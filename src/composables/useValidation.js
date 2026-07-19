/**
 * Validation rules (§7). Pure functions over the registration state — no Vue,
 * no side effects — so they are trivially testable and the store just wraps them
 * in `computed`s. Validation is deferred and unified: nothing here decides *when*
 * to show errors (that's the store's `submitAttempted`), only *what* is invalid.
 *
 * @module composables/useValidation
 */

/** Email: local@domain.tld. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  return EMAIL_RE.test(value.trim())
}

/**
 * US phone (NANP): 10 digits, or 11 digits starting with a country-code 1.
 * Punctuation/spacing is ignored.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isValidPhone(value) {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
}

/**
 * Step 1 — attendee + ticket (§7). A ticket is required (§6); the shipping
 * address is required only when merch is in the order (§6.5).
 *
 * @param {import('../types.js').RegistrationState} reg
 * @param {boolean} hasMerch
 * @returns {import('../types.js').ValidationError[]}
 */
export function validateAttendee(reg, hasMerch) {
  /** @type {import('../types.js').ValidationError[]} */
  const errors = []
  const add = (/** @type {string} */ field, /** @type {string} */ message) =>
    errors.push({ step: 1, field, message })
  const a = reg.attendee

  if (!reg.ticketTypeId) add('ticket', 'Please select a ticket type.')
  if (!a.fullName.trim()) add('fullName', 'Full name is required.')
  if (!a.email.trim()) add('email', 'Email is required.')
  else if (!isValidEmail(a.email)) add('email', 'Enter a valid email address.')
  if (!a.phone.trim()) add('phone', 'Phone is required.')
  else if (!isValidPhone(a.phone)) add('phone', 'Enter a valid US phone number.')
  if (!a.company.trim()) add('company', 'Company is required.')
  if (!a.jobTitle.trim()) add('jobTitle', 'Job title is required.')
  if (hasMerch && !a.shippingAddress.trim()) {
    add('shippingAddress', 'Shipping address is required for merchandise orders.')
  }
  return errors
}

// Step 2 has no validation: overlapping sessions are blocked at selection (a
// conflicting session is disabled), so a selected set can never overlap.

/**
 * Step 3 — merch integrity: a size must be chosen for items that offer sizes
 * (qty is already clamped to `maxQuantity` at selection).
 *
 * @param {Array<{ item: import('../types.js').MerchItem, qty: number, size?: string }>} selectedMerch
 * @returns {import('../types.js').ValidationError[]}
 */
export function validateMerch(selectedMerch) {
  /** @type {import('../types.js').ValidationError[]} */
  const errors = []
  for (const { item, size } of selectedMerch) {
    if (item.sizes && item.sizes.length > 0 && !size) {
      errors.push({ step: 3, field: item.id, message: `Choose a size for ${item.name}.` })
    }
  }
  return errors
}

/**
 * All validation errors, grouped by step. Step 2 is always empty (overlaps are
 * blocked at selection).
 *
 * @param {Object} input
 * @param {import('../types.js').RegistrationState} input.registration
 * @param {boolean} input.hasMerch
 * @param {Array<{ item: import('../types.js').MerchItem, qty: number, size?: string }>} input.selectedMerch
 * @returns {Record<number, import('../types.js').ValidationError[]>}
 */
export function computeErrorsByStep({ registration, hasMerch, selectedMerch }) {
  return {
    1: validateAttendee(registration, hasMerch),
    2: [],
    3: validateMerch(selectedMerch),
    4: [],
  }
}
