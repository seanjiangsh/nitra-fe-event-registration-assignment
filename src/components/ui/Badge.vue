<script setup>
/**
 * Small pill/badge. `variant` maps to a semantic color pair (token-only, no
 * hex). Shared across the wizard: the "Selected" affordance on ticket cards
 * here, and session track / status badges (KEYNOTE, SOLD OUT, …) in stage 5.
 *
 * Full class strings are listed literally in `VARIANTS` so UnoCSS's scanner
 * picks them up (dynamically-built class names would not be generated).
 *
 * Variant type lives in `types.js` so callers (e.g. `SessionCard`) can annotate
 * against the same union.
 */

/** @type {Record<string, string>} */
const VARIANTS = {
  brand: "bg-brand-muted-rest text-brand-emphasis",
  neutral: "bg-neutral-muted-rest text-neutral",
  success: "bg-success-muted-rest text-success-emphasis",
  danger: "bg-danger-muted-rest text-danger-emphasis",
  info: "bg-info-muted-rest text-info-emphasis",
  warning: "bg-warning-muted-rest text-warning-emphasis",
  accent: "bg-accent-muted-rest text-accent-emphasis",
  // Solid green/700 fill with inverse text — the ticket "Selected" affordance.
  "success-solid": "bg-success-bold-rest text-inverse",
  // Muted gray — the "main" track and the disabled-session track badge. bg is the
  // semantic subtle token (gray[50]); text uses the gray[700] primitive (no
  // semantic gray-700 text token exists).
  "neutral-subtle": "bg-neutral-subtle-rest text-gray-700",
};

const props = defineProps({
  variant: {
    type: /** @type {import('vue').PropType<import('../../types.js').BadgeVariant>} */ (
      String
    ),
    default: "neutral",
  },
  /** Text-size utility (default `body/sm`); pass e.g. `text-[11px]` for `body/xs`. */
  size: { type: String, default: "text-sm" },
  /** Font-weight utility (default semibold). */
  weight: { type: String, default: "font-semibold" },
});
</script>

<template>
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full tracking-wide"
    :class="[
      VARIANTS[props.variant] || VARIANTS.neutral,
      props.size,
      props.weight,
    ]"
  >
    <slot />
  </span>
</template>
