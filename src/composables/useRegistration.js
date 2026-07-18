/**
 * The shared registration store (§4). One reactive `RegistrationState` plus
 * derived `computed`s, created once in `WizardLayout` and shared with every step
 * route via provide/inject under a `Symbol` key. This is the plain-JS analogue
 * of a typed React context: the key is a `Symbol`, and the injected shape is
 * described in JSDoc so consumers still get IntelliSense and checking.
 *
 * Derived state is always `computed` (never `watch`); the single `watch` here is
 * the legitimate side-effect of persisting to localStorage (§4.2).
 *
 * @module composables/useRegistration
 */

import { reactive, computed, watch, provide, inject } from 'vue'
import { TICKETS, SESSIONS, WORKSHOPS, MEALS, MERCH } from '../data.js'
import { computePricing } from './usePricing.js'
import { hydrate, persist, clearPersisted } from './useRegistrationPersistence.js'

/**
 * Array `.filter` type-guard that drops null/undefined and narrows the element
 * type — turns `(T | null)[]` into `T[]` without a cast.
 *
 * @template T
 * @param {T} value
 * @returns {value is NonNullable<T>}
 */
const isPresent = (value) => value != null

/**
 * The value shared through provide/inject. `registration` is the reactive
 * source of truth; everything else is derived or an action.
 *
 * @typedef {Object} RegistrationStore
 * @property {import('../types.js').RegistrationState} registration
 * @property {import('vue').ComputedRef<import('../types.js').Ticket | null>} ticket
 * @property {import('vue').ComputedRef<boolean>} isVip
 * @property {import('vue').ComputedRef<boolean>} hasMerch
 * @property {import('vue').ComputedRef<import('../types.js').Session[]>} selectedSessions
 * @property {import('vue').ComputedRef<import('../types.js').Workshop[]>} selectedWorkshops
 * @property {import('vue').ComputedRef<import('../types.js').Meal[]>} selectedMeals
 * @property {import('vue').ComputedRef<Array<{ item: import('../types.js').MerchItem, qty: number, size?: string }>>} selectedMerch
 * @property {import('vue').ComputedRef<import('./usePricing.js').PricingResult>} pricing
 * @property {() => void} reset
 */

/**
 * Injection key for the store. Exported so tests or advanced consumers can
 * provide a stub; steps use {@link useRegistration} instead.
 *
 * @type {import('vue').InjectionKey<RegistrationStore>}
 */
export const RegistrationKey = Symbol('registration')

/**
 * A fresh, empty registration.
 *
 * @returns {import('../types.js').RegistrationState}
 */
export function createInitialState() {
  return {
    attendee: { fullName: '', email: '', phone: '', company: '', jobTitle: '', shippingAddress: '' },
    ticketTypeId: null,
    selectedSessionIds: [],
    selectedWorkshopIds: [],
    selectedMealIds: [],
    merch: {},
    status: 'draft',
    submittedAt: null,
  }
}

/**
 * Build the reactive store: hydrate from localStorage, expose derived state,
 * and persist on every change. Call once (in the layout) and share the result.
 *
 * @returns {RegistrationStore}
 */
export function createRegistrationStore() {
  /** @type {import('../types.js').RegistrationState} */
  const registration = reactive(createInitialState())

  // Hydrate once before anything reads the store (§4.2). Merge over the fresh
  // state so a partial/older blob still yields a complete, valid object.
  const saved = hydrate()
  if (saved) Object.assign(registration, saved)

  /**
   * Find an entity by id, preserving its specific type (generic so
   * `byId(TICKETS, …)` returns `Ticket | null`, not `{ id: string } | null`).
   *
   * @template {{ id: string }} T
   * @param {readonly T[]} list
   * @param {string} id
   * @returns {T | null}
   */
  const byId = (list, id) => list.find((item) => item.id === id) ?? null

  const ticket = computed(() =>
    registration.ticketTypeId ? byId(TICKETS, registration.ticketTypeId) : null,
  )
  const isVip = computed(() => registration.ticketTypeId === 'vip')
  const hasMerch = computed(() => Object.keys(registration.merch).length > 0)

  const selectedSessions = computed(() =>
    registration.selectedSessionIds.map((id) => byId(SESSIONS, id)).filter(isPresent),
  )
  const selectedWorkshops = computed(() =>
    registration.selectedWorkshopIds.map((id) => byId(WORKSHOPS, id)).filter(isPresent),
  )
  const selectedMeals = computed(() =>
    registration.selectedMealIds.map((id) => byId(MEALS, id)).filter(isPresent),
  )
  const selectedMerch = computed(() =>
    Object.entries(registration.merch)
      .map(([id, sel]) => {
        const item = byId(MERCH, id)
        return item ? { item, qty: sel.qty, size: sel.size } : null
      })
      .filter(isPresent),
  )

  const pricing = computed(() =>
    computePricing({
      ticket: ticket.value,
      workshops: selectedWorkshops.value,
      meals: selectedMeals.value,
      merch: selectedMerch.value.map(({ item, qty }) => ({ item, qty })),
      isVip: isVip.value,
    }),
  )

  /** Clear the store and its persisted copy — the only full state wipe (§4.3). */
  function reset() {
    Object.assign(registration, createInitialState())
    clearPersisted()
  }

  // The one legitimate side-effect watch: mirror state to localStorage (§4.2).
  watch(registration, () => persist(registration), { deep: true })

  return {
    registration,
    ticket,
    isVip,
    hasMerch,
    selectedSessions,
    selectedWorkshops,
    selectedMeals,
    selectedMerch,
    pricing,
    reset,
  }
}

/**
 * Create the store and provide it to descendants. Called once by the layout.
 *
 * @returns {RegistrationStore}
 */
export function provideRegistration() {
  const store = createRegistrationStore()
  provide(RegistrationKey, store)
  return store
}

/**
 * Inject the shared store. Throws if no provider is mounted above, which turns
 * a wiring mistake into an immediate, clear error instead of silent undefined.
 *
 * @returns {RegistrationStore}
 */
export function useRegistration() {
  const store = inject(RegistrationKey)
  if (!store) {
    throw new Error('useRegistration() must be used within a component that has a WizardLayout ancestor')
  }
  return store
}
