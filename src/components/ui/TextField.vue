<script setup>
/**
 * Labeled text input with two-way binding via `defineModel` (the plain-JS form:
 * runtime options + JSDoc, per §2/§9). Presentation only — validation is
 * deferred and unified on Step 4 (S1.noInline), so this shows no error state
 * yet; the `error` slot/prop hook is added in stage 7.
 *
 * @typedef {Object} TextFieldProps
 * @property {string} id            // ties <label for> to the input
 * @property {string} label
 * @property {string} [type]        // 'text' | 'email' | 'tel' | …
 * @property {string} [placeholder]
 * @property {string} [autocomplete]
 * @property {string} [hint]        // helper text under the field
 */

/** Two-way bound value. */
const model = defineModel({ type: String, default: '' })

defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  hint: { type: String, default: '' },
})
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-md font-medium text-neutral">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      class="w-full px-3 py-2 rounded-lg text-md text-neutral bg-surface-l0 border border-solid border-neutral-muted transition-colors placeholder:text-neutral-quiet hover:border-neutral-emphasis focus:border-brand-emphasis focus:outline-none"
    />
    <p v-if="hint" class="text-sm text-neutral-quiet">{{ hint }}</p>
  </div>
</template>
