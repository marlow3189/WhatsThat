import type { Currency } from './types'

/** Kwoty trzymamy w najmniejszej jednostce (grosze, centy), żeby nie gubić groszy na floatach. */
export const zl = (value: number) => Math.round(value * 100)

const cache = new Map<string, Intl.NumberFormat>()

/** 32 900 zł, 4,50 zł, 24 €: grosze tylko wtedy, gdy są. */
export function formatMoney(minor: number, currency: Currency = 'PLN', locale = 'pl-PL'): string {
  const fraction = minor % 100 === 0 ? 0 : 2
  const key = `${locale}|${currency}|${fraction}`
  let f = cache.get(key)
  if (!f) {
    f = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: fraction, maximumFractionDigits: fraction })
    cache.set(key, f)
  }
  return f.format(minor / 100).replace(/ /g, ' ')
}

export const formatPLN = (grosze: number) => formatMoney(grosze, 'PLN')
