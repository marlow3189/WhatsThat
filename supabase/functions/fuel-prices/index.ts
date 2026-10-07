// Ceny paliw od stacji: POST z kluczem stacji (Authorization: Bearer <klucz>).
// Body: {"pb95": 5.89, "on": 5.99, "lpg": 2.79} (zł za litr, dowolny podzbiór). Odpowiedź: zapisane paliwa.
// Wdrożenie: supabase functions deploy fuel-prices --no-verify-jwt (stacja nie ma konta użytkownika, uwierzytelnia ją klucz).
import { createClient } from 'npm:@supabase/supabase-js@2'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const RANGE: Record<string, [number, number]> = { pb95: [300, 1500], on: [300, 1500], lpg: [100, 800] }

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  const key = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (key.length < 32) return json({ error: 'unauthorized' }, 401)
  const { data: row } = await db.from('station_api_keys').select('station_id').eq('key_hash', await sha256(key)).is('revoked_at', null).maybeSingle()
  if (!row) return json({ error: 'unauthorized' }, 401)

  const { data: allowed } = await db.rpc('hit_limit', { p_key: row.station_id, p_action: 'fuel_api', p_max: 60, p_window: '1 hour' })
  if (allowed === false) return json({ error: 'rate_limited' }, 429)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }
  const rows = Object.entries(body)
    .filter(([fuel, v]) => fuel in RANGE && typeof v === 'number')
    .map(([fuel, v]) => ({ fuel, price: Math.round((v as number) * 100) }))
    .filter(({ fuel, price }) => price >= RANGE[fuel][0] && price <= RANGE[fuel][1])
  if (!rows.length) return json({ error: 'no_valid_prices' }, 422)

  const { error } = await db.from('fuel_prices').insert(rows.map((r) => ({ ...r, station_id: row.station_id, source: 'station' })))
  if (error) return json({ error: 'db' }, 500)
  return json({ saved: rows.map((r) => r.fuel) })
})
