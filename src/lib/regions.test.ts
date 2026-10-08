import { describe, expect, it } from 'vitest'
import { COUNTRIES } from './countries'
import { REGIONS, REGION_KIND, nearestRegion, regionsOf } from './regions'

const COUNTS: Record<string, number> = {
  PL: 16,
  CZ: 14,
  SK: 8,
  HU: 20,
  DE: 16,
  AT: 9,
  UA: 27,
  IT: 20,
  ES: 19,
  GB: 12,
  US: 51,
  IN: 36,
}

/** Zgrubne granice kraju [minLat, maxLat, minLng, maxLng] (z wyspami, Alaską, Hawajami, Ceutą i Melillą). */
const BOXES: Record<string, [number, number, number, number]> = {
  PL: [49.0, 54.9, 14.1, 24.2],
  CZ: [48.5, 51.1, 12.0, 18.9],
  SK: [47.7, 49.7, 16.8, 22.6],
  HU: [45.7, 48.6, 16.1, 22.9],
  DE: [47.2, 55.1, 5.8, 15.1],
  AT: [46.3, 49.1, 9.5, 17.2],
  UA: [44.3, 52.4, 22.1, 40.3],
  IT: [35.4, 47.1, 6.6, 18.6],
  ES: [27.6, 43.8, -18.2, 4.4],
  GB: [49.9, 60.9, -8.2, 1.8],
  US: [18.9, 71.4, -179.2, -66.9],
  IN: [6.7, 35.7, 68.1, 97.4],
}

describe('regions', () => {
  it('każdy kraj ma listę regionów i rodzaj regionu', () => {
    for (const c of COUNTRIES) {
      expect(regionsOf(c.code).length, c.code).toBeGreaterThan(0)
      expect(REGION_KIND[c.code], c.code).toBeDefined()
    }
    expect(regionsOf('XX')).toEqual([])
  })

  it('ma właściwą liczbę regionów', () => {
    for (const [code, n] of Object.entries(COUNTS)) expect(REGIONS[code]?.length, code).toBe(n)
  })

  it('nie powtarza nazw regionów w kraju', () => {
    for (const [code, list] of Object.entries(REGIONS)) {
      const names = list.map((r) => r.region)
      expect(new Set(names).size, code).toBe(names.length)
    }
  })

  it('stolice leżą w granicach kraju', () => {
    for (const c of COUNTRIES) {
      const [minLat, maxLat, minLng, maxLng] = BOXES[c.code]
      for (const r of regionsOf(c.code)) {
        expect(r.lat, `${c.code} ${r.region}`).toBeGreaterThanOrEqual(minLat)
        expect(r.lat, `${c.code} ${r.region}`).toBeLessThanOrEqual(maxLat)
        expect(r.lng, `${c.code} ${r.region}`).toBeGreaterThanOrEqual(minLng)
        expect(r.lng, `${c.code} ${r.region}`).toBeLessThanOrEqual(maxLng)
      }
    }
  })

  it('wskazuje najbliższy region', () => {
    expect(nearestRegion('DE', 48.14, 11.58)?.region).toBe('Bayern')
    expect(nearestRegion('IN', 19.07, 72.88)?.region).toBe('Maharashtra')
    expect(nearestRegion('PL', 52.23, 21.01)?.region).toBe('mazowieckie')
    expect(nearestRegion('XX', 0, 0)).toBeNull()
  })
})
