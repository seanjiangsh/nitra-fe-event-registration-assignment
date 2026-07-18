/**
 * Domain models for the WebDev Summit registration wizard.
 *
 * JSDoc `@typedef` blocks only — this file emits no runtime code. Shapes mirror
 * the untouched mocks in `src/mocks` (event.js / sessions.js / addons.js). Other
 * modules reference these via `import('./types.js').<Name>`.
 *
 * @module types
 */

/**
 * A conference track. Derived from the `track` field across sessions.
 * @typedef {'main' | 'frontend' | 'backend' | 'devops'} Track
 */

/**
 * Add-on category discriminator (the `category` field on every add-on).
 * @typedef {'workshop' | 'meal' | 'merchandise'} AddonCategory
 */

/**
 * A ticket type (event.ticketTypes[]).
 * @typedef {Object} Ticket
 * @property {string} id                 // 'general' | 'vip' | 'student'
 * @property {string} name
 * @property {number} price
 * @property {string} description
 * @property {string[]} perks
 */

/**
 * The event venue (event.venue).
 * @typedef {Object} Venue
 * @property {string} name
 * @property {string} address
 */

/**
 * The conference event (mocks/event.js `event`).
 * @typedef {Object} EventInfo
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string[]} dates            // ISO date strings, e.g. '2028-11-15'
 * @property {Venue} venue
 * @property {Ticket[]} ticketTypes
 */

/**
 * A conference session (mocks/sessions.js). `date` is the start, `endDate` the
 * end — both UTC ISO timestamps that MUST be compared/formatted in UTC.
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} title
 * @property {string} speaker
 * @property {string} speakerTitle
 * @property {Track} track
 * @property {string} date               // UTC ISO start, e.g. '2028-11-15T09:00:00Z'
 * @property {string} endDate            // UTC ISO end
 * @property {number} capacity
 * @property {number} registered
 * @property {string} description
 */

/**
 * A workshop add-on. Time-slotted, so it can conflict with selected sessions
 * and has its own capacity. VIP holders get 10% off its price.
 * @typedef {Object} Workshop
 * @property {string} id
 * @property {'workshop'} category
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {string} date               // UTC ISO start
 * @property {string} endDate            // UTC ISO end
 * @property {number} capacity
 * @property {number} registered
 */

/**
 * A meal-package add-on. No time slot — meals never conflict, so they are a
 * plain multi-select.
 * @typedef {Object} Meal
 * @property {string} id
 * @property {'meal'} category
 * @property {string} name
 * @property {string} description
 * @property {number} price
 */

/**
 * A merchandise add-on. Multiple items may be ordered, each with a per-item
 * quantity capped at `maxQuantity`; `sizes` is present only for sized items.
 * @typedef {Object} MerchItem
 * @property {string} id
 * @property {'merchandise'} category
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {number} maxQuantity
 * @property {string[]} [sizes]
 */

/**
 * Any add-on from the mixed `addons` array, discriminated by `category`.
 * @typedef {Workshop | Meal | MerchItem} Addon
 */

/**
 * Attendee details captured on Step 1.
 * @typedef {Object} Attendee
 * @property {string} fullName
 * @property {string} email
 * @property {string} phone
 * @property {string} company
 * @property {string} jobTitle
 * @property {string} shippingAddress    // required only when merch is selected
 */

/**
 * A single merch line in the registration: chosen quantity and (if sized) size.
 * @typedef {Object} MerchSelection
 * @property {number} qty
 * @property {string} [size]
 */

/**
 * The full cross-step registration state (the shared reactive store, §4).
 * @typedef {Object} RegistrationState
 * @property {Attendee} attendee
 * @property {string | null} ticketTypeId
 * @property {string[]} selectedSessionIds
 * @property {string[]} selectedWorkshopIds
 * @property {string[]} selectedMealIds
 * @property {Object.<string, MerchSelection>} merch   // keyed by merch item id
 * @property {'draft' | 'submitted'} status
 * @property {string | null} submittedAt               // ISO timestamp on submit
 */

/**
 * One itemized line in the order summary / pricing breakdown.
 * @typedef {Object} PricingLine
 * @property {string} id
 * @property {string} label
 * @property {number} amount             // signed: discounts are negative
 * @property {'ticket' | 'workshop' | 'discount' | 'meal' | 'merch'} kind
 * @property {number} [qty]              // present for merch lines
 */

/**
 * A single validation failure, keyed to the step that owns the field.
 * @typedef {Object} ValidationError
 * @property {number} step               // 1 | 2 | 3 | 4
 * @property {string} field              // field name or selection id
 * @property {string} message
 */

/**
 * Semantic color variant shared by the `Badge` component and its callers
 * (ticket "Selected", session track / status pills).
 * @typedef {'brand' | 'neutral' | 'success' | 'danger' | 'info' | 'warning' | 'accent'} BadgeVariant
 */

export {}
