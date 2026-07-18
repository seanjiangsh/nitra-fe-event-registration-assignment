/**
 * Date/time formatting — UTC ONLY (§6.1). The mock timestamps are UTC
 * (`2028-11-15T09:00:00Z`) and the design renders them verbatim ("9:00 AM"), so
 * every formatter pins `timeZone: 'UTC'`. Formatting in the host zone (e.g.
 * Taipei, UTC+8) would shift every time by 8 hours and break fidelity.
 *
 * Formatters are created once and reused, never string-concatenated.
 *
 * @module composables/useDateTime
 */

const timeFmt = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'UTC',
})

const dayShortFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

const dayLongFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

/**
 * A UTC time, e.g. `'2028-11-15T09:00:00Z'` → `'9:00 AM'`.
 *
 * @param {string} iso
 * @returns {string}
 */
export function formatTime(iso) {
  return timeFmt.format(new Date(iso))
}

/**
 * A UTC time range, e.g. `'9:00 AM – 10:00 AM'` (en dash).
 *
 * @param {string} startIso
 * @param {string} endIso
 * @returns {string}
 */
export function formatTimeRange(startIso, endIso) {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`
}

/**
 * Short UTC date, e.g. `'2028-11-15'` → `'Nov 15'`.
 *
 * @param {string} iso
 * @returns {string}
 */
export function formatDayShort(iso) {
  return dayShortFmt.format(new Date(iso))
}

/**
 * Long UTC date, e.g. `'2028-11-15'` → `'Saturday, November 15, 2028'`.
 *
 * @param {string} iso
 * @returns {string}
 */
export function formatDayLong(iso) {
  return dayLongFmt.format(new Date(iso))
}

/**
 * Date/time helpers.
 *
 * @returns {{
 *   formatTime: typeof formatTime,
 *   formatTimeRange: typeof formatTimeRange,
 *   formatDayShort: typeof formatDayShort,
 *   formatDayLong: typeof formatDayLong,
 * }}
 */
export function useDateTime() {
  return { formatTime, formatTimeRange, formatDayShort, formatDayLong }
}
