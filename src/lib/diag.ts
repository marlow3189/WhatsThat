/**
 * Diagnostyka na telefonie: zapamiętujemy ostatnie błędy aplikacji (bez danych osobowych), żeby tester mógł je
 * skopiować w Ja → Diagnostyka i wysłać. Zamiast białego ekranu pokazujemy komunikat z przyciskiem „Uruchom ponownie”.
 */
const KEY = 'miliorbit:errors'
const MAX = 12

export interface ErrorEntry {
  at: number
  where: string
  message: string
  stack?: string
}

export function readErrors(): ErrorEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as ErrorEntry[]
  } catch {
    return []
  }
}

export function logError(where: string, error: unknown) {
  const e = error instanceof Error ? error : new Error(String(error))
  const entry: ErrorEntry = { at: Date.now(), where, message: e.message.slice(0, 300), stack: e.stack?.split('\n').slice(0, 6).join('\n').slice(0, 900) }
  try {
    localStorage.setItem(KEY, JSON.stringify([entry, ...readErrors()].slice(0, MAX)))
  } catch {
    /* pamięć zablokowana */
  }
}

export function clearErrors() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nic */
  }
}

/** Łapie błędy spoza Reacta (timery, obietnice), żeby nic nie ginęło bez śladu. */
export function installErrorLog() {
  if (typeof window === 'undefined') return
  window.addEventListener('error', (e) => logError('window', e.error ?? e.message))
  window.addEventListener('unhandledrejection', (e) => logError('promise', e.reason))
}

/** Jedna linijka o urządzeniu: wersja aplikacji, Android/iOS, wersja WebView (Chrome), ekran. */
export function deviceSummary(build: string): string {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
  const os = ua.match(/Android [\d.]+|iPhone OS [\d_]+|Mac OS X [\d_]+|Windows NT [\d.]+/)?.[0] ?? '?'
  const chrome = ua.match(/Chrome\/([\d.]+)/)?.[1] ?? ua.match(/Version\/([\d.]+).*Safari/)?.[1] ?? '?'
  const screen = typeof window === 'undefined' ? '' : `${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio}`
  const sat = typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top').trim()
  return `Regioorbit ${build} · ${os} · WebView ${chrome} · ${screen}${sat ? ` · inset ${sat}` : ''}`
}
