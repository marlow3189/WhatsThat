import { useEffect, useState } from 'react'
import type { Place } from './types'

/**
 * Oficjalne ostrzeżenia o zagrożeniach, zależnie od kraju. Pokazujemy je zawsze ze źródłem i linkiem,
 * aplikacja nie zastępuje Alertu RCB (SMS do wszystkich w zasięgu stacji) ani numeru 112.
 *
 * Źródła (sprawdzone październik 2026):
 * - PL: IMGW-PIB, publiczne API ostrzeżeń meteo (JSON, kody TERYT powiatów): danepubliczne.imgw.pl/api/data/warningsmeteo.
 *   RCB nie publikuje API; komunikaty RCB są na gov.pl/web/rcb, Alert RCB przychodzi SMS-em (cell broadcast).
 * - DE: NINA / BBK, warnung.bund.de/api31/dashboard/{ARS}.json (publiczne, ale nieoficjalne jako API, format może się zmienić).
 * - pozostałe kraje UE: Meteoalarm (EUMETNET), kanały Atom z CAP 1.2 na licencji CC BY 4.0.
 * W produkcji pobiera je funkcja serwerowa (cache 5 min, brak problemów z CORS), aplikacja czyta z niej.
 */
export interface Warning {
  id: string
  source: string
  title: string
  level: 1 | 2 | 3
  area: string
  until?: string
  text?: string
  url: string
  /** przykład w wersji demo (gdy brak sieci), wyraźnie oznaczony */
  demo?: boolean
}

export interface Provider {
  name: string
  url: string
  /** co to za kanał (dla użytkownika) */
  note: 'sms' | 'meteo' | 'civil'
}

export const PROVIDERS: Record<string, Provider[]> = {
  PL: [
    { name: 'Alert RCB', url: 'https://www.gov.pl/web/rcb', note: 'sms' },
    { name: 'IMGW-PIB', url: 'https://meteo.imgw.pl', note: 'meteo' },
  ],
  DE: [
    { name: 'NINA (BBK)', url: 'https://warnung.bund.de', note: 'civil' },
    { name: 'Meteoalarm', url: 'https://meteoalarm.org', note: 'meteo' },
  ],
  UA: [{ name: 'ДСНС України', url: 'https://dsns.gov.ua', note: 'civil' }],
}
export const providersFor = (country: string): Provider[] => PROVIDERS[country] ?? [{ name: 'Meteoalarm', url: 'https://meteoalarm.org', note: 'meteo' }]

/** Kody TERYT województw (dwie pierwsze cyfry kodu powiatu w ostrzeżeniach IMGW). */
export const TERYT: Record<string, string> = {
  dolnośląskie: '02', 'kujawsko-pomorskie': '04', lubelskie: '06', lubuskie: '08', łódzkie: '10', małopolskie: '12',
  mazowieckie: '14', opolskie: '16', podkarpackie: '18', podlaskie: '20', pomorskie: '22', śląskie: '24',
  świętokrzyskie: '26', 'warmińsko-mazurskie': '28', wielkopolskie: '30', zachodniopomorskie: '32',
}

interface ImgwRow {
  id?: string | number
  nazwa_zdarzenia?: string
  stopien?: string | number
  obowiazuje_do?: string
  tresc?: string
  teryt?: string[]
}

/** Ostrzeżenia IMGW dla województwa (po prefiksie TERYT), najwyższy stopień pierwszy. */
export function parseImgw(rows: unknown, voivodeship: string): Warning[] {
  const code = TERYT[voivodeship]
  if (!code || !Array.isArray(rows)) return []
  return (rows as ImgwRow[])
    .filter((r) => Array.isArray(r.teryt) && r.teryt.some((p) => String(p).startsWith(code)))
    .map((r, i) => ({
      id: `imgw-${r.id ?? i}`,
      source: 'IMGW-PIB',
      title: r.nazwa_zdarzenia ?? '—',
      level: Math.min(3, Math.max(1, Number(r.stopien) || 1)) as 1 | 2 | 3,
      area: voivodeship,
      until: r.obowiazuje_do,
      text: r.tresc,
      url: 'https://meteo.imgw.pl',
    }))
    .sort((a, b) => b.level - a.level)
}

/** Przykład pokazywany w wersji demo, gdy oficjalne źródło jest niedostępne (zawsze oznaczony „Przykład”). */
export function demoWarning(place: Place, country: string): Warning {
  const pl = country === 'PL'
  return {
    id: 'demo',
    source: pl ? 'IMGW-PIB' : 'Meteoalarm',
    title: pl ? 'Silny wiatr' : 'Wind',
    level: 1,
    area: place.voivodeship || place.town,
    until: new Date(Date.now() + 30 * 3_600_000).toISOString(),
    url: pl ? 'https://meteo.imgw.pl' : 'https://meteoalarm.org',
    demo: true,
  }
}

export function useWarnings(place: Place, country: string, on: boolean): Warning[] {
  const [items, setItems] = useState<Warning[]>([])
  useEffect(() => {
    if (!on) return setItems([])
    if (country !== 'PL') return setItems([demoWarning(place, country)])
    const ctrl = new AbortController()
    fetch('https://danepubliczne.imgw.pl/api/data/warningsmeteo', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((rows) => setItems(parseImgw(rows, place.voivodeship)))
      .catch(() => !ctrl.signal.aborted && setItems([demoWarning(place, country)]))
    return () => ctrl.abort()
  }, [place.voivodeship, place.town, country, on]) // eslint-disable-line react-hooks/exhaustive-deps
  return items
}
