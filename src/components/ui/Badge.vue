<script setup>
/**
 * Small pill/badge. `variant` maps to a semantic color pair (token-only, no
 * hex). Shared across the wizard: the "Selected" affordance on ticket cards
 * here, and session track / status badges (KEYNOTE, SOLD OUT, …) in stage 5.
 *
 * Full class strings are listed literally in `VARIANTS` so UnoCSS's scanner
 * picks them up (dynamically-built class names would not be generated).
 *
 * @typedef {'brand' | 'neutral' | 'success' | 'danger' | 'info' | 'warning' | 'accent'} BadgeVariant
 */

/** @type {Record<string, string>} */
const VARIANTS = {
  brand: 'bg-brand-muted-rest text-brand-emphasis',
  neutral: 'bg-neutral-muted-rest text-neutral',
  success: 'bg-success-muted-rest text-success-emphasis',
  danger: 'bg-danger-muted-rest text-danger-emphasis',
  info: 'bg-info-muted-rest text-info-emphasis',
  warning: 'bg-warning-muted-rest text-warning-emphasis',
  accent: 'bg-accent-muted-rest text-accent-emphasis',
}

const props = defineProps({
  variant: {
    type: /** @type {import('vue').PropType<BadgeVariant>} */ (String),
    default: 'neutral',
  },
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-semibold uppercase tracking-wide"
    :class="VARIANTS[props.variant] || VARIANTS.neutral"
  >
    <slot />
  </span>
</template>
