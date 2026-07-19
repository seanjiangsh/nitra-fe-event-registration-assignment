<script setup>
/**
 * Live order summary (Step 3, S3.5). Reads the shared store's itemized `pricing`
 * and renders a running breakdown + grand total via the single currency
 * formatter (S3.6). Built on Quasar's `q-card` / `q-list` / `q-item` for the
 * panel + line-item structure, styled with design tokens.
 */
import { useRegistration } from '../../composables/useRegistration.js'
import { format } from '../../composables/useCurrency.js'

const { pricing } = useRegistration()
</script>

<template>
  <q-card flat class="!rounded-md bg-surface-l1">
    <q-card-section class="pb-2">
      <h2 class="text-subtitle1 text-neutral m-0">Order Summary</h2>
    </q-card-section>

    <q-card-section v-if="pricing.lines.length === 0" class="pt-0">
      <p class="text-md text-neutral-muted m-0">Nothing selected yet.</p>
    </q-card-section>

    <q-list v-else class="pb-1">
      <q-item v-for="line in pricing.lines" :key="line.id" dense class="px-4">
        <q-item-section>
          <span class="text-md" :class="line.kind === 'discount' ? 'text-success' : 'text-neutral-muted'">
            {{ line.label }}<span v-if="line.qty" class="text-neutral-quiet"> &times;{{ line.qty }}</span>
          </span>
        </q-item-section>
        <q-item-section side>
          <span class="text-md font-medium" :class="line.kind === 'discount' ? 'text-success' : 'text-neutral'">
            {{ format(line.amount) }}
          </span>
        </q-item-section>
      </q-item>
    </q-list>

    <q-separator class="!bg-[var(--divider-default)]" />

    <q-card-section class="flex items-baseline justify-between py-3">
      <span class="text-md font-semibold text-neutral">Total</span>
      <span class="text-subtitle1 font-bold text-brand-emphasis">{{ format(pricing.grandTotal) }}</span>
    </q-card-section>
  </q-card>
</template>
