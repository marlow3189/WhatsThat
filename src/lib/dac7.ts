import type { Kind } from './types'

/**
 * DAC7: operator platformy raportuje sprzedawców do Szefa KAS (w Polsce: informacja DPI-IS w XML)
 * do 31 stycznia za poprzedni rok i w tym samym terminie przekazuje sprzedawcy jego dane.
 * Czynności objęte raportem: sprzedaż towarów, najem nieruchomości, najem środków transportu,
 * usługi osobiste. Wynajem zwykłych rzeczy (wiertarka, namiot) nie jest objęty.
 */
export type Dac7Activity = 'goods' | 'property' | 'transport' | 'services'

/** Kurs do przeliczenia progu 2 000 EUR. Do aktualizacji raz w roku. */
export const EUR_PLN = 4.25

const TRANSPORT_SUBS = ['car', 'moto', 'van', 'trailer']

export function activityOf(kind: Kind, category: string, sub?: string): Dac7Activity | null {
  if (kind === 'sell') return category === 'homes' ? null : 'goods' // sprzedaż nieruchomości nie jest objęta
  if (kind === 'rent' && category === 'homes') return 'property'
  if (kind === 'rent' && category === 'cars' && sub && TRANSPORT_SUBS.includes(sub)) return 'transport'
  if (kind === 'service') return 'services'
  return null
}

export interface SaleAggregate {
  sellerId: string
  activity: Dac7Activity
  count: number
  /** grosze */
  totalPln: number
}

export interface SellerData {
  name?: string
  address?: string
  taxId?: string
  birthDate?: string
  iban?: string
}

export const REQUIRED: (keyof SellerData)[] = ['name', 'address', 'taxId', 'birthDate']

/** Sprzedaż towarów jest wyłączona tylko przy < 30 transakcjach I < 2 000 EUR. Inne czynności: zawsze. */
export function isReportable(a: Pick<SaleAggregate, 'activity' | 'count' | 'totalPln'>): boolean {
  if (a.count === 0) return false
  if (a.activity !== 'goods') return true
  return a.count >= 30 || a.totalPln / 100 / EUR_PLN >= 2000
}

/** Wcześniej prosimy o dane: od 25 transakcji albo 1 500 EUR. */
export function isApproaching(a: Pick<SaleAggregate, 'activity' | 'count' | 'totalPln'>): boolean {
  if (isReportable(a)) return false
  return a.count >= 25 || a.totalPln / 100 / EUR_PLN >= 1500
}

export interface Dac7Row {
  sellerId: string
  activities: Dac7Activity[]
  count: number
  totalPln: number
  missing: (keyof SellerData)[]
}

export function buildReport(aggs: SaleAggregate[], data: Record<string, SellerData>): Dac7Row[] {
  const bySeller = new Map<string, Dac7Row>()
  for (const a of aggs.filter(isReportable)) {
    const row = bySeller.get(a.sellerId) ?? { sellerId: a.sellerId, activities: [], count: 0, totalPln: 0, missing: [] }
    row.activities.push(a.activity)
    row.count += a.count
    row.totalPln += a.totalPln
    bySeller.set(a.sellerId, row)
  }
  return [...bySeller.values()].map((r) => ({ ...r, missing: REQUIRED.filter((k) => !data[r.sellerId]?.[k]) }))
}

/** Termin: 31 stycznia roku następnego. */
export function deadline(year: number): Date {
  return new Date(year + 1, 0, 31)
}

/** Od 1 grudnia do terminu panel podpowiada przygotowanie raportu. */
export function isReportSeason(year: number, now = new Date()): boolean {
  return now >= new Date(year, 11, 1) && now <= deadline(year)
}

/** Plik roboczy do sprawdzenia; do KAS idzie XML według schematu DPI-IS z serwisu Ministerstwa Finansów. */
export function toCsv(rows: Dac7Row[], data: Record<string, SellerData>): string {
  const head = 'seller_id;name;address;tax_id;birth_date;activities;transactions;total_pln'
  const lines = rows.map((r) => {
    const d = data[r.sellerId] ?? {}
    return [r.sellerId, d.name, d.address, d.taxId, d.birthDate, r.activities.join('+'), r.count, (r.totalPln / 100).toFixed(2)]
      .map((v) => String(v ?? ''))
      .join(';')
  })
  return [head, ...lines].join('\n')
}
