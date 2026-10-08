import { useEffect, useState } from 'react'
import { LIVE, db } from './backend'
import type { Place } from './types'

/**
 * Komunikaty zweryfikowanych instytucji (gmina, spółdzielnia, sołectwo) i najbliższy wywóz śmieci.
 * Publikować może tylko członek instytucji, którą operator sprawdził ręcznie (supabase/migrations/0005).
 * W demo pokazujemy przykład, żeby było widać, jak to wygląda.
 */
export interface CouncilNotice {
  id: string
  org: string
  kind: 'notice' | 'alert' | 'outage' | 'event' | 'waste'
  title: string
}
export interface Pickup {
  date: string
  fraction: string
}

export function useCouncil(place: Place, demo: { org: string; notice: string }) {
  const [data, setData] = useState<{ notices: CouncilNotice[]; pickups: Pickup[] }>(() => (LIVE ? { notices: [], pickups: [] } : demoCouncil(demo)))
  useEffect(() => {
    if (!LIVE) return setData(demoCouncil(demo))
    let alive = true
    ;(async () => {
      try {
        const client = await db()
        const [a, w] = await Promise.all([client.rpc('announcements_near', { lim: 5 }), client.rpc('my_waste_pickups', { days: 7 })])
        if (!alive) return
        setData({
          notices: ((a.data ?? []) as { id: string; org_name: string; kind: CouncilNotice['kind']; title: string }[]).map((x) => ({ id: x.id, org: x.org_name, kind: x.kind, title: x.title })),
          pickups: ((w.data ?? []) as { pickup_date: string; fraction: string }[]).map((x) => ({ date: x.pickup_date, fraction: x.fraction })),
        })
      } catch {
        /* brak sieci: karta się nie pokazuje */
      }
    })()
    return () => {
      alive = false
    }
  }, [place.lat, place.lng, demo.org, demo.notice]) // eslint-disable-line react-hooks/exhaustive-deps
  return data
}

function demoCouncil(demo: { org: string; notice: string }) {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  return {
    notices: [{ id: 'demo-water', org: demo.org, kind: 'outage' as const, title: demo.notice }],
    pickups: [
      { date: tomorrow, fraction: 'paper' },
      { date: tomorrow, fraction: 'plastic' },
    ],
  }
}

/** Wniosek o konto instytucji. Decyzję podejmuje człowiek po sprawdzeniu domeny, telefonu i upoważnienia. */
export async function applyForOrg(name: string, email: string): Promise<{ ok: boolean; error?: string }> {
  if (!LIVE) return { ok: true }
  try {
    const { error } = await (await db()).from('org_applications').insert({ kind: 'municipality', name: name.trim(), official_email: email.trim() })
    return error ? { ok: false, error: error.message } : { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
