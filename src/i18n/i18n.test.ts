import { describe, expect, it } from 'vitest'
import { pl } from './pl'
import { LANGS, translator } from './index'
import { CATEGORIES, FARM_TEMPLATES } from '../lib/categories'

describe('tłumaczenia', () => {
  it('każdy język ma każdy klucz i te same zmienne', async () => {
    const keys = Object.keys(pl) as (keyof typeof pl)[]
    for (const { id } of LANGS) {
      const t = translator(id)
      for (const k of keys) {
        const out = t(k, { n: 1, name: 'A', title: 'B', amount: 'C', price: 'D', date: 'E', phone: 'F', km: 2, d: 'G', unit: 'H', what: 'I', app: 'J', id: 'K', names: 'L', url: 'M', link: 'N', country: 'O', status: 'P', used: 1, limit: 3, total: 9 })
        expect(out, `${id}:${k}`).not.toMatch(/\{\w+\}/)
        expect(out.length, `${id}:${k}`).toBeGreaterThan(0)
      }
    }
  })
  it('kategorie i produkty rolnika mają 9 języków', () => {
    for (const c of CATEGORIES) {
      for (const { id } of LANGS) {
        expect(c.label[id], `${c.id}:${id}`).toBeTruthy()
        for (const s of c.subs) expect(s.label[id], `${c.id}.${s.id}:${id}`).toBeTruthy()
      }
    }
    for (const f of FARM_TEMPLATES) for (const { id } of LANGS) expect(f.label[id]).toBeTruthy()
  })
})
