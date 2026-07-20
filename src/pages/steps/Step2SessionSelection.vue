<script setup>
/**
 * Step 2 — Session Selection (S2). Sessions grouped by UTC date (S2.1) with a
 * day switcher; each card is multi-select. Selection is FREE (per spec): the
 * only thing that disables a session is sold-out capacity (S2.3). Time conflicts
 * between selected sessions are allowed here and validated at Step 4 (§7), where
 * the review flags the overlapping picks. The active day is step-local UI state
 * preserved by `<keep-alive>`.
 */
import { ref, computed, watch } from "vue";
import { useRegistration } from "../../composables/useRegistration.js";
import { SESSIONS, EVENT } from "../../data.js";
import { formatDayShort } from "../../composables/useDateTime.js";
import SegmentedTabs from "../../components/ui/SegmentedTabs.vue";
import SessionCard from "../../components/cards/SessionCard.vue";

const { registration } = useRegistration();

const activeDay = ref(EVENT.dates[0]);

/**
 * Direction of the day-panel slide, derived from the tab index delta: switching
 * to a later day slides the new panel in from the right (`day-next`), an earlier
 * day from the left (`day-prev`). Purely presentational (stage 10).
 */
const slideDir = ref("day-next");
let prevDayIdx = EVENT.dates.indexOf(activeDay.value);
watch(activeDay, (day) => {
  const i = EVENT.dates.indexOf(day);
  slideDir.value = i >= prevDayIdx ? "day-next" : "day-prev";
  prevDayIdx = i;
});

/** Day options for the segmented switcher. */
const dayTabs = computed(() =>
  EVENT.dates.map((d) => ({ id: d, label: formatDayShort(d) })),
);

const isSelected = (/** @type {import('../../types.js').Session} */ s) =>
  registration.selectedSessionIds.includes(s.id);

/**
 * A session is disabled only when it's sold out (S2.3) and the attendee hasn't
 * already selected it (they can still deselect a full session they hold). Time
 * conflicts do NOT disable — selection is free and overlaps are flagged at Step 4.
 */
function sessionDisabled(/** @type {import('../../types.js').Session} */ s) {
  if (isSelected(s)) return false;
  return s.registered >= s.capacity;
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
    <SegmentedTabs
      v-model="activeDay"
      :options="dayTabs"
      aria-label="Conference day"
    />

    <!-- Selected count -->
    <p class="text-sm font-semibold text-brand-emphasis m-0">
      {{ selectedCount }}
      {{ selectedCount === 1 ? "session" : "sessions" }} selected
    </p>

    <!-- Session grid — slides left/right when the day tab changes (stage 10).
         Re-keying by day + a CSS keyframe (not a JS <transition>) mirrors the
         add-ons category slide and plays reliably even if the tab is backgrounded. -->
    <div
      :key="activeDay"
      class="grid grid-cols-2 gap-4"
      :class="slideDir === 'day-next' ? 'day-slide-next' : 'day-slide-prev'"
    >
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

<style scoped>
/* Direction-aware day-panel slide (later day → in from the right). CSS animation,
   so it degrades gracefully and doesn't depend on JS transition-end events. */
.day-slide-next {
  animation: day-slide-next 220ms ease-out;
}
.day-slide-prev {
  animation: day-slide-prev 220ms ease-out;
}
@keyframes day-slide-next {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes day-slide-prev {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .day-slide-next,
  .day-slide-prev {
    animation: none;
  }
}
</style>
