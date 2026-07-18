<script setup>
/**
 * Single ticket option. Single-select is owned by the parent (Step 1 binds the
 * chosen id); this card is presentational + emits `select`. Rendered as a real
 * `role="radio"` button inside the parent's radiogroup, so it's keyboard- and
 * screen-reader-operable for free (§10.4).
 *
 * @typedef {Object} TicketCardProps
 * @property {import('../../types.js').Ticket} ticket
 * @property {boolean} selected
 */
import { format } from '../../composables/useCurrency.js'
import Badge from '../ui/Badge.vue'
import PerkCheckIcon from '../icons/PerkCheckIcon.vue'

defineProps({
  ticket: {
    /** @type {import('vue').PropType<import('../../types.js').Ticket>} */
    type: Object,
    required: true,
  },
  selected: { type: Boolean, default: false },
})

defineEmits(['select'])
</script>

<template>
  <button
    type="button"
    role="radio"
    :aria-checked="selected"
    class="flex flex-col text-left gap-3 p-4 rounded-xl border-2 border-solid cursor-pointer transition-colors bg-surface-l0"
    :class="
      selected
        ? 'border-brand-emphasis bg-brand-subtle-rest'
        : 'border-neutral-muted hover:border-neutral-emphasis'
    "
    @click="$emit('select')"
  >
    <div class="flex items-baseline justify-between gap-2">
      <span class="text-subtitle1 text-neutral">{{ ticket.name }}</span>
      <span class="text-h4 text-brand-emphasis">{{ format(ticket.price) }}</span>
    </div>

    <p class="text-md text-neutral-muted m-0">{{ ticket.description }}</p>

    <ul class="list-none p-0 m-0 flex flex-col gap-1">
      <li v-for="perk in ticket.perks" :key="perk" class="flex items-center gap-2 text-sm text-neutral">
        <PerkCheckIcon class="w-4 h-4 shrink-0" />
        {{ perk }}
      </li>
    </ul>

    <!-- Reserve the badge's height on every card (pinned to the bottom) so
         selecting/deselecting never changes card height or shifts the layout. -->
    <div class="mt-auto min-h-6 flex items-end">
      <Badge v-if="selected" variant="brand">
        <q-icon name="check" size="14px" />
        Selected
      </Badge>
    </div>
  </button>
</template>
