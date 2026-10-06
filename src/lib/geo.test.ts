import { describe, expect, it } from 'vitest'
import { distanceKm, formatDistance, matchesLocation, nearestTown, town } from './geo'
import { canSee, relationTo } from './circles'
import type { User } from './types'

const waw = town('Warszawa')
const krk = town('Kraków')

describe('geo', () => {
  it('Warszawa–Kraków to ok. 252 km', () => {
    expect(distanceKm(waw, krk)).toBeGreaterThan(245)
    expect(distanceKm(waw, krk)).toBeLessThan(260)
  })
  it('filtruje po promieniu, miejscowości, województwie i kraju', () => {
    const piaseczno = town('Piaseczno')
    expect(matchesLocation(waw, piaseczno, { scope: 'radius', radiusKm: 10 })).toBe(false)
    expect(matchesLocation(waw, piaseczno, { scope: 'radius', radiusKm: 20 })).toBe(true)
    expect(matchesLocation(waw, piaseczno, { scope: 'town', radiusKm: 0 })).toBe(false)
    expect(matchesLocation(waw, piaseczno, { scope: 'voivodeship', radiusKm: 0 })).toBe(true)
    expect(matchesLocation(waw, krk, { scope: 'country', radiusKm: 0 })).toBe(true)
  })
  it('formatuje odległości', () => {
    expect(formatDistance(0.04)).toBe('100 m')
    expect(formatDistance(2.345)).toBe('2,3 km')
    expect(formatDistance(42.6)).toBe('43 km')
  })
  it('przypisuje najbliższą miejscowość', () => {
    expect(nearestTown(50.07, 19.9).town).toBe('Kraków')
    expect(nearestTown(51.98, 20.84).town).toBe('Tarczyn')
  })
})

describe('kręgi', () => {
  const u = (id: string, friends: string[]): User => ({ id, name: id, phoneTail: '00', hue: 0, place: waw, friends, since: 0 })
  const users = { me: u('me', ['a', 'b']), a: u('a', ['me', 'c']), b: u('b', ['me', 'c']), c: u('c', ['a', 'b']), d: u('d', []) }
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
