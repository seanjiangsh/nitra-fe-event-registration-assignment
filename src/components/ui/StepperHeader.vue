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
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { STEPS, stepIndex } from "../../router/steps.js";
import { useRegistration } from "../../composables/useRegistration.js";
import StepCheckIcon from "../icons/StepCheckIcon.vue";

const route = useRoute();
const router = useRouter();
const { submitAttempted, errorsByStep } = useRegistration();

/** Index of the active step (-1 on non-step routes). */
const activeIndex = computed(() => stepIndex(route.path));

/** A step is flagged once a submit was attempted and it still has errors (S4.5). */
function stepHasError(/** @type {number} */ order) {
  return submitAttempted.value && (errorsByStep.value[order]?.length ?? 0) > 0;
}

/** @param {import('../../router/steps.js').WizardStep} step */
function go(step) {
  if (step.path !== route.path) router.push(step.path);
}

/**
 * Left position of each step's circle, as a % of the stepper width. The first is
 * always 0 and the last step is pinned to the right edge (so it stays aligned as
 * the width changes) — tune the *middle* values freely to move steps 2 and 3.
 *   e.g. [0, 33, 67] → even thirds; [0, 40, 78] → steps 2 & 3 shifted right.
 */
const STEP_POS = [0, 32.4, 62.4];

/**
 * Flex sizing for step `i`'s slot so its circle lands on `STEP_POS[i]`. Each slot
 * is a fixed % as wide as the gap to the next step; the slot before the last step
 * grows to fill, which pins the last step to the right edge.
 * @param {number} i
 * @returns {Record<string, string | number>}
 */
function slotStyle(i) {
  if (i === STEPS.length - 1) return {}; // last step: shrink-0, pinned right
  const next = STEP_POS[i + 1];
  if (next == null) return { flexGrow: 1, flexBasis: "0%" }; // fills → pins last step
  return { flexGrow: 0, flexShrink: 0, flexBasis: next - STEP_POS[i] + "%" };
}
</script>

<template>
  <nav aria-label="Registration steps">
    <ol class="flex items-center list-none p-0 m-0 w-full">
      <li
        v-for="(step, i) in STEPS"
        :key="step.name"
        class="flex items-center"
        :class="i === STEPS.length - 1 ? 'shrink-0' : ''"
        :style="slotStyle(i)"
      >
        <button
          type="button"
          class="flex items-center gap-[0.55rem] shrink-0 bg-transparent border-none cursor-pointer p-1"
          :aria-current="i === activeIndex ? 'step' : undefined"
          @click="go(step)"
        >
          <span
            class="flex items-center justify-center w-8 h-8 rounded-full text-md font-semibold transition-colors"
            :class="
              stepHasError(step.order)
                ? 'bg-danger-emphasis-rest text-inverse'
                : i === activeIndex
                  ? 'bg-brand-emphasis-rest text-inverse'
                  : i < activeIndex
                    ? 'bg-brand-emphasis-rest text-inverse'
                    : 'bg-neutral-muted-rest text-neutral-muted'
            "
          >
            <q-icon
              v-if="stepHasError(step.order)"
              name="priority_high"
              size="16px"
            />
            <StepCheckIcon v-else-if="i < activeIndex" />
            <template v-else>{{ step.order }}</template>
          </span>
          <span
            class="text-[13px]"
            :class="
              stepHasError(step.order)
                ? 'text-danger font-semibold'
                : i === activeIndex
                  ? 'text-neutral font-semibold'
                  : 'text-neutral-muted font-medium'
            "
          >
            {{ step.label }}
          </span>
        </button>
        <span
          v-if="i < STEPS.length - 1"
          class="flex-1 h-[2px] bg-[var(--divider-default)] mx-[0.75rem]"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>
