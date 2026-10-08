import { describe, expect, it } from 'vitest'
import { addDays, agenda, dayKey, monthGrid } from './calendar'
import type { Listing, Order } from './types'

const label = { waste: (w: string) => `Wywóz: ${w}`, pickupOf: (t: string) => `Odbiór: ${t}`, returnOf: (t: string) => `Zwrot: ${t}`, planEnds: 'Koniec planu', wasteName: (f: string) => f }

describe('kalendarz', () => {
  it('liczy dni w lokalnej strefie i przez koniec miesiąca', () => {
    expect(dayKey(new Date(2026, 9, 8, 0, 30))).toBe('2026-10-08')
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('siatka miesiąca zaczyna się w poniedziałek', () => {
    const g = monthGrid('2026-10')
    expect(g[0]).toBe('2026-09-28')
    expect(g.length % 7).toBe(0)
    expect(g).toContain('2026-10-31')
  })
  it('zbiera własne terminy, „Będę”, wynajem i śmieci po kolei', () => {
    const listings = [
      { id: 'l1', title: 'Festyn', garageDate: '2026-10-12', going: ['me'] },
      { id: 'l2', title: 'Przyczepka', going: [] },
      { id: 'l3', title: 'Koncert', garageDate: '2026-10-11', going: ['ktos'] },
    ] as unknown as Listing[]
    const orders = [{ id: 'o1', listingId: 'l2', buyerId: 'me', sellerId: 'x', from: '2026-10-10', to: '2026-10-11', status: 'paid' }] as unknown as Order[]
    const a = agenda({ entries: [{ id: 'c1', title: 'Lekarz', date: '2026-10-10', time: '09:30', createdAt: 0 }], listings, orders, me: 'me', pickups: [{ date: '2026-10-09', fraction: 'paper' }, { date: '2026-10-09', fraction: 'plastic' }], label })
    expect(a.map((x) => x.title)).toEqual(['Wywóz: paper, plastic', 'Lekarz', 'Odbiór: Przyczepka', 'Zwrot: Przyczepka', 'Festyn'])
    expect(a.find((x) => x.title === 'Lekarz')?.entryId).toBe('c1')
  })
})
