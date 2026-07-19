<script setup>
/**
 * One session in the Step 2 grid. Multi-select via the shared `BaseCard`
 * (role="checkbox", keyboard-operable). Card shows title, speaker, UTC time,
 * track, and remaining spots (S2.4).
 *
 * `disabled` is decided by the parent and is true when the session is sold out
 * OR its time overlaps a session the attendee has already selected — so two
 * overlapping sessions can never both be picked (the conflict is blocked at
 * selection, not deferred). A session the attendee has already selected is never
 * disabled, even if it is now full ("last spot" taken by them) — so they can
 * still deselect it. When disabled the card is greyed (surface-l2), the title is
 * muted, and the checkbox is hidden.
 *
 * @typedef {Object} SessionCardProps
 * @property {import('../../types.js').Session} session
 * @property {boolean} selected
 * @property {boolean} disabled
 */
import { computed } from "vue";
import BaseCard from "../ui/BaseCard.vue";
import Badge from "../ui/Badge.vue";
import { formatTimeRange } from "../../composables/useDateTime.js";

const props = defineProps({
  session: {
    /** @type {import('vue').PropType<import('../../types.js').Session>} */
    type: Object,
    required: true,
  },
  selected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

defineEmits(["toggle"]);

/** @type {Record<string, { label: string, variant: import('../../types.js').BadgeVariant }>} */
const TRACKS = {
  main: { label: "MAIN", variant: "neutral-subtle" },
  frontend: { label: "FRONTEND", variant: "accent" },
  backend: { label: "BACKEND", variant: "info" },
  devops: { label: "DEVOPS", variant: "accent" },
};

const track = computed(
  () =>
    TRACKS[props.session.track] ?? {
      label: props.session.track,
      variant: "neutral",
    },
);

// Capacity counts the attendee's own reservation.
const reserved = computed(
  () => props.session.registered + (props.selected ? 1 : 0),
);
const spotsLeft = computed(() =>
  Math.max(0, props.session.capacity - reserved.value),
);
const isFull = computed(() => spotsLeft.value === 0);
const fillRatio = computed(() =>
  props.session.capacity ? reserved.value / props.session.capacity : 0,
);
const timeRange = computed(() =>
  formatTimeRange(props.session.date, props.session.endDate),
);

/**
 * Capacity-bar colour by fill (§10.1) — 4 tiers to match the Figma:
 *   full → red, ≥70% → orange, ≥50% → olive/yellow, else green.
 * To retune: change the thresholds/tokens here; the actual colour values live in
 * the design tokens (`--bg-{danger|accent|warning|success}-emphasis-rest`).
 */
const barColor = computed(() => {
  const fill = fillRatio.value;
  if (fill >= 1) return "bg-danger-bold-rest"; // full / sold out
  if (fill >= 0.7) return "bg-accent-bold-rest"; // nearly full
  if (fill >= 0.5) return "bg-warning-bold-rest"; // filling up
  return "bg-brand-emphasis-rest"; // plenty of room
});
</script>

<template>
  <BaseCard
    :selected="selected"
    :disabled="disabled"
    disabled-bg="bg-surface-l2"
    padding="p-4"
    gap="gap-[6.75px]"
    role="checkbox"
    @select="$emit('toggle')"
  >
    <div class="flex items-start justify-between gap-2">
      <Badge
        :variant="disabled ? 'neutral-subtle' : track.variant"
        size="text-[11px]"
        >{{ track.label }}</Badge
      >
      <!-- Checkbox is hidden when disabled (sold out / time-conflict). Its 22px
           box is always reserved so hiding it never shifts the card content. -->
      <span class="shrink-0 w-[22px] h-[22px] leading-none mr-[-3px] mt-[-1px]">
        <q-icon
          v-if="!disabled"
          :name="selected ? 'check_box' : 'check_box_outline_blank'"
          size="22px"
          :class="selected ? 'text-brand-emphasis' : 'text-neutral-quiet'"
        />
      </span>
    </div>

    <span
      class="text-subtitle1 tracking-normal"
      :class="disabled ? 'text-neutral-disabled' : 'text-neutral'"
      >{{ session.title }}</span
    >
    <span class="text-sm tracking-[-0.075px] text-neutral-muted"
      >{{ session.speaker }} · {{ session.speakerTitle }}</span
    >
    <span
      class="text-sm tracking-[-0.375px] text-neutral flex items-center gap-1"
    >
      {{ timeRange }}
    </span>

    <div class="mt-1 flex flex-col gap-1">
      <div class="h-1.5 rounded-full bg-neutral-muted-rest overflow-hidden">
        <div
          class="h-full rounded-full transition-all"
          :class="barColor"
          :style="{ width: Math.round(fillRatio * 100) + '%' }"
        />
      </div>
      <span
        class="text-sm tracking-[-0.3px]"
        :class="
          isFull ? 'text-danger-emphasis font-medium' : 'text-neutral-muted'
        "
      >
        {{ isFull ? "Sold out" : `${spotsLeft} spots left` }}
      </span>
    </div>
  </BaseCard>
</template>
