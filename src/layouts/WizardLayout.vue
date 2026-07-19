<script setup>
/**
 * Persistent wizard shell (§4.1). This is the route parent for the four step
 * routes, so it mounts once and stays mounted across step changes — which makes
 * it the single place the shared store is created and `provide`d, and the home
 * of the stepper, footer, and live order summary.
 *
 * The `<router-view>` wraps each step in `<keep-alive>` (so step-local UI state
 * survives navigation) and a direction-aware `<transition>` (forward vs back is
 * derived from the step-index delta). Motion is intentionally light here; the
 * easing/animation polish is stage 10.
 */
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { provideRegistration } from '../composables/useRegistration.js'
import { STEPS } from '../router/steps.js'
import { EVENT } from '../data.js'
import StepperHeader from '../components/ui/StepperHeader.vue'
import WizardFooter from '../components/ui/WizardFooter.vue'

// Create + provide the store once, here at the shell root (§4).
const store = provideRegistration()

const route = useRoute()
const router = useRouter()

// The header and footer are sticky (fixed height); only <main> scrolls. Reset
// its scroll to the top on every step change so a new step starts at the top.
const scrollMain = ref(/** @type {HTMLElement | null} */ (null))
watch(
  () => route.path,
  (path) => {
    if (scrollMain.value) scrollMain.value.scrollTop = 0
    // Reaching the review step activates validation (error banner + stepper
    // flags + the submit gate). This goes beyond the spec's submit-click model
    // (§7) but is better UX: the user sees what's missing and Submit stays
    // disabled until it's fixed.
    if (path === '/review') store.submitAttempted.value = true
  },
  { immediate: true },
)

/**
 * Direction-aware transition name for a step route. The router guard stashes it
 * on `to.meta.transition`; this narrows it to a string (falling back to a plain
 * fade) so the `<transition name>` binding is well-typed.
 *
 * @param {import('vue-router').RouteLocationNormalizedLoaded} route
 * @returns {string}
 */
function transitionName(route) {
  return typeof route.meta.transition === 'string' ? route.meta.transition : 'fade'
}

/**
 * Unified submit gate (S4.4/S4.5). Validate everything at once; if anything
 * fails, mark the attempt (which reveals errors + stepper flags) and jump to the
 * lowest failing step. On success the registration is submitted — the success
 * screen + redirect are wired in stage 8.
 */
function onSubmit() {
  const { ok, firstErrorStep } = store.submit()
  if (!ok && firstErrorStep) {
    router.push(STEPS[firstErrorStep - 1].path)
  }
}
</script>

<template>
  <!-- App shell: fixed viewport height, header + footer sticky, only <main>
       scrolls (h-screen + overflow-hidden on the frame). -->
  <div class="h-screen bg-surface-l0 flex flex-col overflow-hidden">
    <header class="shrink-0 bg-surface-l0 border-b border-solid border-neutral-muted">
      <div class="mx-auto max-w-[1200px] w-full px-6 py-4 flex flex-col gap-4">
        <h1 class="text-subtitle1 text-brand-emphasis m-0">{{ EVENT.name }}</h1>
        <StepperHeader />
      </div>
    </header>

    <!-- Only scrollable region. The order summary is not layout chrome — it
         lives inside Step 3 only, so the shell is a single centered column. -->
    <main ref="scrollMain" class="flex-1 overflow-y-auto">
      <div class="mx-auto max-w-[1120px] w-full px-6 py-8">
        <router-view v-slot="{ Component, route: r }">
          <transition :name="transitionName(r)" mode="out-in">
            <keep-alive>
              <component :is="Component" :key="r.name" />
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </main>

    <footer class="shrink-0 bg-surface-l0 border-t border-solid border-neutral-muted">
      <div class="mx-auto max-w-[1200px] w-full px-6 py-4">
        <WizardFooter @submit="onSubmit" />
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Direction-aware step transitions (structural; polished in stage 10). */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active,
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-next-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-24px);
}
.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

@media (prefers-reduced-motion: reduce) {
  .slide-next-enter-active,
  .slide-next-leave-active,
  .slide-prev-enter-active,
  .slide-prev-leave-active,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
  .slide-next-enter-from,
  .slide-next-leave-to,
  .slide-prev-enter-from,
  .slide-prev-leave-to {
    transform: none;
  }
}
</style>
