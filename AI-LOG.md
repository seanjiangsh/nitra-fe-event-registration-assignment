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

### Stage 2–3 · Claude Code · Scaffold domain models + store + wizard shell
- **Prompt**: JS-only (no .ts/lang="ts"), don't touch mocks/css/unocss/quasar.config;
  types.js @typedef, data.js typed re-export, useCurrency, useTimeConflicts (UTC),
  useRegistration (reactive + Symbol inject key), IndexPage shell, App.vue Suspense.
- **Worked**: _(fill: what it got right first pass)_
- **Didn't / caught**: _(fill: e.g. typedef fields guessed vs actual mock shape;
  local-time formatting; hex instead of tokens; watch instead of computed)_
- **Changed**: _(fill: the specific correction)_

<!-- Append one block per AI step below, same shape. -->
