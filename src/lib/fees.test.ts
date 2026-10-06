import { describe, expect, it } from 'vitest'
import { quoteFree, quoteRental, quoteSale, rentalDays } from './fees'
import { zl } from './money'

describe('quoteRental', () => {
  it('znajomi płacą tylko cenę właściciela', () => {
    const q = quoteRental({ pricePerDay: zl(30), days: 3, circle: 1, protection: false })
    expect(q.total).toBe(zl(90))
    expect(q.platformRevenue).toBe(0)
    expect(q.inApp).toBe(false)
    expect(q.processingCost).toBe(0)
  })

  it('market: 10% opłaty serwisowej po stronie biorącego, właściciel dostaje 100%', () => {
    const q = quoteRental({ pricePerDay: zl(30), days: 3, circle: 3, protection: false, deposit: zl(300) })
    expect(q.total).toBe(zl(99))
    expect(q.ownerPayout).toBe(zl(90))
    expect(q.depositHold).toBe(zl(300))
    expect(q.processingCost).toBe(Math.round(zl(99) * 0.015) + 100)
  })

  it('stosuje minimalną opłatę dla tanich wynajmów', () => {
    expect(quoteRental({ pricePerDay: zl(5), days: 1, circle: 3, protection: false }).total).toBe(zl(7))
    expect(quoteRental({ pricePerDay: zl(5), days: 1, circle: 2, protection: false }).total).toBe(zl(6))
  })

  it('ochrona: 8% z minimum 3 zł, 40% zostaje na platformie', () => {
    const q = quoteRental({ pricePerDay: zl(100), days: 2, circle: 3, protection: true })
    expect(q.total).toBe(zl(200 + 20 + 16))
    expect(q.platformRevenue).toBe(zl(20) + Math.round(zl(16) * 0.4))
    const small = quoteRental({ pricePerDay: zl(10), days: 1, circle: 2, protection: true })
    expect(small.lines.find((l) => l.label.startsWith('Ochrona'))?.amount).toBe(zl(3))
  })
})

describe('quoteSale', () => {
  it('gotówka przy odbiorze jest darmowa', () => {
    expect(quoteSale({ price: zl(200), circle: 3, inApp: false }).total).toBe(zl(200))
  })
  it('bezpieczny zakup w markecie: 4% + 1 zł', () => {
    const q = quoteSale({ price: zl(200), circle: 3, inApp: true })
    expect(q.total).toBe(zl(209))
    expect(q.ownerPayout).toBe(zl(200))
  })
  it('znajomi nie płacą za bezpieczny zakup', () => {
    expect(quoteSale({ price: zl(200), circle: 1, inApp: true }).platformRevenue).toBe(0)
  })
})

describe('pozostałe', () => {
  it('pożyczanie i wymiana są darmowe', () => {
    expect(quoteFree(zl(100))).toMatchObject({ total: 0, depositHold: zl(100), inApp: true })
  })
  it('liczy dni wynajmu, minimum 1', () => {
    expect(rentalDays('2026-10-10', '2026-10-13')).toBe(3)
    expect(rentalDays('2026-10-10', '2026-10-10')).toBe(1)
  })
})
