/**
 * Pomiar marketingu: Google Analytics 4, Meta Pixel i TikTok Pixel.
 * Zasady (RODO, ePrivacy / Prawo komunikacji elektronicznej, DSA):
 * - nic nie ładujemy bez zgody; odmowa jest tak samo łatwa jak zgoda,
 * - identyfikatory ustawia się w zmiennych środowiskowych (VITE_GA4_ID, VITE_META_PIXEL_ID, VITE_TIKTOK_PIXEL_ID),
 * - do pikseli nie wysyłamy imienia, numeru telefonu ani treści ogłoszeń, tylko rodzaj zdarzenia i kwotę.
 * Bez ustawionych identyfikatorów moduł nic nie robi i nie pokazuje paska zgody.
 */

type Win = Window & {
  dataLayer?: unknown[]
  gtag?: (...a: unknown[]) => void
  fbq?: ((...a: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...a: unknown[]) => void; push?: unknown }
  ttq?: { track: (e: string, p?: object) => void; page: () => void; load: (id: string) => void; [k: string]: unknown }
}

const env = import.meta.env
export const IDS = {
  ga4: (env.VITE_GA4_ID as string | undefined) ?? '',
  meta: (env.VITE_META_PIXEL_ID as string | undefined) ?? '',
  tiktok: (env.VITE_TIKTOK_PIXEL_ID as string | undefined) ?? '',
}
export const hasTrackers = () => !!(IDS.ga4 || IDS.meta || IDS.tiktok)

const KEY = 'miliorbit:consent'
export type Consent = 'granted' | 'denied' | null

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

export function setConsent(v: 'granted' | 'denied') {
  try {
    localStorage.setItem(KEY, v)
  } catch {
    /* tryb prywatny: zgoda tylko na tę sesję */
  }
  if (v === 'granted') load()
}

/** Pierwsze źródło wejścia (utm_*), żeby wiedzieć, która kampania przyniosła rejestrację. */
export function rememberSource() {
  try {
    const q = new URLSearchParams(location.search)
    const utm = Object.fromEntries([...q].filter(([k]) => k.startsWith('utm_') || k === 'ref'))
    if (Object.keys(utm).length && !localStorage.getItem('miliorbit:utm')) localStorage.setItem('miliorbit:utm', JSON.stringify(utm))
  } catch {
    /* nic */
  }
}
const source = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem('miliorbit:utm') ?? '{}')
  } catch {
    return {}
  }
}

function script(src: string) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

let loaded = false
function load() {
  if (loaded || typeof document === 'undefined') return
  loaded = true
  const w = window as Win
  if (IDS.ga4) {
    w.dataLayer = w.dataLayer ?? []
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments)
    }
    w.gtag('consent', 'default', { ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'denied' })
    w.gtag('js', new Date())
    w.gtag('config', IDS.ga4, { anonymize_ip: true })
    script(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(IDS.ga4)}`)
  }
  if (IDS.meta) {
    const f = function (...a: unknown[]) {
      if (f.callMethod) f.callMethod(...a)
      else f.queue!.push(a)
    } as NonNullable<Win['fbq']>
    f.queue = []
    f.loaded = true
    f.version = '2.0'
    f.push = f
    w.fbq = f
    script('https://connect.facebook.net/en_US/fbevents.js')
    w.fbq('init', IDS.meta)
    w.fbq('track', 'PageView')
  }
  if (IDS.tiktok) {
    const q: unknown[] = []
    const stub = (m: string) => (...a: unknown[]) => q.push([m, ...a])
    w.ttq = { track: stub('track'), page: stub('page'), load: stub('load'), _q: q } as unknown as Win['ttq']
    script(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(IDS.tiktok)}&lib=ttq`)
    w.ttq!.page()
  }
}

/** Zdarzenia biznesowe w jednym słowniku: nazwy GA4 / Meta / TikTok. */
const MAP = {
  sign_up: ['sign_up', 'CompleteRegistration', 'CompleteRegistration'],
  listing_created: ['generate_lead', 'Lead', 'SubmitForm'],
  invite: ['share', 'Contact', 'Contact'],
  purchase: ['purchase', 'Purchase', 'CompletePayment'],
  subscribe: ['purchase', 'Subscribe', 'Subscribe'],
  search: ['search', 'Search', 'Search'],
} as const
export type TrackEvent = keyof typeof MAP

export function track(event: TrackEvent, params: { value?: number; currency?: string; count?: number } = {}) {
  if (getConsent() !== 'granted' || !hasTrackers()) return
  load()
  const w = window as Win
  const [ga, meta, tt] = MAP[event]
  const p = { ...params, ...(event === 'sign_up' ? source() : {}) }
  w.gtag?.('event', ga, p)
  w.fbq?.('track', meta, p)
  w.ttq?.track(tt, p)
}

/** Przy starcie: zapamiętaj źródło i, jeśli zgoda już jest, wczytaj piksele. */
export function initAnalytics() {
  rememberSource()
  if (getConsent() === 'granted' && hasTrackers()) load()
}
