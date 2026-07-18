<script setup>
/**
 * Live order summary. Reads the shared store's itemized `pricing` and renders a
 * running breakdown + grand total via the single currency formatter. This is
 * the minimal, wired version; the full styled summary (grouping, transitions,
 * empty states) is fleshed out in stage 6.
 */
import { useRegistration } from '../../composables/useRegistration.js'
import { format } from '../../composables/useCurrency.js'

const { pricing } = useRegistration()
</script>

<template>
  <aside class="bg-surface-l0 border border-solid border-neutral-muted rounded-xl p-4">
    <h2 class="text-subtitle1 text-neutral m-0 mb-3">Order Summary</h2>

    <p v-if="pricing.lines.length === 0" class="text-md text-neutral-muted m-0">
      Nothing selected yet.
    </p>

    <ul v-else class="list-none p-0 m-0 flex flex-col gap-2">
      <li
        v-for="line in pricing.lines"
        :key="line.id"
        class="flex items-baseline justify-between gap-3 text-md"
      >
        <span :class="line.kind === 'discount' ? 'text-success' : 'text-neutral-muted'">
          {{ line.label }}<span v-if="line.qty" class="text-neutral-quiet"> &times;{{ line.qty }}</span>
        </span>
        <span :class="line.kind === 'discount' ? 'text-success font-medium' : 'text-neutral font-medium'">
          {{ format(line.amount) }}
        </span>
      </li>
    </ul>

    <div class="mt-3 pt-3 border-t border-solid border-neutral-muted flex items-baseline justify-between">
      <span class="text-md font-semibold text-neutral">Total</span>
      <span class="text-subtitle1 font-bold text-brand-emphasis">{{ format(pricing.grandTotal) }}</span>
    </div>
  </aside>
</template>
