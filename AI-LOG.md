# AI-LOG.md — AI tool usage trace

Running log of how AI tools were used on this assignment: the prompt/intent, what
worked, what didn't, and the correction I made. The corrections are the point —
they show judgment, not just delegation. §16 of PLAN.md summarizes this at the end.

Format per entry: **Stage · Tool · Intent → Outcome → What I changed.**

---

### Planning · Claude (chat) · Break down spec + design into a build plan

- **Worked**: spec/rubric analysis, staged commit plan, business-logic edge cases
  (VIP-workshops-only discount, UTC time rule, deferred vs live conflict detection).
- **Didn't / caught**: initially scoped in TypeScript; corrected to plain JS + JSDoc
  to match Nitra's stack. Flagged the README's stale :9000 (real port is :9001).
- **Changed**: rewrote the plan around JSDoc `@typedef` + `jsconfig` checkJs; kept
  provided mocks untouched behind a typed `data.js` boundary.

### Stage 2 · JSDoc domain models + pricing / currency / conflict logic

**Prompt**: JS-only (no `.ts`/`lang="ts"`); don't touch mocks/css/unocss/quasar.config.
Build `jsconfig.json`, `types.js` (@typedef only), a typed `data.js` re-export of the
mocks, `useCurrency`, UTC-only `useTimeConflicts`, and a pure `usePricing` verified
against 733.10 / 670.00 / 804.10.

**Claude (first pass)**

- **Worked**: foundation right first try — `jsconfig` per spec, UTC-safe conflict
  logic via `getTime()` only, and pure `computePricing` that hit all three known
  totals exactly (733.10 / 670.00 / 804.10) on the first Node run.
- **Caught**: reading `addons.js` before typing surfaced two shape traps — `sizes`
  is absent on `merch2`/`merch3` (would've been wrong to type it required) and meals
  carry no day/slot field (confirms plain multi-select, §6.6). Sessions use `date`
  as the START field (not a separate `startDate`) with `endDate`.
- **Changed**: typed `sizes` optional (`[sizes]`) on `MerchItem`; modeled `date` as
  the start throughout; rounded the VIP discount + grand total to whole cents
  (`Math.round(n*100)/100`) against binary-float drift. CLI `vue-tsc` flags only two
  provided-file issues (a `vue-router` module-resolution quirk the editor's bundler
  resolution resolves, and a pre-existing implicit-`any` in `unocss/index.js`) —
  none in the Stage 2 code, which type-checks clean.

**Human review (caught)**

- **Flagged**: `sessionConflictPairs` — the two nested loops read as inefficient
  "once the data is big."
- **Correction (framing, not just code)**: `n` is only the sessions ONE attendee
  selected (bounded by the 12-session catalog), so the O(n²) was never a real
  bottleneck — the true trap would be scanning the whole catalog, which this flow
  never does. Logged as a clarity/judgment change, not a perf fix.
- **Changed**: sort selections by start + break the inner scan once a later session
  starts at/after the current one ends → O(n log n) + conflicts found, behavior-
  preserving (11/11 cases incl. empty/single, order-independence, touching-edge
  non-conflicts, and a cross-check vs the naive O(n²) reference). Half-open
  `[start, end)` keeps touching edges (s1 ends 10:00Z, s2 starts 10:00Z) from
  counting as a conflict.

<!-- Append one block per AI step below, same shape. -->

### Stage 3 · Store + wizard layout + nested routes

**Prompt**: `useRegistration` (reactive + provide/inject `Symbol` key + `reset()`),
versioned localStorage persistence (validate/prune on hydrate), `WizardLayout`
parent (stepper/footer/summary/`<router-view>`), nested step routes + `/success`
guards, free nav, `<keep-alive>` + direction-aware transition.

**Claude (first pass + self-caught in verify)**

- **Worked**: store, persistence, guards, and routing were right first pass and
  verified in-browser — free stepper nav swaps steps, `<keep-alive>` preserved a
  step-local day tab across leave/return, a full reload rehydrated the store from
  localStorage, `/success` was guarded both directions, and Back to Home cleared
  store + storage back to a fresh draft. No console errors.
- **Transition hang — first hypothesis was wrong**: with `<transition mode="out-in">`
  - `<keep-alive>`, the leaving step stuck at `-leave-from`. I first blamed a
    reactive transition-name flipping mid-swap and refactored to stash the name on
    `to.meta` + a per-route `:key` — but it still hung. The real cause was
    environmental: the headless verify pane runs `document.hidden`, which pauses
    `requestAnimationFrame`, and Vue swaps transition classes on rAF, so `out-in`
    waited forever. Code is correct (a visible tab animates fine); kept the meta +
    `:key` refactor since it's the canonical, more robust direction-aware pattern.
- **Type gate exposed two real bugs**: as vue/vue-router imports spread, CLI
  `vue-tsc` collapsed every binding to `{}` — the committed `jsconfig` had no
  `moduleResolution`. Adding `"moduleResolution": "bundler"` (what Volar/Vite use)
  made the gate real and surfaced two defects the editor would have shown:
  `byId()` wasn't generic (returned `{ id }` not `Ticket`), and a merch filter
  type-guard whose optional `size?` didn't narrow past `| null`.

**Human review (caught)**

- **"Refactor `sanitize` (lots of data checking) + anywhere else cleaner."** —
  split `sanitize` into focused helpers (`keepId`, `keepIds`, `sanitizeAttendee`,
  `sanitizeMerch`) with the mock lookups built once at module load, so it reads as
  a declarative assembly; re-verified pruning end-to-end in Node (clamp/prune/
  version-gate/garbage all correct). Also unified the four resolved-selection
  computeds behind one generic `isPresent` NonNullable type-guard (dropping four
  verbose inline `x is T` guards and the odd `flatMap`).

**Changed**: `moduleResolution: "bundler"`; generic `byId`; direction-aware
transition via `route.meta` + `:key`; `sanitize` decomposed into named helpers +
module-level lookups; `isPresent` guard unifying the selection computeds. No new
dependencies. Src type-clean (only the pre-existing implicit-`any` in the provided
`unocss/index.js` remains, untouched).

### Stage 4 · Step 1 attendee info + ticket cards

**Prompt**: six attendee fields + three single-select ticket cards, bound to the
store, with NO inline validation (S1.noInline) — rules fire on Step 4.

**Claude (first pass)**

- **Worked**: built two reusable components that carry the EC1 Vue-pattern signal
  in their JS form — `TextField` two-way binds via `defineModel({ type, default })`,
  `TicketCard` uses runtime `defineProps` typed with a JSDoc `PropType` cast +
  `defineEmits(['select'])`. Step 1 wires the three cards as a `role="radiogroup"`
  single-select bound to `registration.ticketTypeId` and the six fields to
  `registration.attendee`.
- **Verified in-browser**: selecting a ticket flips `aria-checked` (only one true),
  updates the live summary and persisted `ticketTypeId`, and switching VIP→General
  moved the total 599→299; field input persists to localStorage; type-clean; a
  fresh dev-server load has a clean console.
- **Held the line on S1.noInline**: fields only capture input — no error state is
  rendered yet (added in stage 7). The shipping field carries a _hint_ ("required
  only if you order merch"), which is guidance, not a validation error.

**Human review (caught — full design capture supplied)**

- **Order summary belongs to Step 3 only**, not the shell. Moved it out of
  `WizardLayout` (which is now a single centered column); it will be rendered
  inside `Step3Addons` in stage 6.
- **Prefer built-in icons; fall back to inline SVG only when the design truly
  differs.** `@quasar/extras` ships `material-icons` (2122 names in
  `material-icons/icons.json`; browse fonts.google.com/icons) and it's loaded, so
  `<q-icon name="…">` covers most needs. I over-applied this and deleted the perk
  SVG — but the perk check differs from `check_circle` in both color and shape, so
  it came back as an inline `PerkCheckIcon` component fed the exact Figma export
  (colorable via `currentColor` when the asset uses it). Lesson: built-in first,
  but a bespoke glyph is a legit inline-SVG case.
- **Extracted a reusable `Badge` component** (variant → semantic token pair via a
  static class map so UnoCSS's scanner emits the classes). Used now for the
  "Selected" affordance on `TicketCard`; reused in stage 5 for session track /
  status badges (KEYNOTE, SOLD OUT, …).
- **Primary CTA is accent (orange), not brand (teal).** The design's Next/Submit
  buttons are orange even though §3 wires `--q-primary` to brand — the buttons are
  custom-styled, so the footer now uses `bg-accent-emphasis-*`, is labelled
  "Next: <next step>" / "Submit Registration", and its Back is a ghost button
  omitted on the first step.

**Human review (round 2 — design fitting)**

- **Reserve the "Selected" badge height so selecting never shifts layout.** Every
  card always renders a fixed-height (`min-h-6`) badge slot pinned to the bottom
  (`mt-auto`); the badge only toggles inside it. Verified the three cards stay
  256px before and after selecting. `mt-auto` also bottom-aligns the badge across
  cards with different perk counts.
- **Duplicate form-field id — real root cause in `index.html`.** The starter
  hand-wrote `<div id="q-app">` *and* kept the `<!-- quasar:entry-point -->`
  marker, so Quasar injected a *second* mount point; when both rendered the form,
  every input id duplicated (Chrome autofill warning). Removed the manual div →
  single `#q-app`, zero duplicate ids in the DOM.
- **Typography + layout tweaks**: section headings to `text-subtitle1` /
  `text-h3` (Attendee Information as a semantic `<h3>` so the header stays the sole
  `<h1>`); Job Title and Shipping Address span full width (`col-span-2`) on their
  own rows.
- **Scope note**: the full pixel-fidelity audit is still stage 9; these were
  shared-chrome / structural fixes worth folding in now since every later step
  builds on them.
