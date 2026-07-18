<script setup>
/**
 * Step 4 — Review & Submit. Stage 3 stub: echoes a little cross-step state to
 * prove the shared store reaches the last step. Full summary, itemized pricing,
 * Edit links, and unified submit validation arrive in stage 7.
 */
import { useRegistration } from '../../composables/useRegistration.js'
import { format } from '../../composables/useCurrency.js'

const { registration, pricing } = useRegistration()
</script>

<template>
  <section>
    <h1 class="text-h3 text-neutral m-0 mb-1">Review</h1>
    <p class="text-md text-neutral-muted m-0 mb-4">Step 4 of 4 — review and submit.</p>

    <dl class="text-md text-neutral m-0">
      <div class="flex gap-2">
        <dt class="text-neutral-muted">Attendee:</dt>
        <dd class="m-0 font-medium">{{ registration.attendee.fullName || '—' }}</dd>
      </div>
      <div class="flex gap-2">
        <dt class="text-neutral-muted">Total:</dt>
        <dd class="m-0 font-medium">{{ format(pricing.grandTotal) }}</dd>
      </div>
    </dl>
    <p class="text-sm text-neutral-quiet mt-3">(Placeholder — full review + validation come in stage 7.)</p>
  </section>
</template>
