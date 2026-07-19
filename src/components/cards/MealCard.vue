<script setup>
/**
 * Meal-package add-on (Step 3). Plain multi-select via the shared `BaseCard` —
 * meals carry no time slot, so there is no conflict logic (§6.6).
 *
 * @typedef {Object} MealCardProps
 * @property {import('../../types.js').Meal} meal
 * @property {boolean} selected
 */
import BaseCard from '../ui/BaseCard.vue'
import { format } from '../../composables/useCurrency.js'

defineProps({
  meal: {
    /** @type {import('vue').PropType<import('../../types.js').Meal>} */
    type: Object,
    required: true,
  },
  selected: { type: Boolean, default: false },
})

defineEmits(['toggle'])
</script>

<template>
  <BaseCard :selected="selected" role="checkbox" @select="$emit('toggle')">
    <div class="flex items-start justify-between gap-3">
      <span class="text-subtitle1 text-neutral">{{ meal.name }}</span>
      <span class="text-subtitle1 text-brand-emphasis shrink-0">{{ format(meal.price) }}</span>
    </div>

    <p class="text-md text-neutral-muted m-0">{{ meal.description }}</p>

    <span v-if="selected" class="flex items-center gap-1 text-sm font-medium text-success">
      <q-icon name="check" size="14px" /> Added to order
    </span>
  </BaseCard>
</template>
