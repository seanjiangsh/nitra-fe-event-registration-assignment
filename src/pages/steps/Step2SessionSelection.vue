<script setup>
/**
 * Step 2 — Session Selection (S2). Sessions grouped by UTC date (S2.1) with a
 * day switcher; each card is multi-select. A session is disabled (greyed, no
 * checkbox) when it is sold out (S2.3) OR its time overlaps a session the
 * attendee has already selected — so two overlapping sessions can never both be
 * picked (the conflict is blocked here, not deferred to Step 4). The active day
 * is step-local UI state preserved by `<keep-alive>`.
 */
import { ref, computed } from "vue";
import { useRegistration } from "../../composables/useRegistration.js";
import { SESSIONS, EVENT } from "../../data.js";
import { formatDayShort } from "../../composables/useDateTime.js";
import { overlaps } from "../../composables/useTimeConflicts.js";
import SegmentedTabs from "../../components/ui/SegmentedTabs.vue";
import SessionCard from "../../components/cards/SessionCard.vue";

const { registration, selectedSessions, selectedWorkshops } = useRegistration();

const activeDay = ref(EVENT.dates[0]);

/** Day options for the segmented switcher. */
const dayTabs = computed(() => EVENT.dates.map((d) => ({ id: d, label: formatDayShort(d) })));

const isSelected = (/** @type {import('../../types.js').Session} */ s) =>
  registration.selectedSessionIds.includes(s.id);

/**
 * A session is disabled when it's sold out or its time clashes with an
 * already-selected session OR workshop (the conflict is bidirectional — Step 3
 * disables a workshop that clashes with a selected session, and this disables a
 * session that clashes with a selected workshop). A session the attendee has
 * already picked is never disabled (they can still deselect it).
 */
function sessionDisabled(/** @type {import('../../types.js').Session} */ s) {
  if (isSelected(s)) return false;
  if (s.registered >= s.capacity) return true;
  return (
    selectedSessions.value.some((sel) => overlaps(s, sel)) ||
    selectedWorkshops.value.some((w) => overlaps(s, w))
  );
}

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

    <!-- Day switcher -->
    <SegmentedTabs v-model="activeDay" :options="dayTabs" aria-label="Conference day" />

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
        :selected="isSelected(session)"
        :disabled="sessionDisabled(session)"
        @toggle="toggleSession(session.id)"
      />
    </div>
  </section>
</template>
