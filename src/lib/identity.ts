/**
 * Anonimowy, stały identyfikator osoby: „anonym” + kraj + płeć (m, w, x) + 10 cyfr.
 * Przykład: anonymplm4829175530.
 *
 * Cyfry NIE są numerem telefonu. Gdyby klucz zawierał numer (np. anonymplm0048693487111), każdy, kto zobaczy
 * awatar, znałby Twój numer, a ukrywamy go przed obcymi. Dlatego cyfry to skrót numeru liczony z tajnym kluczem
 * serwera (w produkcji HMAC-SHA-256 w funkcji Supabase, sekret tylko na serwerze): ten sam numer daje zawsze ten sam
 * klucz, ale z klucza nie da się odtworzyć numeru. Unikalność pilnuje baza (unikalny indeks, przy kolizji
 * 1 na 10 mld serwer dolicza kolejny skrót).
 */

export type Gender = 'm' | 'w' | 'x'
export const GENDERS: Gender[] = ['m', 'w', 'x']

/** Numer w formacie E.164 bez spacji: „+48 600 100 200” → „+48600100200”. */
export function e164(phone: string): string {
  const d = phone.replace(/[^\d+]/g, '')
  return d.startsWith('00') ? `+${d.slice(2)}` : d
}

/** Deterministyczny skrót demo (FNV-1a 64-bit na dwóch połówkach). W produkcji: HMAC-SHA-256 z sekretem serwera. */
function digest(text: string): bigint {
  let h = 0xcbf29ce484222325n
  for (const ch of text) {
    h ^= BigInt(ch.codePointAt(0)!)
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn
  }
  // dodatkowe wymieszanie bitów (splitmix64), żeby sąsiednie numery dawały zupełnie różne cyfry
  h = ((h ^ (h >> 30n)) * 0xbf58476d1ce4e5b9n) & 0xffffffffffffffffn
  h = ((h ^ (h >> 27n)) * 0x94d049bb133111ebn) & 0xffffffffffffffffn
  return h ^ (h >> 31n)
}

/** Klucz demo; prawdziwy sekret trzyma tylko serwer (zmienna ANON_KEY_SECRET w Supabase). */
const DEMO_SECRET = 'miliorbit-demo'

export function anonKey(country: string, gender: Gender, phone: string, secret = DEMO_SECRET): string {
  const digits = (digest(`${secret}|${e164(phone)}`) % 10_000_000_000n).toString().padStart(10, '0')
  return `anonym${country.toLowerCase().slice(0, 2)}${gender}${digits}`
}

export const isAnonKey = (key: string) => /^anonym[a-z]{2}[mwx]\d{10}$/.test(key)

/** „anonymplm4829175530” → „anonym·pl·m·4829 175 530” (łatwiej przeczytać i podyktować). */
export function formatKey(key: string): string {
  const m = key.match(/^anonym([a-z]{2})([mwx])(\d{4})(\d{3})(\d{3})$/)
  return m ? `anonym·${m[1]}·${m[2]}·${m[3]} ${m[4]} ${m[5]}` : key
}

/**
 * Awatar z klucza: symetryczny wzór 5×5 (jak identicon) i odcień. Ten sam klucz = ten sam obrazek,
 * więc osobę spoza znajomych rozpoznasz, nie znając jej imienia ani numeru.
 */
export function identicon(key: string): { hue: number; cells: boolean[] } {
  const h = digest(key)
  const cells: boolean[] = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const c = col < 3 ? col : 4 - col
      cells.push(((h >> BigInt(row * 3 + c)) & 1n) === 1n)
    }
  }
  return { hue: Number((h >> 40n) % 360n), cells }
}
