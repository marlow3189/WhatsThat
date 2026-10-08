import { describe, expect, it } from 'vitest'
import { RECIPES, findRecipe, matches, normalize, plan, searchByCircle, stems, type Hit } from './planner'
import type { Listing } from './types'

const l = (id: string, title: string, description = ''): Listing =>
  ({ id, title, description, ownerId: 'x', kind: 'sell', category: 'other', unit: 'fixed', delivery: ['pickup'], place: { lat: 0, lng: 0, town: '', voivodeship: '' }, visibility: 3, status: 'active', createdAt: 0 }) as Listing
const hit = (listing: Listing, circle: 1 | 2 | 3, km = 1): Hit => ({ listing, rel: { circle, via: [] }, km })

describe('planer', () => {
  it('rozpoznaje cel w różnych językach', () => {
    expect(findRecipe('chcę wybrukować podjazd')?.id).toBe('paving')
    expect(findRecipe('Einfahrt pflastern')?.id).toBe('paving')
    expect(findRecipe('przeprowadzka w sobotę')?.id).toBe('moving')
    expect(findRecipe('skosić trawnik')?.id).toBe('garden')
    expect(findRecipe('jajka')).toBeUndefined()
    expect(findRecipe('tani opał na zimę')?.id).toBe('heating')
    expect(findRecipe('pellet')?.id).toBe('heating')
    for (const r of RECIPES) for (const goal of Object.values(r.goal)) expect(findRecipe(goal)?.id, goal).toBe(r.id)
  })
  it('normalizuje polskie znaki i odmianę', () => {
    expect(normalize('Zagęszczarka ŁADNA')).toBe('zageszczarka ladna')
    expect(stems('jajka')).toEqual(['jajk'])
    expect(matches(l('a', 'Piasek płukany'), stems('piasku'), 3)).toBe(true)
    expect(matches(l('b', 'Odbiór w Piasecznie'), stems('piasek'), 3)).toBe(false)
  })
  it('pod każdy krok daje oferty, znajomi najpierw', () => {
    const pool = [
      hit(l('1', 'Piasek płukany 0–2 mm'), 3, 5),
      hit(l('2', 'Zagęszczarka gruntowa 90 kg'), 1, 8),
      hit(l('3', 'Kostka brukowa Holland'), 3, 5),
      hit(l('4', 'Piasek do piaskownicy'), 1, 2),
    ]
    pool.push(hit(l('5', 'Gilotyna do kostki brukowej'), 3), hit(l('6', 'Ubijak', 'Do podbudowy pod kostkę'), 1))
    const steps = plan(findRecipe('kostka na podjazd')!, pool)
    expect(steps[0].hits.map((h) => h.listing.id)).toEqual(['4', '1'])
    expect(steps[1].hits.map((h) => h.listing.id)).toEqual(['3'])
    expect(steps[2].hits.map((h) => h.listing.id)).toEqual(['2'])
    expect(steps[3].hits.map((h) => h.listing.id)).toEqual(['5'])
  })
  it('„jajka”: zestaw od znajomych osobno', () => {
    const pool = [hit(l('1', 'Jajka od kur z wolnego wybiegu'), 2), hit(l('2', 'Jajka od moich kur'), 1), hit(l('3', 'Rower'), 1)]
    const r = searchByCircle('jajka', pool)
    expect(r.friends.map((h) => h.listing.id)).toEqual(['2'])
    expect(r.fof.map((h) => h.listing.id)).toEqual(['1'])
  })
  it('hindi: słowa w dewanagari nie rozpadają się na kawałki', () => {
    expect(stems('अंडे')).toEqual(['अंडे'])
    expect(matches(l('h', 'देसी अंडे'), stems('अंडे'))).toBe(true)
    expect(findRecipe('आँगन में पेवर ब्लॉक लगवाना')?.id).toBe('paving')
    expect(findRecipe('घर शिफ्ट करना है')?.id).toBe('moving')
    const r = searchByCircle('अंडे', [hit(l('1', 'देसी अंडे'), 1), hit(l('2', 'साइकिल'), 1)])
    expect(r.friends.map((h) => h.listing.id)).toEqual(['1'])
  })
})
