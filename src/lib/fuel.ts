import type { Place } from './types'

/**
 * Ceny paliw na stacjach w okolicy. Źródła (od najlepszego): stacja przez API (`supabase/functions/fuel-prices`),
 * zgłoszenie użytkownika (zdjęcie pylonu), cena orientacyjna. Każda cena ma źródło i godzinę, żeby nikt
 * nie pomylił orientacyjnej z aktualną. Kwoty w groszach za litr.
 */
export type Fuel = 'pb95' | 'on' | 'lpg'
export const FUELS: Fuel[] = ['pb95', 'on', 'lpg']
export type PriceSource = 'station' | 'users' | 'estimate'

export interface Station {
  id: string
  name: string
  place: Place
  prices: Partial<Record<Fuel, number>>
  updatedAt: number
  source: PriceSource
}

/** Rozsądny zakres ceny za litr (zł): chroni przed literówkami i fałszywymi zgłoszeniami. */
const RANGE: Record<Fuel, [number, number]> = { pb95: [300, 1500], on: [300, 1500], lpg: [100, 800] }
export const validPrice = (fuel: Fuel, grosze: number) => Number.isInteger(grosze) && grosze >= RANGE[fuel][0] && grosze <= RANGE[fuel][1]

/** Stacje demo rozstawione wokół miejsca użytkownika; ceny orientacyjne, oznaczone jako takie. */
export function demoStations(center: Place, now = Date.now()): Station[] {
  const at = (dLat: number, dLng: number): Place => ({ ...center, lat: center.lat + dLat, lng: center.lng + dLng })
  const h = 3_600_000
  return [
    { id: 's1', name: 'Stacja przy obwodnicy', place: at(0.012, 0.018), prices: { pb95: 589, on: 599, lpg: 279 }, updatedAt: now - 2 * h, source: 'station' },
    { id: 's2', name: 'Stacja Północ', place: at(0.028, -0.006), prices: { pb95: 599, on: 609, lpg: 285 }, updatedAt: now - 5 * h, source: 'users' },
    { id: 's3', name: 'Stacja Centrum (samoobsługowa)', place: at(-0.006, 0.004), prices: { pb95: 609, on: 619 }, updatedAt: now - 26 * h, source: 'estimate' },
    { id: 's4', name: 'Stacja przy markecie', place: at(-0.021, -0.017), prices: { pb95: 579, on: 595, lpg: 275 }, updatedAt: now - 1 * h, source: 'station' },
    { id: 's5', name: 'Stacja LPG Południe', place: at(-0.04, 0.03), prices: { lpg: 269 }, updatedAt: now - 8 * h, source: 'users' },
  ]
}

/** Najtańsza stacja dla danego paliwa (przy równej cenie: bliższa). */
export function cheapest<T extends Station & { km: number }>(stations: T[], fuel: Fuel): T | undefined {
  return stations.filter((s) => s.prices[fuel] !== undefined).sort((a, b) => a.prices[fuel]! - b.prices[fuel]! || a.km - b.km)[0]
}

/** „5,89 zł” */
export const formatFuel = (grosze: number) => `${(grosze / 100).toFixed(2).replace('.', ',')} zł`
