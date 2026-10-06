import type { Listing, Place, User } from './types'
import { TOWNS, distanceKm, town } from './geo'

/**
 * Dane demo leżą wokół Warszawy. Gdy ktoś wybierze inne miasto (np. Katowice), przesuwamy je razem z nim,
 * żeby „obok” znaczyło obok: te same odległości i kręgi, nazwy miejscowości z nowej okolicy.
 * Rzeczy daleko od Warszawy (Kraków, Gdańsk…) zostają na miejscu, bo pokazują wyszukiwanie w całym kraju.
 */
const ORIGIN = town('Warszawa')
const RADIUS_KM = 120

export function shiftPlace(p: Place, to: Place, polish: boolean): Place {
  if (distanceKm(p, ORIGIN) > RADIUS_KM) return p
  const lat = p.lat + (to.lat - ORIGIN.lat)
  const lng = p.lng + (to.lng - ORIGIN.lng)
  const near = polish ? TOWNS.map((t) => ({ t, d: distanceKm({ lat, lng }, t) })).sort((a, b) => a.d - b.d)[0] : undefined
  const named = near && near.d < 12 ? near.t : to
  return { lat, lng, town: named.town, voivodeship: named.voivodeship, country: to.country }
}

export function relocateDemo(users: Record<string, User>, listings: Listing[], to: Place, polish: boolean, skip: string): { users: Record<string, User>; listings: Listing[] } {
  if (distanceKm(to, ORIGIN) < 25) return { users, listings }
  return {
    users: Object.fromEntries(Object.entries(users).map(([id, u]) => [id, id === skip ? u : { ...u, place: shiftPlace(u.place, to, polish) }])),
    listings: listings.map((l) => ({ ...l, place: shiftPlace(l.place, to, polish) })),
  }
}
