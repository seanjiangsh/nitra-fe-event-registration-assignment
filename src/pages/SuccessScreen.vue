<script setup>
/**
 * Success screen (§4.3, S4.6). Top-level route, outside `WizardLayout` (no
 * stepper / footer), reachable only once `status === 'submitted'` (router guard).
 * It is self-contained: it reads the durable persisted registration rather than
 * the layout's store (which is unmounted here), so a reload re-shows it. "Back to
 * Home" is the single action — it clears persisted state and starts a fresh
 * registration, the only full state wipe.
 */
import { computed } from "vue";
import { useRouter } from "vue-router";
import {
  hydrate,
  clearPersisted,
} from "../composables/useRegistrationPersistence.js";
import { FIRST_STEP_PATH } from "../router/steps.js";
import { EVENT } from "../data.js";
import AppBrand from "../components/ui/AppBrand.vue";

const router = useRouter();

// The submitted registration (read once from storage; the store is unmounted here).
const registration = hydrate();

/** Deterministic confirmation number from submittedAt, so it's stable on reload. */
const confirmationNumber = computed(() => {
  const year = EVENT.dates[0].slice(0, 4);
  const stamp = registration?.submittedAt
    ? new Date(registration.submittedAt).getTime()
    : Date.now();
  return `WD${year}-${String(stamp).slice(-5)}`;
});

const attendeeName = computed(
  () => registration?.attendee.fullName?.trim() ?? "",
);
const attendeeEmail = computed(
  () => registration?.attendee.email?.trim() ?? "",
);

function backToHome() {
  clearPersisted();
  router.push(FIRST_STEP_PATH);
}
</script>

<template>
  <!-- overflow-x-hidden clips the brand row's `ml-12 w-full` right-edge overflow
       (the wizard shell clips it via overflow-hidden); vertical stays natural. -->
  <div class="min-h-screen flex flex-col overflow-x-hidden bg-surface-l0">
    <!-- Same brand header as the wizard shell (brand row must match WizardLayout
         so the logo keeps the same height + position across routes). -->
    <header
      class="shrink-0 bg-surface-l0 border-b border-t-0 border-x-0 border-solid divider-default"
    >
      <div class="ml-12 w-full">
        <AppBrand />
      </div>
    </header>

    <main class="flex-1 flex items-center justify-center p-6">
      <div class="flex flex-col items-center gap-5 text-center max-w-[32rem]">
      <!-- Success mark (exact Figma SVG; the green + white are icon-internal). -->
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        class="success-pop"
      >
        <rect
          width="80"
          height="80"
          rx="40"
          fill="var(--bg-success-emphasis-rest)"
        />
        <path
          d="M22 40L34.8571 54L58 26"
          stroke="white"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <h1
        class="success-rise text-h2 text-success tracking-[0.015rem] m-0"
        style="animation-delay: 90ms"
      >
        Registration Complete!
      </h1>

      <p
        class="success-rise text-lg font-semibold text-brand-emphasis m-0"
        style="animation-delay: 150ms"
      >
        Confirmation #{{ confirmationNumber }}
      </p>

      <p
        class="success-rise text-md text-neutral-muted m-0"
        style="animation-delay: 210ms"
      >
        Thank you<template v-if="attendeeName">, {{ attendeeName }}</template
        >! Your spot at {{ EVENT.name }} is confirmed.
        <template v-if="attendeeEmail">
          A confirmation email has been sent to {{ attendeeEmail }}.</template
        >
      </p>

      <button
        type="button"
        class="success-rise mt-2 px-6 py-2.5 rounded-lg text-md font-semibold border-none text-inverse cursor-pointer transition-colors bg-accent-emphasis-rest hover:bg-accent-emphasis-hover active:bg-accent-emphasis-active"
        style="animation-delay: 270ms"
        @click="backToHome"
      >
        Back to Home
      </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Entrance choreography (stage 10): the mark springs in, then the copy rises in
   a short stagger (delays set inline per element). */
.success-pop {
  animation: success-pop 440ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
@keyframes success-pop {
  0% {
    opacity: 0;
    transform: scale(0.2);
  }
  60% {
    transform: scale(1.08);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
.success-rise {
  animation: success-rise 360ms ease-out both;
}
@keyframes success-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .success-pop,
  .success-rise {
    animation: none;
  }
}
</style>
