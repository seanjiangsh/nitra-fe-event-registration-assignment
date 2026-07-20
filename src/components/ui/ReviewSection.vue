<script setup>
/**
 * A titled review section (Step 4) — a surface-l1 card with an optional "Edit"
 * link that jumps back to the owning step (S4.3), and a danger border when that
 * step has unresolved errors after submit. Border is always 2px (transparent
 * when valid) so toggling the error state never shifts layout.
 */
import { useRouter } from "vue-router";

defineProps({
  title: { type: String, required: true },
  editTo: { type: String, default: "" },
  /** Step number shown in the "Edit → Step N" link. */
  step: { type: Number, default: 0 },
  invalid: { type: Boolean, default: false },
});

const router = useRouter();
</script>

<template>
  <section
    class="rounded-md bg-surface-l1 p-5 border-2 border-solid transition-colors"
    :class="invalid ? 'border-danger-emphasis' : 'border-transparent'"
  >
    <header class="flex items-center justify-between gap-2 mb-3">
      <h3
        class="text-subtitle1 m-0"
        :class="invalid ? 'text-danger' : 'text-neutral'"
      >
        {{ title }}
      </h3>
      <!-- Edit link per Figma: 12px / weight 610 (semibold) / underline. The
           colour #3A7679 is the `teal-500` primitive token (no semantic alias). -->
      <button
        v-if="editTo"
        type="button"
        class="shrink-0 bg-transparent border-0 cursor-pointer p-0 text-sm font-semibold underline text-teal-500"
        @click="router.push(editTo)"
      >
        Edit → Step {{ step }}
      </button>
    </header>
    <slot />
  </section>
</template>
