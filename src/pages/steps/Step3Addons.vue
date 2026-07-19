<script setup>
/**
 * Step 3 — Add-ons (S3). Grouped by category (S3.1) via a segmented switcher
 * with a sliding indicator + a direction-aware content slide: workshops (with
 * live conflict-disable vs selected sessions, S3.2), meal packages, and
 * merchandise (per-item qty + size, S3.3). The shipping banner is always present
 * (S3.4) — kept in the layout so adding merch doesn't shift the page. The live
 * order summary (S3.5/.6) sits alongside. Active tab is kept alive across nav.
 */
import { ref, watch } from "vue";
import { useRegistration } from "../../composables/useRegistration.js";
import { WORKSHOPS, MEALS, MERCH } from "../../data.js";
import { overlaps } from "../../composables/useTimeConflicts.js";
import SegmentedTabs from "../../components/ui/SegmentedTabs.vue";
import WorkshopCard from "../../components/cards/WorkshopCard.vue";
import MealCard from "../../components/cards/MealCard.vue";
import MerchCard from "../../components/cards/MerchCard.vue";
import OrderSummary from "../../components/ui/OrderSummary.vue";

const { registration, selectedSessions, submitAttempted, errorsByStep } =
  useRegistration();

/** Merch integrity error for an item, surfaced after submit (§7). */
function merchError(/** @type {import('../../types.js').MerchItem} */ item) {
  if (!submitAttempted.value) return "";
  return errorsByStep.value[3].find((e) => e.field === item.id)?.message ?? "";
}

const TABS = [
  { id: "workshops", label: "Workshops" },
  { id: "meals", label: "Meal Packages" },
  { id: "merch", label: "Merchandise" },
];
const activeTab = ref("workshops");

// Direction-aware content slide when switching category.
const contentDir = ref("next");
watch(activeTab, (to, from) => {
  const toI = TABS.findIndex((t) => t.id === to);
  const fromI = TABS.findIndex((t) => t.id === from);
  contentDir.value = toI >= fromI ? "next" : "prev";
});

// ── Workshop availability (live) ──
const isSoldOut = (/** @type {import('../../types.js').Workshop} */ w) =>
  w.registered >= w.capacity;
const isWorkshopSelected = (
  /** @type {import('../../types.js').Workshop} */ w,
) => registration.selectedWorkshopIds.includes(w.id);
/** First selected session this workshop overlaps, or null. */
const conflictingSession = (
  /** @type {import('../../types.js').Workshop} */ w,
) => selectedSessions.value.find((s) => overlaps(w, s)) ?? null;

/** Disabled when sold out, or overlapping a selected session (unless already the attendee's pick). */
function workshopDisabled(/** @type {import('../../types.js').Workshop} */ w) {
  return isSoldOut(w) || (!!conflictingSession(w) && !isWorkshopSelected(w));
}
/** Conflict reason shown on the card; sold-out is shown via the card's spots text. */
function workshopConflictNote(
  /** @type {import('../../types.js').Workshop} */ w,
) {
  const clash = conflictingSession(w);
  return clash && !isWorkshopSelected(w) ? `Overlaps “${clash.title}”` : "";
}

// ── Mutations ──
function toggleId(/** @type {string[]} */ ids, /** @type {string} */ id) {
  const i = ids.indexOf(id);
  if (i === -1) ids.push(id);
  else ids.splice(i, 1);
}
const toggleWorkshop = (/** @type {string} */ id) =>
  toggleId(registration.selectedWorkshopIds, id);
const toggleMeal = (/** @type {string} */ id) =>
  toggleId(registration.selectedMealIds, id);

/** Step a merch item's qty from its LIVE store value (robust to rapid clicks), clamped to [0, max]. */
function stepMerch(
  /** @type {import('../../types.js').MerchItem} */ item,
  /** @type {number} */ delta,
) {
  const current = registration.merch[item.id]?.qty ?? 0;
  const next = Math.max(0, Math.min(current + delta, item.maxQuantity));
  if (next <= 0) {
    delete registration.merch[item.id];
    return;
  }
  const cur = registration.merch[item.id];
  registration.merch[item.id] = cur ? { ...cur, qty: next } : { qty: next };
}
function setMerchSize(/** @type {string} */ id, /** @type {string} */ size) {
  const cur = registration.merch[id];
  registration.merch[id] = cur ? { ...cur, size } : { qty: 1, size };
}
</script>

<template>
  <section class="flex gap-8 items-start">
    <!-- Left: add-on content -->
    <div class="flex-1 min-w-0 flex flex-col gap-6">
      <h2 class="text-h3 text-neutral m-0">Select Add-ons</h2>

      <SegmentedTabs
        v-model="activeTab"
        :options="TABS"
        aria-label="Add-on category"
      />

      <!-- Shipping info (S3.4) — always present so adding merch doesn't shift layout -->
      <template v-if="activeTab === 'merch'">
        <q-banner class="bg-info-subtle-rest !rounded-md text-neutral">
          <template #avatar>
            <q-icon name="info" class="text-info-emphasis" />
          </template>
          <span class="text-subtitle2 text-neutral block"
            >Shipping Information</span
          >
          <span class="text-md text-neutral-muted">
            Merchandise items will be shipped to your address one week before
            the conference. Please ensure your shipping address in Step 1 is
            correct.
          </span>
        </q-banner>
      </template>

      <!-- Category content (row list) with a direction-aware slide on switch -->
      <div
        :key="activeTab"
        class="flex flex-col gap-4"
        :class="contentDir === 'next' ? 'addon-slide-next' : 'addon-slide-prev'"
      >
        <template v-if="activeTab === 'workshops'">
          <WorkshopCard
            v-for="w in WORKSHOPS"
            :key="w.id"
            :workshop="w"
            :selected="registration.selectedWorkshopIds.includes(w.id)"
            :disabled="workshopDisabled(w)"
            :conflict-note="workshopConflictNote(w)"
            @toggle="toggleWorkshop(w.id)"
          />
        </template>

        <template v-else-if="activeTab === 'meals'">
          <MealCard
            v-for="m in MEALS"
            :key="m.id"
            :meal="m"
            :selected="registration.selectedMealIds.includes(m.id)"
            @toggle="toggleMeal(m.id)"
          />
        </template>

        <template v-else>
          <MerchCard
            v-for="item in MERCH"
            :key="item.id"
            :item="item"
            :qty="registration.merch[item.id]?.qty ?? 0"
            :size="registration.merch[item.id]?.size ?? ''"
            :error="merchError(item)"
            @increment="stepMerch(item, 1)"
            @decrement="stepMerch(item, -1)"
            @update:size="setMerchSize(item.id, $event)"
          />
        </template>
      </div>
    </div>

    <!-- Right: live order summary (sticky within the scrolling main) -->
    <aside class="w-80 shrink-0 sticky top-2">
      <OrderSummary />
    </aside>
  </section>
</template>

<style scoped>
/* Direction-aware content slide on category switch (CSS animation degrades
   gracefully — no dependency on JS transition end events). */
.addon-slide-next {
  animation: addon-slide-next 220ms ease-out;
}
.addon-slide-prev {
  animation: addon-slide-prev 220ms ease-out;
}
@keyframes addon-slide-next {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes addon-slide-prev {
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
  .addon-slide-next,
  .addon-slide-prev {
    animation: none;
  }
}
</style>
