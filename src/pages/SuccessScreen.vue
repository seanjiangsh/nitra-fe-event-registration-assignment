<script setup>
/**
 * Success screen (§4.3). Top-level route, outside `WizardLayout` (no stepper /
 * footer), reachable only once `status === 'submitted'`. It is self-contained:
 * it reads the durable persisted registration rather than the layout's store
 * (which is unmounted here), and "Back to Home" is the single action — it clears
 * persisted state and starts a fresh registration, the only full state wipe.
 *
 * Stage 3 stub: the confirmation summary is fleshed out in stage 8.
 */
import { useRouter } from 'vue-router'
import { clearPersisted } from '../composables/useRegistrationPersistence.js'
import { FIRST_STEP_PATH } from '../router/steps.js'

const router = useRouter()

function backToHome() {
  clearPersisted()
  router.push(FIRST_STEP_PATH)
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center p-6">
    <div class="text-center max-w-120">
      <h1 class="text-h2 text-neutral m-0 mb-2">Registration submitted</h1>
      <p class="text-lg text-neutral-muted m-0 mb-6">
        Thanks for registering. (Confirmation summary comes in stage 8.)
      </p>
      <button
        type="button"
        class="px-5 py-2 rounded-lg text-md font-semibold border-none text-inverse cursor-pointer transition-colors bg-brand-emphasis-rest hover:bg-brand-emphasis-hover"
        @click="backToHome"
      >
        Back to Home
      </button>
    </div>
  </main>
</template>
