/**
 * Pricing — a pure, itemized calculation from resolved inputs. No store access
 * here (the store-connected `computed` is wired in stage 6); this keeps the
 * money math independently testable.
 *
 * Rules (§6.3): sessions are free; the VIP 10% discount applies to WORKSHOPS
 * ONLY, never order-wide.
 *
 *   workshopsGross   = sum(selected workshop prices)
 *   workshopDiscount = isVip ? workshopsGross * 0.10 : 0
 *   grandTotal       = ticket + (workshopsGross - discount) + meals + merch
 *
 * @module composables/usePricing
 */

/**
 * A resolved merch selection for pricing: the item plus chosen quantity.
 * @typedef {Object} MerchPricingInput
 * @property {import('../types.js').MerchItem} item
 * @property {number} qty
 */

/**
 * Inputs to the pricing calculation.
 * @typedef {Object} PricingInput
 * @property {import('../types.js').Ticket | null} ticket
 * @property {import('../types.js').Workshop[]} workshops   // selected workshops
 * @property {import('../types.js').Meal[]} meals           // selected meals
 * @property {MerchPricingInput[]} merch                    // selected merch + qty
 * @property {boolean} isVip
 */

/**
 * The computed breakdown.
 * @typedef {Object} PricingResult
 * @property {import('../types.js').PricingLine[]} lines
 * @property {number} grandTotal
 */

/** Round to whole cents to avoid binary-float drift. */
const cents = (/** @type {number} */ n) => Math.round(n * 100) / 100;

/** VIP workshop discount rate. */
const VIP_WORKSHOP_DISCOUNT = 0.1;

/**
 * Compute the itemized order breakdown. Pure — same inputs always yield the
 * same result.
 *
 * @param {PricingInput} input
 * @returns {PricingResult}
 */
export function computePricing({ ticket, workshops, meals, merch, isVip }) {
  /** @type {import('../types.js').PricingLine[]} */
  const lines = [];

  if (ticket) {
    lines.push({
      id: ticket.id,
      label: ticket.name,
      amount: ticket.price,
      kind: "ticket",
    });
  }

  const workshopsGross = workshops.reduce((sum, w) => sum + w.price, 0);
  for (const w of workshops) {
    lines.push({ id: w.id, label: w.name, amount: w.price, kind: "workshop" });
  }

  const workshopDiscount = isVip
    ? cents(workshopsGross * VIP_WORKSHOP_DISCOUNT)
    : 0;
  if (workshopDiscount > 0) {
    lines.push({
      id: "vip-workshop-discount",
      label: "VIP workshop discount (10%)",
      amount: -workshopDiscount,
      kind: "discount",
    });
  }

  for (const m of meals) {
    lines.push({ id: m.id, label: m.name, amount: m.price, kind: "meal" });
  }

  for (const { item, qty } of merch) {
    lines.push({
      id: item.id,
      label: item.name,
      amount: cents(item.price * qty),
      kind: "merch",
      qty,
    });
  }

  const grandTotal = cents(lines.reduce((sum, line) => sum + line.amount, 0));

  return { lines, grandTotal };
}

/**
 * Pricing helpers.
 *
 * @returns {{ computePricing: typeof computePricing }}
 */
export function usePricing() {
  return { computePricing };
}
