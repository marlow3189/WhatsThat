import { describe, expect, it } from 'vitest'
import { bestMode, formatMinutes, minutes } from './travel'
import { isOpen, maskPhone, ordinals } from './privacy'

describe('czas dotarcia', () => {
  it('pieszo, rowerem, autem', () => {
    expect(minutes(1, 'walk')).toBe(16) // 1,25 km po drogach / 4,8 km/h
    expect(minutes(3, 'bike')).toBe(16)
    expect(minutes(10, 'car')).toBe(23)
    expect(bestMode(0.8)).toBe('walk')
    expect(bestMode(4)).toBe('bike')
    expect(bestMode(20)).toBe('car')
    expect(formatMinutes(80)).toBe('1 h 20 min')
  })
})

describe('prywatność', () => {
  it('maskuje numer i nadaje stałe numery porządkowe', () => {
    expect(maskPhone('+48 601 234 567')).toBe('+48 60…')
    expect(maskPhone('')).toBe('')
    expect(ordinals(['zofia', 'ania', 'jan'])).toEqual({ ania: 1, jan: 2, zofia: 3 })
  })
  it('sprawdza godziny otwarcia', () => {
    const at = (h: number, m = 0) => new Date(2026, 9, 7, h, m)
    expect(isOpen('6:00–13:00', at(7))).toBe(true)
    expect(isOpen('6:00–13:00', at(13))).toBe(false)
    expect(isOpen('pon–sob 16:00–19:00', at(18, 30))).toBe(true)
    expect(isOpen('22:00–6:00', at(23))).toBe(true)
    expect(isOpen('kiedy chcesz', at(9))).toBeUndefined()
  })
})

import { missingInOrbit, orbitLevel, orbitScore } from './orbit'

describe('siła orbity', () => {
  it('rośnie z każdym znajomym i ofertą obok', () => {
    expect(orbitScore(0, 0, 0)).toBe(0)
    expect(orbitScore(4, 5, 10)).toBe(62)
    expect(orbitScore(20, 30, 50)).toBe(100)
    expect(orbitLevel(10)).toBe('start')
    expect(orbitLevel(62)).toBe('good')
  })
  it('podpowiada, kogo brakuje', () => {
    expect(missingInOrbit(['farm', 'tools', 'pets'], [{ category: 'farm' }, { category: 'tools' }])).toEqual(['pets'])
  })
})
