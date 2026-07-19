# PLAN.md — Nitra Event Registration Wizard

> WebDev Summit registration wizard. Vue 3.5.17 + Quasar 2.18.5 + UnoCSS. Plain JavaScript with JSDoc type defs (matching Nitra's stack — no TypeScript).
> This file doubles as the required development journal. Sections marked _(fill as you go)_ are updated during the build.

---

## TL;DR

**What**: a 4-step registration wizard (Attendee Info → Sessions → Add-ons → Review) with free navigation, preserved state, deferred/unified validation, and a live order summary.

**Key decisions**: plain JavaScript with JSDoc type defs (Nitra doesn't use TS), editor-checked via `jsconfig.json` (§2); nested step routes under a persistent `WizardLayout` with the store shared via `useRegistration` + provide/inject, localStorage-persisted and refresh-safe, with a simplified post-submit success/reset flow (single Back-to-Home button, §4.1–4.3); UnoCSS semantic tokens only, no hex (§3); mock UTC timestamps rendered in UTC (§6.1); VIP 10% discount applies to workshops only (§6.3); US-only phone (§7); motion treated as its own stage since UX Polish is scored (§10.3); pixel audit at 1440 (§10.2).

**Stages** (each = one atomic commit; full mapping in §8):

| #     | Stage                                                     | Refs          |
| ----- | --------------------------------------------------------- | ------------- |
| 0     | Unchanged starter baseline                                | —             |
| 1     | Commit planning docs (PLAN.md + AI-LOG.md)                | Process       |
| 2     | JSDoc types + domain models + pricing/currency/conflict logic | S3.6, EC4 |
| 3     | Store + WizardLayout + nested step routes (+ persistence) | EC1, S4.5     |
| 4     | Step 1 attendee info + ticket cards                       | S1            |
| 5     | Step 2 session selection                                  | S2.1/.3/.4    |
| 6     | Step 3 add-ons + live order summary                       | S3.1–.6       |
| 7     | Step 4 review + unified validation                        | S4.1–.5, S2.2 |
| 8     | Success screen + Back-to-Home reset (submitted persists)  | S4.6          |
| 9     | Design fidelity + interactive states (audit @1440)        | EC2           |
| 10    | Motion + transitions                                      | EC5           |
| 11–13 | _Optional_: tests, responsive, i18n (en-US/zh-TW)         | Nice-to-have  |

**Budget**: ~6 to 8 hours (routing + persistence add ~1.5 to 2h). Ship the working end-to-end wizard first; persistence (§4.2) underpins refresh-safety and the reload-shows-success behavior, so it's the last thing to simplify if time runs very short. Optional stages only if core is solid.

**Ref key**: `S<step>.<item>` = README Step Details; `EC<n>` = evaluation criteria (see §8.1).

---

## 1. How I planned and broke down the task

A 4-step wizard (Attendee Info, Session Selection, Add-ons, Review & Submit) with free back/forward navigation, preserved state, deferred/unified validation, and a live order summary. Built bottom-up in four layers so the hard logic is proven before any pixels:

1. **State + data layer**: one shared registration store (composable + provide/inject), typed mock data, derived pricing.
2. **Business logic**: time-conflict detection, capacity, VIP workshop discount, conditional shipping, currency. Pure typed functions, independently verifiable.
3. **Step UIs**: one component per step plus reusable cards.
4. **Shell + validation + polish**: stepper navigation, unified submit validation, error routing, success screen, then design fidelity.

Rationale for order: pricing and conflict rules are where correctness points live and are cheap to get wrong late, so their pure functions are written and verified first (stage 2) against the real mock data and the three known totals, before any UI depends on them. The store-connected `usePricing` composable and the live summary are then wired in stage 6.

---

## 2. Language & tooling decision: JavaScript + JSDoc types

Nitra's stack is JavaScript, not TypeScript, so the app is built in plain JS to match their conventions. Type safety and the Code Quality signal come from **JSDoc type annotations checked by the editor**, not from a compile step. The shipped code stays pure JS while still getting typed props/composables, IntelliSense, and self-documenting domain models — which is what the Vue Patterns and Code Quality criteria actually reward.

Setup (no TS toolchain shipped):

- Every SFC uses `<script setup>` (no `lang="ts"`). `quasar.config.js` and the provided files stay as-is.
- Add a `jsconfig.json` with `"checkJs": true` (and `"strict": true`) so the editor's language service type-checks JS + JSDoc and flags mismatches while building. **No `typescript`/`vue-tsc` dependency is added** — the checking is editor-level, so nothing TS-related ships or installs.
- **Domain models live in `src/types.js` as JSDoc `@typedef` blocks** (annotations only, no runtime code). Other files reference them via `@type {import('./types.js').Session}` / `@param` / `@returns`, which gives full IntelliSense and cross-file checking.
- **Leave the provided `.js` mocks untouched** (given data). `src/data.js` imports them and re-exports under clear names with a JSDoc cast at the boundary (`/** @type {import('./types.js').Session[]} */ export const SESSIONS = sessions`). Everything downstream is annotated.

Domain typedefs to define: `Ticket`, `Session`, `Addon` (`@typedef {Workshop | Meal | MerchItem} Addon`), `RegistrationState`, `PricingLine`, `ValidationError`.

What changes vs a TS build (honest EC1 notes — the _patterns_ survive, only the type mechanism differs):

- `defineModel<T>()` → `defineModel({ type, default })` runtime declaration + JSDoc. Same two-way-binding pattern, typed via options.
- `defineProps<Props>()` → runtime `defineProps({ ... })` with a JSDoc `@typedef` for the shape (runtime prop declarations are the idiomatic JS form and still validate).
- `InjectionKey<T>` → a `Symbol` key exported from the composable, with the injected value annotated in JSDoc. The provide/inject pattern is unchanged; only the key's compile-time generic guarantee is softer.

Optional (not committed by default): a one-off `npx vue-tsc --noEmit` gives a full command-line type gate if wanted, but it's the one place TS tooling would re-enter, so it stays optional and dev-only.

---

## 3. Design tokens: how the system is wired (do not reconcile Figma by hand)

The repo ships the design system in two layers of ONE system, not two competing sets:

- `src/css/colors.scss` + `typography.scss`: the **raw values** as CSS custom properties (`--text-brand-default: #2E5E60`, `--font-size-h1: 32px`) plus a Quasar bridge (`--q-primary: var(--bg-brand-emphasis-rest)`). Source of truth. Loaded via `app.scss`.
- `src/unocss/semantic.js` + `index.js`: the **utility class layer**. `semanticColors` references those CSS vars; `semanticShortcuts` + typography shortcuts generate the classes used in templates.

Decisions:

- **Use UnoCSS shortcut classes in templates** (README-preferred). Treat the scss files as a value store; do not edit them and do not hardcode hex.
- **Do not check Figma tokens one by one.** The Figma "Design Token Reference" frame is a visual catalog of these same tokens, and Dev Mode is unavailable anyway. `src/css` + `semantic.js` are authoritative; map by token name.
- Reach for raw `var(--...)` only for a token with no generated shortcut.

Class reference:

- Text: `text-neutral`, `text-neutral-muted`, `text-brand`, `text-danger`, `text-success`, `text-info`, `text-warning` (+ `-emphasis`).
- Background: `bg-surface-l0`..`l3`, `bg-brand-emphasis-rest/hover/active`, `bg-brand-muted-rest`, `bg-brand-subtle-rest`, `bg-danger-*`, `bg-success-*`.
- Border: `border-neutral-muted/quiet/emphasis`, `border-brand-emphasis`, `border-danger-emphasis/muted`.
- Divider: `divider-default`, `divider-muted`.
- Typography: `text-h1`..`text-h4`, `text-subtitle1/2`; body `text-lg` (16), `text-md` (14), `text-sm` (12); weights `font-bold/semibold/medium/regular`.

---

## 4. Architecture & key decisions

**Routed steps under a persistent layout.** Each step is a nested route under a `WizardLayout` that owns the stepper, footer, summary and a `<router-view>`. The layout is the route parent, created once, so it stays mounted across step changes while the URL reflects the active step (`/attendee`, `/sessions`, `/add-ons`, `/review`, plus `/success`). This gives refresh-safe deep-links, native back/forward, and a clean home for the post-submit success flow (§4.3) — paired with state persistence (§4.2) so a refresh never lands on a step with an empty store.

**Cross-step state: one composable, provided at the layout root.** `useRegistration()` owns a JSDoc-typed `reactive` registration object and exposes derived state as `computed`, created once in `WizardLayout` and shared via `provide`/`inject` (a `Symbol` key exported from the composable) so every step route reads the same instance. Hits three rubric bullets at once: composable extraction, provide/inject, computed-over-watch.

```js
/**
 * @typedef {Object} RegistrationState
 * @property {{ fullName: string, email: string, phone: string, company: string, jobTitle: string, shippingAddress: string }} attendee
 * @property {string|null} ticketTypeId    // 'general' | 'vip' | 'student'
 * @property {string[]} selectedSessionIds
 * @property {string[]} selectedWorkshopIds
 * @property {string[]} selectedMealIds
 * @property {Object.<string, { qty: number, size?: string }>} merch
 * @property {'draft'|'submitted'} status
 * @property {string|null} submittedAt      // ISO timestamp when submitted
 */
```

Derived (all `computed`): `ticket`, `isVip`, `hasMerch`, resolved selections, `pricing`, `errorsByStep`.

**Validation is deferred and unified.** No validation feedback is shown before the first submit (this is what the README's "no inline validation" means — nothing fires as the user types). On Step 4 submit, compute `errorsByStep` across everything at once, mark failing steps on the stepper, and jump to the first failing step. After that first submit, invalid fields stay highlighted (danger border + message) and clear reactively as the user fixes them — that is post-submit re-validation, not inline-as-you-type.

**Tokens only, no hardcoded hex** (see §3).

### 4.1 App shell & routing

The starter ships one lazy route and an `App.vue` that is just `<router-view />`. Restructure into **nested routes under a `WizardLayout`**:

```
/            → redirect → /attendee
WizardLayout (stepper header + footer nav + order summary + <router-view/>)
  /attendee    Step1AttendeeInfo
  /sessions    Step2SessionSelection
  /add-ons     Step3Addons
  /review      Step4Review
/success       SuccessScreen   (top-level; reachable only when status === 'submitted')
```

`WizardLayout` is the route parent, so it stays mounted across step changes and is the single place the store is created and `provide`d; each step route `inject`s it. Everything routing-flavored becomes a `router.push`: footer Back/Next, stepper jump-to-step (S4.5), Step 4 Edit buttons (S4.3), and the submit error-jump to the first failing step. **Free navigation stays free** between the four steps (no guards block forward movement). Guards are status-based: while `status === 'submitted'` the wizard step routes redirect to `/success` (the form is read-only post-submit), and `/success` redirects to `/attendee` while still a draft — so the success URL can't be reached without a submission, and the form can't be re-entered after one.

Keep the `fade`/slide transition and `<keep-alive>` on the layout's `<router-view>` so step-local UI state (selected day/category tab, expanded sections, scroll) survives navigation:

```vue
<router-view v-slot="{ Component }">
  <transition :name="transitionName" mode="out-in">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </transition>
</router-view>
```

Transition direction is derived from the step index delta of the `to`/`from` routes (forward vs back). No `<Suspense>`: step components have synchronous `setup` and sync mock imports, so it adds a concept with near-zero payoff. Note: dev server runs on **:9001** (quasar.config), not :9000.

### 4.2 State persistence (refresh-safe)

Persist `registration` to `localStorage` so a refresh, a shared step URL, or a return visit never lands on an empty store. This is the one legitimate side-effect use of `watch` (it does not conflict with computed-over-watch, which is about derived state):

- **Save**: `watch(registration, persist, { deep: true })` writes a versioned blob `{ version, data }`.
- **Hydrate** once on store init: if the stored `version` matches, load it; on mismatch, ignore and start fresh (forward-compatible against a shape change instead of crashing).
- **Validate on hydrate**: drop any `selectedSessionId` / addon id / merch key that no longer exists in the mocks, so stale saved data can't render a broken selection.
- **Reset**: a single `reset()` clears both the reactive store and the storage key — the only thing that wipes state, used by Back to Home (§4.3).

`localStorage` is chosen over `sessionStorage` deliberately: the "come back later and edit" flow needs it to outlive the tab.

### 4.3 Post-submit lifecycle (simplified)

`status` drives what happens after Step 4 submit, kept deliberately minimal to match the design — the success screen has a single **Back to Home** button, no edit/update:

- Submit with no errors → set `status = 'submitted'`, stamp `submittedAt`, `push('/success')`.
- **Reload while submitted**: persisted `status === 'submitted'` hydrates on load, so the success screen shows again; the wizard step routes redirect to `/success` while submitted, so the form can't be re-entered.
- **Back to Home** (the only action on the success screen) → `reset()` (clears store + storage, `status` back to draft) → `push('/attendee')` for a fresh registration. This is the only state wipe.

No view/edit path: once submitted, the registration is read-only until Back to Home starts a new one. This keeps both the flow and the design surface small.

---

## 5. Proposed file structure

```
src/
  types.js                     # JSDoc @typedef domain models (annotations only)
  data.js                      # JSDoc-typed re-export of mocks (mocks left untouched)
  jsconfig.json                # checkJs + strict for editor-level JSDoc checking (repo root)
  router/routes.js             # nested step routes under WizardLayout + /success (edit provided files)
  layouts/WizardLayout.vue     # persistent shell: stepper + footer + summary + <router-view/>; creates+provides store
  pages/
    steps/  Step1AttendeeInfo.vue  Step2SessionSelection.vue  Step3Addons.vue  Step4Review.vue
    SuccessScreen.vue          # summary + single Back-to-Home action (§4.3)
  components/
    cards/  TicketCard.vue  SessionCard.vue  WorkshopCard.vue  MealCard.vue  MerchCard.vue
    ui/     OrderSummary.vue  StepperHeader.vue  WizardFooter.vue
  composables/
    useRegistration.js         # reactive store + provide/inject Symbol key + reset() (JSDoc-typed)
    useRegistrationPersistence.js  # localStorage save/hydrate/validate/version (§4.2)
    usePricing.js              # computed itemized breakdown
    useValidation.js           # errorsByStep, first-error step, submit gate
    useTimeConflicts.js        # interval overlap + session/workshop conflicts
    useCurrency.js             # Intl currency formatter
  mocks/  css/  unocss/         # provided — do not modify
```

---

## 6. Business logic (write first, as pure typed functions)

**Pre-flight — read the mocks before coding.** The mock files imply behavior the README doesn't spell out, so confirm these against `event.js` / `sessions.js` / `addons.js` first (the JSDoc typedefs in `types.js` should match whatever is found): is a ticket required for a valid registration; can workshops be selected with no sessions chosen; are meals multi-select (any day/slot field?); can multiple merch items be ordered at once; does shipping become optional again after all merch is removed; and does any field structure imply a stricter phone/format rule. Current plan assumes: ticket required, workshops independent (only session-conflict disables), meals multi-select, merch multi with per-item qty, shipping conditional on `hasMerch`. Adjust if a mock says otherwise.

### 6.1 Time-conflict detection + TIMEZONE RULE

Mock timestamps are UTC (`2028-11-15T09:00:00Z`) and the design renders that as "9:00 AM". Formatting in local time (Taipei UTC+8) would shift every time by 8 hours and break fidelity. **Always format and compare in UTC** (`Intl.DateTimeFormat` with `timeZone: 'UTC'`, or `getUTC*`).
Overlap: intervals `[aStart,aEnd)` and `[bStart,bEnd)` overlap iff `aStart < bEnd && bStart < aEnd` (compare via `getTime()`).

- **Session vs session** (deferred to Step 4): known overlaps in data — Day1 s2/s3, s4/s5; Day2 s8/s9, s11/s12. Selecting both of a pair is a Step 2 error surfaced at submit, NOT blocked at selection.
- **Workshop vs selected session** (live in Step 3): a workshop is unavailable if it overlaps any selected session. `ws1` (Nov16 14:00 to 17:00) overlaps s11/s12; `ws2` (Nov15 15:30 to 18:30) overlaps s6. Reactive: deselecting the session re-enables it.

### 6.2 Capacity

`registered >= capacity` renders full/disabled and non-selectable. Already full in data: s2 (120/120), s9 (90/90), ws2 (25/25). Remaining = `capacity - registered`.

### 6.3 Pricing — VIP discount applies to WORKSHOPS ONLY

VIP 10% is not order-wide.

```
ticketPrice      = ticket.price
workshopsGross   = sum(selected workshop prices)
workshopDiscount = isVip ? workshopsGross * 0.10 : 0
mealsTotal       = sum(selected meal prices)
merchTotal       = sum(qty * price)
grandTotal       = ticketPrice + (workshopsGross - workshopDiscount) + mealsTotal + merchTotal
```

Sessions are free (included). Expose one itemized array feeding both the live summary and Step 4. Verified against design: 599+149-14.90 = 733.10; 599+35+36 = 670.00; 599+149+35+36-14.90 = 804.10.

### 6.4 Currency

`$X,XXX.XX` via `Intl.NumberFormat('en-US',{ style:'currency', currency:'USD' })`. One formatter, never string concat.

### 6.5 Conditional shipping address

Optional until any merch selected, then required. Drives the Step 3 banner and a Step 1 error at submit.

### 6.6 Add-on selection semantics

Only the ticket is single-select. Everything else stacks independently:

- **Sessions**: multi-select; overlaps allowed at selection, flagged at Step 4 (§6.1).
- **Workshops**: multi-select; only conflict-with-selected-session disables one, live (§6.1).
- **Meals**: multi-select, no conflict logic — two meal packages don't clash, so `selectedMealIds` is a plain array summed in pricing. (The model already supports this; confirm against `addons.js` in case a meal carries a day/slot field that would imply otherwise.)
- **Merch**: multiple items at once, each `{ qty, size? }`, qty capped at `maxQuantity`.

---

## 7. Validation strategy

`useValidation.js` returns `errorsByStep` — a step-keyed object `{ 1: ValidationError[], 2: ..., 3: ..., 4: ... }` (JSDoc `@typedef`), computed from the store:

- **Step 1**: fullName/email/phone/company/jobTitle required; email + phone format; shippingAddress required iff `hasMerch`.
- **Step 2**: no overlapping selected sessions (§6.1).
- **Step 3**: merch integrity (qty within maxQuantity, size chosen when `sizes` present).
- **Submit gate**: if any errors, mark failing steps and navigate to the lowest failing step; else show success.

Email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.

Phone: US-only (NANP). Normalize with `const digits = value.replace(/\D/g, '')`, then accept `digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))`; use `<input type="tel">` and display as `(XXX) XXX-XXXX`. This accepts `(415) 555-2671`, `4155552671`, `1-415-555-2671` and rejects letters, too-short input, and international numbers.

---

## 8. Staged commit plan mapped to spec

### 8.1 Spec reference legend (where the refs come from)

Refs use `S<step>.<item>` for the README "Step Details" numbering, and `EC<n>` for this doc's Evaluation Criteria. This makes every stage traceable to an authoritative line.

README Step Details:

- **S1** Attendee Info: `S1.fields` (6-field table + validation rules), `S1.tickets` (3 ticket cards, single-select), `S1.noInline` (no inline validation; all at submit).
- **S2** Session Selection: `S2.1` group by date, `S2.2` time-conflict deferred to Step 4, `S2.3` capacity full/disabled, `S2.4` card shows title/speaker/time/track/spots.
- **S3** Add-ons: `S3.1` group by category, `S3.2` workshop time conflicts, `S3.3` merch sizes/maxQuantity, `S3.4` shipping banner, `S3.5` running total, `S3.6` currency `$X,XXX.XX`.
- **S4** Review & Submit: `S4.1` summary display, `S4.2` itemized pricing, `S4.3` edit buttons, `S4.4` unified validation, `S4.5` error navigation, `S4.6` success state.

Evaluation Criteria: `EC1` Vue Patterns (25%), `EC2` Design Fidelity (20%), `EC3` Code Quality & Architecture (20%), `EC4` JavaScript Logic (20%), `EC5` UX Polish (15%), `Bonus` AI Collaboration (+5%).

### 8.2 Stages (each = one logical commit)

| #   | Commit                                        | Builds                                                                                                                                                                                             | Spec refs                                                  |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 0   | `chore: initial starter (unchanged baseline)` | Pristine clone (fresh history)                                                                                                                                                                     | Provenance                                                 |
| 1   | `docs: add PLAN.md + AI-LOG.md`               | Planning, task breakdown, and the AI-usage log committed on top of the pristine baseline, before any code — so the history shows the plan preceding the work                                        | Process; commit history                                    |
| 2   | `chore: add JSDoc domain models + jsconfig`   | `jsconfig.json`, `types.js` (@typedef), typed `data.js`, `useCurrency`, `useTimeConflicts` (UTC-safe), pure pricing calc (verified vs 733.10/670/804.10)          | S3.6, EC4; foundation                                      |
| 3   | `feat: store + wizard layout + nested routes` | `useRegistration` (typed + provide/inject + `reset()`), `WizardLayout` parent (stepper, footer, summary, `<router-view>`), nested step routes + `/success` guard, free nav, `<keep-alive>` + direction-aware transition; localStorage persistence + hydrate/validate/version (§4.2)                                       | EC1; S4.5 (jump); Requirements: free nav + preserved state |
| 4   | `feat: step 1 attendee info + ticket cards`   | 6 fields, 3 ticket cards (single-select), no inline validation                                                                                                                                     | S1.fields, S1.tickets, S1.noInline                         |
| 5   | `feat: step 2 session selection`              | Nov 15/16 tabs, session cards, full-disabled, "N selected", capacity bar                                                                                                                           | S2.1, S2.3, S2.4                                           |
| 6   | `feat: step 3 add-ons + order summary`        | Category tabs, workshop conflict-disable, meal cards, merch size + qty, shipping banner, live summary w/ VIP discount                                                                              | S3.1, S3.2, S3.3, S3.4, S3.5, S3.6; EC4                    |
| 7   | `feat: step 4 review + unified validation`    | Summary, itemized pricing, Edit->Step links, submit-time validation, error banner + stepper indicators + inline required + danger border, submit gate; session-conflict check (S2.2) surfaces here | S4.1, S4.2, S4.3, S4.4, S4.5, S2.2                         |
| 8   | `feat: success screen + back-to-home reset`   | Success screen + summary (design-fidelity, single Back-to-Home button); `status`/`submittedAt`; submitted state persists so reload re-shows success + step routes redirect to `/success`; Back to Home → `reset()` (only state wipe); no edit path (§4.3)                        | S4.6                                                       |
| 9   | `polish: design fidelity + states`            | Token mapping, track/progress-bar colors, hover/disabled/active/error states, pixel audit at 1440 (§10.2), JSDoc/editor checks clean                                                               | EC2                                                        |
| 10  | `feat: motion + transitions`                  | Step transitions, card/select feedback, summary list add/remove, error/banner entrance, progress-bar + success animations, direction-aware step transitions (§10.3)                               | EC5                                                        |

Optional stages (only after core 0 to 10 are solid). See §11 (Nice to have) and §12 (Testing).

| #   | Commit                                                | Builds                                                 | Notes                                                      |
| --- | ----------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| 11  | `test: unit tests for pricing, conflicts, validation` | Vitest on pure functions                               | Coverage % not evaluated; correctness net + quality signal |
| 12  | `feat: responsive layout`                             | Mobile breakpoints for stepper, cards, summary sidebar | Named nice-to-have                                         |
| 13  | `feat: i18n (en-US, zh-TW)`                           | vue-i18n, extract UI strings, en-US default + zh-TW    | Named nice-to-have                                         |

Commit atomically at each stage; keep the history readable.

---

## 9. React -> Vue cheat sheet (personal reference)

Plain `<script setup>` (JS); types via JSDoc where useful.

| React               | Vue 3 `<script setup>` (JS)                              |
| ------------------- | -------------------------------------------------------- |
| `useState`          | `ref()` / `reactive()` (JSDoc `@type` where non-obvious) |
| `useMemo` / derived | `computed`                                               |
| `useEffect` (sync)  | prefer `computed`; `watch` only for side effects         |
| controlled input    | `v-model`                                                |
| child form control  | `defineModel({ type, default })`                         |
| props               | `defineProps({ ... })` + JSDoc `@typedef` for shape      |
| callbacks up        | `defineEmits(['change', ...])`                           |
| Context             | `provide` / `inject` with an exported `Symbol` key       |
| `.map()`            | `v-for` with `:key`                                      |
| lifecycle mount     | `onMounted`                                              |

Eval-relevant: `defineModel` in cards/fields (typed via options + JSDoc), derived state in `computed` not `watch`, shared logic in JSDoc-typed composables.

---

## 10. Design notes & decisions

### 10.1 Notes from Figma screenshot review

- **Header year**: frames say "WebDev Summit 2025" but `event.name` is "WebDev Summit 2028" (dates + T-shirt copy confirm 2028). Bind header to `event.name`; do not hardcode.
- **Timezone**: render mock UTC timestamps in UTC (see §6.1).
- **s5 dimming**: "Database Performance Tuning" (52/90, not full) appears dimmed on the Sessions frame, likely because it conflicts with selected s4. Spec says sessions are freely selectable with conflicts deferred to Step 4, so implement as free selection; if mirroring the visual, use a soft non-blocking "conflicts with a selected session" hint, not a hard disable.
- **Sold-out sessions** must be truly non-interactive, not just labelled.
- **Ignore mockup quantity artifact** (sticker card qty vs summary): totals are computed live.
- **Card details to replicate**: capacity progress bar colored by fill (green -> olive -> red), track badge color per track, `+ Added to order` affordance, brand-border selected state, qty stepper capped at `maxQuantity`.

### 10.2 Pixel-perfect audit (PPA) reference

Design Fidelity is 20% and rewards pixel-perfect reproduction, so audit against a fixed reference. The Figma frames are **1440 wide (fixed), height hug** (smallest is 1440x981). Treat **1440px as the canonical desktop audit width** and build/QA the desktop layout at exactly 1440. There are no other desktop widths in the file, so 1440 is the single source of fidelity truth; anything narrower is the responsive nice-to-have (§11), extrapolated, not spec'd.

PPA method per screen: set the browser viewport to 1440, screenshot each step, overlay against the matching Figma frame (export at 1x, or Figma "compare"), and check spacing, font sizes (map to the `text-h*`/`text-lg/md/sm` tokens, not eyeballed px), colors (token names, never hex), border radius, and the interactive states (hover/active/disabled/error). Keep a short PPA checklist in the commit for stage 9. Content height "hugs", so do not force fixed heights; let content flow.

> **Note for the interviewer — `pixel-perfect-captures/`.** This directory holds the reference PPA snapshots taken at the 1440 audit width (`stage-1`, `stage-2`, `stage-3_workshop`, `stage-3_merchandise`, `stage-4_review`, `stage-4_review-error-state`). They are the overlay targets the stage-9 design-fidelity pass was tuned against — the many small token/spacing adjustments logged in `AI-LOG.md` (stepper, badge colours, card padding/gap, selected states, review error list, etc.) were each verified in-browser against these captures. They are committed as evidence of the fidelity work, not consumed by the app at runtime.

### 10.3 Motion & transitions (stage 10 targets)

UX Polish (15%) explicitly scores transitions and animations, so motion is a dedicated stage, not an afterthought. All motion is token/timing-consistent (one easing + duration scale, e.g. 150ms micro, 250ms step), respects `prefers-reduced-motion`, and never blocks input.

| Interaction                        | Target component                      | Motion                                                                                                     |
| ---------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Step change (next/back/jump)       | wizard shell / step host              | slide + fade, `<transition>` (or `<transition-group>`), `mode="out-in"`; direction-aware (forward vs back) |
| Session day-tab switch             | Step2SessionSelection / SegmentedTabs | slide left/right + fade on the day panel; direction-aware (later day → slide in from right)                 |
| Lazy route/chunk load              | `App.vue` `<router-view>`             | `fade` transition on the async component (no Suspense, §4.1)                                              |
| Ticket / session / workshop select | TicketCard, SessionCard, WorkshopCard | border + background ease to selected; subtle scale/press on click                                          |
| Card hover / disabled              | all cards                             | hover elevation/border ease; disabled = no transition, reduced opacity                                     |
| Add/remove order line              | OrderSummary                          | `<transition-group>` list enter/leave (height + fade) as items change                                      |
| Total change                       | OrderSummary total                    | brief number tick/flash on update                                                                          |
| Qty +/-                            | MerchCard stepper                     | value pop; button press feedback                                                                           |
| Shipping banner appears            | Step3Addons                           | slide-down/fade when first merch added                                                                     |
| Validation errors appear           | Step4Review, StepperHeader            | error banner fade/slide; stepper error dot pulse once; danger border ease-in on failing section            |
| Capacity bar                       | SessionCard                           | width transition on mount (0 to fill)                                                                      |
| Success screen                     | SuccessScreen                         | check-mark draw/scale-in, content fade-up                                                                  |
| Button states                      | WizardFooter                          | hover/active/disabled background ease                                                                      |

Prefer CSS transitions + Vue `<transition>`/`<transition-group>` over JS animation libs (no dependency). Add a lib only if a specific effect needs it, and justify in §13.

### 10.4 Accessibility (cheap wins, high value)

Not a scored line item, but it lands under Code Quality and UX Polish and is nearly free in Vue. Do the high-value basics, not a full WCAG audit: real semantic elements (`<button>` for actions, `<label for>` on every field); `aria-invalid` + `aria-describedby` on errored fields after submit; the stepper as a proper list with `aria-current="step"` on the active step; move focus to the step heading on step change so keyboard/screen-reader users aren't stranded; make selectable cards keyboard-operable (`role="button"` or a real button, Enter/Space to toggle, visible focus ring); and keep the disabled/full states genuinely `disabled`/non-focusable, not just dimmed. Skip anything heavier (live regions, focus traps) unless time allows.

---

## 11. Nice to have (the two named in the doc)

Only after core stages 0 to 9. The doc names exactly two, so scope stays tight.

**Responsive design (mobile).** Lowest-risk, highest-visible bonus. The token system already ships responsive typography (`typography.scss` scales h1 to h4 under 1023px) and UnoCSS breakpoints (`tablet: 768px`, `desktop: 1024px`). Plan:

- Wizard shell: stack the Step 3 order-summary sidebar below content on mobile; make the stepper header horizontally scrollable or collapse labels to numbers.
- Cards: single-column session/add-on grids under `tablet`; ensure tap targets and the qty stepper stay usable.
- Footer nav: keep Back/Next reachable (sticky bottom on small screens).
- Verify at 375px, 768px, 1280px. No new dependency required.

**i18n (vue-i18n).** Higher effort, so second priority. Locales: **en-US (default) and zh-TW** (Traditional Chinese, Taiwan) only. Plan:

- Add `vue-i18n`, register a boot file, extract UI strings (labels, step titles, banner, validation messages) into `src/locales/en-US.js` and `src/locales/zh-TW.js`, with a simple language switch.
- Keep mock/domain data as-is (session titles, speakers, product names are not translated); only chrome/UI strings are localized.
- Currency stays `en-US`/USD via `Intl` regardless of UI locale (prices are USD); pass locale explicitly to the formatter so zh-TW does not reformat the currency.
- Watch zh-TW line lengths (labels run longer/shorter than English) against the 1440 layout.
- Document as a dependency in §13 if attempted.

If time forces a choice, do responsive first (visible, cheap, no dep) and i18n only if comfortable.

---

## 12. Testing

**Context: the doc lists "Test coverage percentage" under Not Evaluated.** So do not chase coverage. Tests are optional and worth doing only as (a) a correctness safety net for the logic that carries the JavaScript Logic 20% weight, and (b) a small quality signal. Keep them fast, pure, and few.

Tool: **Vitest** (Vite-native, integrates with the Quasar/Vite setup; add `vitest` + `@vue/test-utils` as devDeps, document in §13).

What is actually worth testing (pure functions, no DOM):

- **Pricing** (`usePricing`): VIP discount applies to workshops only and not order-wide; non-VIP gets no discount; merch qty \* price; grand total. Assert the three verified figures: 733.10, 670.00, 804.10.
- **Time conflicts** (`useTimeConflicts`): the known overlaps (s2/s3, s4/s5, s8/s9, s11/s12) return true; non-overlaps return false; workshop-vs-session (ws1 vs s11/s12, ws2 vs s6) flagged; comparisons run in UTC.
- **Validation** (`useValidation`): required-field rules; email/phone format; shipping required iff merch selected; overlapping sessions produce a Step 2 error.
- **Currency** (`useCurrency`): formats to `$X,XXX.XX`.

Optionally one component smoke test (mount the wizard, assert step navigation preserves state), but only if core is done. Skip snapshot tests and coverage gates.

Add a `test` script (`vitest run`). These tests also back up specific PLAN.md claims about correctness.

---

## 13. Dependencies — decisions _(confirm as you go)_

- **No TypeScript**: matching Nitra's JS stack. Types via JSDoc `@typedef` + a `jsconfig.json` (`checkJs`), which needs no installed dependency (editor language service does the checking). See §2. Optional `npx vue-tsc --noEmit` as an ad-hoc gate only, never committed.
- **No date library**: native `Date` + `Intl` cover overlap and formatting.
- **No form/validation library**: validation is deferred and unified; hand-rolled is cleaner and shows the logic being scored.
- **No lodash**: grouping is a small `reduce`.
- **vitest + @vue/test-utils**: only if attempting §12 tests. Dev-only; no runtime footprint.
- **vue-i18n**: only if attempting the i18n nice-to-have (§11); justify then.

**Supply-chain note.** The core build adds **no dependencies at all** — no TS toolchain, no date/validation/utility libs (types are JSDoc + editor-checked; logic is hand-rolled), so the added attack surface is effectively zero. Any optional-stage dep (vitest, vue-i18n) is a small, long-established package pinned via the lockfile. Yarn's release-age gate (`npmMinimalAgeGate` in `.yarnrc.yml`, in minutes) would add a cooldown against newly-published compromised versions, but the starter pins Yarn 4.6.0 (the feature needs 4.12+) and nothing added here is a fresh release, so the pinned toolchain was left untouched rather than change provided config.

---

## 14. AI collaboration notes _(fill as you go — bonus up to +5%)_

Per entry: Task, Prompt, Outcome, Review/correction (the correction is what earns the bonus). Watch for AI slips: applying VIP discount order-wide instead of workshops only; blocking session conflicts at selection instead of deferring; hardcoding hex; using `watch` where `computed` fits; formatting times in local zone.

## 15. Challenges & solutions _(fill as you go)_

## 16. What I'd improve with more time _(fill as you go)_

- Whichever of tests / responsive / i18n (§11, §12) did not make it in; broader component tests; keyboard/ARIA on stepper and cards.

## 17. Definition of done

- [ ] Clean checkout runs on :9001; JSDoc/editor type checks clean, no console errors
- [ ] 4 steps, free nav; each step has its own URL (`/attendee`.../review`); form + UI state (tab, expanded, scroll) preserved via keep-alive
- [ ] Refresh / shared step URL / return visit restores state (localStorage, validated on hydrate); `/success` guarded until submitted
- [ ] Sessions grouped, full disabled, spots shown, times in UTC
- [ ] Add-ons grouped; meals multi-select; merch size/qty; shipping banner on merch
- [ ] Workshop disabled when conflicting with a selected session
- [ ] Live summary, correct VIP workshop discount, `$X,XXX.XX`
- [ ] Email + US-only (NANP) phone validation
- [ ] Unified submit validation; step error indicators; jump-to-step
- [ ] Session time-conflicts caught at submit
- [ ] Success screen with summary (single Back-to-Home button); reload while submitted re-shows success; Back to Home resets to a new registration
- [ ] Tokens only, no hex; hover/disabled/error/active states; audited at 1440 (§10.2)
- [ ] Step + card + summary transitions in place; reduced-motion respected
- [ ] Accessibility basics: labels, `aria-invalid`, `aria-current` step, focus-on-step-change, keyboard-operable cards (§10.4)
- [ ] Atomic commit history; PLAN.md complete
