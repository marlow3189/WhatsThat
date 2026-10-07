import { Suspense, lazy, useEffect, useState, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
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
  if (!account.onboarded) return <Onboarding />
  return (
    <div className="mx-auto flex min-h-full max-w-[34rem] flex-col bg-bg">
      <RestrictedBanner />
      <Toast />
      <main className="flex flex-1 flex-col pb-28">
        <Suspense fallback={<div className="grid flex-1 place-items-center p-10 text-muted" aria-busy="true">…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/u/:id" element={<Profile />} />
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
    <div className="fixed inset-x-0 bottom-24 z-40 mx-auto max-w-[34rem] px-3" role="dialog" aria-label={t('cc.more')}>
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

function RestrictedBanner() {
  const { t, account } = useStore()
  if (!account.restricted) return null
  return (
    <Link to="/zastrzez" className="sticky top-0 z-30 flex items-center gap-2 bg-danger px-4 py-2.5 text-[14px] text-white">
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
    <div className="fixed inset-x-0 z-50 mx-auto max-w-[34rem] px-3" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }} role="status">
      {toast.link ? <Link to={toast.link} onClick={dismissToast} className={cls}>{body}</Link> : <button type="button" onClick={dismissToast} className={cls}>{body}</button>}
    </div>
  )
}

/** Pływający pasek zakładek jak w iOS 26. */
function TabBar() {
  const { t, chats, readAt, restartAdd } = useStore()
  const navigate = useNavigate()
  /** Płynne przejście między zakładkami (View Transitions API); bez wsparcia w przeglądarce zwykła nawigacja. */
  const go = (to: string, extra?: () => void) => (e: MouseEvent) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    extra?.()
    if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    e.preventDefault()
    doc.startViewTransition(() => flushSync(() => navigate(to)))
  }
  const unread = chats.filter((c) => {
    const last = c.messages.at(-1)
    return last && last.from !== 'me' && last.at > (readAt[c.id] ?? 0)
  }).length
  const tabs = [
    { to: '/', label: t('nav.home'), icon: 'home' },
    { to: '/szukaj', label: t('nav.search'), icon: 'search' },
    { to: '/dodaj', label: t('nav.add'), icon: 'plus', onClick: restartAdd },
    { to: '/wiadomosci', label: t('nav.messages'), icon: 'chat', badge: unread },
    { to: '/ja', label: t('nav.me'), icon: 'user' },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[34rem] px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }} aria-label="Menu">
      <div className="grid h-[68px] grid-cols-5 items-center rounded-full bg-surface/95 px-1.5 shadow-[0_10px_36px_rgb(28_26_23/0.14)] backdrop-blur-xl">
        {tabs.map((tab) =>
          tab.icon === 'plus' ? (
            <NavLink key={tab.to} to={tab.to} onClick={go(tab.to, tab.onClick)} aria-label={tab.label} className="press mx-auto grid size-[52px] place-items-center rounded-full bg-primary text-white shadow-[0_6px_16px_rgb(18_19_22/0.3)]">
              <Icon name="plus" size={26} strokeWidth={2.4} />
            </NavLink>
          ) : (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              onClick={go(tab.to, tab.onClick)}
              className={({ isActive }) => cx('press relative flex h-full flex-col items-center justify-center gap-0.5', isActive ? 'text-primary' : 'text-muted')}
            >
              {({ isActive }) => (
                <>
                  <Icon name={tab.icon} size={23} strokeWidth={isActive ? 2.3 : 1.9} />
                  <span className={cx('max-w-full truncate px-1 text-[10px]', isActive ? 'font-bold' : 'font-medium')}>{tab.label}</span>
                  {!!tab.badge && <span className="tnum absolute top-2 left-[calc(50%+4px)] grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[11px] font-bold text-white ring-2 ring-surface">{tab.badge}</span>}
                </>
              )}
            </NavLink>
          ),
        )}
      </div>
    </nav>
  )
}
