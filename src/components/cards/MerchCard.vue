<script setup>
/**
 * Merchandise add-on (Step 3). Uses `BaseCard` in its NON-interactive form (it
 * owns its own controls: a size dropdown when the item has `sizes`, and a qty
 * stepper capped at `maxQuantity`). "Selected" (ringed + brand bg + "Added to
 * order") when qty > 0. Emits intent (`increment` / `decrement`) so rapid clicks
 * step correctly from the parent's live store; size flows up via `update:size`.
 *
 * @typedef {Object} MerchCardProps
 * @property {import('../../types.js').MerchItem} item
 * @property {number} qty
 * @property {string} [size]
 */
import BaseCard from "../ui/BaseCard.vue";
import { formatCompact } from "../../composables/useCurrency.js";

defineProps({
  item: {
    /** @type {import('vue').PropType<import('../../types.js').MerchItem>} */
    type: Object,
    required: true,
  },
  qty: { type: Number, default: 0 },
  size: { type: String, default: "" },
  error: { type: String, default: "" },
});

const emit = defineEmits(["increment", "decrement", "update:size"]);

function onSizeChange(/** @type {Event} */ e) {
  const el = /** @type {HTMLSelectElement} */ (e.target);
  emit("update:size", el.value);
}
</script>

<template>
  <BaseCard
    :selected="qty > 0"
    :interactive="false"
    padding="px-[1rem] py-[1rem]"
    gap="gap-[5px]"
  >
    <div class="flex items-start justify-between gap-3">
      <span class="text-subtitle1 text-neutral tracking-normal">{{
        item.name
      }}</span>
      <span class="text-subtitle1 text-brand-emphasis shrink-0">{{
        formatCompact(item.price)
      }}</span>
    </div>

    <p class="text-sm tracking-[-0.05px] text-neutral-muted m-0">
      {{ item.description }}
    </p>

    <!-- Controls: size (sized items) + qty stepper, inline -->
    <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
      <div v-if="item.sizes" class="flex items-center gap-2">
        <label :for="`size-${item.id}`" class="text-sm text-neutral-muted"
          >Size:</label
        >
        <select
          :id="`size-${item.id}`"
          :value="size"
          class="px-2 py-1 rounded-md border border-solid bg-surface-l0 text-sm text-neutral cursor-pointer focus:outline-none"
          :class="
            error
              ? 'border-danger-emphasis'
              : 'border-neutral-muted hover:border-neutral-emphasis focus:border-brand-emphasis'
          "
          @change="onSizeChange"
        >
          <option value="" disabled>Select</option>
          <option v-for="s in item.sizes" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm text-neutral-muted">Qty:</span>
        <button
          type="button"
          class="flex items-center justify-center w-8 h-8 rounded-md border-none bg-surface-l2 text-neutral cursor-pointer transition-colors hover:bg-neutral-muted-rest disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="qty <= 0"
          aria-label="Decrease quantity"
          @click="emit('decrement')"
        >
          <q-icon name="remove" size="18px" />
        </button>
        <span
          :key="qty"
          class="qty-pop inline-block min-w-6 text-center text-md font-semibold text-neutral"
          >{{ qty }}</span
        >
        <button
          type="button"
          class="flex items-center justify-center w-8 h-8 rounded-md border-none bg-surface-l2 text-neutral cursor-pointer transition-colors hover:bg-neutral-muted-rest disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="qty >= item.maxQuantity"
          aria-label="Increase quantity"
          @click="emit('increment')"
        >
          <q-icon name="add" size="18px" />
        </button>
        <span class="text-sm text-neutral-quiet"
          >max {{ item.maxQuantity }}</span
        >
      </div>
    </div>

    <span v-if="error" class="text-sm font-medium text-danger-emphasis">{{
      error
    }}</span>
    <span
      v-else-if="qty > 0"
      class="flex items-center gap-1 text-[11px] font-medium text-success"
    >
      <q-icon name="check" size="11px" /> Added to order
    </span>
  </BaseCard>
</template>

<style scoped>
/* Qty value pops when it changes (re-keyed span replays the keyframe). Stage 10. */
.qty-pop {
  animation: qty-pop 200ms ease-out;
}
@keyframes qty-pop {
  0% {
    transform: scale(0.7);
    opacity: 0.4;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .qty-pop {
    animation: none;
  }
}
</style>
