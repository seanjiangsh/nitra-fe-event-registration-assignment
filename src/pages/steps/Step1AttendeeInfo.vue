<script setup>
/**
 * Step 1 — Attendee Info (S1). Three single-select ticket cards bound to
 * `registration.ticketTypeId`, plus the six attendee fields bound to
 * `registration.attendee`. No inline validation (S1.noInline): fields simply
 * capture input; all rules fire on Step 4 submit (stage 7).
 */
import { computed } from "vue";
import { useRegistration } from "../../composables/useRegistration.js";
import { TICKETS } from "../../data.js";
import TicketCard from "../../components/cards/TicketCard.vue";
import TextField from "../../components/ui/TextField.vue";

const { registration, hasMerch, submitAttempted, errorsByStep } =
  useRegistration();

/** Field → message map for Step 1, only after a submit was attempted (§7). */
const fieldErrors = computed(() => {
  /** @type {Record<string, string>} */
  const map = {};
  if (submitAttempted.value) {
    for (const e of errorsByStep.value[1]) map[e.field] = e.message;
  }
  return map;
});

/** @param {string} id */
function selectTicket(id) {
  registration.ticketTypeId = id;
}
</script>

<template>
  <section class="flex flex-col gap-8">
    <!-- Ticket selection (single-select) -->
    <div class="flex flex-col gap-3">
      <h2 class="text-subtitle1 text-neutral m-0 tracking-normal">
        Select Ticket Type
      </h2>
      <div
        role="radiogroup"
        aria-label="Ticket type"
        class="grid grid-cols-3 gap-4 pt-1"
      >
        <TicketCard
          v-for="ticket in TICKETS"
          :key="ticket.id"
          :ticket="ticket"
          :selected="registration.ticketTypeId === ticket.id"
          @select="selectTicket(ticket.id)"
        />
      </div>
      <p v-if="fieldErrors.ticket" class="text-sm text-danger m-0">
        {{ fieldErrors.ticket }}
      </p>
    </div>

    <!-- Attendee details -->
    <div class="flex flex-col gap-3">
      <h3 class="text-h3 text-neutral m-0 tracking-[0.2px]">
        Attendee Information
      </h3>
      <div class="grid grid-cols-2 gap-x-6 gap-y-[1.3rem] mt-[1.25rem]">
        <TextField
          id="fullName"
          v-model="registration.attendee.fullName"
          label="Full Name"
          autocomplete="name"
          placeholder="Enter your full name"
          :error="fieldErrors.fullName"
        />
        <TextField
          id="email"
          v-model="registration.attendee.email"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="Enter your email"
          :error="fieldErrors.email"
        />
        <TextField
          id="phone"
          v-model="registration.attendee.phone"
          label="Phone"
          type="tel"
          autocomplete="tel"
          placeholder="Enter your phone number"
          :error="fieldErrors.phone"
        />
        <TextField
          id="company"
          v-model="registration.attendee.company"
          label="Company"
          autocomplete="organization"
          placeholder="Enter your company name"
          :error="fieldErrors.company"
        />
        <TextField
          id="jobTitle"
          v-model="registration.attendee.jobTitle"
          class="col-span-2"
          label="Job Title"
          autocomplete="organization-title"
          placeholder="Enter your job title"
          :error="fieldErrors.jobTitle"
        />
        <TextField
          id="shippingAddress"
          v-model="registration.attendee.shippingAddress"
          class="col-span-2"
          :label="hasMerch ? 'Shipping Address' : 'Shipping Address (Optional)'"
          :required="hasMerch"
          autocomplete="street-address"
          placeholder="Enter your shipping address"
          :error="fieldErrors.shippingAddress"
        />
      </div>
    </div>
  </section>
</template>
