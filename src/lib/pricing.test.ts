import { describe, expect, it } from 'vitest'
import { COMMISSION, DAY, PRICES, afterPayment, canPublish, daysLeft, effectivePlan, isAvailable, listingsThisMonth, orderTotal, referralBonus, rentalUnits, renewalReminder } from './pricing'

const now = Date.UTC(2026, 9, 15, 12)

describe('plany', () => {
  it('darmowy: 3 nowe ogłoszenia w miesiącu kalendarzowym', () => {
    const mine = [{ createdAt: now - DAY }, { createdAt: now - 2 * DAY }, { createdAt: Date.UTC(2026, 8, 20) }]
    expect(listingsThisMonth(mine, now)).toBe(2)
    expect(canPublish('free', 2)).toBe(true)
    expect(canPublish('free', 3)).toBe(false)
    expect(canPublish('annual', 300)).toBe(true)
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
  it('bonus za polecenia tylko na płatnym planie', () => {
    expect(referralBonus({ plan: 'free' }, 3, now)).toBeUndefined()
    expect(referralBonus({ plan: 'annual', planUntil: now + 10 * DAY }, 2, now)).toBeUndefined()
    expect(referralBonus({ plan: 'annual', planUntil: now + 10 * DAY }, 3, now)).toBe(now + 100 * DAY)
  })
  it('ceny: 99 zł rok, 499 zł firma, odnowienie 1 zł', () => {
    expect(PRICES.PLN).toEqual({ annual: 9900, business: 49900, renewal: 100 })
    expect(PRICES.EUR.business).toBe(10000)
    expect(PRICES.USD.business).toBe(11900)
  })
  it('nie pobieramy prowizji', () => expect(COMMISSION).toBe(0))
})

describe('zamówienia', () => {
  it('rolnik: cena za kg × ilość', () => {
    expect(orderTotal({ price: 450, unit: 'kg', kind: 'sell', qty: 2.5 })).toBe(1125)
  })
  it('wysyłka doliczana do kwoty', () => {
    expect(orderTotal({ price: 26000, unit: 'fixed', kind: 'sell', shipping: 1599 })).toBe(27599)
  })
  it('wynajem liczony w jednostkach ogłoszenia', () => {
    expect(orderTotal({ price: 2500, unit: 'day', kind: 'rent', from: '2026-10-10', to: '2026-10-13' })).toBe(7500)
    expect(rentalUnits('2026-10-01', '2026-10-20', 'week')).toBe(3)
  })
  it('kto pierwszy zapłaci: rzecz pojedyncza się rezerwuje, zapas maleje', () => {
    expect(afterPayment({ status: 'active', unit: 'fixed' }, 1)).toEqual({ stock: undefined, status: 'reserved' })
    expect(afterPayment({ status: 'active', unit: 'item', stock: 12 }, 10)).toEqual({ stock: 2, status: 'active' })
    expect(afterPayment({ status: 'active', unit: 'kg', stock: 2 }, 2)).toEqual({ stock: 0, status: 'sold' })
    expect(isAvailable({ status: 'reserved' })).toBe(false)
    expect(isAvailable({ status: 'active', paused: true })).toBe(false)
    expect(isAvailable({ status: 'active', stock: 0 })).toBe(false)
  })
})
