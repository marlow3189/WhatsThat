import type { Listing } from './types'
import type { Hit } from './planner'
import { RECIPES, plan } from './planner'

/**
 * „Siła orbity”: zamiast nagród za zaproszenia pokazujemy korzyść — ile codziennych spraw da się załatwić
 * u ludzi, których znasz (albo którzy znają Twoich znajomych). Każdy nowy sąsiad w orbicie to krótsza droga.
 */
export type OrbitLevel = 'start' | 'growing' | 'good' | 'great'

export function orbitScore(friends: number, fof: number, offersNear: number): number {
  return Math.min(100, Math.round(friends * 8 + fof * 3 + offersNear * 1.5))
}

export function orbitLevel(score: number): OrbitLevel {
  return score < 25 ? 'start' : score < 50 ? 'growing' : score < 75 ? 'good' : 'great'
}

/** W ilu krokach planu (np. brukowanie) jest oferta od znajomych lub ich znajomych. */
export function planCoverage(pool: Hit[], recipeId = 'paving'): { done: number; total: number } {
  const recipe = RECIPES.find((r) => r.id === recipeId) ?? RECIPES[0]
  const steps = plan(recipe, pool.filter((h) => h.rel.circle <= 2))
  return { done: steps.filter((s) => s.hits.length > 0).length, total: steps.length }
}

/** Zainteresowania, w których nikt z orbity (krąg 1–2) nic nie oferuje: tu warto kogoś zaprosić. */
export function missingInOrbit(interests: string[], orbitListings: Pick<Listing, 'category'>[]): string[] {
  const have = new Set(orbitListings.map((l) => l.category))
  return interests.filter((c) => !have.has(c))
}
