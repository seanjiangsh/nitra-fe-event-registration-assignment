<script setup>
/**
 * Checkmark shown in the stepper circle for completed steps (in place of the
 * number). Inline SVG so it matches the Figma glyph exactly and is colorable via
 * `currentColor` — the enclosing circle sets the color (e.g. `text-brand-emphasis`
 * on the muted bg, or `text-inverse` on a filled one). The `stroke="white"` in
 * the design export is just icon-internal contrast; `currentColor` adapts it to
 * the circle's foreground.
 */
</script>

<template>
  <svg
    width="15"
    height="12"
    viewBox="0 0 16 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 6.86669L5.9 12L15 1.00003"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
