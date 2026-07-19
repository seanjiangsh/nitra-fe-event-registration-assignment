<script setup>
/**
 * Reusable segmented tab control (day switcher, add-on categories). A single
 * `bg-brand-emphasis-rest` indicator slides left/right behind the active tab —
 * its position/width are measured from the active button so tabs can keep their
 * natural (unequal) widths. Two-way bound via `v-model`.
 *
 * @typedef {{ id: string, label: string }} TabOption
 */
import { ref, watch, onMounted, nextTick } from "vue";

const props = defineProps({
  modelValue: { type: String, required: true },
  options: {
    type: /** @type {import('vue').PropType<TabOption[]>} */ (Array),
    required: true,
  },
  ariaLabel: { type: String, default: "Tabs" },
});

const emit = defineEmits(["update:modelValue"]);

/** @type {import('vue').Ref<HTMLButtonElement[]>} */
const btns = ref([]);
const indicator = ref({ left: 0, width: 0 });

function setBtn(/** @type {any} */ el, /** @type {number} */ i) {
  if (el) btns.value[i] = el;
}

function updateIndicator() {
  const i = props.options.findIndex((o) => o.id === props.modelValue);
  const el = btns.value[i];
  if (el) indicator.value = { left: el.offsetLeft, width: el.offsetWidth };
}

onMounted(async () => {
  await nextTick();
  updateIndicator();
});
watch(() => props.modelValue, updateIndicator);
watch(
  () => props.options,
  async () => {
    await nextTick();
    updateIndicator();
  },
);

function select(/** @type {string} */ id) {
  if (id !== props.modelValue) emit("update:modelValue", id);
}
</script>

<template>
  <div
    role="tablist"
    :aria-label="ariaLabel"
    class="relative inline-flex w-fit gap-1 p-1 rounded-lg bg-surface-l2"
  >
    <!-- Sliding active indicator -->
    <span
      class="absolute top-1 bottom-1 rounded-lg bg-brand-emphasis-rest transition-all duration-200 ease-out"
      :style="{ left: indicator.left + 'px', width: indicator.width + 'px' }"
      aria-hidden="true"
    />
    <button
      v-for="(opt, i) in options"
      :key="opt.id"
      :ref="(el) => setBtn(el, i)"
      type="button"
      role="tab"
      :aria-selected="opt.id === modelValue"
      class="relative z-1 appearance-none border-0 bg-transparent cursor-pointer px-5 py-[6px] rounded-lg text-[13px] font-semibold transition-colors"
      :class="
        opt.id === modelValue
          ? 'text-inverse'
          : 'text-neutral-muted hover:text-neutral'
      "
      @click="select(opt.id)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
/* Keyboard focus ring (appearance-none strips the native one). */
[role="tab"]:focus-visible {
  outline: 2px solid var(--border-brand-emphasis);
  outline-offset: 2px;
}
</style>
