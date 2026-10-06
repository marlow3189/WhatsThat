import { describe, expect, it } from 'vitest'
import { CITIES, distanceKm, formatDistance, matchesLocation, nearestCity } from './geo'
import { relationTo, canSee } from './circles'
import type { User } from './types'

const waw = CITIES[0]
const krk = CITIES.find((c) => c.city === 'Kraków')!

describe('geo', () => {
  it('Warszawa–Kraków to ok. 252 km', () => {
    expect(distanceKm(waw, krk)).toBeGreaterThan(245)
    expect(distanceKm(waw, krk)).toBeLessThan(260)
  })
  it('filtruje po promieniu, mieście, województwie i kraju', () => {
    const piaseczno = CITIES.find((c) => c.city === 'Piaseczno')!
    expect(matchesLocation(waw, piaseczno, { scope: 'radius', radiusKm: 10 })).toBe(false)
    expect(matchesLocation(waw, piaseczno, { scope: 'radius', radiusKm: 20 })).toBe(true)
    expect(matchesLocation(waw, piaseczno, { scope: 'city', radiusKm: 0 })).toBe(false)
    expect(matchesLocation(waw, piaseczno, { scope: 'voivodeship', radiusKm: 0 })).toBe(true)
    expect(matchesLocation(waw, krk, { scope: 'country', radiusKm: 0 })).toBe(true)
  })
  it('formatuje odległości', () => {
    expect(formatDistance(0.04)).toBe('100 m')
    expect(formatDistance(2.345)).toBe('2,3 km')
    expect(formatDistance(42.6)).toBe('43 km')
  })
  it('przypisuje najbliższe miasto', () => {
    expect(nearestCity(50.07, 19.9).city).toBe('Kraków')
  })
})

describe('kręgi', () => {
  const u = (id: string, friends: string[]): User => ({
    id, name: id, hue: 0, place: waw, rating: 5, reviews: 0, verified: false, friends, plan: 'free',
  })
  const users = {
    me: u('me', ['a', 'b']),
    a: u('a', ['me', 'c']),
    b: u('b', ['me', 'c']),
    c: u('c', ['a', 'b']),
    d: u('d', []),
  }
  it('rozpoznaje znajomych, znajomych znajomych i obcych', () => {
    expect(relationTo('me', 'a', users).circle).toBe(1)
    expect(relationTo('me', 'c', users)).toEqual({ circle: 2, via: ['a', 'b'] })
    expect(relationTo('me', 'd', users).circle).toBe(3)
  })
  it('respektuje zasięg ogłoszenia', () => {
    expect(canSee(2, 1)).toBe(false)
    expect(canSee(2, 3)).toBe(true)
  })
})
