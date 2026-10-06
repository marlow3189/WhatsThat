import { describe, expect, it } from 'vitest'
import { COMMISSION, canPublish, orderTotal, rentalUnits } from './pricing'

describe('plany', () => {
  it('za darmo do 3 aktywnych ogłoszeń, potem dostęp roczny', () => {
    expect(canPublish(2, 'free')).toBe(true)
    expect(canPublish(3, 'free')).toBe(false)
    expect(canPublish(250, 'annual')).toBe(true)
  })
  it('nie pobieramy prowizji', () => expect(COMMISSION).toBe(0))
})

describe('kwota zamówienia', () => {
  it('rolnik: cena za kg × ilość', () => {
    expect(orderTotal({ price: 450, unit: 'kg', kind: 'sell', qty: 2.5 })).toBe(1125)
  })
  it('wynajem liczony w jednostkach ogłoszenia', () => {
    expect(orderTotal({ price: 2500, unit: 'day', kind: 'rent', from: '2026-10-10', to: '2026-10-13' })).toBe(7500)
    expect(rentalUnits('2026-10-01', '2026-10-20', 'week')).toBe(3)
    expect(rentalUnits('2026-10-01', '2026-10-01', 'night')).toBe(1)
  })
  it('usługa i rzecz w jednej cenie', () => {
    expect(orderTotal({ price: 32_900_00, unit: 'fixed', kind: 'sell' })).toBe(32_900_00)
  })
})
