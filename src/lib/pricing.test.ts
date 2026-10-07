import { describe, expect, it } from 'vitest'
import { COMMISSION, DAY, PRICES, afterPayment, canPublish, daysLeft, effectivePlan, isAvailable, isShown, listingsThisMonth, needsRefresh, orderTotal, handoverCode, rentalUnits, renewalReminder } from './pricing'

const now = Date.UTC(2026, 9, 15, 12)

describe('plany', () => {
  it('darmowy: 2 nowe ogłoszenia w miesiącu kalendarzowym', () => {
    const mine = [{ createdAt: now - DAY, category: 'tools' }, { createdAt: now - 2 * DAY, category: 'tools' }, { createdAt: Date.UTC(2026, 8, 20), category: 'tools' }]
    expect(listingsThisMonth(mine, now)).toBe(2)
    expect(canPublish('free', 1, now + DAY, now)).toBe(true)
    expect(canPublish('free', 2, now + DAY, now)).toBe(false)
    expect(canPublish('annual', 300, 0, now)).toBe(true)
  })
  it('po roku darmowe konto trzeba odświeżyć (10 zł), żeby dalej wystawiać', () => {
    expect(needsRefresh('free', now - DAY, now)).toBe(true)
    expect(needsRefresh('free', now + DAY, now)).toBe(false)
    expect(needsRefresh('annual', now - DAY, now)).toBe(false)
    expect(canPublish('free', 0, now - DAY, now)).toBe(false)
  })
  it('po wygaśnięciu planu konto wraca do darmowego', () => {
    expect(effectivePlan({ plan: 'annual', planUntil: now + DAY }, now)).toBe('annual')
    expect(effectivePlan({ plan: 'annual', planUntil: now - DAY }, now)).toBe('free')
  })
  it('przypomina 30, 7 i 1 dzień przed końcem', () => {
    expect(renewalReminder(daysLeft({ plan: 'annual', planUntil: now + 40 * DAY }, now))).toBe(null)
    expect(renewalReminder(daysLeft({ plan: 'annual', planUntil: now + 25 * DAY }, now))).toBe(30)
    expect(renewalReminder(daysLeft({ plan: 'business', planUntil: now + 5 * DAY }, now))).toBe(7)
    expect(renewalReminder(daysLeft({ plan: 'annual', planUntil: now + DAY / 2 }, now))).toBe(1)
  })
  it('ogłoszenia sąsiedzkie nie liczą się do limitu', () => {
    expect(listingsThisMonth([{ createdAt: now, category: 'community' }, { createdAt: now, category: 'tools' }], now)).toBe(1)
  })
  it('kod odbioru ma 4 cyfry', () => {
    expect(handoverCode(() => 0.0042)).toBe('0042')
    expect(handoverCode()).toMatch(/^\d{4}$/)
  })
  it('ceny: 99 zł rok, 499 zł firma, odświeżenie 10 zł', () => {
    expect(PRICES.PLN).toEqual({ annual: 9900, business: 49900, refresh: 1000 })
    expect(PRICES.EUR.business).toBe(10000)
    expect(PRICES.USD.business).toBe(11900)
  })
  it('nie pobieramy prowizji', () => expect(COMMISSION).toBe(0))
})

describe('zamówienia', () => {
  it('rolnik: cena za kg × ilość', () => {
    expect(orderTotal({ price: 450, unit: 'kg', kind: 'sell', qty: 2.5 })).toBe(1125)
    expect(orderTotal({ price: 12000, unit: 'tonne', kind: 'sell', qty: 3 })).toBe(36000)
  })
  it('wysyłka doliczana do kwoty', () => {
    expect(orderTotal({ price: 26000, unit: 'fixed', kind: 'sell', shipping: 1599 })).toBe(27599)
  })
  it('wynajem liczony w jednostkach ogłoszenia', () => {
    expect(orderTotal({ price: 2500, unit: 'day', kind: 'rent', from: '2026-10-10', to: '2026-10-13' })).toBe(7500)
    expect(rentalUnits('2026-10-01', '2026-10-20', 'week')).toBe(3)
  })
  it('kto pierwszy zapłaci: rzecz pojedyncza „Kupione”, przy wielu sztukach maleje zapas', () => {
    expect(afterPayment({ status: 'active', unit: 'fixed', kind: 'sell' }, 1, now)).toEqual({ stock: undefined, status: 'sold', soldAt: now })
    expect(afterPayment({ status: 'active', unit: 'day', kind: 'rent' }, 1, now)).toEqual({ stock: undefined, status: 'reserved' })
    expect(afterPayment({ status: 'active', unit: 'item', kind: 'sell', stock: 12 }, 10, now)).toEqual({ stock: 2, status: 'active' })
    expect(afterPayment({ status: 'active', unit: 'kg', kind: 'sell', stock: 2 }, 2, now)).toEqual({ stock: 0, status: 'sold', soldAt: now })
    expect(isShown({ status: 'sold', soldAt: now - DAY / 2 }, now)).toBe(true)
    expect(isShown({ status: 'sold', soldAt: now - 2 * DAY }, now)).toBe(false)
    expect(isAvailable({ status: 'reserved' })).toBe(false)
    expect(isAvailable({ status: 'active', paused: true })).toBe(false)
    expect(isAvailable({ status: 'active', stock: 0 })).toBe(false)
  })
})
