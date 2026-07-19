<script setup>
/**
 * Shared shell for the selectable cards (ticket, session, add-ons). Owns the
 * common look so each card only supplies content + selection state:
 *  - 6px radius (`border-radius/m`)
 *  - border: 1px `border/neutral/muted` normally, 2px `border/brand/emphasis`
 *    when selected
 *  - drop shadow: resting `0 1px 3px #0000000A`, hover `0 4px 16px #00000014`
 *
 * Restored to a native element rather than `q-card`: the design's card is fully
 * custom (radius, border, shadow), so q-card contributed only overrides, and a
 * native `<button>` gives keyboard/focus a11y for free. Renders a `<button>`
 * when interactive (ticket/session toggles) or a `<div>` when not (e.g. a merch
 * card that owns its own qty steppers).
 *
 * @emits select — activated (click / Enter / Space) while interactive & enabled
 */
const props = defineProps({
  selected: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  interactive: { type: Boolean, default: true },
  /** Background utility class when NOT selected (ticket cards opt into surface-l1). */
  restBg: { type: String, default: "bg-surface-l0" },
  /** Background utility class when selected (ticket cards opt into the lighter brand-subtle). */
  selectedBg: { type: String, default: "bg-brand-subtle-rest" },
  /** Background utility class when disabled + not selected (sessions use surface-l2). */
  disabledBg: { type: String, default: "bg-surface-l0 opacity-60" },
  /** Padding utility (default p-4; stage 1 tickets opt into the roomier 1.25rem). */
  padding: { type: String, default: "" },
  /** Gap between stacked card rows (default gap-3; sessions opt into the tighter gap-1). */
  gap: { type: String, default: "" },
  /** ARIA role when interactive. */
  role: {
    type: /** @type {import('vue').PropType<'radio' | 'checkbox'>} */ (String),
    default: undefined,
  },
});

const emit = defineEmits(["select"]);

function activate() {
  if (props.interactive && !props.disabled) emit("select");
}
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    :type="interactive ? 'button' : undefined"
    :role="interactive ? role : undefined"
    :aria-checked="interactive && role ? selected : undefined"
    :disabled="interactive && disabled ? true : undefined"
    class="card-shell appearance-none border-0 flex flex-col w-full text-left rounded-md transition-all"
    :class="[
      padding,
      gap,
      selected ? `is-selected ${selectedBg}` : disabled ? disabledBg : restBg,
      disabled
        ? 'is-disabled cursor-not-allowed'
        : interactive
          ? 'is-interactive cursor-pointer'
          : '',
    ]"
    @click="activate"
  >
    <slot />
  </component>
</template>

<style scoped>
/* The border is drawn as an INSET box-shadow ring (not a CSS border) so the
   1px → 2px change on select adds no layout size — no content/layout shift. The
   ring and the drop-shadow elevation are separate custom properties composed
   into one box-shadow; `is-selected` swaps the ring, `:hover` swaps the
   elevation. Border colors come from the design tokens; the drop shadows are
   design values with no token equivalent. */
.card-shell {
  --card-ring: inset 0 0 0 1px var(--border-neutral-muted);
  --card-elevation: 0px 1px 3px 0px #0000000a;
  box-shadow: var(--card-ring), var(--card-elevation);
}
.card-shell.is-selected {
  --card-ring: inset 0 0 0 2px var(--border-brand-emphasis);
}
.card-shell.is-interactive:not(.is-disabled):hover {
  --card-elevation: 0px 4px 16px 0px #00000014;
}
/* Keyboard focus ring (appearance-none strips the native one). */
.card-shell:focus-visible {
  outline: 2px solid var(--border-brand-emphasis);
  outline-offset: 2px;
}
</style>
