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
  disabled: { type: Boolean, default: false },
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

// Capacity counts the attendee's own reservation.
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
  <BaseCard :selected="selected" :disabled="disabled" disabled-bg="bg-surface-l2" role="checkbox" @select="$emit('toggle')">
    <div class="flex items-start justify-between gap-2">
      <Badge :variant="track.variant">{{ track.label }}</Badge>
      <!-- Checkbox is hidden when disabled (sold out / time-conflict). -->
      <q-icon
        v-if="!disabled"
        :name="selected ? 'check_box' : 'check_box_outline_blank'"
        size="22px"
        :class="selected ? 'text-brand-emphasis' : 'text-neutral-quiet'"
      />
    </div>

    <span class="text-subtitle1" :class="disabled ? 'text-neutral-disabled' : 'text-neutral'">{{ session.title }}</span>
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
