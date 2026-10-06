import { pl, type Key } from './pl'
import { en } from './en'
import { de } from './de'
import { uk } from './uk'
import type { Lang } from '../lib/types'
import { BRAND } from '../config'

export type { Key }

const DICTS = { pl, en, de, uk }

export const LANGS: { id: Lang; name: string; locale: string }[] = [
  { id: 'pl', name: 'Polski', locale: 'pl-PL' },
  { id: 'en', name: 'English', locale: 'en-GB' },
  { id: 'de', name: 'Deutsch', locale: 'de-DE' },
  { id: 'uk', name: 'Українська', locale: 'uk-UA' },
]

export type T = (key: Key, vars?: Record<string, string | number>) => string

export function translator(lang: Lang): T {
  const dict = DICTS[lang] ?? pl
  return (key, vars = {}) =>
    (dict[key] ?? pl[key] ?? key).replace(/\{(\w+)\}/g, (_, k: string) =>
      k === 'brand' ? BRAND.name : String(vars[k] ?? `{${k}}`),
    )
}

export const localeOf = (lang: Lang) => LANGS.find((l) => l.id === lang)?.locale ?? 'pl-PL'
