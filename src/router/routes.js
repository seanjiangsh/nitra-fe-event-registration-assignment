import { STEPS, FIRST_STEP_PATH } from './steps.js'

/**
 * Lazy step components, keyed by step name (see {@link STEPS}).
 * @type {Record<string, () => Promise<unknown>>}
 */
const stepComponents = {
  attendee: () => import('../pages/steps/Step1AttendeeInfo.vue'),
  sessions: () => import('../pages/steps/Step2SessionSelection.vue'),
  'add-ons': () => import('../pages/steps/Step3Addons.vue'),
  review: () => import('../pages/steps/Step4Review.vue'),
}

/**
 * The four step routes, nested under the persistent layout. Child paths are
 * relative (no leading slash) so they resolve to `/attendee` … `/review`.
 */
const children = STEPS.map((step) => ({
  path: step.path.slice(1),
  name: step.name,
  component: stepComponents[step.name],
}))

/** @type {import('vue-router').RouteRecordRaw[]} */
export default [
  {
    path: '/',
    component: () => import('../layouts/WizardLayout.vue'),
    redirect: FIRST_STEP_PATH,
    children,
  },
  {
    path: '/success',
    name: 'success',
    component: () => import('../pages/SuccessScreen.vue'),
  },
  // Unknown paths fall back to the first step.
  {
    path: '/:catchAll(.*)*',
    redirect: FIRST_STEP_PATH,
  },
]
