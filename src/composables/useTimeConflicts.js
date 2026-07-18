/**
 * Time-conflict detection. UTC ONLY — every comparison goes through
 * `Date.getTime()` (epoch ms, timezone-agnostic); local-zone accessors are
 * never used, so a Taipei (UTC+8) dev box and a UTC CI box agree (§6.1).
 *
 * Overlap rule for half-open intervals `[start, end)`:
 *   overlaps(a, b) === aStart < bEnd && bStart < aEnd
 *
 * @module composables/useTimeConflicts
 */

/**
 * Any object carrying a UTC ISO start (`date`) and end (`endDate`).
 * @typedef {{ date: string, endDate: string }} TimeSlot
 */

/**
 * Epoch milliseconds for a UTC ISO timestamp. Returns UTC ms regardless of the
 * host timezone.
 *
 * @param {string} iso
 * @returns {number}
 */
function ms(iso) {
  return new Date(iso).getTime();
}

/**
 * True if two time slots overlap (half-open intervals; touching edges do not
 * count as a conflict).
 *
 * @param {TimeSlot} a
 * @param {TimeSlot} b
 * @returns {boolean}
 */
export function overlaps(a, b) {
  return ms(a.date) < ms(b.endDate) && ms(b.date) < ms(a.endDate);
}

/**
 * Session-vs-session conflict (deferred to Step 4 — flagged, not blocked).
 *
 * @param {import('../types.js').Session} a
 * @param {import('../types.js').Session} b
 * @returns {boolean}
 */
export function sessionsConflict(a, b) {
  return a.id !== b.id && overlaps(a, b);
}

/**
 * All conflicting pairs among the selected sessions (each unordered pair once),
 * returned ordered by start time.
 *
 * Sorting by start lets the inner scan stop as soon as a later session begins
 * at/after the current one ends — since everything after it starts later still,
 * nothing further out can overlap either. That makes this O(n log n) plus the
 * number of conflicts found, rather than checking every pair. (n is only the
 * sessions one attendee selected, so it stays small regardless; the early-out
 * is cheap insurance and the clearer intent.)
 *
 * @param {import('../types.js').Session[]} selected
 * @returns {Array<[import('../types.js').Session, import('../types.js').Session]>}
 */
export function sessionConflictPairs(selected) {
  const sorted = [...selected].sort((a, b) => ms(a.date) - ms(b.date));
  /** @type {Array<[import('../types.js').Session, import('../types.js').Session]>} */
  const pairs = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      // Sorted by start, so start[i] <= start[j] < end[j]: overlap reduces to
      // start[j] < end[i]. Once start[j] >= end[i], no later j can overlap i.
      if (ms(sorted[j].date) >= ms(sorted[i].endDate)) break;
      pairs.push([sorted[i], sorted[j]]);
    }
  }
  return pairs;
}

/**
 * Workshop-vs-selected-session conflict (live in Step 3): true if the workshop
 * overlaps any currently selected session, which makes it unavailable.
 *
 * @param {import('../types.js').Workshop} workshop
 * @param {import('../types.js').Session[]} selectedSessions
 * @returns {boolean}
 */
export function workshopConflictsWithSessions(workshop, selectedSessions) {
  return selectedSessions.some((session) => overlaps(workshop, session));
}

/**
 * Time-conflict helpers.
 *
 * @returns {{
 *   overlaps: typeof overlaps,
 *   sessionsConflict: typeof sessionsConflict,
 *   sessionConflictPairs: typeof sessionConflictPairs,
 *   workshopConflictsWithSessions: typeof workshopConflictsWithSessions,
 * }}
 */
export function useTimeConflicts() {
  return {
    overlaps,
    sessionsConflict,
    sessionConflictPairs,
    workshopConflictsWithSessions,
  };
}
