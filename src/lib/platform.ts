import { BRAND } from '../config'

/**
 * Aplikacja jest przede wszystkim na telefon (Android i iOS przez Capacitor). Przeglądarka to dodatek:
 * ta sama aplikacja pod miliorbit.com/app/. Tu rozpoznajemy, gdzie działamy, i tłumaczymy linki na ekrany.
 */

type Cap = { isNativePlatform?: () => boolean; getPlatform?: () => string }
const cap = () => (globalThis as { Capacitor?: Cap }).Capacitor

/** Aplikacja ze sklepu (Capacitor), a nie strona w przeglądarce. */
export const isNative = () => !!cap()?.isNativePlatform?.()

export type Os = 'android' | 'ios' | 'desktop'

export function osOf(ua: string, touchMac = false): Os {
  if (/Android/i.test(ua)) return 'android'
  if (/iPhone|iPad|iPod/i.test(ua) || touchMac) return 'ios'
  return 'desktop'
}

export function deviceOs(): Os {
  const native = cap()?.getPlatform?.()
  if (native === 'android' || native === 'ios') return native
  if (typeof navigator === 'undefined') return 'desktop'
  return osOf(navigator.userAgent, navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** Strona dodana do ekranu początkowego (PWA). */
export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)

/**
 * Link → ekran aplikacji. Obsługuje linki udostępniane z aplikacji i otwierane w aplikacji natywnej
 * (App Links na Androidzie, Universal Links na iOS):
 *   https://miliorbit.com/l/abc → /l/abc (ogłoszenie)
 *   https://miliorbit.com/u/abc → /u/abc (profil)
 *   https://miliorbit.com/z/abc → /znajomi (zaproszenie od znajomego)
 *   https://miliorbit.com/sos → /sos
 *   https://miliorbit.com/app/#/czat/1 → /czat/1
 */
export function routeFromLink(url: string): string | null {
  let u: URL
  try {
    u = new URL(url, `https://${BRAND.domain}`)
  } catch {
    return null
  }
  if (u.hash.startsWith('#/')) return u.hash.slice(1)
  const path = u.pathname.replace(/\/+$/, '')
  const m = path.match(/^\/(l|u)\/([\w-]{1,64})$/)
  if (m) return `/${m[1]}/${m[2]}`
  if (/^\/z\/[\w-]{1,64}$/.test(path)) return '/znajomi'
  if (path === '/sos') return '/sos'
  if (path === '/zastrzez') return '/zastrzez'
  if (path === '' || path === '/app' || path === '/pobierz') return '/'
  return null
}
