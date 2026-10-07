/**
 * Szacowany czas dotarcia bez zewnętrznego API: odległość w linii prostej × współczynnik krętości dróg,
 * podzielona przez typową prędkość. W produkcji: serwer tras (OSRM / openrouteservice / Google Routes),
 * a to zostaje jako szybkie przybliżenie, gdy sieci brak.
 */
export type Mode = 'walk' | 'bike' | 'car'

const DETOUR: Record<Mode, number> = { walk: 1.25, bike: 1.25, car: 1.35 }
/** Minuty „na start”: wyjście z domu, rower z piwnicy, parkowanie. */
const OVERHEAD: Record<Mode, number> = { walk: 0, bike: 1, car: 3 }

function speedKmh(mode: Mode, km: number): number {
  if (mode === 'walk') return 4.8
  if (mode === 'bike') return 15
  return km < 5 ? 25 : km < 30 ? 40 : 75
}

export function minutes(km: number, mode: Mode): number {
  const road = km * DETOUR[mode]
  return Math.max(1, Math.round((road / speedKmh(mode, road)) * 60 + OVERHEAD[mode]))
}

/** Najrozsądniejszy sposób: pieszo do 1,5 km, rowerem do 6 km, dalej autem. */
export function bestMode(km: number): Mode {
  return km <= 1.5 ? 'walk' : km <= 6 ? 'bike' : 'car'
}

/** „12 min” albo „1 h 20 min”. */
export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
