<script setup>
/**
 * Step 2 — Session Selection (S2). Sessions grouped by UTC date (S2.1) with a
 * day switcher; each card is multi-select. Overlapping selections are allowed
 * here and flagged only at Step 4 submit (S2.2). Sold-out sessions are disabled
 * (S2.3). The active day is step-local UI state preserved by `<keep-alive>`.
 */
import { ref, computed } from "vue";
import { useRegistration } from "../../composables/useRegistration.js";
import { SESSIONS, EVENT } from "../../data.js";
import { formatDayShort } from "../../composables/useDateTime.js";
import SessionCard from "../../components/cards/SessionCard.vue";

const { registration } = useRegistration();

const activeDay = ref(EVENT.dates[0]);

/** Sessions grouped by their UTC date (`YYYY-MM-DD`), in event-day order. */
const sessionsByDay = computed(() => {
  /** @type {Record<string, import('../../types.js').Session[]>} */
  const groups = {};
  for (const day of EVENT.dates) groups[day] = [];
  for (const session of SESSIONS) {
    const day = session.date.slice(0, 10);
    if (groups[day]) groups[day].push(session);
  }
  return groups;
});

const daySessions = computed(() => sessionsByDay.value[activeDay.value] ?? []);
const selectedCount = computed(() => registration.selectedSessionIds.length);

/** @param {string} id */
function toggleSession(id) {
  const ids = registration.selectedSessionIds;
  const i = ids.indexOf(id);
  if (i === -1) ids.push(id);
  else ids.splice(i, 1);
}
</script>

<template>
  <section class="flex flex-col gap-6">
    <header class="flex items-end justify-between gap-4">
      <h2 class="text-h3 text-neutral m-0">Select Sessions</h2>
    </header>

    <!-- Day switcher (segmented control) -->
    <div
      role="tablist"
      aria-label="Conference day"
      class="inline-flex w-fit gap-1 p-1 rounded-xl bg-surface-l2"
    >
      <button
        v-for="day in EVENT.dates"
        :key="day"
        type="button"
        role="tab"
        :aria-selected="day === activeDay"
        class="px-6 py-2 rounded-lg text-md font-semibold transition-colors"
        :class="day === activeDay ? 'bg-brand-emphasis-rest text-inverse' : 'text-neutral-muted hover:text-neutral'"
        @click="activeDay = day"
      >
        {{ formatDayShort(day) }}
      </button>
    </div>

    <!-- Selected count -->
    <p class="text-md font-semibold text-brand-emphasis m-0">
      {{ selectedCount }} {{ selectedCount === 1 ? 'session' : 'sessions' }} selected
    </p>

    <!-- Session grid -->
    <div class="grid grid-cols-2 gap-4">
      <SessionCard
        v-for="session in daySessions"
        :key="session.id"
        :session="session"
        :selected="registration.selectedSessionIds.includes(session.id)"
        @toggle="toggleSession(session.id)"
      />
    </div>
  </section>
</template>
