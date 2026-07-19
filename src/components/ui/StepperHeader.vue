<script setup>
/**
 * Wizard stepper header. Renders the four steps from the shared {@link STEPS}
 * metadata, marks the active one, and supports free jump-to-step navigation
 * (S4.5) — no guards block movement between the four steps. Rendered as a
 * semantic ordered list with `aria-current="step"` on the active item (§10.4).
 *
 * Visual polish and per-step error indicators come in later stages; this is the
 * structural, navigable stepper.
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { STEPS, stepIndex } from '../../router/steps.js'
import { useRegistration } from '../../composables/useRegistration.js'

const route = useRoute()
const router = useRouter()
const { submitAttempted, errorsByStep } = useRegistration()

/** Index of the active step (-1 on non-step routes). */
const activeIndex = computed(() => stepIndex(route.path))

/** A step is flagged once a submit was attempted and it still has errors (S4.5). */
function stepHasError(/** @type {number} */ order) {
  return submitAttempted.value && (errorsByStep.value[order]?.length ?? 0) > 0
}

/** @param {import('../../router/steps.js').WizardStep} step */
function go(step) {
  if (step.path !== route.path) router.push(step.path)
}
</script>

<template>
  <nav aria-label="Registration steps">
    <ol class="flex items-center gap-2 list-none p-0 m-0">
      <li v-for="(step, i) in STEPS" :key="step.name" class="flex items-center gap-2">
        <button
          type="button"
          class="flex items-center gap-2 bg-transparent border-none cursor-pointer p-1"
          :aria-current="i === activeIndex ? 'step' : undefined"
          @click="go(step)"
        >
          <span
            class="flex items-center justify-center w-7 h-7 rounded-full text-md font-semibold transition-colors"
            :class="
              stepHasError(step.order)
                ? 'bg-danger-emphasis-rest text-inverse'
                : i === activeIndex
                  ? 'bg-brand-emphasis-rest text-inverse'
                  : i < activeIndex
                    ? 'bg-brand-muted-rest text-brand-emphasis'
                    : 'bg-neutral-muted-rest text-neutral-muted'
            "
          >
            <q-icon v-if="stepHasError(step.order)" name="priority_high" size="16px" />
            <template v-else>{{ step.order }}</template>
          </span>
          <span
            class="text-md"
            :class="
              stepHasError(step.order)
                ? 'text-danger-emphasis font-semibold'
                : i === activeIndex
                  ? 'text-neutral font-semibold'
                  : 'text-neutral-muted font-medium'
            "
          >
            {{ step.label }}
          </span>
        </button>
        <span v-if="i < STEPS.length - 1" class="w-8 h-px bg-[var(--divider-default)]" aria-hidden="true" />
      </li>
    </ol>
  </nav>
</template>
