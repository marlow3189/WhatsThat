import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Tryb pracy aplikacji:
 * - „demo”: dane przykładowe zapisane tylko na urządzeniu (podgląd, testy bez bazy),
 * - „na żywo”: Supabase (logowanie, ogłoszenia, czaty…), gdy w budowaniu są VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY.
 * Klucz publiczny („publishable” albo stary „anon”) jest jawny z założenia (chroni nas RLS w bazie).
 * Klucza „secret” / service_role NIGDY tu nie wpisujemy.
 */
const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

export const LIVE = !!URL_ && !!KEY && !URL_.includes('xxxx') && import.meta.env.MODE !== 'preview'
export const BACKEND_HOST = URL_ ? URL_.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : ''

let client: Promise<SupabaseClient> | null = null

/** Klient Supabase ładowany dopiero w trybie na żywo (tryb demo nie pobiera tej biblioteki). */
export function db(): Promise<SupabaseClient> {
  if (!LIVE) return Promise.reject(new Error('Tryb demo: brak VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY'))
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL_!, KEY!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }),
  )
  return client
}

export interface Health {
  ok: boolean
  /** co sprawdzono i z jakim wynikiem, po ludzku */
  detail: string
  ms?: number
}

/** Test połączenia: logowanie (Auth) i baza (REST). Pomaga sprawdzić zmienne po wdrożeniu. */
export async function checkConnection(fetcher: typeof fetch = fetch): Promise<Health> {
  if (!URL_ || !KEY) return { ok: false, detail: 'Tryb demo: brak adresu i klucza Supabase w zmiennych budowania.' }
  const t0 = Date.now()
  try {
    // tylko nagłówek apikey: działa ze starym kluczem „anon” (JWT) i nowym „publishable” (sb_publishable_…)
    const headers = { apikey: KEY }
    // tabela z migracji 0001: bez zalogowania RLS zwraca pustą listę, a brak tabeli to 404 (migracje nieuruchomione)
    const [auth, rest] = await Promise.all([fetcher(`${URL_}/auth/v1/health`, { headers }), fetcher(`${URL_}/rest/v1/profiles?select=id&limit=1`, { headers })])
    const ms = Date.now() - t0
    if (auth.status === 401 || rest.status === 401) return { ok: false, ms, detail: 'Zły klucz (401). Skopiuj jeszcze raz klucz publiczny (publishable albo anon) z Project Settings → API Keys.' }
    if (!auth.ok) return { ok: false, ms, detail: `Logowanie (Auth) odpowiada błędem ${auth.status}.` }
    if (rest.status === 404) return { ok: false, ms, detail: 'Połączenie jest, ale w bazie nie ma tabel. Uruchom migracje 0001–0004 (docs/PLAN.md, faza 1).' }
    if (!rest.ok) return { ok: false, ms, detail: `Baza (REST) odpowiada błędem ${rest.status}.` }
    return { ok: true, ms, detail: `Połączono z ${BACKEND_HOST} (${ms} ms).` }
  } catch {
    return { ok: false, detail: 'Brak połączenia: sprawdź adres projektu i internet (albo blokadę CSP).' }
  }
}
