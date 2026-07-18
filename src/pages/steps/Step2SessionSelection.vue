<script setup>
/**
 * Step 2 — Session Selection. Stage 3 stub. The `day` ref below is deliberate
 * step-local UI state used to verify `<keep-alive>`: pick a day, navigate away
 * and back, and the selection survives because the layout keeps this instance
 * alive. Real session cards, grouping, and capacity arrive in stage 5.
 */
import { ref } from 'vue'
import { EVENT } from '../../data.js'

const day = ref(EVENT.dates[0])
</script>

<template>
  <section>
    <h1 class="text-h3 text-neutral m-0 mb-1">Sessions</h1>
    <p class="text-md text-neutral-muted m-0 mb-4">Step 2 of 4 — choose your sessions.</p>

    <div class="flex gap-2">
      <button
        v-for="d in EVENT.dates"
        :key="d"
        type="button"
        class="px-3 py-2 rounded-lg text-md font-medium border border-solid cursor-pointer transition-colors"
        :class="d === day ? 'bg-brand-emphasis-rest text-inverse border-brand-emphasis' : 'bg-surface-l0 text-neutral border-neutral-muted'"
        @click="day = d"
      >
        {{ d }}
      </button>
    </div>
    <p class="text-sm text-neutral-quiet mt-3">
      (Placeholder day tabs — keep-alive check. Selected day survives navigation. Session cards come in stage 5.)
    </p>
  </section>
</template>
