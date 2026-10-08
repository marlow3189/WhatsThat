import { Suspense, lazy, useEffect, useState } from 'react'
import { HashRouter, Link, MemoryRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router'
import { StoreProvider, useStore } from './data/store'
import { cx } from './components/ui'
import { Icon } from './components/icons'
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { Search } from './screens/Search'
import { ListingScreen } from './screens/Listing'
import { OrderScreen } from './screens/Order'
import { ChatScreen, Messages } from './screens/Messages'
import { Add } from './screens/Add'
import { Interests, Me, Muted, MyListings, NotificationSettings, Orders, Payouts, Privacy, Stall, Terms } from './screens/Me'
import { Friends, Install, Notifications, Restrict, Trusted } from './screens/Safety'
import { Profile } from './screens/Profile'
import { Sos } from './screens/Sos'
import { isNative, routeFromLink } from './lib/platform'

// Rzadziej otwierane ekrany ładują się dopiero, gdy są potrzebne (mniejszy start aplikacji).
const Operator = lazy(() => import('./screens/Operator').then((m) => ({ default: m.Operator })))
const Fuel = lazy(() => import('./screens/Fuel').then((m) => ({ default: m.Fuel })))
const Qr = lazy(() => import('./screens/Qr').then((m) => ({ default: m.Qr })))
import { getConsent, hasTrackers, setConsent } from './lib/analytics'

// Podgląd jednoplikowy działa w ramce bez dostępu do adresu, więc trasy trzyma w pamięci.
const Router = import.meta.env.MODE === 'preview' ? MemoryRouter : HashRouter

export function App() {
  return (
    <StoreProvider>
      <Router>
        <Shell />
      </Router>
    </StoreProvider>
  )
}

function Shell() {
  const { account, chats, readAt } = useStore()
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname, account.onboarded])
  // Liczba nieprzeczytanych na ikonie aplikacji (Badging API: Android, iOS 16.4+ dla aplikacji z ekranu początkowego).
  const unread = chats.filter((c) => {
    const last = c.messages.at(-1)
    return last && last.from !== 'me' && last.at > (readAt[c.id] ?? 0)
  }).length
  useEffect(() => {
    const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
    ;(unread ? nav.setAppBadge?.(unread) : nav.clearAppBadge?.())?.catch(() => {})
  }, [unread])
  useDeepLinks()
  if (!account.onboarded) return <Onboarding />
  return (
    <div className="mx-auto flex min-h-full max-w-[34rem] flex-col bg-bg" style={{ paddingTop: 'var(--sat)' }}>
      {/* Pod paskiem stanu telefonu: tło zamiast przewijanej treści (Android 15+ i iPhone rysują aplikację pod nim). */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 bg-bg" style={{ height: 'var(--sat)' }} aria-hidden />
      <RestrictedBanner />
      <SafetyBanner />
      <Toast />
      <main className="flex flex-1 flex-col" style={{ paddingBottom: 'calc(var(--sab) + 80px)' }}>
        <Suspense fallback={<div className="grid flex-1 place-items-center p-10 text-muted" aria-busy="true">…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/u/:id" element={<Profile />} />
          <Route path="/sos" element={<Sos />} />
          <Route path="/paliwa" element={<Fuel />} />
          <Route path="/qr" element={<Qr />} />
          <Route path="/szukaj" element={<Search />} />
          <Route path="/l/:id" element={<ListingScreen />} />
          <Route path="/zamowienie/:id" element={<OrderScreen />} />
          <Route path="/zamowienia" element={<Orders />} />
          <Route path="/dodaj" element={<AddRoute />} />
          <Route path="/wiadomosci" element={<Messages />} />
          <Route path="/czat/:id" element={<ChatScreen />} />
          <Route path="/ja" element={<Me />} />
          <Route path="/ja/stragan" element={<Stall />} />
          <Route path="/ja/platnosci" element={<Payouts />} />
          <Route path="/ja/zainteresowania" element={<Interests />} />
          <Route path="/ja/ukryte" element={<Muted />} />
          <Route path="/ja/prywatnosc" element={<Privacy />} />
          <Route path="/ja/regulamin" element={<Terms />} />
          <Route path="/moje" element={<MyListings />} />
          <Route path="/znajomi" element={<Friends />} />
          <Route path="/zastrzez" element={<Restrict />} />
          <Route path="/zaufani" element={<Trusted />} />
          <Route path="/instaluj" element={<Install />} />
          <Route path="/powiadomienia" element={<Notifications />} />
          <Route path="/ustawienia/powiadomienia" element={<NotificationSettings />} />
          <Route path="/operator" element={<Operator />} />
        </Routes>
        </Suspense>
      </main>
      <TabBar />
      <ConsentBanner />
    </div>
  )
}

/** Zgoda na piksele: dwa równorzędne przyciski, bez „zgody domyślnej”. Pokazuje się tylko, gdy piksele są skonfigurowane. */
function ConsentBanner() {
  const { t } = useStore()
  const [open, setOpen] = useState(() => hasTrackers() && getConsent() === null)
  if (!open) return null
  const choose = (v: 'granted' | 'denied') => {
    setConsent(v)
    setOpen(false)
  }
  return (
    <div className="fixed inset-x-0 z-40 mx-auto max-w-[34rem] px-3" style={{ bottom: 'calc(var(--sab) + 72px)' }} role="dialog" aria-label={t('cc.more')}>
      <div className="flex flex-col gap-3 rounded-[24px] bg-surface p-4 shadow-[0_10px_36px_rgb(20_27_45/0.2)]">
        <p className="text-[14px] leading-snug">{t('cc.text')} <Link to="/ja/prywatnosc" className="font-semibold text-link">{t('cc.more')}</Link></p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => choose('denied')} className="press min-h-11 rounded-full bg-fill text-[15px] font-bold">{t('cc.reject')}</button>
          <button type="button" onClick={() => choose('granted')} className="press min-h-11 rounded-full bg-fill text-[15px] font-bold">{t('cc.accept')}</button>
        </div>
      </div>
    </div>
  )
}

/** Każde wejście w „Dodaj” zaczyna od nowa, także po ponownym stuknięciu zakładki. */
function AddRoute() {
  const location = useLocation()
  const { addNonce } = useStore()
  return <Add key={`${location.key}-${addNonce}`} />
}

/**
 * Linki https://miliorbit.com/l/… otwierają się w aplikacji ze sklepu (App Links / Universal Links).
 * System przekazuje adres, a my zamieniamy go na ekran. W przeglądarce nic nie robi.
 */
function useDeepLinks() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!isNative()) return
    let off: (() => void) | undefined
    import('@capacitor/app').then(({ App: CapApp }) =>
      CapApp.addListener('appUrlOpen', ({ url }) => {
        const to = routeFromLink(url)
        if (to) navigate(to)
      }).then((h) => (off = () => h.remove())),
    )
    return () => off?.()
  }, [navigate])
}

/** Trwający alarm SOS albo udostępnianie lokalizacji: zawsze widać, że trwa, i jednym dotknięciem da się to zakończyć. */
function SafetyBanner() {
  const { t, account, sos, stopShare } = useStore()
  const [, tick] = useState(0)
  const left = account.share ? Math.ceil((account.share.until - Date.now()) / 60_000) : 0
  useEffect(() => {
    if (!account.share) return
    if (left <= 0) {
      stopShare()
      return
    }
    const id = window.setInterval(() => tick((n) => n + 1), 15_000)
    return () => clearInterval(id)
  }, [account.share, left]) // eslint-disable-line react-hooks/exhaustive-deps
  if (sos && !sos.endedAt) {
    return (
      <Link to="/sos" className="sticky z-30 flex items-center gap-2 bg-danger px-4 py-2.5 text-[14px] font-semibold text-white" style={{ top: 'var(--sat)' }}>
        <span className="sos-pulse size-2.5 shrink-0 rounded-full bg-white" />
        <span className="min-w-0 flex-1">{t('sos.banner')}</span>
        <span className="underline">{t('sos.open')}</span>
      </Link>
    )
  }
  if (left > 0) {
    return (
      <div className="sticky z-30 flex items-center gap-2 bg-ink px-4 py-2.5 text-[14px] text-white" style={{ top: 'var(--sat)' }}>
        <Icon name="walk" size={18} />
        <Link to="/sos" className="min-w-0 flex-1 truncate">{t('share.banner', { n: left })}</Link>
        <button type="button" onClick={stopShare} className="min-h-8 font-semibold underline">{t('share.stop')}</button>
      </div>
    )
  }
  return null
}

function RestrictedBanner() {
  const { t, account } = useStore()
  if (!account.restricted) return null
  return (
    <Link to="/zastrzez" className="sticky z-30 flex items-center gap-2 bg-danger px-4 py-2.5 text-[14px] text-white" style={{ top: 'var(--sat)' }}>
      <Icon name="lock" size={18} />
      <span className="min-w-0 flex-1">{t('r.banner')}</span>
      <span className="font-semibold underline">{t('r.unlock')}</span>
    </Link>
  )
}

/** Powiadomienie jak systemowy push (w aplikacji natywnej: prawdziwy push). */
function Toast() {
  const { toast, dismissToast } = useStore()
  if (!toast) return null
  const body = (
    <span className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-white"><Icon name="bell" size={18} /></span>
      <span className="min-w-0 flex-1 text-[15px] leading-snug">{toast.text}</span>
    </span>
  )
  const cls = 'toast-in block w-full rounded-[24px] bg-surface p-3 text-left shadow-[0_10px_36px_rgb(28_26_23/0.18)]'
  return (
    <div className="fixed inset-x-0 z-50 mx-auto max-w-[34rem] px-3" style={{ top: 'calc(var(--sat) + 8px)' }} role="status">
      {toast.link ? <Link to={toast.link} onClick={dismissToast} className={cls}>{body}</Link> : <button type="button" onClick={dismissToast} className={cls}>{body}</button>}
    </div>
  )
}

/**
 * Dolne menu jak w WhatsAppie (Material 3): płaski pasek na całą szerokość, który niczego nie zasłania,
 * 5 zakładek w zasięgu kciuka, „pigułka” pod aktywną ikoną, licznik nieprzeczytanych. „Dodaj” ma zawsze
 * kolorowe tło, bo to najważniejsza czynność. Zakładki przełączają się od razu, bez animacji.
 */
function TabBar() {
  const { t, chats, readAt, restartAdd } = useStore()
  const unread = chats.filter((c) => {
    const last = c.messages.at(-1)
    return last && last.from !== 'me' && last.at > (readAt[c.id] ?? 0)
  }).length
  const tabs = [
    { to: '/', label: t('nav.home'), icon: 'community' },
    { to: '/szukaj', label: t('nav.search'), icon: 'search' },
    { to: '/dodaj', label: t('nav.add'), icon: 'plus', onClick: restartAdd },
    { to: '/wiadomosci', label: t('nav.messages'), icon: 'chat', badge: unread },
    { to: '/ja', label: t('nav.me'), icon: 'user' },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface" style={{ paddingBottom: 'var(--sab)' }} aria-label="Menu">
      <div className="mx-auto grid h-16 max-w-[34rem] grid-cols-5">
        {tabs.map((tab) => {
          const plus = tab.icon === 'plus'
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              onClick={tab.onClick}
              aria-label={tab.label}
              className={({ isActive }) => cx('press flex min-w-0 flex-col items-center justify-center gap-1', isActive ? 'text-ink' : 'text-muted')}
            >
              {({ isActive }) => (
                <>
                  <span className={cx('relative grid h-8 w-14 place-items-center rounded-full transition-colors', plus ? 'bg-primary text-primary-ink' : isActive && 'bg-primary-soft text-primary')}>
                    <Icon name={tab.icon} size={22} strokeWidth={plus ? 2.4 : isActive ? 2.2 : 1.8} fill={isActive && !plus && tab.icon !== 'search' ? 'currentColor' : 'none'} fillOpacity={0.18} />
                    {!!tab.badge && <span className="tnum absolute -top-1 left-[calc(50%+5px)] grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-white ring-2 ring-surface">{tab.badge}</span>}
                  </span>
                  <span className={cx('max-w-full truncate px-0.5 text-[12px] leading-none', isActive ? 'font-bold' : 'font-medium')}>{tab.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
