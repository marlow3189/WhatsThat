import type { Kind, Plan, Unit } from './types'

/**
 * Model „łącznika”: nie pobieramy prowizji i nie trzymamy cudzych pieniędzy.
 * Płatność idzie od kupującego prosto na konto sprzedającego u operatora płatności.
 * Zarabiamy na rocznym dostępie dla tych, którzy wystawiają więcej.
 */
export const PLANS = {
  free: { activeListings: 3, yearly: 0 },
  annual: { activeListings: Infinity, yearly: 7900 },
} as const

export const COMMISSION = 0

export function canPublish(activeListings: number, plan: Plan): boolean {
  return activeListings < PLANS[plan].activeListings
}

export const UNITS_BY_KIND: Record<Kind, Unit[]> = {
  sell: ['item', 'kg', 'pack', 'fixed'],
  rent: ['day', 'week', 'month', 'night', 'hour'],
  service: ['hour', 'fixed'],
  give: ['fixed'],
  swap: ['fixed'],
  garage: ['fixed'],
}

/** Jednostki, w których kupujący wybiera ilość. */
export const COUNTABLE: Unit[] = ['item', 'kg', 'pack']

export function rentalUnits(from: string, to: string, unit: Unit): number {
  const days = Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) || 1)
  if (unit === 'week') return Math.ceil(days / 7)
  if (unit === 'month') return Math.ceil(days / 30)
  return days
}

export interface TotalInput {
  price: number
  unit: Unit
  kind: Kind
  qty?: number
  from?: string
  to?: string
}

/** Kwota do zapłaty: cena sprzedającego, bez naszych dopłat. */
export function orderTotal({ price, unit, kind, qty = 1, from, to }: TotalInput): number {
  if (kind === 'rent' && from && to) return price * rentalUnits(from, to, unit)
  if (COUNTABLE.includes(unit)) return Math.round(price * qty)
  return price
}
