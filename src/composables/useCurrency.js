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
 * Currency helpers.
 *
 * @returns {{ format: (amount: number) => string }}
 */
export function useCurrency() {
  return { format };
}
