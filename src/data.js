/**
 * Typed boundary over the provided mocks.
 *
 * The mock files in `src/mocks` are given data and stay untouched (and are
 * excluded from type-checking). This module imports them and re-exports each
 * under a clear name with a JSDoc cast, so everything downstream is fully typed.
 *
 * @module data
 */

import { event } from './mocks/event.js'
import { sessions } from './mocks/sessions.js'
import { addons } from './mocks/addons.js'

/** The conference event. @type {import('./types.js').EventInfo} */
export const EVENT = /** @type {import('./types.js').EventInfo} */ (event)

/** All ticket types (single-select on Step 1). @type {import('./types.js').Ticket[]} */
export const TICKETS = /** @type {import('./types.js').Ticket[]} */ (event.ticketTypes)

/** All sessions, flat (group by date in the UI). @type {import('./types.js').Session[]} */
export const SESSIONS = /** @type {import('./types.js').Session[]} */ (sessions)

/** All add-ons, mixed (group by category in the UI). @type {import('./types.js').Addon[]} */
export const ADDONS = /** @type {import('./types.js').Addon[]} */ (addons)

/** Workshop add-ons only. @type {import('./types.js').Workshop[]} */
export const WORKSHOPS = /** @type {import('./types.js').Workshop[]} */ (
  ADDONS.filter((a) => a.category === 'workshop')
)

/** Meal add-ons only. @type {import('./types.js').Meal[]} */
export const MEALS = /** @type {import('./types.js').Meal[]} */ (
  ADDONS.filter((a) => a.category === 'meal')
)

/** Merchandise add-ons only. @type {import('./types.js').MerchItem[]} */
export const MERCH = /** @type {import('./types.js').MerchItem[]} */ (
  ADDONS.filter((a) => a.category === 'merchandise')
)
