import type { CalendarEntry, Listing, Order } from './types'

/**
 * Prywatny kalendarz: Twoje terminy plus to, co aplikacja już wie (wydarzenia z „Będę”, odbiory i zwroty
 * z wynajmu, wywóz śmieci od gminy, koniec planu). Widzisz go tylko Ty; obce osoby nie wiedzą, gdzie i kiedy będziesz.
 */
export type AgendaSource = 'mine' | 'event' | 'order' | 'waste' | 'plan'

export interface AgendaItem {
  id: string
  date: string
  time?: string
  title: string
  source: AgendaSource
  link?: string
  /** tylko własne terminy da się usunąć z kalendarza */
  entryId?: string
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}/

/** Dzień RRRR-MM-DD w lokalnej strefie czasowej (nie UTC: o 0:30 w Polsce to już „dziś”). */
export function dayKey(d: Date | number): string {
  const x = typeof d === 'number' ? new Date(d) : d
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + n))
}

export interface AgendaInput {
  entries: CalendarEntry[]
  listings: Listing[]
  orders: Order[]
  me: string
  pickups?: { date: string; fraction: string }[]
  planUntil?: number
  /** podpisy w języku użytkownika */
  label: { waste: (what: string) => string; pickupOf: (title: string) => string; returnOf: (title: string) => string; planEnds: string; wasteName: (fraction: string) => string }
}

/** Wszystkie pozycje kalendarza, posortowane po dniu i godzinie. */
export function agenda(i: AgendaInput): AgendaItem[] {
  const out: AgendaItem[] = []
  for (const e of i.entries) out.push({ id: `c-${e.id}`, date: e.date, time: e.time, title: e.title, source: 'mine', entryId: e.id })
  for (const l of i.listings) {
    if (l.going?.includes(i.me) && l.garageDate && DAY_RE.test(l.garageDate)) out.push({ id: `e-${l.id}`, date: l.garageDate.slice(0, 10), title: l.title, source: 'event', link: `/l/${l.id}` })
  }
  const byId = new Map(i.listings.map((l) => [l.id, l]))
  for (const o of i.orders) {
    if (o.status === 'cancelled' || (o.buyerId !== i.me && o.sellerId !== i.me)) continue
    const title = byId.get(o.listingId)?.title ?? '…'
    if (o.from && DAY_RE.test(o.from)) out.push({ id: `of-${o.id}`, date: o.from.slice(0, 10), title: i.label.pickupOf(title), source: 'order', link: `/zamowienie/${o.id}` })
    if (o.to && DAY_RE.test(o.to)) out.push({ id: `ot-${o.id}`, date: o.to.slice(0, 10), title: i.label.returnOf(title), source: 'order', link: `/zamowienie/${o.id}` })
  }
  const waste = new Map<string, string[]>()
  for (const p of i.pickups ?? []) waste.set(p.date, [...(waste.get(p.date) ?? []), i.label.wasteName(p.fraction)])
  for (const [date, what] of waste) out.push({ id: `w-${date}`, date, title: i.label.waste(what.join(', ')), source: 'waste' })
  if (i.planUntil) out.push({ id: 'plan', date: dayKey(i.planUntil), title: i.label.planEnds, source: 'plan', link: '/ja' })
  return out.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '99').localeCompare(b.time ?? '99'))
}

/** Siatka miesiąca od poniedziałku: 5–6 tygodni po 7 dni (dni spoza miesiąca też, żeby siatka była pełna). */
export function monthGrid(month: string): string[] {
  const [y, m] = month.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const offset = (first.getDay() + 6) % 7
  const start = dayKey(new Date(y, m - 1, 1 - offset))
  const days = Array.from({ length: 42 }, (_, k) => addDays(start, k))
  return days[35].slice(0, 7) === month ? days : days.slice(0, 35)
}
