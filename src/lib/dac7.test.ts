import { describe, expect, it } from 'vitest'
import { activityOf, buildReport, deadline, isApproaching, isReportable, isReportSeason, toCsv } from './dac7'
import { monthlyCosts, monthlyRevenue, sum } from './costs'

describe('DAC7', () => {
  it('klasyfikuje czynności', () => {
    expect(activityOf('sell', 'farm')).toBe('goods')
    expect(activityOf('sell', 'homes')).toBeNull()
    expect(activityOf('rent', 'homes', 'workers')).toBe('property')
    expect(activityOf('rent', 'cars', 'trailer')).toBe('transport')
    expect(activityOf('rent', 'cars', 'carcare')).toBeNull()
    expect(activityOf('rent', 'tools', 'power')).toBeNull()
    expect(activityOf('service', 'services', 'clean')).toBe('services')
    expect(activityOf('give', 'home')).toBeNull()
  })
  it('towary: wyłączenie tylko przy < 30 transakcjach i < 2 000 EUR', () => {
    expect(isReportable({ activity: 'goods', count: 29, totalPln: 800_000 })).toBe(false)
    expect(isReportable({ activity: 'goods', count: 30, totalPln: 10_000 })).toBe(true)
    expect(isReportable({ activity: 'goods', count: 1, totalPln: 3_290_000 })).toBe(true)
    expect(isReportable({ activity: 'property', count: 1, totalPln: 3_500 })).toBe(true)
    expect(isApproaching({ activity: 'goods', count: 26, totalPln: 50_000 })).toBe(true)
  })
  it('buduje raport i wskazuje brakujące dane', () => {
    const rows = buildReport(
      [
        { sellerId: 'a', activity: 'goods', count: 3, totalPln: 80_000 },
        { sellerId: 'b', activity: 'goods', count: 340, totalPln: 2_600_000 },
        { sellerId: 'b', activity: 'services', count: 2, totalPln: 20_000 },
      ],
      { b: { name: 'Józef', address: 'Tarczyn' } },
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ sellerId: 'b', activities: ['goods', 'services'], count: 342, missing: ['taxId', 'birthDate'] })
    expect(toCsv(rows, {}).split('\n')).toHaveLength(2)
  })
  it('termin 31 stycznia i sezon raportowy od grudnia', () => {
    expect(deadline(2026).toDateString()).toBe(new Date(2027, 0, 31).toDateString())
    expect(isReportSeason(2026, new Date(2026, 11, 5))).toBe(true)
    expect(isReportSeason(2026, new Date(2026, 9, 5))).toBe(false)
  })
})

describe('koszty', () => {
  it('przy 10 tys. aktywnych i 6% płacących przychód przewyższa koszty', () => {
    const input = { mau: 10_000, newUsers: 800, conversion: 0.06 }
    expect(sum(monthlyCosts(input))).toBeLessThan(1500)
    expect(monthlyRevenue(input)).toBeCloseTo(4950)
  })
})
