<script setup>
/**
 * Success screen (§4.3, S4.6). Top-level route, outside `WizardLayout` (no
 * stepper / footer), reachable only once `status === 'submitted'` (router guard).
 * It is self-contained: it reads the durable persisted registration rather than
 * the layout's store (which is unmounted here), so a reload re-shows it. "Back to
 * Home" is the single action — it clears persisted state and starts a fresh
 * registration, the only full state wipe.
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { hydrate, clearPersisted } from '../composables/useRegistrationPersistence.js'
import { FIRST_STEP_PATH } from '../router/steps.js'
import { EVENT } from '../data.js'

const router = useRouter()

// The submitted registration (read once from storage; the store is unmounted here).
const registration = hydrate()

/** Deterministic confirmation number from submittedAt, so it's stable on reload. */
const confirmationNumber = computed(() => {
  const year = EVENT.dates[0].slice(0, 4)
  const stamp = registration?.submittedAt ? new Date(registration.submittedAt).getTime() : Date.now()
  return `WD${year}-${String(stamp).slice(-5)}`
})

const attendeeName = computed(() => registration?.attendee.fullName?.trim() ?? '')
const attendeeEmail = computed(() => registration?.attendee.email?.trim() ?? '')

function backToHome() {
  clearPersisted()
  router.push(FIRST_STEP_PATH)
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center p-6">
    <div class="flex flex-col items-center gap-5 text-center max-w-[32rem]">
      <!-- Success mark (exact Figma SVG; the green + white are icon-internal). -->
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="80" height="80" rx="40" fill="#15B471" />
        <path d="M22 40L34.8571 54L58 26" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

      <h1 class="text-h2 text-neutral m-0">Registration Complete!</h1>

      <p class="text-lg font-semibold text-brand-emphasis m-0">Confirmation #{{ confirmationNumber }}</p>

      <p class="text-md text-neutral-muted m-0">
        Thank you<template v-if="attendeeName">, {{ attendeeName }}</template>! Your spot at
        {{ EVENT.name }} is confirmed.
        <template v-if="attendeeEmail"> A confirmation email has been sent to {{ attendeeEmail }}.</template>
      </p>

      <button
        type="button"
        class="mt-2 px-6 py-2.5 rounded-lg text-md font-semibold border-none text-inverse cursor-pointer transition-colors bg-accent-emphasis-rest hover:bg-accent-emphasis-hover active:bg-accent-emphasis-active"
        @click="backToHome"
      >
        Back to Home
      </button>
    </div>
  </main>
</template>
