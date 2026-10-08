import { useEffect, useMemo, useState } from 'react'
import { pl, type Dict, type Key } from './pl'
import type { Lang } from '../lib/types'
import { BRAND } from '../config'

export type { Key }

/**
 * Polski jest w paczce startowej, pozostałe języki doładowują się dopiero, gdy ktoś je wybierze
 * (szybszy start aplikacji w przeglądarce: każdy język to kilkadziesiąt kB).
 */
const DICTS: Partial<Record<Lang, Dict>> = { pl }
const LOADERS: Record<Exclude<Lang, 'pl'>, () => Promise<Dict>> = {
  en: () => import('./en').then((m) => m.en),
  de: () => import('./de').then((m) => m.de),
  uk: () => import('./uk').then((m) => m.uk),
  cs: () => import('./cs').then((m) => m.cs),
  sk: () => import('./sk').then((m) => m.sk),
  hu: () => import('./hu').then((m) => m.hu),
  it: () => import('./it').then((m) => m.it),
  es: () => import('./es').then((m) => m.es),
  hi: () => import('./hi').then((m) => m.hi),
}

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
  { id: 'hi', name: 'हिन्दी', locale: 'hi-IN' },
]

export type T = (key: Key, vars?: Record<string, string | number>) => string

export async function loadLang(lang: Lang): Promise<void> {
  if (DICTS[lang] || lang === 'pl') return
  const load = LOADERS[lang]
  if (load) DICTS[lang] = await load()
}

/** Tłumacz dla języka; dopóki język się wczytuje, brakujące teksty bierze z polskiego. */
export function translator(lang: Lang): T {
  const dict = DICTS[lang] ?? pl
  return (key, vars = {}) =>
    (dict[key] ?? pl[key] ?? key).replace(/\{(\w+)\}/g, (_, k: string) =>
      k === 'brand' ? BRAND.name : k === 'email' ? BRAND.email : String(vars[k] ?? `{${k}}`),
    )
}

/** Tłumacz w komponencie: po wyborze języka doładowuje go i odświeża ekran. */
export function useTranslator(lang: Lang): T {
  // Licznik zamiast true/false: dwie szybkie zmiany stanu nie mogą się „zlać” w brak zmiany.
  const [loads, setLoads] = useState(0)
  useEffect(() => {
    if (DICTS[lang]) return
    let live = true
    loadLang(lang).then(() => live && setLoads((n) => n + 1))
    return () => {
      live = false
    }
  }, [lang])
  const ready = !!DICTS[lang]
  return useMemo(() => translator(lang), [lang, loads, ready]) // eslint-disable-line react-hooks/exhaustive-deps
}

export const localeOf = (lang: Lang) => LANGS.find((l) => l.id === lang)?.locale ?? 'pl-PL'
