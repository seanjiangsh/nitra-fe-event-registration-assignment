/**
 * localStorage persistence for the registration store (§4.2). The store is
 * saved as a versioned blob so a refresh, a shared step URL, or a return visit
 * never lands on an empty store — and, once submitted, reloads back into the
 * success screen.
 *
 * Two safety rails:
 *  - **Version gate**: on a version mismatch the saved blob is ignored and the
 *    store starts fresh, so a future shape change can't crash hydration.
 *  - **Validate on hydrate**: any selection id / merch key that no longer exists
 *    in the mocks is dropped, and merch qty/size are clamped to what the item
 *    actually allows, so stale saved data can't render a broken selection.
 *
 * @module composables/useRegistrationPersistence
 */

import { TICKETS, SESSIONS, WORKSHOPS, MEALS, MERCH } from '../data.js'

const STORAGE_KEY = 'nitra:registration'
/** Bump when {@link import('../types.js').RegistrationState} changes shape. */
const VERSION = 1

/** @returns {boolean} whether localStorage is usable (guards SSR / privacy modes). */
function hasStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

// Static membership sets / lookups over the mocks, built once (mocks never
// change at runtime).
const idSet = (/** @type {readonly { id: string }[]} */ items) => new Set(items.map((i) => i.id))
const TICKET_IDS = idSet(TICKETS)
const SESSION_IDS = idSet(SESSIONS)
const WORKSHOP_IDS = idSet(WORKSHOPS)
const MEAL_IDS = idSet(MEALS)
const MERCH_BY_ID = new Map(MERCH.map((m) => [m.id, m]))

/** Keep a scalar only if it is a known id, else `null`. */
const keepId = (/** @type {unknown} */ v, /** @type {Set<string>} */ valid) =>
  typeof v === 'string' && valid.has(v) ? v : null

/** Keep only the entries of an array that are known ids. */
const keepIds = (/** @type {unknown} */ arr, /** @type {Set<string>} */ valid) =>
  Array.isArray(arr) ? arr.filter((id) => typeof id === 'string' && valid.has(id)) : []

/**
 * Coerce an unknown attendee blob into the full six-field shape; any non-string
 * becomes an empty string.
 *
 * @param {unknown} raw
 * @returns {import('../types.js').Attendee}
 */
function sanitizeAttendee(raw) {
  const a = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
  const str = (/** @type {unknown} */ v) => (typeof v === 'string' ? v : '')
  return {
    fullName: str(a.fullName),
    email: str(a.email),
    phone: str(a.phone),
    company: str(a.company),
    jobTitle: str(a.jobTitle),
    shippingAddress: str(a.shippingAddress),
  }
}

/**
 * Coerce an unknown merch blob into valid selections: unknown items are dropped,
 * qty is clamped to `[1, maxQuantity]`, and a size is kept only if the item
 * offers it.
 *
 * @param {unknown} raw
 * @returns {Record<string, import('../types.js').MerchSelection>}
 */
function sanitizeMerch(raw) {
  /** @type {Record<string, import('../types.js').MerchSelection>} */
  const merch = {}
  if (!raw || typeof raw !== 'object') return merch
  for (const [id, sel] of Object.entries(raw)) {
    const item = MERCH_BY_ID.get(id)
    if (!item || !sel || typeof sel !== 'object') continue
    const rawQty = Number(/** @type {any} */ (sel).qty)
    if (!Number.isFinite(rawQty) || rawQty < 1) continue
    const qty = Math.min(Math.floor(rawQty), item.maxQuantity)
    const rawSize = /** @type {any} */ (sel).size
    const size = item.sizes && item.sizes.includes(rawSize) ? rawSize : undefined
    merch[id] = size ? { qty, size } : { qty }
  }
  return merch
}

/**
 * Coerce an arbitrary parsed value into a valid, mock-consistent
 * RegistrationState (or `null` if it isn't an object). Each field delegates to a
 * focused helper above, so this reads as a declarative assembly.
 *
 * @param {unknown} raw
 * @returns {import('../types.js').RegistrationState | null}
 */
function sanitize(raw) {
  if (!raw || typeof raw !== 'object') return null
  const data = /** @type {Record<string, any>} */ (raw)
  const status = data.status === 'submitted' ? 'submitted' : 'draft'
  return {
    attendee: sanitizeAttendee(data.attendee),
    ticketTypeId: keepId(data.ticketTypeId, TICKET_IDS),
    selectedSessionIds: keepIds(data.selectedSessionIds, SESSION_IDS),
    selectedWorkshopIds: keepIds(data.selectedWorkshopIds, WORKSHOP_IDS),
    selectedMealIds: keepIds(data.selectedMealIds, MEAL_IDS),
    merch: sanitizeMerch(data.merch),
    status,
    submittedAt: status === 'submitted' && typeof data.submittedAt === 'string' ? data.submittedAt : null,
  }
}

/**
 * Read + validate the persisted registration, or `null` if absent, unreadable,
 * or from a different version.
 *
 * @returns {import('../types.js').RegistrationState | null}
 */
export function hydrate() {
  if (!hasStorage()) return null
  try {
    const blob = window.localStorage.getItem(STORAGE_KEY)
    if (!blob) return null
    const parsed = JSON.parse(blob)
    if (!parsed || parsed.version !== VERSION) return null
    return sanitize(parsed.data)
  } catch {
    return null
  }
}

/**
 * Persist the current registration under the version envelope.
 *
 * @param {import('../types.js').RegistrationState} state
 * @returns {void}
 */
export function persist(state) {
  if (!hasStorage()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, data: state }))
  } catch {
    // quota / privacy mode — persistence is best-effort, never fatal
  }
}

/**
 * The persisted lifecycle status without materialising the whole store — used
 * by router guards, which run before the layout's provided store exists, so the
 * durable localStorage value is the source of truth for the `/success` gate.
 *
 * @returns {'draft' | 'submitted'}
 */
export function readPersistedStatus() {
  return hydrate()?.status ?? 'draft'
}

/**
 * Clear the persisted registration (the store's `reset()` calls this).
 *
 * @returns {void}
 */
export function clearPersisted() {
  if (!hasStorage()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
