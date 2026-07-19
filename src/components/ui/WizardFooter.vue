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
import { useRegistration } from '../../composables/useRegistration.js'

const emit = defineEmits(['submit'])

const route = useRoute()
const router = useRouter()
const { isValid } = useRegistration()

const index = computed(() => stepIndex(route.path))
const isFirst = computed(() => index.value === 0)
const isLast = computed(() => index.value === STEPS.length - 1)

/** On the review step, Submit is disabled until the whole registration is valid. */
const submitDisabled = computed(() => isLast.value && !isValid.value)

/** Label of the next step, for the "Next: …" CTA. */
const nextLabel = computed(() => STEPS[index.value + 1]?.label ?? '')

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
    <!-- Back: ghost button, omitted on the first step (nothing to go back to). -->
    <button
      v-if="!isFirst"
      type="button"
      class="px-5 py-2 rounded-lg text-md font-semibold border border-solid border-neutral-muted text-neutral bg-surface-l0 cursor-pointer transition-colors hover:bg-neutral-subtle-hover hover:border-neutral-emphasis"
      @click="back"
    >
      Back
    </button>
    <span v-else aria-hidden="true"></span>

    <!-- Primary CTA: accent, labelled with the next step (or submit on review).
         On review, disabled until the registration validates. -->
    <button
      type="button"
      class="px-5 py-2 rounded-lg text-md font-semibold border-none text-inverse transition-colors bg-accent-emphasis-rest hover:bg-accent-emphasis-hover active:bg-accent-emphasis-active cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent-emphasis-rest"
      :disabled="submitDisabled"
      @click="next"
    >
      {{ isLast ? 'Submit Registration' : `Next: ${nextLabel}` }}
    </button>
  </div>
</template>
