// Ostrzeżenia dla aplikacji: pobiera oficjalne źródła po stronie serwera (bez problemów z CORS), trzyma 5 min w cache.
// PL: IMGW-PIB (publiczne API). Pozostałe kraje: Meteoalarm (Atom/CAP, CC BY 4.0) — do dodania przy wejściu na rynek.
// GET ?country=PL&voivodeship=śląskie
import { createClient } from 'npm:@supabase/supabase-js@2'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const TERYT: Record<string, string> = {
  dolnośląskie: '02', 'kujawsko-pomorskie': '04', lubelskie: '06', lubuskie: '08', łódzkie: '10', małopolskie: '12',
  mazowieckie: '14', opolskie: '16', podkarpackie: '18', podlaskie: '20', pomorskie: '22', śląskie: '24',
  świętokrzyskie: '26', 'warmińsko-mazurskie': '28', wielkopolskie: '30', zachodniopomorskie: '32',
}
const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const country = url.searchParams.get('country') ?? 'PL'
  const region = url.searchParams.get('voivodeship') ?? ''
  if (country !== 'PL' || !TERYT[region]) return new Response('[]', { headers: cors })

  const { data: cached } = await db.from('warnings_cache').select('payload, fetched_at').eq('country', country).eq('region', region).maybeSingle()
  if (cached && Date.now() - Date.parse(cached.fetched_at) < 5 * 60_000) return new Response(JSON.stringify(cached.payload), { headers: cors })

  const res = await fetch('https://danepubliczne.imgw.pl/api/data/warningsmeteo')
  if (!res.ok) return new Response(JSON.stringify(cached?.payload ?? []), { headers: cors })
  const rows: { id?: string; nazwa_zdarzenia?: string; stopien?: string; obowiazuje_do?: string; tresc?: string; teryt?: string[] }[] = await res.json()
  const payload = rows
    .filter((r) => r.teryt?.some((p) => p.startsWith(TERYT[region])))
    .map((r) => ({ id: r.id, title: r.nazwa_zdarzenia, level: Number(r.stopien) || 1, until: r.obowiazuje_do, text: r.tresc, source: 'IMGW-PIB' }))
  await db.from('warnings_cache').upsert({ country, region, payload, fetched_at: new Date().toISOString() })
  return new Response(JSON.stringify(payload), { headers: cors })
})
