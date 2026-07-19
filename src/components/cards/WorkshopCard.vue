<script setup>
/**
 * Workshop add-on (Step 3). Multi-select via the shared `BaseCard`. Workshops
 * have capacity, so the card shows "N spots remaining" / "Sold Out" (like a
 * session) rather than an "Added to order" affordance — selection is conveyed by
 * the brand bg + border. A workshop is disabled when sold out, or when its time
 * overlaps a session the attendee has selected (S3.2, `conflictNote`), computed
 * live by the parent so deselecting the session re-enables it.
 *
 * @typedef {Object} WorkshopCardProps
 * @property {import('../../types.js').Workshop} workshop
 * @property {boolean} selected
 * @property {boolean} disabled
 * @property {string} conflictNote   // "Overlaps …" when blocked by a selected session
 */
import { computed } from "vue";
import BaseCard from "../ui/BaseCard.vue";
import { formatCompact } from "../../composables/useCurrency.js";
import {
  formatDayShort,
  formatTimeRange,
} from "../../composables/useDateTime.js";

const props = defineProps({
  workshop: {
    /** @type {import('vue').PropType<import('../../types.js').Workshop>} */
    type: Object,
    required: true,
  },
  selected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  conflictNote: { type: String, default: "" },
});

defineEmits(["toggle"]);

const when = computed(
  () =>
    `${formatDayShort(props.workshop.date)} · ${formatTimeRange(props.workshop.date, props.workshop.endDate)}`,
);
// Capacity counts the attendee's own reservation, like sessions.
const reserved = computed(
  () => props.workshop.registered + (props.selected ? 1 : 0),
);
const spotsRemaining = computed(() =>
  Math.max(0, props.workshop.capacity - reserved.value),
);
const isFull = computed(() => spotsRemaining.value === 0);
</script>

<template>
  <BaseCard
    :selected="selected"
    :disabled="disabled"
    role="checkbox"
    padding="px-[1rem] py-[1rem]"
    gap="gap-[7px]"
    @select="$emit('toggle')"
  >
    <div class="flex items-start justify-between gap-3">
      <span class="text-subtitle1 text-neutral tracking-normal">{{
        workshop.name
      }}</span>
      <span class="text-subtitle1 text-brand-emphasis shrink-0">{{
        formatCompact(workshop.price)
      }}</span>
    </div>

    <p class="text-sm tracking-[0.075px] text-neutral-muted m-0">
      {{ workshop.description }}
    </p>

    <span
      class="text-[10.5px] tracking-[0.075px] text-neutral flex items-center gap-1"
    >
      {{ when }}
    </span>

    <span
      class="text-sm text-neutral-muted tracking-[-0.5px]"
      :class="isFull && 'font-medium'"
    >
      {{ isFull ? "Sold Out" : `${spotsRemaining} spots remaining` }}
    </span>
    <span
      v-if="conflictNote"
      class="text-sm font-medium text-danger-emphasis"
      >{{ conflictNote }}</span
    >
  </BaseCard>
</template>
