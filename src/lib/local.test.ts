import { describe, expect, it } from 'vitest'
import { cheapest, demoStations, formatFuel, validPrice } from './fuel'
import { parseImgw, providersFor } from './warnings'
import { town } from './geo'

describe('paliwa', () => {
  it('odrzuca nierealne ceny i znajduje najtańszą stację', () => {
    expect(validPrice('pb95', 589)).toBe(true)
    expect(validPrice('pb95', 58)).toBe(false)
    expect(validPrice('lpg', 2.79 as unknown as number)).toBe(false)
    const st = demoStations(town('Katowice'), 0).map((s, i) => ({ ...s, km: i }))
    expect(cheapest(st, 'pb95')?.id).toBe('s4')
    expect(cheapest(st, 'lpg')?.id).toBe('s5')
    expect(formatFuel(589)).toBe('5,89 zł')
  })
})

describe('ostrzeżenia', () => {
  const rows = [
    { id: 1, nazwa_zdarzenia: 'Silny wiatr', stopien: '1', teryt: ['2469', '2470'], obowiazuje_do: '2026-10-08 18:00' },
    { id: 2, nazwa_zdarzenia: 'Intensywne opady deszczu', stopien: '2', teryt: ['2401'] },
    { id: 3, nazwa_zdarzenia: 'Mgła', stopien: '1', teryt: ['1465'] },
  ]
  it('IMGW: tylko powiaty z województwa, wyższy stopień pierwszy', () => {
    const w = parseImgw(rows, 'śląskie')
    expect(w.map((x) => x.title)).toEqual(['Intensywne opady deszczu', 'Silny wiatr'])
    expect(parseImgw(rows, 'mazowieckie').map((x) => x.title)).toEqual(['Mgła'])
    expect(parseImgw({ error: 1 }, 'śląskie')).toEqual([])
  })
  it('źródła zależą od kraju', () => {
    expect(providersFor('PL').map((p) => p.name)).toContain('Alert RCB')
    expect(providersFor('CZ')[0].name).toBe('Meteoalarm')
  })
})
