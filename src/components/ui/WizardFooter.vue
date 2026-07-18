<script setup>
/**
 * Footer navigation. Back/Next move between the four steps using the shared
 * {@link STEPS} order; on the last step, Next becomes the submit action, which
 * the layout handles (validation + submit gate arrive in stage 7). Back is
 * disabled on the first step.
 *
 * @emits submit — user pressed the primary action on the final (review) step
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { STEPS, stepIndex } from '../../router/steps.js'

const emit = defineEmits(['submit'])

const route = useRoute()
const router = useRouter()

const index = computed(() => stepIndex(route.path))
const isFirst = computed(() => index.value === 0)
const isLast = computed(() => index.value === STEPS.length - 1)

function back() {
  if (!isFirst.value) router.push(STEPS[index.value - 1].path)
}

function next() {
  if (isLast.value) {
    emit('submit')
  } else if (index.value !== -1) {
    router.push(STEPS[index.value + 1].path)
  }
}
</script>

<template>
  <div class="flex items-center justify-between">
    <button
      type="button"
      class="px-4 py-2 rounded-lg text-md font-semibold border border-solid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      :class="
        isFirst
          ? 'border-neutral-muted text-neutral-muted'
          : 'border-neutral-emphasis text-neutral bg-surface-l0 hover:bg-neutral-subtle-hover cursor-pointer'
      "
      :disabled="isFirst"
      @click="back"
    >
      Back
    </button>

    <button
      type="button"
      class="px-5 py-2 rounded-lg text-md font-semibold border-none text-inverse cursor-pointer transition-colors bg-brand-emphasis-rest hover:bg-brand-emphasis-hover active:bg-brand-emphasis-active"
      @click="next"
    >
      {{ isLast ? 'Submit Registration' : 'Next' }}
    </button>
  </div>
</template>
