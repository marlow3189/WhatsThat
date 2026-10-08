import { LIVE, db } from './backend'
import { stems, type Recipe } from './planner'
import type { Lang } from './types'

/**
 * Planer AI na żywo: pytanie użytkownika („chcę wybrukować podjazd”) idzie do funkcji Supabase `plan`
 * (supabase/functions/plan), która pyta model Claude i zwraca kroki. Klucz do modelu jest tylko w sekretach
 * Supabase, nigdy w aplikacji. Oferty pod kroki dobiera dalej ten sam kod co w demo (planner.ts), znajomi najpierw.
 * W trybie demo i bez internetu zwraca null, a aplikacja korzysta z gotowych planów.
 */
export interface RemotePlan {
  goal: string
  steps: { title: string; kind?: string; queries: string[]; categories?: string[] }[]
}

const LANG_IDS: Lang[] = ['pl', 'en', 'de', 'uk', 'cs', 'sk', 'hu', 'it', 'es', 'hi']
const same = (text: string) => Object.fromEntries(LANG_IDS.map((l) => [l, text])) as Record<Lang, string>

/** Odpowiedź modelu → przepis w formacie planera (tekst w języku użytkownika, słowa do szukania z zapytań). */
export function toRecipe(p: RemotePlan, query: string): Recipe | null {
  const steps = (p.steps ?? [])
    .filter((s) => s && typeof s.title === 'string' && Array.isArray(s.queries))
    .slice(0, 6)
    .map((s, i) => ({ id: `ai${i + 1}`, title: same(s.title.slice(0, 120)), terms: [...new Set(s.queries.slice(0, 5).flatMap((q) => stems(String(q))))] }))
    .filter((s) => s.terms.length)
  if (!steps.length) return null
  return { id: 'ai', keywords: [query], goal: same((p.goal || query).slice(0, 120)), steps }
}

const cache = new Map<string, Recipe | null>()

export async function askPlanner(query: string, lang: Lang, country: string): Promise<Recipe | null> {
  const q = query.trim()
  if (!LIVE || q.length < 3 || q.length > 300) return null
  const key = `${lang}|${country}|${q.toLowerCase()}`
  if (cache.has(key)) return cache.get(key)!
  try {
    const client = await db()
    const { data, error } = await client.functions.invoke<RemotePlan>('plan', { body: { query: q, lang, country } })
    const recipe = !error && data ? toRecipe(data, q) : null
    cache.set(key, recipe)
    return recipe
  } catch {
    return null
  }
}
