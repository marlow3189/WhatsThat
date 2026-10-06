import type { Currency, Lang } from './types'

export interface Country {
  code: string
  currency: Currency
  lang: Lang
  /** prefiks telefonu */
  dial: string
  /** środek kraju, gdy nie znamy miejscowości */
  lat: number
  lng: number
}

/** Startujemy w Polsce; reszta gotowa na kolejne rynki. */
export const COUNTRIES: Country[] = [
  { code: 'PL', currency: 'PLN', lang: 'pl', dial: '+48', lat: 52.07, lng: 19.48 },
  { code: 'CZ', currency: 'CZK', lang: 'cs', dial: '+420', lat: 49.82, lng: 15.47 },
  { code: 'SK', currency: 'EUR', lang: 'sk', dial: '+421', lat: 48.67, lng: 19.7 },
  { code: 'HU', currency: 'HUF', lang: 'hu', dial: '+36', lat: 47.16, lng: 19.5 },
  { code: 'DE', currency: 'EUR', lang: 'de', dial: '+49', lat: 51.17, lng: 10.45 },
  { code: 'AT', currency: 'EUR', lang: 'de', dial: '+43', lat: 47.52, lng: 14.55 },
  { code: 'UA', currency: 'UAH', lang: 'uk', dial: '+380', lat: 48.38, lng: 31.17 },
  { code: 'IT', currency: 'EUR', lang: 'it', dial: '+39', lat: 41.87, lng: 12.57 },
  { code: 'ES', currency: 'EUR', lang: 'es', dial: '+34', lat: 40.46, lng: -3.75 },
  { code: 'GB', currency: 'GBP', lang: 'en', dial: '+44', lat: 54.0, lng: -2.0 },
  { code: 'US', currency: 'USD', lang: 'en', dial: '+1', lat: 39.8, lng: -98.6 },
]

export const countryByCode = (code: string) => COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0]

export function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}
