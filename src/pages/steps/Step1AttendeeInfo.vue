<script setup>
/**
 * Step 1 — Attendee Info. Stage 3 stub: proves the store binding and
 * persistence wiring with a single live field. The full 6-field form + ticket
 * cards + deferred validation arrive in stage 4.
 */
import { useRegistration } from '../../composables/useRegistration.js'

const { registration } = useRegistration()
</script>

<template>
  <section>
    <h1 class="text-h3 text-neutral m-0 mb-1">Attendee Info</h1>
    <p class="text-md text-neutral-muted m-0 mb-4">Step 1 of 4 — tell us who's attending.</p>

    <label class="block text-md font-medium text-neutral mb-1" for="fullName">Full name</label>
    <input
      id="fullName"
      v-model="registration.attendee.fullName"
      type="text"
      placeholder="Ada Lovelace"
      class="w-full max-w-96 px-3 py-2 rounded-lg border border-solid border-neutral-muted text-md text-neutral bg-surface-l0"
    />
    <p class="text-sm text-neutral-quiet mt-2">
      (Placeholder field — full form comes in stage 4. Type here, navigate away and back, or refresh to see state preserved.)
    </p>
  </section>
</template>
