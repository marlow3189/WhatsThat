import { describe, expect, it } from 'vitest'
import { e164phone, fromRow, parsePoint, point, toRow } from './live'
import type { Place } from './types'

const here: Place = { lat: 52.23, lng: 21.01, town: 'Warszawa', voivodeship: 'mazowieckie', country: 'PL' }

describe('tryb na żywo: zamiana danych', () => {
  it('punkt dla PostGIS i numer do SMS', () => {
    expect(point({ lat: 52.2297, lng: 21.0122 })).toBe('SRID=4326;POINT(21.012200 52.229700)')
    expect(e164phone('+48 600-100 200')).toBe('+48600100200')
  })
  it('czyta punkt z EWKB i z GeoJSON', () => {
    // SRID=4326;POINT(21.0122 52.2297) zapisany przez PostGIS jako EWKB (little endian)
    const buf = new DataView(new ArrayBuffer(25))
    buf.setUint8(0, 1)
    buf.setUint32(1, 0x20000001, true)
    buf.setUint32(5, 4326, true)
    buf.setFloat64(9, 21.0122, true)
    buf.setFloat64(17, 52.2297, true)
    const hex = [...new Uint8Array(buf.buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
    expect(hex.startsWith('0101000020e6100000')).toBe(true)
    expect(parsePoint(hex)).toEqual([21.0122, 52.2297])
    expect(parsePoint({ type: 'Point', coordinates: [19.94, 50.06] })).toEqual([19.94, 50.06])
    expect(parsePoint('xyz')).toBeNull()
  })
  it('ogłoszenie tam i z powrotem', () => {
    const row = toRow({ kind: 'sell', category: 'tools', title: 'Wiertarka', description: '', price: 12000, currency: 'PLN', unit: 'fixed', delivery: ['pickup'], place: here, visibility: 3 }, 'u1')
    expect(row.location).toBe('SRID=4326;POINT(21.010000 52.230000)')
    const back = fromRow({ ...row, id: 'x1', created_at: '2026-10-08T10:00:00Z', location: { coordinates: [21.01, 52.23] } }, 'u1', here)
    expect(back).toMatchObject({ id: 'db-x1', ownerId: 'me', title: 'Wiertarka', price: 12000, place: { lat: 52.23, lng: 21.01 } })
    expect(fromRow({ ...row, id: 'x2', owner_id: undefined }, 'u1', here).ownerId).toBe('db-hidden')
  })
})
