import type { Place } from './types'

export type Scope = 'radius' | 'city' | 'voivodeship' | 'country'

export interface LocationFilter {
  scope: Scope
  radiusKm: number
}

const R = 6371

/** Odległość po łuku wielkiego koła (haversine), w km. */
export function distanceKm(a: Pick<Place, 'lat' | 'lng'>, b: Pick<Place, 'lat' | 'lng'>): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function matchesLocation(me: Place, item: Place, filter: LocationFilter): boolean {
  switch (filter.scope) {
    case 'radius':
      return distanceKm(me, item) <= filter.radiusKm
    case 'city':
      return me.city === item.city
    case 'voivodeship':
      return me.voivodeship === item.voivodeship
    case 'country':
      return true
  }
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(100, Math.round((km * 1000) / 100) * 100)} m`
  if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`
  return `${Math.round(km)} km`
}

export const CITIES: Place[] = [
  { city: 'Warszawa', voivodeship: 'mazowieckie', lat: 52.2297, lng: 21.0122 },
  { city: 'Piaseczno', voivodeship: 'mazowieckie', lat: 52.0817, lng: 21.0239 },
  { city: 'Pruszków', voivodeship: 'mazowieckie', lat: 52.1708, lng: 20.8122 },
  { city: 'Kraków', voivodeship: 'małopolskie', lat: 50.0647, lng: 19.945 },
  { city: 'Wrocław', voivodeship: 'dolnośląskie', lat: 51.1079, lng: 17.0385 },
  { city: 'Poznań', voivodeship: 'wielkopolskie', lat: 52.4064, lng: 16.9252 },
  { city: 'Gdańsk', voivodeship: 'pomorskie', lat: 54.352, lng: 18.6466 },
  { city: 'Łódź', voivodeship: 'łódzkie', lat: 51.7592, lng: 19.456 },
  { city: 'Lublin', voivodeship: 'lubelskie', lat: 51.2465, lng: 22.5684 },
]

/** Najbliższe znane miasto — wystarczy do etykiety, dokładne położenie zostaje w lat/lng. */
export function nearestCity(lat: number, lng: number): Place {
  let best = CITIES[0]
  let bestD = Infinity
  for (const c of CITIES) {
    const d = distanceKm({ lat, lng }, c)
    if (d < bestD) {
      best = c
      bestD = d
    }
  }
  return { ...best, lat, lng }
}
