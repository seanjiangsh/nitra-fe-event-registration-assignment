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

### Stage 5 · Step 2 session selection

**Prompt**: group sessions by day with a day switcher, multi-select cards,
sold-out disabled, capacity bar, "N selected"; time-conflicts deferred to Step 4.

**Claude (first pass)**

- **Worked**: `useDateTime` (one-time `Intl` formatters, `timeZone: 'UTC'`) —
  verified `9:00 AM` even under `TZ=Asia/Taipei`, so the §6.1 UTC rule holds.
  `SessionCard` is a `role="checkbox"` multi-select showing track badge, UTC time
  range, and remaining spots, with a capacity bar colored green→olive→red by fill
  (§10.1). Sold-out cards (`registered >= capacity`) are genuinely `disabled`, not
  just labelled (S2.3). `Step2` groups `SESSIONS` by UTC date and adds a day
  switcher with a per-day selected-count badge.
- **Reused the extracted `Badge`** for the track pills (Keynote / Frontend /
  Backend / DevOps) and the Sold-out pill — the stage-4 review's payoff.
- **Verified in-browser**: grouping (6 + 6), sold-out s2 (120/120) and s9 (90/90)
  disabled and non-interactive, multi-select toggles persist (`[s1, s4]` →
  "2 selected", day-1 tab badge "2"), capacity colors (62% green / 89% olive /
  100% red), UTC times, clean console, type-clean.
- **Held S2.2**: overlapping selections are allowed here (e.g. s2/s3) and will be
  flagged only at the Step 4 submit check — not blocked at selection.
- **Token discipline**: swapped an initial `bg-[rgba(255,255,255,…)]` count-badge
  fill for a token pair (`bg-surface-l0 text-brand-emphasis`) — no hardcoded
  colors.

**Human review (caught — design + capacity semantics)**

- **Day switcher → segmented control** (design capture): both days sit in one
  light `bg-surface-l2` container, active is a filled `bg-brand-emphasis-rest`
  pill. Dropped the per-tab count badges and added a standalone
  "N sessions selected" line (brand-colored, singular/plural aware); removed the
  now-unused `selectedOnDay` helper.
- **No Sold-out badge**: removed the pill; "Sold out" now appears only as the
  spots-left text.
- **Capacity counts the attendee's own reservation.** Selecting a session drops
  its "spots left" by one and nudges the bar (verified s3 22→21, 78%→79%). The key
  subtlety: a session the attendee has selected is *never* grayed — if their pick
  takes the last seat it reads "Sold out" but stays interactive so they can
  deselect. A card is disabled/dimmed only when full *and not* their pick
  (`baseFull && !selected`), so s2 (120/120) and s9 (90/90) stay non-interactive.

### Cross-cutting · Sticky app-shell + Quasar component reuse

**Human review (caught)**

- **Sticky header/footer, scrollable main.** Reworked `WizardLayout` into an app
  shell: `h-screen` + `overflow-hidden` frame, `shrink-0` header/footer, and
  `flex-1 overflow-y-auto` on `<main>` as the only scroll region, with its
  `scrollTop` reset to 0 on each step change. Verified: scrolling main keeps the
  header at top 0 and the footer fixed, and the window itself never scrolls.
- **Cards: tried `q-card`, then extracted a custom `BaseCard`.** First converted
  `TicketCard` / `SessionCard` to `<q-card flat>` — but it needed `!rounded-xl`
  (beat Quasar's 4px), `flat` (kill its Material shadow), plus custom border and
  manual `@keydown` handlers, i.e. q-card was fully overridden and added nothing.
  When the exact card spec came in (6px radius, 1px neutral / 2px brand border,
  resting `0 1px 3px #0000000A` + hover `0 4px 16px #00000014` shadows) I took the
  "if q-card doesn't fit, restore to custom" path and extracted a `BaseCard`
  wrapper owning that shared shell. It renders a native `<button>` (interactive
  ticket/session — keyboard/focus a11y for free, no keydown handlers) or a `<div>`
  (non-interactive, e.g. a merch card that owns its own steppers). Verified exact:
  6px radius, 2px `rgb(38,77,79)` selected / 1px `rgb(227,230,232)` border, resting
  shadow, click+keyboard select, disabled no-op. Dropped the earlier selected
  `bg-brand-subtle` tint since the spec lists only border/radius/shadow.
- **No-shift-on-select fix (caught).** A real CSS border still changed the content
  box 1px↔2px on select, nudging inner content. Redrew the border as an **inset
  `box-shadow` ring** (which takes no layout space) composed with the drop shadow
  via two custom props — `--card-ring` (1px neutral → 2px brand on `is-selected`)
  and `--card-elevation` (resting → hover) — and zeroed the native `<button>`'s UA
  border (`appearance-none border-0`, which was the visible-border culprit).
  Verified: `border-width: 0`, ring 1px→2px, and inner-content shift **0px** on
  both card types.
- **Where I held custom (judgment).** `Badge` and `TextField` stay custom: a
  Quasar `q-chip`/`q-badge` maps to Quasar's palette, not our CSS-var tokens (it
  would need `!important` overrides to stay on-token), and `q-input`'s in-field
  label fights the design's label-above + external `<label for>` association. The
  higher-value Quasar wins are behavioral/structural and land in the
  display-heavy stages: `q-list`/`q-item` + `q-card` for the order summary and
  review (6–7), `q-banner` for the shipping alert (6), `q-timeline` for the review
  session list (7), and `q-input` reconsidered there for its built-in error/hint
  states. Building those Quasar-first.

### Stage 6 · Step 3 add-ons + order summary

**Prompt**: add-ons grouped by category (workshops with live conflict-disable,
meals, merch with qty + size), shipping banner, live order summary; currency.

**Claude (first pass)**

- **Delivered the Quasar-first commitment.** `OrderSummary` is `q-card` +
  `q-list`/`q-item`/`q-item-section` + `q-separator`; the shipping alert is a
  `q-banner` with an avatar icon (S3.4). Add-on cards reuse the shared `BaseCard`
  — `WorkshopCard`/`MealCard` as interactive checkboxes, `MerchCard` as the
  **non-interactive** variant (`:interactive="false"`) since it owns its own qty
  stepper + size picker (the reason BaseCard supports a `<div>` form).
- **Live workshop conflict (S3.2).** `Step3` computes each workshop's
  availability from `selectedSessions` via `overlaps()`: disabled + a note
  (`Overlaps "…"`) when it clashes with a selected session, sold-out when full.
  Verified reactive both ways — selecting s11 disabled ws1 ("Overlaps
  'Accessibility Deep Dive'"), removing it re-enabled ws1; ws2 stays sold-out
  (25/25).
- **Pricing verified through the live UI** (not just the Node unit): VIP + ws1
  → **$733.10** (with the "VIP workshop discount (10%) −$14.90" line), VIP + merch
  → **$670.00**, VIP + ws1 + merch → **$804.10**. Meal multi-select, merch size,
  and decrement-to-0 removal (drops the key, hides the banner) all confirmed.

**Self-caught (verify)**

- **Rapid-click qty bug.** The stepper first emitted `qty + 1` computed from its
  prop — but the prop hasn't re-rendered between synchronous clicks, so 3 fast
  clicks all read the same stale value and only stepped once. Refactored
  `MerchCard` to emit intent (`increment` / `decrement`); `Step3.stepMerch` derives
  the next qty from the **live store** and clamps to `maxQuantity`. Verified: 5
  rapid clicks on a max-2 item cap at 2.

**Human review (caught — merch design capture)**

- **Extracted `SegmentedTabs`** (reusable) — a sliding `bg-brand-emphasis-rest`
  indicator that measures the active button's `offsetLeft/Width` so tabs keep
  natural widths; verified it slides (Workshops 4px/120 → Merchandise 275px/129).
  Used for both the add-on categories and (retrofitted) the Step 2 day switcher.
  Add-on content gets a direction-aware slide on switch via a CSS `@keyframes`
  animation (degrades gracefully — no JS-transition-end dependency).
- **Add-on cards now match the capture**: full-width **row list** (`flex-col`, not
  a grid), **no checkbox** — selection is conveyed by the brand-muted bg + a
  green "✓ Added to order" affordance; **size is a dropdown** (`<select>`); merch
  controls (size + qty stepper + "max N") sit on one inline row.
- **BaseCard selected bg → `bg-brand-muted-rest`** (all selectable/addable cards);
  verified `rgb(203,229,230)`.
- **OrderSummary is the surface-card variant** (`bg-surface-l1`, verified
  `rgb(244,245,246)`, no border).
- **Shipping banner is always present** (no `v-if`) so adding merch never shifts
  the page, with the capture's "Shipping Information" copy in a `q-banner`.
- **Follow-up fixes.** (1) `bg-surface-l1` had leaked onto the app shell — moved
  it off (shell → white `surface-l0`) and scoped `surface-l1` to just the ticket
  unselected card (a new `restBg` prop on `BaseCard`, default `surface-l0`) and the
  order summary; other cards stay white. (2) `SegmentedTabs` buttons showed native
  UA borders and their opaque button bg covered the sliding indicator — added
  `appearance-none border-0 bg-transparent` so the green indicator shows through
  (verified `border-width: 0`, transparent bg, indicator `rgb(38,77,79)`).
- **Workshops show capacity, not "Added to order".** Since workshops have
  capacity, the card now reads "N spots remaining" / "Sold Out" (counting the
  attendee's own reservation, like sessions) instead of the merch-style affordance;
  selection is conveyed by the brand bg + border. The conflict reason ("Overlaps
  …") is a separate `conflictNote` prop. Verified ws1 8→7 on select, ws2 "Sold
  Out", no "Added to order" on any workshop.

### Stage 7 · Step 4 review + unified validation

**Prompt**: deferred/unified validation, the review summary with edit links +
itemized pricing, submit gate with jump-to-first-error, field/step error UI, and
the session-conflict check surfaced (S2.2).

**Claude (first pass)**

- **Rules are pure and tested first.** `useValidation.js` holds email/US-NANP
  phone checks + `validateAttendee` (required + ticket + shipping-iff-merch),
  `validateSessions` (overlaps, reusing `sessionConflictPairs`), and
  `validateMerch` (size when the item has sizes). Verified in Node before any UI.
- **Deferred + unified in the store.** `errorsByStep`/`isValid`/`firstErrorStep`
  are always computed, but a `submitAttempted` flag (set by `submit()`) gates
  when the UI shows them, then it re-validates reactively as fields are fixed.
- **Error surfaces.** `TextField` gained an `error` prop (danger border + message
  + `aria-invalid`/`aria-describedby`); `StepperHeader` flags failing steps with a
  red dot + `!` icon; Step 2 shows a `q-banner` listing overlaps (S2.2); Step 3's
  `MerchCard` shows a size error + danger select. `Step4Review` is the summary
  (S4.1): attendee `dl`, a `q-timeline` of sessions in UTC order, an add-ons list,
  the shared `OrderSummary` for itemized pricing (S4.2), per-section `Edit` links
  back to each step (S4.3), a top error banner (S4.4), and danger section borders.
- **Submit gate (S4.5).** The layout's `onSubmit` calls `store.submit()` and, on
  failure, jumps to the lowest failing step. Verified end-to-end: a multi-error
  registration jumped to Step 1 with 6 `aria-invalid` fields + messages (incl.
  shipping-required-because-merch, email/phone format), ticket error, and 3
  stepper dots; the Step 2 overlap banner; the Step 3 merch size error; the review
  banner listing all 9 errors with all 3 sections danger-bordered; and a fully
  valid registration submitting clean (no jump — success redirect is stage 8).
- **Verification note.** The step `<transition mode="out-in">` stalls in the
  headless pane (paused rAF, as in stage 3), so it was temporarily removed to
  drive the cross-step error flow, then restored. Delivered the planned Quasar
  wins: `q-banner` (error banners); kept the custom `TextField` and added its
  error state rather than swapping in `q-input`.

**Human review (caught — review design + shipping states)**

- **Shipping-address conditional states** (design capture): the label is
  "Shipping address (optional)" with no merch and "Shipping address \*" (new
  `required` prop on `TextField` → red asterisk) once merch is added; after
  validation activates it also turns the label red + shows the danger border +
  "Shipping address is required for merchandise orders." Verified all three.
- **Review layout to match the capture**: sessions are a plain list (left =
  "Nov 15, 9:00 AM", right = title) — dropped `q-timeline`, which didn't fit;
  add-ons are left = kind / right = "Title ($price)"; ticket reads "VIP ($599)"
  (new `formatCompact` — no cents for inline references); the Edit links read
  "Edit → Step N"; and the summary card gained `title`/`totalLabel` props so the
  review shows "Pricing Summary" / "Grand Total" while the Step 3 sidebar keeps
  "Order Summary" / "Total". (Also removed a stray `console.log` and a broken
  `text-neutral-default` class from the summary.)
- **Validate on entering Review + disable Submit** — asked whether the spec has
  it: it doesn't (§7 defers to the submit *click*). Implemented it anyway as the
  better UX: reaching `/review` flips `submitAttempted` on (banner + stepper
  flags + danger borders appear) and the footer's Submit is `:disabled` until
  `isValid`. Verified: invalid → Submit disabled (opacity 0.6) + banner shown;
  valid → enabled + banner gone.
- **Attendee summary is one row per line** (was a 2-col grid): label left,
  value right-aligned. An empty required field shows "— (required)" (danger) —
  and "— (required for merchandise)" for shipping when merch is selected — only
  once validation is active. Verified all 7 rows against the capture.
- **Hidden Figma rule: overlaps are blocked at selection, not deferred.** A
  session whose time overlaps an already-selected one is now *disabled* (parent-
  computed `sessionDisabled`), greyed (`disabledBg="bg-surface-l2"`, a new
  `BaseCard` prop), title `text-neutral-disabled`, and its checkbox hidden — the
  same treatment sold-out already gets. A session the attendee has selected is
  never disabled (last-spot exception). Consequences: a selected set can never
  overlap, so **removed** the Step 2 "Some selected sessions overlap" banner and
  the Step 4 session-overlap validation (`validateSessions` gone; step 2 is
  always `[]`). Verified: selecting s4 disabled+greyed s5 (no checkbox);
  deselecting s4 re-enabled it; sold-out s2 also loses its checkbox; no banner.
- **Edit link per Figma spec** (12px / weight 610 / underline / `#3A7679`): mapped
  to `text-sm` + `font-semibold` (this system's semibold = 610) + `underline` +
  an arbitrary `text-[#3A7679]` (that colour has no semantic token — an
  intentional exception). Verified computed `rgb(58,118,121)`, 12px, 610.
- **App font was Roboto, not Inter (caught in verify).** The Figma is Inter but
  Quasar's default Roboto was rendering — Inter wasn't loaded anywhere. Added
  `@fontsource-variable/inter` (variable font, so the design's non-standard weights
  485/570/610/630 render exactly) and set the family on `#q-app` in `App.vue`
  (ID specificity beats Quasar's `body` rule; the proper spots — quasar.config /
  src/css — are the untouched provided files). Verified: `h2`/edit-link compute to
  "Inter Variable" and the latin face loads. First (chosen) runtime dependency.
- **Two conflict/validation bugs caught.** (1) The session-vs-workshop conflict
  was one-directional — selecting a session disabled a clashing workshop, but not
  vice-versa. `sessionDisabled` now also checks selected *workshops*, so selecting
  ws1 disables s11/s12 in Step 2 (verified; s7 unaffected). (2) The review's
  attendee rows keyed the danger state off *emptiness*, so a present-but-invalid
  field (bad email) showed plain, not red. Rewired the rows to the actual
  `errorsByStep[1]`: empty → "— (required…)", present-but-invalid → "value (invalid
  email/phone)", both red. Verified `notanemail (invalid email)` in red.

### Stage 8 · Success screen + back-to-home reset

**Prompt**: finalise on submit, a success screen with a confirmation number, and
a single Back-to-Home that resets to a fresh registration (§4.3, S4.6).

**Claude (first pass)**

- **Finalise in `submit()`**: on a valid submit it sets `status = 'submitted'` +
  stamps `submittedAt`; the deep-watch persists it, and the layout's `onSubmit`
  pushes `/success` (jumps to the first error step otherwise).
- **SuccessScreen** is self-contained (top-level route, no layout store): it
  `hydrate()`s the persisted registration, shows "Registration Complete!", a
  deterministic confirmation number (`WD<eventYear>-<submittedAt digits>`, stable
  across reloads), a personalised message, and Back to Home — which `clearPersisted()`
  + returns to Step 1 (the only full state wipe).
- **Verified the whole lifecycle**: valid submit → `/success`, `status:'submitted'`,
  `submittedAt` set, "Confirmation #WD2028-26712", personalised copy; reload on
  `/success` re-shows it with the same number; navigating to a step while submitted
  redirects back to `/success` (guard, read-only post-submit); Back to Home clears
  localStorage (`null`) and lands on a fresh, empty Step 1. Console clean.

### Stage 9 · Design fidelity + interactive states

**Prompt**: token mapping, hover/disabled/active/error/focus states, audit @1440.

**Claude (first pass)**

- **Focus-visible states (a11y §10.4).** `appearance-none` had stripped the native
  focus ring from the selectable cards and the segmented tabs, leaving keyboard
  users with no focus indicator. Added a `:focus-visible` brand outline (2px,
  offset 2px) to `BaseCard` and `SegmentedTabs`; native buttons keep `appearance:
  auto` so their default ring stays. Verified both rules load in the CSSOM.
- **Token / hex audit clean.** The only hex in `src` templates is intentional and
  token-less: the edit-link `#3A7679`, the card drop-shadow values, and the
  success SVG — everything else is design tokens.
- **1440 audit (§10.2).** At 1440 the content centres at max-1120 with no
  horizontal overflow; hover/disabled/active/error states (built incrementally
  through stages 4–8) all present. A true pixel overlay needs the Figma frames
  (not available here), so remaining fidelity nits are driven from the design
  captures.
- **Header (caught).** The header showed text only — the design has a logo mark,
  and the success page had no header at all. Extracted an `AppBrand` (the Figma
  logo SVG + event name) and used it in both the wizard shell header and a new
  success-page header, so the chrome is identical. Verified the logo (`#264D4F`,
  40px) + title render on both `/attendee` and `/success`.
- **Full-width stepper + dividers (design).** Split the header into a brand row and
  a stepper band separated by a full-width divider (bottom divider is the header's
  own border); the stepper's connectors became `flex-1` so the row fills the width
  (verified `ol` = container 1152, connectors ~206–239px).
- **Session capacity-bar colours (design).** Retuned to the Figma's 4 tiers —
  ≥100% red, ≥70% orange (`accent`), ≥50% olive (`warning`), else green — matching
  all six day-1 cards (s1 97% orange … s6 41% green). Config lives in
  `SessionCard.barColor` (thresholds/token), with the raw values in the
  `--bg-*-emphasis-rest` design tokens.
- **Divider tokens on the header (design).** The stepper's top/bottom rules were
  drawn with the border colour (`border-neutral-muted`); the design uses the
  divider token. Switched both to `divider-default` so they match the stepper's
  connector lines (verified both borders resolve to `rgba(0,0,0,0.1)` =
  `--divider-default`).
- **Reserve the session checkbox box (design).** Hiding the checkbox on a
  disabled card (sold-out / conflict) collapsed the top row and nudged the card
  content. Wrapped the checkbox in an always-present 22×22 box so the row height
  is fixed whether the checkbox renders or not (verified the box stays 22×22 on
  the sold-out card where the icon is absent).
- **Fuller Next CTA on step 1 (design).** The footer's primary button read
  "Next: Sessions" (reusing the compact stepper label). Added an optional
  `ctaLabel` to the step metadata — the sessions step carries
  `ctaLabel: 'Session Selection'`, and `WizardFooter` prefers it (`ctaLabel ??
  label`). The stepper still shows the short "Sessions"; only the CTA reads
  "Next: Session Selection". Verified the button text on `/attendee`.
- **Back button as secondary/muted (design).** Restyled the footer Back button to
  the Figma `components/button/secondary` tokens: `bg/muted/rest` and
  `text/on-muted`. Those component-level tokens aren't in this repo (there's no
  component-token layer), so they were aliased to the base semantic classes they
  correspond to — `bg-neutral-muted-rest` (gray[100] #E3E6E8) and `text-neutral`
  (neutral default, which the button already used). Also moved the hover from
  `neutral-subtle-hover` to `neutral-muted-hover` (gray[200]) since the old hover
  equalled the new rest bg and gave no feedback. Verified on `/sessions`:
  bg `#E3E6E8`, text `rgba(0,0,0,0.9)`.
- **Tick for completed steps (design).** Completed stepper steps (`i < activeIndex`)
  now render a checkmark instead of the step number. Added `StepCheckIcon` (inline
  SVG from the Figma export) using `stroke="currentColor"` so it inherits the
  circle's foreground — the export's `stroke="white"` is icon-internal contrast,
  but the completed circle uses the light `brand-muted` bg, so the tick renders in
  `text-brand-emphasis` (dark teal) to stay visible. Precedence in the circle:
  error dot → completed tick → number (active/future). Verified on `/add-ons`:
  steps 1 & 2 show dark-teal ticks, step 3 shows "3", step 4 shows "4".
- **Completed-step colour fix (design).** First pass kept the completed circle on
  the light `brand-muted` bg with a dark-teal tick; the design wants it to match
  the active number circle — solid `brand-emphasis` (#264D4F) fill with a **white**
  tick. Switched the completed branch to `bg-brand-emphasis-rest text-inverse`, so
  the `currentColor` tick renders white. Now active + completed share the dark-green
  fill (number vs tick), future stays gray. Verified on `/add-ons`.
- **Configurable card padding/gap (design).** `BaseCard` gained `padding` and
  `gap` props (defaults empty/`gap-3`) so each stage sets its own rhythm: tickets
  `px-[1.25rem]`, sessions/add-ons `p-4` with per-card gaps. Prevents one stage's
  spacing tweak from leaking into the others.
- **Badge track-colour mapping (design).** Retuned session track badges to the
  Figma swatches using tokens only: main → `neutral-subtle` (new variant,
  `bg-neutral-subtle-rest` + `text-gray-700`), frontend/devops → `accent`
  (orange), backend → `info` (blue); disabled sessions fall back to the gray
  `neutral-subtle`. `accent`/`info` already matched the exact hexes; added
  `neutral-subtle` to `Badge` + the `BadgeVariant` type.
- **Add-on card parity (design).** Propagated the Workshop card's spacing/type
  changes to Meal and Merch (padding, gap, `tracking-normal` title, `text-sm`
  description); removed the native border on the Merch qty stepper buttons.
- **Review error list (design).** Each banner item is now prefixed with its step
  ("Step 1: …") and the native `list-disc` marker was replaced with a flex row +
  manual bullet so the dot↔text gap is a tunable `gap-*` (native marker spacing
  isn't controllable). Title reads "…following errors before submitting".

### Stage 10 · Motion & transitions

**Prompt**: add a slide left/right effect for the session day-tab switch, then a
few more motion targets from §10.3 — listed for the human to verify.

**Claude**

- **Session day-tab slide.** Direction-aware slide+fade on the Step 2 day switch:
  a `watch` on `activeDay` sets the direction from the tab-index delta (later day
  → in from the right). First shipped as `<transition mode="out-in">`, then
  **refactored to a CSS keyframe on a re-keyed div** to match the existing add-ons
  category slide and avoid the out-in stall in a backgrounded tab (CSS animations
  don't depend on `transitionend`). Verified the resolved `animation-name`.
- **Order-summary total flash.** The grand total re-keys by value, replaying a
  pop (scale 1.09) + brand-colour pulse whenever it changes. Verified live: total
  $299 → $334 on adding merch, keyframe applied.
- **Merch qty pop.** The quantity number re-keys by `qty`, popping (scale 0.7→1)
  on each +/- . Verified applied on increment.
- **Success-screen entrance.** The check mark springs in (scale 0.2→1.08→1), then
  the heading/confirmation/message/button rise in a short inline-delay stagger.
  Wired (mount-time); left for the human to eyeball since `/success` is guarded.

All four are CSS keyframes (robust, no JS transition-end dependency) and each is
disabled under `prefers-reduced-motion`. `vue-tsc` clean.

**Human**

- Reviewed the four animations in-browser ("nice looks good") before commit.
