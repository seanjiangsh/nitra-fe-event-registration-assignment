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
import { provideRegistration } from '../composables/useRegistration.js'
import { EVENT } from '../data.js'
import StepperHeader from '../components/ui/StepperHeader.vue'
import WizardFooter from '../components/ui/WizardFooter.vue'

// Create + provide the store once, here at the shell root (§4).
provideRegistration()

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

/** Placeholder submit handler — validation + submit gate arrive in stage 7. */
function onSubmit() {
  // no-op for now; stage 7 wires unified validation and the submit gate
}
</script>

<template>
  <div class="min-h-screen bg-surface-l1 flex flex-col">
    <header class="bg-surface-l0 border-b border-solid border-neutral-muted">
      <div class="mx-auto max-w-[1200px] w-full px-6 py-4 flex flex-col gap-4">
        <h1 class="text-subtitle1 text-brand-emphasis m-0">{{ EVENT.name }}</h1>
        <StepperHeader />
      </div>
    </header>

    <!-- The order summary is not layout chrome — it lives inside Step 3 only
         (per the design), so the shell is a single centered column. -->
    <main class="mx-auto max-w-[1120px] w-full px-6 py-8 flex-1">
      <router-view v-slot="{ Component, route }">
        <transition :name="transitionName(route)" mode="out-in">
          <keep-alive>
            <component :is="Component" :key="route.name" />
          </keep-alive>
        </transition>
      </router-view>
    </main>

    <footer class="bg-surface-l0 border-t border-solid border-neutral-muted">
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
