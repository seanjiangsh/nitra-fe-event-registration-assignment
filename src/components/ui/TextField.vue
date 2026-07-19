<script setup>
/**
 * Labeled text input with two-way binding via `defineModel` (the plain-JS form:
 * runtime options + JSDoc, per §2/§9). Validation is deferred and unified: the
 * parent passes an `error` message only after the first submit, and this shows a
 * danger border + message + `aria-invalid`/`aria-describedby` (§10.4).
 *
 * @typedef {Object} TextFieldProps
 * @property {string} id            // ties <label for> to the input
 * @property {string} label
 * @property {string} [type]        // 'text' | 'email' | 'tel' | …
 * @property {string} [placeholder]
 * @property {string} [autocomplete]
 * @property {string} [hint]        // helper text under the field
 * @property {string} [error]       // error message; danger state when non-empty
 * @property {boolean} [required]   // renders a red asterisk after the label
 */
import { computed } from "vue";

/** Two-way bound value. */
const model = defineModel({ type: String, default: "" });

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
  autocomplete: { type: String, default: "off" },
  hint: { type: String, default: "" },
  error: { type: String, default: "" },
  required: { type: Boolean, default: false },
});

const hasError = computed(() => props.error.length > 0);
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      :for="id"
      class="text-sm font-medium"
      :class="hasError ? 'text-danger-emphasis' : 'text-neutral'"
    >
      {{ label }}<span v-if="required" class="text-danger-emphasis"> *</span>
    </label>
    <input
      :id="id"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :aria-invalid="hasError || undefined"
      :aria-describedby="hasError ? `${id}-error` : undefined"
      class="w-full px-3 pt-[0.6rem] pb-[0.5rem] rounded-lg text-lg text-neutral bg-surface-l0 border border-solid transition-colors placeholder:text-neutral-quiet focus:outline-none"
      :class="
        hasError
          ? 'border-danger-emphasis focus:border-danger-emphasis'
          : 'border-neutral-muted hover:border-neutral-emphasis focus:border-brand-emphasis'
      "
    />
    <p v-if="hasError" :id="`${id}-error`" class="text-sm text-danger-emphasis">
      {{ error }}
    </p>
    <p v-else-if="hint" class="text-sm text-neutral-quiet">{{ hint }}</p>
  </div>
</template>
