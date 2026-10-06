import type { Account, Currency, Kind, Listing, Plan, Unit } from './types'

/**
 * Model „łącznika”: 0% prowizji, nie trzymamy cudzych pieniędzy.
 * Płatność idzie od kupującego prosto na konto sprzedającego u operatora płatności.
 * Zarabiamy tylko na planach. Kwoty w najmniejszej jednostce waluty (grosze, centy).
 */
export const COMMISSION = 0

/** Darmowy plan: 3 nowe ogłoszenia w miesiącu kalendarzowym. */
export const FREE_PER_MONTH = 3

/** Ceny brutto. Propozycja do zatwierdzenia; poza PLN zaokrąglone, nie przeliczane kursem. */
export const PRICES: Record<Currency, { annual: number; business: number; renewal: number }> = {
  PLN: { annual: 9900, business: 49900, renewal: 100 },
  EUR: { annual: 2400, business: 10000, renewal: 100 },
  USD: { annual: 2700, business: 11900, renewal: 100 },
  GBP: { annual: 2100, business: 8900, renewal: 100 },
  CZK: { annual: 59000, business: 249000, renewal: 2500 },
  HUF: { annual: 990000, business: 3990000, renewal: 39000 },
  UAH: { annual: 99000, business: 499000, renewal: 4500 },
}

export const YEAR = 365 * 86_400_000
export const DAY = 86_400_000

/** Plan obowiązuje do daty ważności; po niej konto wraca do darmowego. */
export function effectivePlan(account: Pick<Account, 'plan' | 'planUntil'>, now = Date.now()): Plan {
  if (account.plan === 'free') return 'free'
  return (account.planUntil ?? 0) > now ? account.plan : 'free'
}

export function startOfMonth(now = Date.now()): number {
  const d = new Date(now)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

/** Ile ogłoszeń dodano w bieżącym miesiącu kalendarzowym. */
export function listingsThisMonth(mine: Pick<Listing, 'createdAt'>[], now = Date.now()): number {
  const from = startOfMonth(now)
  return mine.filter((l) => l.createdAt >= from).length
}

export function canPublish(plan: Plan, addedThisMonth: number): boolean {
  return plan !== 'free' || addedThisMonth < FREE_PER_MONTH
}

/** Ile dni do końca planu; null dla darmowego. */
export function daysLeft(account: Pick<Account, 'plan' | 'planUntil'>, now = Date.now()): number | null {
  if (account.plan === 'free' || !account.planUntil) return null
  return Math.ceil((account.planUntil - now) / DAY)
}

/** Przypomnienia o końcu planu: 30, 7 i 1 dzień przed. */
export function renewalReminder(days: number | null): 30 | 7 | 1 | null {
  if (days === null || days < 0) return null
  if (days <= 1) return 1
  if (days <= 7) return 7
  if (days <= 30) return 30
  return null
}

/** Bonus za 3 polecenia: +3 miesiące, tylko na płatnym planie. */
export function referralBonus(account: Pick<Account, 'plan' | 'planUntil'>, invited: number, now = Date.now()): number | undefined {
  if (invited < 3 || effectivePlan(account, now) === 'free') return undefined
  return (account.planUntil ?? now) + 90 * DAY
}

export const UNITS_BY_KIND: Record<Kind, Unit[]> = {
  sell: ['item', 'kg', 'pack', 'litre', 'fixed'],
  rent: ['day', 'week', 'month', 'night', 'hour'],
  service: ['hour', 'fixed'],
  give: ['fixed'],
  swap: ['fixed'],
  garage: ['fixed'],
  wanted: ['fixed'],
}

/** Jednostki, w których kupujący wybiera ilość. */
export const COUNTABLE: Unit[] = ['item', 'kg', 'pack', 'litre']

export function rentalUnits(from: string, to: string, unit: Unit): number {
  const days = Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / DAY) || 1)
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
  shipping?: number
}

/** Kwota do zapłaty: cena sprzedającego (+ ewentualna wysyłka), bez naszych dopłat. */
export function orderTotal({ price, unit, kind, qty = 1, from, to, shipping = 0 }: TotalInput): number {
  const base = kind === 'rent' && from && to ? price * rentalUnits(from, to, unit) : COUNTABLE.includes(unit) ? Math.round(price * qty) : price
  return base + shipping
}

/**
 * Kto pierwszy zapłaci, ten ma: rzecz pojedyncza zostaje zarezerwowana,
 * przy towarze na wagę / sztuki zmniejsza się zapas.
 */
export function afterPayment(listing: Pick<Listing, 'stock' | 'status' | 'unit'>, qty: number): Pick<Listing, 'stock' | 'status'> {
  if (listing.stock !== undefined) {
    const stock = Math.max(0, +(listing.stock - qty).toFixed(2))
    return { stock, status: stock === 0 ? 'sold' : listing.status }
  }
  return { stock: undefined, status: 'reserved' }
}

export function isAvailable(listing: Pick<Listing, 'status' | 'paused' | 'stock'>): boolean {
  return listing.status === 'active' && !listing.paused && (listing.stock === undefined || listing.stock > 0)
}
