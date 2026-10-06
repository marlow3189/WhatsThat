import type { Place } from './types'

export type Scope = 'radius' | 'town' | 'voivodeship' | 'country'

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
    case 'town':
      return me.town === item.town
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

/** Województwa ze stolicą jako punktem domyślnym, gdy ktoś nie poda miejscowości. */
export const VOIVODESHIPS: Place[] = [
  { voivodeship: 'dolnośląskie', town: 'Wrocław', lat: 51.1079, lng: 17.0385 },
  { voivodeship: 'kujawsko-pomorskie', town: 'Bydgoszcz', lat: 53.1235, lng: 18.0084 },
  { voivodeship: 'lubelskie', town: 'Lublin', lat: 51.2465, lng: 22.5684 },
  { voivodeship: 'lubuskie', town: 'Zielona Góra', lat: 51.9356, lng: 15.5062 },
  { voivodeship: 'łódzkie', town: 'Łódź', lat: 51.7592, lng: 19.456 },
  { voivodeship: 'małopolskie', town: 'Kraków', lat: 50.0647, lng: 19.945 },
  { voivodeship: 'mazowieckie', town: 'Warszawa', lat: 52.2297, lng: 21.0122 },
  { voivodeship: 'opolskie', town: 'Opole', lat: 50.6751, lng: 17.9213 },
  { voivodeship: 'podkarpackie', town: 'Rzeszów', lat: 50.0412, lng: 21.9991 },
  { voivodeship: 'podlaskie', town: 'Białystok', lat: 53.1325, lng: 23.1688 },
  { voivodeship: 'pomorskie', town: 'Gdańsk', lat: 54.352, lng: 18.6466 },
  { voivodeship: 'śląskie', town: 'Katowice', lat: 50.2649, lng: 19.0238 },
  { voivodeship: 'świętokrzyskie', town: 'Kielce', lat: 50.8661, lng: 20.6286 },
  { voivodeship: 'warmińsko-mazurskie', town: 'Olsztyn', lat: 53.7784, lng: 20.4801 },
  { voivodeship: 'wielkopolskie', town: 'Poznań', lat: 52.4064, lng: 16.9252 },
  { voivodeship: 'zachodniopomorskie', town: 'Szczecin', lat: 53.4285, lng: 14.5528 },
]

/** Mniejsze miejscowości używane w danych demo i podpowiedziach. */
export const TOWNS: Place[] = [
  ...VOIVODESHIPS,
  { voivodeship: 'mazowieckie', town: 'Piaseczno', lat: 52.0817, lng: 21.0239 },
  { voivodeship: 'mazowieckie', town: 'Tarczyn', lat: 51.9786, lng: 20.8336 },
  { voivodeship: 'mazowieckie', town: 'Pruszków', lat: 52.1708, lng: 20.8122 },
  { voivodeship: 'mazowieckie', town: 'Konstancin-Jeziorna', lat: 52.0939, lng: 21.1175 },
  { voivodeship: 'mazowieckie', town: 'Grójec', lat: 51.8653, lng: 20.8675 },
]

export const town = (name: string) => TOWNS.find((t) => t.town === name)!

/** Najbliższa znana miejscowość: wystarczy do etykiety, dokładne położenie zostaje w lat/lng. */
export function nearestTown(lat: number, lng: number): Place {
  let best = TOWNS[0]
  let bestD = Infinity
  for (const c of TOWNS) {
    const d = distanceKm({ lat, lng }, c)
    if (d < bestD) {
      best = c
      bestD = d
    }
  }
  return { ...best, lat, lng }
}
