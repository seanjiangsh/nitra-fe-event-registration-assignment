<script setup>
/**
 * Step 1 — Attendee Info (S1). Three single-select ticket cards bound to
 * `registration.ticketTypeId`, plus the six attendee fields bound to
 * `registration.attendee`. No inline validation (S1.noInline): fields simply
 * capture input; all rules fire on Step 4 submit (stage 7).
 */
import { useRegistration } from "../../composables/useRegistration.js";
import { TICKETS } from "../../data.js";
import TicketCard from "../../components/cards/TicketCard.vue";
import TextField from "../../components/ui/TextField.vue";

const { registration } = useRegistration();

/** @param {string} id */
function selectTicket(id) {
  registration.ticketTypeId = id;
}
</script>

<template>
  <section class="flex flex-col gap-8">
    <!-- Ticket selection (single-select) -->
    <div class="flex flex-col gap-3">
      <h2 class="text-subtitle1 text-neutral m-0">Select Ticket Type</h2>
      <div
        role="radiogroup"
        aria-label="Ticket type"
        class="grid grid-cols-3 gap-4"
      >
        <TicketCard
          v-for="ticket in TICKETS"
          :key="ticket.id"
          :ticket="ticket"
          :selected="registration.ticketTypeId === ticket.id"
          @select="selectTicket(ticket.id)"
        />
      </div>
    </div>

    <!-- Attendee details -->
    <div class="flex flex-col gap-3">
      <h3 class="text-h3 text-neutral m-0">Attendee Information</h3>
      <div class="grid grid-cols-2 gap-4">
        <TextField
          id="fullName"
          v-model="registration.attendee.fullName"
          label="Full name"
          autocomplete="name"
          placeholder="Enter your full name"
        />
        <TextField
          id="email"
          v-model="registration.attendee.email"
          label="Email"
          type="email"
          autocomplete="email"
          placeholder="Enter your email"
        />
        <TextField
          id="phone"
          v-model="registration.attendee.phone"
          label="Phone"
          type="tel"
          autocomplete="tel"
          placeholder="Enter your phone number"
        />
        <TextField
          id="company"
          v-model="registration.attendee.company"
          label="Company"
          autocomplete="organization"
          placeholder="Enter your company name"
        />
        <TextField
          id="jobTitle"
          v-model="registration.attendee.jobTitle"
          class="col-span-2"
          label="Job title"
          autocomplete="organization-title"
          placeholder="Enter your job title"
        />
        <TextField
          id="shippingAddress"
          v-model="registration.attendee.shippingAddress"
          class="col-span-2"
          label="Shipping address (optional)"
          autocomplete="street-address"
          placeholder="Enter your shipping address"
        />
      </div>
    </div>
  </section>
</template>
