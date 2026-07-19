<script setup>
/**
 * Live order summary (Step 3, S3.5). Reads the shared store's itemized `pricing`
 * and renders a running breakdown + grand total via the single currency
 * formatter (S3.6). Built on Quasar's `q-card` / `q-list` / `q-item` for the
 * panel + line-item structure, styled with design tokens.
 */
import { useRegistration } from "../../composables/useRegistration.js";
import { format } from "../../composables/useCurrency.js";

// Title/total labels differ by context: "Order Summary" / "Total" in the Step 3
// sidebar (defaults), "Pricing Summary" / "Grand Total" on the review step.
defineProps({
  title: { type: String, default: "Order Summary" },
  totalLabel: { type: String, default: "Total" },
});

const { pricing } = useRegistration();
</script>

<template>
  <q-card flat class="!rounded-md bg-surface-l1 p-2">
    <q-card-section class="pb-2">
      <h2 class="text-subtitle1 text-neutral m-0">{{ title }}</h2>
    </q-card-section>

    <q-card-section v-if="pricing.lines.length === 0" class="pt-0">
      <p class="text-sm text-neutral-muted m-0">Nothing selected yet.</p>
    </q-card-section>

    <q-list v-else class="pb-1">
      <q-item v-for="line in pricing.lines" :key="line.id" dense class="px-4">
        <q-item-section>
          <span
            :class="
              line.kind === 'discount'
                ? 'text-brand-emphasis text-[11px]'
                : 'text-neutral-muted text-sm'
            "
          >
            {{ line.kind === "ticket" ? `${line.label} Ticket` : line.label }}
            <span v-if="line.qty" class="text-neutral-quiet">
              &times;{{ line.qty }}
            </span>
          </span>
        </q-item-section>
        <q-item-section side>
          <span
            class="text-sm"
            :class="
              line.kind === 'discount'
                ? 'text-brand-emphasis'
                : 'text-neutral-muted'
            "
          >
            {{ format(line.amount) }}
          </span>
        </q-item-section>
      </q-item>
    </q-list>

    <q-separator class="!bg-[var(--divider-default)]" />

    <q-card-section class="flex items-baseline justify-between py-4">
      <span class="text-sm font-semibold text-neutral">{{ totalLabel }}</span>
      <!-- Re-keying by value replays the flash keyframe whenever the total changes. -->
      <span
        :key="pricing.grandTotal"
        class="total-flash inline-block text-sm font-semibold text-neutral"
        >{{ format(pricing.grandTotal) }}</span
      >
    </q-card-section>
  </q-card>
</template>

<style scoped>
/* Brief pop + brand-colour pulse when the grand total changes (stage 10). */
.total-flash {
  animation: total-flash 320ms ease-out;
  transform-origin: right center;
}
@keyframes total-flash {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.09);
    color: var(--text-brand-emphasis);
  }
  100% {
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .total-flash {
    animation: none;
  }
}
</style>
