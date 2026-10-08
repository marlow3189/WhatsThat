import { describe, expect, it } from 'vitest'
import { toRecipe } from './ai'

describe('planer AI', () => {
  it('zamienia odpowiedź modelu na kroki z wyszukiwanymi słowami', () => {
    const r = toRecipe({ goal: 'Podjazd z kostki', steps: [{ title: 'Piasek', queries: ['piasek płukany'] }, { title: 'Zagęszczarka', queries: ['zagęszczarka'] }] }, 'podjazd')
    expect(r?.steps).toHaveLength(2)
    expect(r?.goal.pl).toBe('Podjazd z kostki')
    expect(r?.goal.hi).toBe('Podjazd z kostki')
    expect(r?.steps[0].terms).toContain('pias')
  })
  it('odrzuca pustą albo uszkodzoną odpowiedź', () => {
    expect(toRecipe({ goal: 'x', steps: [] }, 'x')).toBeNull()
    expect(toRecipe({ goal: 'x', steps: [{ title: 'a', queries: ['?'] }] }, 'x')).toBeNull()
    expect(toRecipe({ goal: 'x' } as never, 'x')).toBeNull()
  })
})
