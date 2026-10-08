import { e164 } from './identity'

/**
 * Kto z kontaktów już jest w aplikacji, bez wysyłania książki adresowej.
 *
 * 1. Telefon czyta numery (po zgodzie systemowej; iOS 18+ i Android pozwalają udostępnić tylko wybrane kontakty).
 * 2. Każdy numer zamieniamy NA TELEFONIE na skrót SHA-256 z formatu E.164. Imion i nazw kontaktów nie wysyłamy wcale.
 * 3. Serwer (funkcja `match_contacts` w 0004_identity_sos.sql) porównuje skróty z kontami i zwraca tylko pasujące
 *    konta. Przesłanych skrótów nie zapisuje, a liczbę zapytań ogranicza (`hit_limit`).
 *
 * Uczciwie: skrót numeru da się odgadnąć próbując wszystkich numerów, dlatego serwer niczego nie przechowuje
 * i limituje zapytania; to minimalizacja danych, a nie pełna anonimizacja (RODO traktuje skrót jak dane osobowe).
 */

export interface PhoneContact {
  name: string
  tel: string[]
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Skróty wszystkich numerów (bez imion), gotowe do porównania na serwerze. */
export async function hashContacts(contacts: PhoneContact[], defaultDial = '+48'): Promise<string[]> {
  const numbers = contacts.flatMap((c) => c.tel).map((n) => normalize(n, defaultDial)).filter(Boolean)
  return Promise.all([...new Set(numbers)].map(sha256))
}

/** Lokalny numer „600 100 200” dostaje kierunkowy kraju użytkownika. */
export function normalize(tel: string, defaultDial = '+48'): string {
  const n = e164(tel)
  if (!n) return ''
  return n.startsWith('+') ? n : `${defaultDial}${n.replace(/^0+/, '')}`
}

type Picker = { select: (props: string[], opts: { multiple: boolean }) => Promise<{ name?: string[]; tel?: string[] }[]> }
type CapContacts = { getContacts: (o: { projection: { name: boolean; phones: boolean } }) => Promise<{ contacts: { name?: { display?: string }; phones?: { number?: string }[] }[] }> }

/** Skąd brać kontakty: wtyczka natywna (Capacitor), Contact Picker API (Chrome na Androidzie) albo nic. */
export function contactSource(): 'native' | 'picker' | 'none' {
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; isPluginAvailable?: (name: string) => boolean }; navigator: Navigator & { contacts?: Picker } }
  // Capacitor.Plugins zwraca obiekt także dla niezainstalowanej wtyczki (wywołanie wtedy wisi),
  // dlatego pytamy wprost, czy wtyczka Contacts jest w aplikacji.
  if (w.Capacitor?.isNativePlatform?.() && w.Capacitor.isPluginAvailable?.('Contacts')) return 'native'
  if (w.navigator.contacts && 'ContactsManager' in window) return 'picker'
  return 'none'
}

/** Prośba o kontakty. W aplikacji natywnej pokaże się systemowe okno zgody; w przeglądarce wybierasz kontakty sam. */
export async function readContacts(): Promise<PhoneContact[] | null> {
  const w = window as unknown as { Capacitor?: { Plugins?: { Contacts?: CapContacts } }; navigator: Navigator & { contacts?: Picker } }
  try {
    const source = contactSource()
    if (source === 'native') {
      // limit czasu: gdyby system nie odpowiedział, aplikacja nie może utknąć na tym ekranie
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 20_000))
      const { contacts } = await Promise.race([w.Capacitor!.Plugins!.Contacts!.getContacts({ projection: { name: true, phones: true } }), timeout])
      return contacts.map((c) => ({ name: c.name?.display ?? '', tel: (c.phones ?? []).map((p) => p.number ?? '').filter(Boolean) }))
    }
    if (source === 'picker') {
      const picked = await w.navigator.contacts!.select(['name', 'tel'], { multiple: true })
      return picked.map((c) => ({ name: c.name?.[0] ?? '', tel: c.tel ?? [] }))
    }
  } catch {
    /* odmowa albo zamknięte okno wyboru */
  }
  return null
}
