import { pl, type Key } from './pl'
import { en } from './en'
import { de } from './de'
import { uk } from './uk'
import { cs } from './cs'
import { sk } from './sk'
import { hu } from './hu'
import { it } from './it'
import { es } from './es'
import type { Lang } from '../lib/types'
import { BRAND } from '../config'

export type { Key }

const DICTS = { pl, en, de, uk, cs, sk, hu, it, es }

export const LANGS: { id: Lang; name: string; locale: string }[] = [
  { id: 'pl', name: 'Polski', locale: 'pl-PL' },
  { id: 'en', name: 'English', locale: 'en-GB' },
  { id: 'de', name: 'Deutsch', locale: 'de-DE' },
  { id: 'uk', name: 'Українська', locale: 'uk-UA' },
  { id: 'cs', name: 'Čeština', locale: 'cs-CZ' },
  { id: 'sk', name: 'Slovenčina', locale: 'sk-SK' },
  { id: 'hu', name: 'Magyar', locale: 'hu-HU' },
  { id: 'it', name: 'Italiano', locale: 'it-IT' },
  { id: 'es', name: 'Español', locale: 'es-ES' },
]

export type T = (key: Key, vars?: Record<string, string | number>) => string

export function translator(lang: Lang): T {
  const dict = DICTS[lang] ?? pl
  return (key, vars = {}) =>
    (dict[key] ?? pl[key] ?? key).replace(/\{(\w+)\}/g, (_, k: string) =>
      k === 'brand' ? BRAND.name : k === 'email' ? BRAND.email : String(vars[k] ?? `{${k}}`),
    )
}

export const localeOf = (lang: Lang) => LANGS.find((l) => l.id === lang)?.locale ?? 'pl-PL'
