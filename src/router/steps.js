/**
 * Wizard step metadata — the single source of truth for step order, URL, and
 * label. Routes build children from this, the stepper renders from it, the
 * footer derives Back/Next targets from it, and the transition derives its
 * direction from the index delta between two step paths. Keeping it in one place
 * means adding/reordering a step never drifts across those consumers.
 *
 * @module router/steps
 */

/**
 * One wizard step.
 * @typedef {Object} WizardStep
 * @property {number} order        // 1-based position, matches the §7 error keys
 * @property {string} name         // route name
 * @property {string} path         // route path under the layout, e.g. '/attendee'
 * @property {string} label        // stepper label
 * @property {string} [ctaLabel]   // fuller label for the footer "Next" CTA (falls back to `label`)
 */

/** @type {WizardStep[]} */
export const STEPS = [
  { order: 1, name: 'attendee', path: '/attendee', label: 'Attendee Info' },
  { order: 2, name: 'sessions', path: '/sessions', label: 'Sessions', ctaLabel: 'Session Selection' },
  { order: 3, name: 'add-ons', path: '/add-ons', label: 'Add-ons' },
  { order: 4, name: 'review', path: '/review', label: 'Review' },
]

/** The path the wizard opens on. */
export const FIRST_STEP_PATH = STEPS[0].path

/**
 * Zero-based index of a step path within {@link STEPS}, or -1 for non-step
 * paths (e.g. `/success`).
 *
 * @param {string} path
 * @returns {number}
 */
export function stepIndex(path) {
  return STEPS.findIndex((step) => step.path === path)
}

/**
 * True if the given path is one of the four wizard step routes.
 *
 * @param {string} path
 * @returns {boolean}
 */
export function isStepPath(path) {
  return stepIndex(path) !== -1
}
