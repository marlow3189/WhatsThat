import { LIVE, db } from './backend'
import type { Account, Circle, Currency, Delivery, Kind, Listing, Place, Unit, User } from './types'

/**
 * Tryb na żywo (Supabase): logowanie, profil, ogłoszenia z bazy. W trybie demo nic tu się nie wykonuje.
 *
 * Faza testów (teraz): logowanie anonimowe (Supabase → Authentication → Sign In / Providers → „Allow anonymous
 * sign-ins”), bez kosztów SMS. Faza 2: VITE_AUTH=sms włącza kod SMS (dostawca SMS w Supabase, np. Twilio).
 * Uprawnienia pilnuje baza (RLS w supabase/migrations), nie aplikacja.
 */
export const AUTH_MODE: 'anonymous' | 'sms' = (import.meta.env.VITE_AUTH as string | undefined) === 'sms' ? 'sms' : 'anonymous'

/** Punkt na mapie w formacie, który PostGIS przyjmuje przez API (EWKT). */
export const point = (p: Pick<Place, 'lat' | 'lng'>) => `SRID=4326;POINT(${p.lng.toFixed(6)} ${p.lat.toFixed(6)})`

/** Numer w formacie E.164 do logowania SMS: „+48 600 100 200” → „+48600100200”. */
export const e164phone = (phone: string) => phone.replace(/[^\d+]/g, '')

/** Id zalogowanego użytkownika w bazie (null w demo albo bez sesji). */
export async function liveUserId(): Promise<string | null> {
  if (!LIVE) return null
  const { data } = await (await db()).auth.getSession()
  return data.session?.user.id ?? null
}

/** Wylogowanie (Ja → Wyloguj): kolejna rejestracja zakłada nowe konto testowe. */
export async function signOut(): Promise<void> {
  if (!LIVE) return
  try {
    await (await db()).auth.signOut()
  } catch {
    /* brak sieci: sesja wygaśnie sama */
  }
}

/** Krok 1 logowania SMS: wysyła kod. W trybie anonimowym nic nie wysyła (kod demo). */
export async function sendCode(phone: string): Promise<{ ok: boolean; error?: string }> {
  if (!LIVE || AUTH_MODE !== 'sms') return { ok: true }
  const { error } = await (await db()).auth.signInWithOtp({ phone: e164phone(phone) })
  return error ? { ok: false, error: error.message } : { ok: true }
}

/** Krok 2: sprawdza kod SMS albo (faza testów) loguje anonimowo. */
export async function verifyCode(phone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  if (!LIVE) return { ok: true }
  const client = await db()
  if (AUTH_MODE === 'sms') {
    const { error } = await client.auth.verifyOtp({ phone: e164phone(phone), token: code, type: 'sms' })
    return error ? { ok: false, error: error.message } : { ok: true }
  }
  const { data } = await client.auth.getSession()
  if (data.session) return { ok: true }
  const { error } = await client.auth.signInAnonymously()
  return error ? { ok: false, error: error.message } : { ok: true }
}

/** Zapis profilu po rejestracji (i przy zmianie okolicy albo języka). */
export async function saveProfile(a: Pick<Account, 'name' | 'lang' | 'country' | 'currency' | 'interests' | 'place' | 'gender'>): Promise<{ ok: boolean; error?: string }> {
  if (!LIVE) return { ok: true }
  const client = await db()
  const id = await liveUserId()
  if (!id) return { ok: false, error: 'no-session' }
  const row: Record<string, unknown> = {
    id,
    display_name: a.name || 'Sąsiad',
    lang: a.lang,
    country: a.country,
    currency: a.currency,
    interests: a.interests,
    voivodeship: a.place.voivodeship,
    town: a.place.town,
    home: point(a.place),
  }
  if (a.gender) row.gender = a.gender
  const { error } = await client.from('profiles').upsert(row)
  return error ? { ok: false, error: error.message } : { ok: true }
}

/** Ogłoszenie z aplikacji → wiersz tabeli listings. */
export function toRow(l: Omit<Listing, 'id' | 'createdAt' | 'ownerId' | 'status'>, ownerId: string) {
  return {
    owner_id: ownerId,
    kind: l.kind,
    category: l.category,
    sub_category: l.sub ?? null,
    title: l.title,
    description: l.description,
    price: l.price ?? null,
    currency: l.currency ?? 'PLN',
    unit: l.unit,
    condition: l.condition ?? null,
    deal: !!l.deal,
    stock: l.stock ?? null,
    pickup_hours: l.pickupHours ?? null,
    delivery: l.delivery,
    shipping_price: l.shippingPrice ?? null,
    deposit: l.deposit ?? null,
    garage_date: l.garageDate ?? null,
    swap_for: l.swapFor ?? null,
    location: point(l.place),
    town: l.place.town,
    voivodeship: l.place.voivodeship,
    visibility: l.visibility,
    incognito: !!l.incognito,
  }
}

/** Publikacja w bazie. Zdjęcia trafią do Storage w fazie 2 (teraz zostają na telefonie). */
export async function publishListing(l: Omit<Listing, 'id' | 'createdAt' | 'ownerId' | 'status'>): Promise<{ id?: string; error?: string }> {
  if (!LIVE) return {}
  const id = await liveUserId()
  if (!id) return { error: 'no-session' }
  const { data, error } = await (await db()).from('listings').insert(toRow(l, id)).select('id').single()
  return error ? { error: error.message } : { id: (data as { id: string }).id }
}

type Row = Record<string, unknown>

/** Punkt z bazy: PostGIS w JSON-ie daje GeoJSON albo szesnastkowy EWKB („0101000020E6100000…”). Zwraca [lng, lat]. */
export function parsePoint(loc: unknown): [number, number] | null {
  if (loc && typeof loc === 'object' && Array.isArray((loc as { coordinates?: unknown }).coordinates)) {
    const [x, y] = (loc as { coordinates: number[] }).coordinates
    return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null
  }
  if (typeof loc !== 'string' || !/^[0-9a-fA-F]+$/.test(loc) || loc.length < 42) return null
  const bytes = new Uint8Array(loc.match(/../g)!.map((b) => parseInt(b, 16)))
  const view = new DataView(bytes.buffer)
  const le = bytes[0] === 1
  const type = view.getUint32(1, le)
  let offset = 5
  if (type & 0x20000000) offset += 4 // SRID
  if ((type & 0xffff) !== 1 || bytes.length < offset + 16) return null
  return [view.getFloat64(offset, le), view.getFloat64(offset + 8, le)]
}

/** Wiersz z bazy (listings_nearby zwraca JSON, w którym lokalizacja jest w GeoJSON albo WKB) → ogłoszenie. */
export function fromRow(r: Row, me: string | null, fallback: Place): Listing {
  const coords = parsePoint(r.location)
  return {
    id: `db-${r.id as string}`,
    ownerId: r.owner_id ? (r.owner_id === me ? 'me' : `db-${r.owner_id as string}`) : 'db-hidden',
    kind: r.kind as Kind,
    category: r.category as string,
    sub: (r.sub_category as string | null) ?? undefined,
    title: r.title as string,
    description: (r.description as string) ?? '',
    price: (r.price as number | null) ?? undefined,
    currency: ((r.currency as string) ?? 'PLN') as Currency,
    unit: r.unit as Unit,
    condition: (r.condition as 'new' | 'used' | null) ?? undefined,
    deal: !!r.deal,
    stock: (r.stock as number | null) ?? undefined,
    pickupHours: (r.pickup_hours as string | null) ?? undefined,
    delivery: ((r.delivery as string[]) ?? ['pickup']) as Delivery[],
    shippingPrice: (r.shipping_price as number | null) ?? undefined,
    deposit: (r.deposit as number | null) ?? undefined,
    garageDate: (r.garage_date as string | null) ?? undefined,
    swapFor: (r.swap_for as string | null) ?? undefined,
    photo: Array.isArray(r.photos) && r.photos.length ? (r.photos[0] as string) : undefined,
    place: { lat: coords ? coords[1] : fallback.lat, lng: coords ? coords[0] : fallback.lng, town: (r.town as string) ?? fallback.town, voivodeship: (r.voivodeship as string) ?? fallback.voivodeship },
    visibility: ((r.visibility as number) ?? 3) as Circle,
    incognito: !!r.incognito,
    promoted: !!r.promoted,
    paused: !!r.paused,
    status: 'active',
    createdAt: r.created_at ? Date.parse(r.created_at as string) : Date.now(),
  }
}

/** Ogłoszenia z okolicy i ich właściciele (imię, klucz anonimowy) z bazy. */
export async function fetchNearby(place: Place, radiusKm = 50): Promise<{ listings: Listing[]; users: User[] } | null> {
  if (!LIVE) return null
  const me = await liveUserId()
  if (!me) return null
  const client = await db()
  const { data, error } = await client.rpc('listings_nearby', { lat: place.lat, lng: place.lng, radius_km: radiusKm })
  if (error || !Array.isArray(data)) return null
  const listings = (data as { listing: Row }[]).map((x) => fromRow(x.listing, me, place))
  const owners = [...new Set(listings.map((l) => l.ownerId).filter((id) => id.startsWith('db-') && id !== 'db-hidden'))].map((id) => id.slice(3))
  let users: User[] = []
  if (owners.length) {
    const { data: profiles } = await client.from('profiles').select('id, display_name, voivodeship, town, gender, anon_key').in('id', owners)
    users = ((profiles ?? []) as Row[]).map((p) => ({
      id: `db-${p.id as string}`,
      name: (p.display_name as string) ?? '?',
      hue: hueFrom(p.id as string),
      place: { ...place, town: (p.town as string) ?? place.town, voivodeship: (p.voivodeship as string) ?? place.voivodeship },
      friends: [],
      since: Date.now(),
      gender: (p.gender as User['gender']) ?? undefined,
      anonKey: (p.anon_key as string) ?? undefined,
    }))
  }
  return { listings, users }
}

function hueFrom(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}
