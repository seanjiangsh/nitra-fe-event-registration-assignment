<script setup>
/**
 * Step 4 — Review & Submit (S4). Read-only summary of the whole registration
 * (S4.1): attendee + ticket, selected sessions (as a chronological timeline),
 * add-ons, and the itemized pricing (S4.2, the shared OrderSummary). Each
 * section has an Edit link back to its step (S4.3). After a submit is attempted,
 * a top error banner lists every problem and each owning section shows a danger
 * border; the submit gate + jump-to-first-error live in the layout (S4.4/S4.5).
 */
import { computed } from "vue";
import { useRegistration } from "../../composables/useRegistration.js";
import { format, formatCompact } from "../../composables/useCurrency.js";
import { formatDayShort, formatTime } from "../../composables/useDateTime.js";
import ReviewSection from "../../components/ui/ReviewSection.vue";
import OrderSummary from "../../components/ui/OrderSummary.vue";

const {
  registration,
  ticket,
  selectedSessions,
  selectedWorkshops,
  selectedMeals,
  selectedMerch,
  submitAttempted,
  errorsByStep,
  isValid,
} = useRegistration();

const showErrors = computed(() => submitAttempted.value && !isValid.value);
const allErrors = computed(() => Object.values(errorsByStep.value).flat());
const stepInvalid = (/** @type {number} */ step) =>
  submitAttempted.value && (errorsByStep.value[step]?.length ?? 0) > 0;

/**
 * Attendee rows for the summary (one per line, value right-aligned). Each row is
 * tied to the actual Step 1 errors so an invalid field (not just an empty one)
 * turns red with a reason: an empty required field reads "— (required…)", a
 * present-but-invalid one (e.g. a bad email) reads "value (invalid …)". Only once
 * validation is active (§7).
 */
const attendeeRows = computed(() => {
  const a = registration.attendee;
  const errs = submitAttempted.value ? errorsByStep.value[1] : [];
  const hasErr = (/** @type {string} */ field) =>
    errs.some((e) => e.field === field);

  /** Parenthetical shown after the value when the field is invalid. */
  const noteFor = (
    /** @type {string} */ field,
    /** @type {string} */ value,
  ) => {
    if (!hasErr(field)) return "";
    if (!value)
      return field === "shippingAddress"
        ? "required for merchandise"
        : "required";
    return field === "email"
      ? "invalid email"
      : field === "phone"
        ? "invalid phone"
        : "invalid";
  };

  const row = (
    /** @type {string} */ label,
    /** @type {string} */ field,
    /** @type {string} */ value,
  ) => ({
    label,
    value,
    note: noteFor(field, value),
    invalid: hasErr(field),
  });

  return [
    row("Name", "fullName", a.fullName),
    row("Email", "email", a.email),
    row("Phone", "phone", a.phone),
    row("Company", "company", a.company),
    row("Job Title", "jobTitle", a.jobTitle),
    row(
      "Ticket Type",
      "ticket",
      ticket.value
        ? `${ticket.value.name} (${formatCompact(ticket.value.price)})`
        : "",
    ),
    row("Shipping Address", "shippingAddress", a.shippingAddress),
  ];
});

/** Selected sessions in chronological (UTC) order. */
const sortedSessions = computed(() =>
  [...selectedSessions.value].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  ),
);
const sessionWhen = (/** @type {import('../../types.js').Session} */ s) =>
  `${formatDayShort(s.date)}, ${formatTime(s.date)}`;

const hasAddons = computed(
  () =>
    selectedWorkshops.value.length > 0 ||
    selectedMeals.value.length > 0 ||
    selectedMerch.value.length > 0,
);
</script>

<template>
  <section class="flex flex-col gap-5">
    <!-- Unified error banner (S4.4) -->
    <q-banner
      v-if="showErrors"
      rounded
      class="bg-danger-muted-rest !rounded-md pt-4 pb-3"
    >
      <span class="text-sm text-danger block font-medium tracking-normal">
        Please fix the following errors before submitting</span
      >
      <ul class="list-none p-0 m-0 text-sm text-neutral mt-1">
        <li
          v-for="err in allErrors"
          :key="`${err.step}-${err.field}`"
          class="flex items-baseline gap-1 text-danger text-sm/6.5"
        >
          <span aria-hidden="true" class="shrink-0">&bull;</span>
          <span>Step {{ err.step }}: {{ err.message }}</span>
        </li>
      </ul>
    </q-banner>

    <h2 class="text-h3 text-neutral m-0">Review Your Registration</h2>

    <!-- Attendee information -->
    <ReviewSection
      title="Attendee Information"
      edit-to="/attendee"
      :step="1"
      :invalid="stepInvalid(1)"
    >
      <dl class="flex flex-col gap-3 m-0">
        <div
          v-for="row in attendeeRows"
          :key="row.label"
          class="flex items-baseline justify-between gap-6"
        >
          <dt class="shrink-0 text-sm text-neutral-muted">{{ row.label }}</dt>
          <dd
            class="m-0 text-sm text-right"
            :class="row.invalid ? 'text-danger' : 'text-neutral'"
          >
            <template v-if="row.value">{{ row.value }}</template
            ><template v-else>&mdash;</template
            ><template v-if="row.note"> ({{ row.note }})</template>
          </dd>
        </div>
      </dl>
    </ReviewSection>

    <!-- Selected sessions (chronological list; left = when, right = title) -->
    <ReviewSection
      title="Selected Sessions"
      edit-to="/sessions"
      :step="2"
      :invalid="stepInvalid(2)"
    >
      <p
        v-if="sortedSessions.length === 0"
        class="text-sm text-neutral-muted m-0"
      >
        No sessions selected.
      </p>
      <ul v-else class="list-none p-0 m-0 flex flex-col gap-3">
        <li
          v-for="s in sortedSessions"
          :key="s.id"
          class="flex justify-between gap-6 text-sm"
        >
          <span class="shrink-0 text-neutral-muted">{{ sessionWhen(s) }}</span>
          <span class="text-right text-neutral">{{ s.title }}</span>
        </li>
      </ul>
    </ReviewSection>

    <!-- Add-ons (left = kind, right = title + price) -->
    <ReviewSection
      title="Add-ons"
      edit-to="/add-ons"
      :step="3"
      :invalid="stepInvalid(3)"
    >
      <p v-if="!hasAddons" class="text-sm text-neutral-muted m-0">
        No add-ons selected.
      </p>
      <ul v-else class="list-none p-0 m-0 flex flex-col gap-3">
        <li
          v-for="w in selectedWorkshops"
          :key="w.id"
          class="flex justify-between gap-6 text-sm"
        >
          <span class="shrink-0 text-neutral-muted">Workshop</span>
          <span class="text-right text-neutral"
            >{{ w.name }} ({{ formatCompact(w.price) }})</span
          >
        </li>
        <li
          v-for="m in selectedMeals"
          :key="m.id"
          class="flex justify-between gap-6 text-sm"
        >
          <span class="shrink-0 text-neutral-muted">Meal</span>
          <span class="text-right text-neutral"
            >{{ m.name }} ({{ formatCompact(m.price) }})</span
          >
        </li>
        <li
          v-for="entry in selectedMerch"
          :key="entry.item.id"
          class="flex justify-between gap-6 text-sm"
        >
          <span class="shrink-0 text-neutral-muted">Merchandise</span>
          <span class="text-right text-neutral">
            {{ entry.item.name
            }}<template v-if="entry.size"> ({{ entry.size }})</template>
            &times;{{ entry.qty }} ({{
              formatCompact(entry.item.price * entry.qty)
            }})
          </span>
        </li>
      </ul>
    </ReviewSection>

    <!-- Pricing summary (S4.2) -->
    <OrderSummary title="Pricing Summary" total-label="Grand Total" />
  </section>
</template>
