import { COUNTRIES } from './countries'

/**
 * Prywatność w kręgach: znajomych widzisz z imienia, firmy z nazwy, a znajomych znajomych i sąsiadów
 * tylko po pseudonimie albo numerze porządkowym i pierwszych cyfrach numeru telefonu.
 */

/** „+48 601 234 567” → „+48 60…” (kierunkowy kraju i dwie pierwsze cyfry, reszta ukryta). */
export function maskPhone(phone?: string): string {
  if (!phone) return ''
  const digits = phone.replace(/[^\d+]/g, '')
  // Najdłuższy pasujący kierunkowy z listy krajów, żeby „+48 601…” nie dało „+486”.
  const dial = COUNTRIES.map((c) => c.dial).filter((d) => digits.startsWith(d)).sort((a, b) => b.length - a.length)[0]
  const rest = dial ? digits.slice(dial.length) : digits.replace(/^\+/, '')
  return rest.length >= 2 ? `${dial ?? ''} ${rest.slice(0, 2)}…`.trim() : ''
}

/** Stały numer porządkowy osoby (nie zmienia się między ekranami ani po odświeżeniu). */
export function ordinals(ids: string[]): Record<string, number> {
  return Object.fromEntries([...ids].sort().map((id, i) => [id, i + 1]))
}

/** Godziny „6:00–13:00” → czy teraz otwarte. Obsługuje też „pon–sob 16:00–19:00” (bierze same godziny). */
export function isOpen(hours: string | undefined, now = new Date()): boolean | undefined {
  const m = hours?.match(/(\d{1,2})[:.](\d{2})\s*[–-]\s*(\d{1,2})[:.](\d{2})/)
  if (!m) return undefined
  const from = +m[1] * 60 + +m[2]
  const to = +m[3] * 60 + +m[4]
  const t = now.getHours() * 60 + now.getMinutes()
  return to > from ? t >= from && t < to : t >= from || t < to
}
