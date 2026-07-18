import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes.js'
import { isStepPath, stepIndex, FIRST_STEP_PATH } from './steps.js'
import { readPersistedStatus } from '../composables/useRegistrationPersistence.js'

export default function () {
  const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: () => ({ left: 0, top: 0 }),
  })

  /**
   * Status-based guards (§4.1 / §4.3). Free navigation between the four steps is
   * never blocked; the only guards are lifecycle-based, and they read the
   * durable persisted status because guards run before the layout's provided
   * store exists:
   *  - while submitted, the wizard steps redirect to `/success` (form is
   *    read-only post-submit, and a reload re-shows success);
   *  - `/success` redirects back to the first step while still a draft, so it
   *    can't be reached without a submission.
   */
  router.beforeEach((to, from) => {
    // Direction-aware step transition: stash the name on `to.meta` here, before
    // the navigation resolves, so it is stable by the time the layout's
    // <transition> runs. (Flipping a reactive name mid-swap desyncs Vue's
    // transition classes and hangs `mode="out-in"`.)
    const delta = stepIndex(to.path) - stepIndex(from.path)
    to.meta.transition = delta < 0 ? 'slide-prev' : 'slide-next'

    const submitted = readPersistedStatus() === 'submitted'
    if (submitted && isStepPath(to.path)) {
      return { path: '/success' }
    }
    if (!submitted && to.path === '/success') {
      return { path: FIRST_STEP_PATH }
    }
    return true
  })

  return router
}
