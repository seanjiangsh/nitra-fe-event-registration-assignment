<script setup>
/**
 * App brand lockup — the event logo mark (exact Figma SVG) + the event name.
 * Shared by the wizard header (`WizardLayout`) and the success screen so the
 * chrome is identical across both.
 */
import { EVENT } from "../../data.js";
</script>

<template>
  <div class="flex items-center">
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        width="40"
        height="40"
        rx="8"
        fill="var(--bg-brand-emphasis-rest)"
      />
      <path
        d="M26.9993 27.0114C15.7309 26.9789 19.3548 20.0092 13.0005 20.0001V12.9885C22.641 13.0026 20.0422 19.9899 26.9993 19.9998V27.0111V27.0114Z"
        fill="white"
      />
      <path
        d="M34.0001 12.9885H26.9995V19.9998H34.0001V12.9885Z"
        fill="white"
      />
      <path d="M13.0006 19.9998H6V27.011H13.0006V19.9998Z" fill="white" />
    </svg>
    <h4 class="text-h4 text-neutral tracking-normal my-6 ml-[0.75rem]">
      {{ EVENT.name }}
    </h4>
  </div>
</template>
