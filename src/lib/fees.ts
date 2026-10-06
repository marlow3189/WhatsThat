import type { Circle, Quote, QuoteLine } from './types'

/**
 * Cennik WhatsThat. Zasada: znajomi nie płacą nic, zarabiamy na transakcjach
 * z obcymi i na narzędziach dla tych, którzy wynajmują dużo.
 * Wszystkie kwoty w groszach.
 */
export const PRICING = {
  rentServiceFee: { 1: 0, 2: 0.05, 3: 0.1 } as Record<Circle, number>,
  rentMinFee: { 1: 0, 2: 100, 3: 200 } as Record<Circle, number>,
  protectionRate: 0.08,
  protectionMin: 300,
  /** część składki ochrony, która zostaje u nas (reszta idzie do ubezpieczyciela) */
  protectionPlatformShare: 0.4,
  saleProtectionRate: { 1: 0, 2: 0.02, 3: 0.04 } as Record<Circle, number>,
  saleProtectionFixed: { 1: 0, 2: 100, 3: 100 } as Record<Circle, number>,
  /** szacunek kosztu bramki (karty EOG): 1,5% + 1 zł */
  processingRate: 0.015,
  processingFixed: 100,
  boost7d: 499,
  bump: 199,
  plans: {
    free: { monthly: 0, marketListings: 5 },
    pro: { monthly: 1900, marketListings: Infinity },
    biznes: { monthly: 7900, marketListings: Infinity },
  },
} as const

const round = (n: number) => Math.round(n)

export function rentalDays(from: string, to: string): number {
  const ms = Date.parse(to) - Date.parse(from)
  if (!Number.isFinite(ms)) return 1
  return Math.max(1, Math.round(ms / 86_400_000))
}

function processing(total: number, inApp: boolean) {
  if (!inApp || total <= 0) return 0
  return round(total * PRICING.processingRate) + PRICING.processingFixed
}

function finish(lines: QuoteLine[], parts: {
  total: number
  ownerPayout: number
  platformRevenue: number
  depositHold: number
  inApp: boolean
}): Quote {
  const processingCost = processing(parts.total, parts.inApp)
  return { ...parts, lines, processingCost, platformNet: parts.platformRevenue - processingCost }
}

export interface RentalInput {
  pricePerDay: number
  days: number
  circle: Circle
  protection: boolean
  deposit?: number
}

/** Wynajem: właściciel dostaje 100% swojej ceny, opłatę serwisową płaci biorący. */
export function quoteRental({ pricePerDay, days, circle, protection, deposit = 0 }: RentalInput): Quote {
  const subtotal = pricePerDay * days
  const rate = PRICING.rentServiceFee[circle]
  const serviceFee = rate === 0 ? 0 : Math.max(round(subtotal * rate), PRICING.rentMinFee[circle])
  // W kręgu znajomych ochrona i kaucja są opcjonalne, rozliczenie może iść poza aplikacją.
  const protectionFee = protection
    ? Math.max(round(subtotal * PRICING.protectionRate), PRICING.protectionMin)
    : 0
  const inApp = circle > 1 || protection || deposit > 0
  const lines: QuoteLine[] = [
    { label: `${days} ${days === 1 ? 'dzień' : 'dni'} × cena dzienna`, amount: subtotal },
  ]
  if (circle === 1) lines.push({ label: 'Opłata serwisowa', amount: 0, hint: 'Znajomi: 0 zł' })
  else lines.push({ label: `Opłata serwisowa ${Math.round(rate * 100)}%`, amount: serviceFee })
  if (protection) lines.push({ label: 'Ochrona przed zniszczeniem', amount: protectionFee })
  return finish(lines, {
    total: subtotal + serviceFee + protectionFee,
    ownerPayout: subtotal,
    platformRevenue: serviceFee + round(protectionFee * PRICING.protectionPlatformShare),
    depositHold: deposit,
    inApp,
  })
}

export interface SaleInput {
  price: number
  circle: Circle
  /** bezpieczna płatność w aplikacji; gotówka przy odbiorze = 0 zł opłat */
  inApp: boolean
}

/** Sprzedaż: wystawienie darmowe, płatna jest tylko opcjonalna ochrona kupującego. */
export function quoteSale({ price, circle, inApp }: SaleInput): Quote {
  const fee =
    inApp && circle > 1
      ? round(price * PRICING.saleProtectionRate[circle]) + PRICING.saleProtectionFixed[circle]
      : 0
  const lines: QuoteLine[] = [{ label: 'Cena', amount: price }]
  if (inApp && circle > 1) lines.push({ label: 'Ochrona kupującego', amount: fee })
  else lines.push({ label: 'Opłaty', amount: 0, hint: inApp ? 'Znajomi: 0 zł' : 'Płatność przy odbiorze' })
  return finish(lines, { total: price + fee, ownerPayout: price, platformRevenue: fee, depositHold: 0, inApp })
}

/** Pożyczanie za darmo i wymiana: zero opłat, kaucja opcjonalna. */
export function quoteFree(deposit = 0): Quote {
  return finish([{ label: 'Opłaty', amount: 0, hint: 'Pożyczanie i wymiana są darmowe' }], {
    total: 0,
    ownerPayout: 0,
    platformRevenue: 0,
    depositHold: deposit,
    inApp: deposit > 0,
  })
}
