import { describe, expect, it } from 'vitest'
import { anonKey, e164, formatKey, identicon, isAnonKey } from './identity'
import { hashContacts, normalize, sha256 } from './contacts'
import { osOf, routeFromLink } from './platform'

describe('anonimowy klucz', () => {
  it('ma format anonym + kraj + płeć + 10 cyfr', () => {
    const k = anonKey('PL', 'm', '+48 693 487 111')
    expect(isAnonKey(k)).toBe(true)
    expect(k.startsWith('anonymplm')).toBe(true)
    expect(formatKey(k)).toMatch(/^anonym·pl·m·\d{4} \d{3} \d{3}$/)
  })
  it('jest stały dla numeru i nie zawiera numeru', () => {
    const a = anonKey('PL', 'w', '+48 693 487 111')
    expect(anonKey('PL', 'w', '0048693487111')).toBe(a)
    expect(a).not.toContain('693487111')
    expect(a).not.toContain('48693')
  })
  it('różne numery i inny sekret dają różne klucze', () => {
    const keys = new Set(Array.from({ length: 2000 }, (_, i) => anonKey('PL', 'x', `+48 600 ${String(i).padStart(6, '0')}`)))
    expect(keys.size).toBe(2000)
    expect(anonKey('PL', 'x', '+48600100200', 's1')).not.toBe(anonKey('PL', 'x', '+48600100200', 's2'))
  })
  it('awatar z klucza jest symetryczny i stały', () => {
    const { cells, hue } = identicon('anonymplm4829175530')
    expect(cells).toHaveLength(25)
    for (let r = 0; r < 5; r++) expect(cells[r * 5]).toBe(cells[r * 5 + 4])
    expect(identicon('anonymplm4829175530').hue).toBe(hue)
  })
  it('numery do E.164', () => {
    expect(e164('+48 600 100 200')).toBe('+48600100200')
    expect(e164('0048 600-100-200')).toBe('+48600100200')
    expect(normalize('600 100 200', '+48')).toBe('+48600100200')
  })
})

describe('kontakty: tylko skróty numerów', () => {
  it('SHA-256 bez imion, bez duplikatów', async () => {
    expect(await sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    const hashes = await hashContacts([{ name: 'Kasia', tel: ['600 100 200', '+48600100200'] }, { name: 'Marek', tel: ['601 200 300'] }])
    expect(hashes).toHaveLength(2)
    expect(hashes.every((h) => /^[0-9a-f]{64}$/.test(h))).toBe(true)
  })
})

describe('linki do aplikacji', () => {
  it('zamienia adresy strony na ekrany', () => {
    expect(routeFromLink('https://regioorbit.com/l/l12')).toBe('/l/l12')
    expect(routeFromLink('https://regioorbit.com/u/kasia/')).toBe('/u/kasia')
    expect(routeFromLink('https://regioorbit.com/z/me')).toBe('/znajomi')
    expect(routeFromLink('https://regioorbit.com/sos')).toBe('/sos')
    expect(routeFromLink('https://regioorbit.com/app/#/czat/c1')).toBe('/czat/c1')
    expect(routeFromLink('https://regioorbit.com/')).toBe('/')
    expect(routeFromLink('https://regioorbit.com/l/../../etc')).toBeNull()
  })
  it('rozpoznaje telefon', () => {
    expect(osOf('Mozilla/5.0 (Linux; Android 15; Pixel 9)')).toBe('android')
    expect(osOf('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('ios')
    expect(osOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', true)).toBe('ios')
    expect(osOf('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('desktop')
  })
})
