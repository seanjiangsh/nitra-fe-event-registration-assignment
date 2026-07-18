<script setup>
/**
 * One session in the Step 2 grid. Multi-select via the shared `BaseCard`
 * (role="checkbox", keyboard-operable). Card shows title, speaker, UTC time,
 * track, and remaining spots (S2.4). Overlap with other selected sessions is NOT
 * handled here — it's deferred to the Step 4 submit check (S2.2).
 *
 * Capacity counts the attendee's own reservation: selecting drops "spots left"
 * by one and nudges the bar. A session the attendee has selected is never
 * disabled — even if that took the last spot (it then reads "Sold out" but stays
 * interactive so they can deselect). A session is disabled only when full *and*
 * the attendee hasn't taken a spot (S2.3): there is genuinely no seat.
 *
 * @typedef {Object} SessionCardProps
 * @property {import('../../types.js').Session} session
 * @property {boolean} selected
 */
import { computed } from 'vue'
import BaseCard from '../ui/BaseCard.vue'
import Badge from '../ui/Badge.vue'
import { formatTimeRange } from '../../composables/useDateTime.js'

const props = defineProps({
  session: {
    /** @type {import('vue').PropType<import('../../types.js').Session>} */
    type: Object,
    required: true,
  },
  selected: { type: Boolean, default: false },
})

defineEmits(['toggle'])

/** @type {Record<string, { label: string, variant: import('../../types.js').BadgeVariant }>} */
const TRACKS = {
  main: { label: 'Keynote', variant: 'brand' },
  frontend: { label: 'Frontend', variant: 'info' },
  backend: { label: 'Backend', variant: 'success' },
  devops: { label: 'DevOps', variant: 'warning' },
}

const track = computed(() => TRACKS[props.session.track] ?? { label: props.session.track, variant: 'neutral' })

/** Full before the attendee is considered — no seat for them to take. */
const baseFull = computed(() => props.session.registered >= props.session.capacity)
/** Non-interactive + dimmed only when full and not the attendee's own pick. */
const disabled = computed(() => baseFull.value && !props.selected)
/** Registered count including the attendee's own reservation. */
const reserved = computed(() => props.session.registered + (props.selected ? 1 : 0))
const spotsLeft = computed(() => Math.max(0, props.session.capacity - reserved.value))
const isFull = computed(() => spotsLeft.value === 0)
const fillRatio = computed(() => (props.session.capacity ? reserved.value / props.session.capacity : 0))
const timeRange = computed(() => formatTimeRange(props.session.date, props.session.endDate))

/** Capacity bar color by fill: green → olive → red (§10.1). */
const barColor = computed(() =>
  fillRatio.value >= 0.9 ? 'bg-danger-emphasis-rest' : fillRatio.value >= 0.7 ? 'bg-warning-emphasis-rest' : 'bg-success-emphasis-rest',
)
</script>

<template>
  <BaseCard :selected="selected" :disabled="disabled" role="checkbox" @select="$emit('toggle')">
    <div class="flex items-start justify-between gap-2">
      <Badge :variant="track.variant">{{ track.label }}</Badge>
      <q-icon
        :name="selected ? 'check_box' : 'check_box_outline_blank'"
        size="22px"
        :class="selected ? 'text-brand-emphasis' : 'text-neutral-quiet'"
      />
    </div>

    <span class="text-subtitle1 text-neutral">{{ session.title }}</span>
    <span class="text-md text-neutral-muted">{{ session.speaker }} · {{ session.speakerTitle }}</span>
    <span class="text-md text-neutral flex items-center gap-1">
      <q-icon name="schedule" size="16px" class="text-neutral-muted" />
      {{ timeRange }}
    </span>

    <div class="mt-1 flex flex-col gap-1">
      <div class="h-1.5 rounded-full bg-neutral-muted-rest overflow-hidden">
        <div class="h-full rounded-full transition-all" :class="barColor" :style="{ width: Math.round(fillRatio * 100) + '%' }" />
      </div>
      <span class="text-sm" :class="isFull ? 'text-danger-emphasis font-medium' : 'text-neutral-muted'">
        {{ isFull ? 'Sold out' : `${spotsLeft} spots left` }}
      </span>
    </div>
  </BaseCard>
</template>
