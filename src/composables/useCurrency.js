/**
 * Currency formatting — one shared `Intl.NumberFormat`, never string concat.
 * Locale/currency are fixed to en-US/USD (prices are USD regardless of UI
 * locale, §6.4).
 *
 * @module composables/useCurrency
 */

/** Single formatter instance reused across every call. */
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Compact formatter (no cents) for inline references like "VIP ($599)". */
const usdCompactFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Format a number as USD, e.g. `1234.5` -> `"$1,234.50"`.
 *
 * @param {number} amount
 * @returns {string}
 */
export function format(amount) {
  return usdFormatter.format(amount);
}

/**
 * Format a whole-dollar amount without cents, e.g. `599` -> `"$599"`. Used for
 * the compact parenthesised prices in the review (tickets / add-ons); the
 * itemised totals keep the full `format`.
 *
 * @param {number} amount
 * @returns {string}
 */
export function formatCompact(amount) {
  return usdCompactFormatter.format(amount);
}

/**
 * Currency helpers.
 *
 * @returns {{ format: (amount: number) => string, formatCompact: (amount: number) => string }}
 */
export function useCurrency() {
  return { format, formatCompact };
}
