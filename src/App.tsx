import { useEffect } from 'react'
import { HashRouter, Link, MemoryRouter, NavLink, Route, Routes, useLocation } from 'react-router'
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
import { Operator } from './screens/Operator'

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
  const { account } = useStore()
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname, account.onboarded])
  if (!account.onboarded) return <Onboarding />
  return (
    <div className="mx-auto flex min-h-full max-w-[34rem] flex-col bg-bg">
      <RestrictedBanner />
      <Toast />
      <main className="flex flex-1 flex-col pb-28">
        <Routes>
          <Route path="/" element={<Home />} />
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
      </main>
      <TabBar />
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
            <NavLink key={tab.to} to={tab.to} onClick={tab.onClick} aria-label={tab.label} className="press mx-auto grid size-[52px] place-items-center rounded-full bg-primary text-white shadow-[0_6px_16px_rgb(217_72_28/0.35)]">
              <Icon name="plus" size={26} strokeWidth={2.4} />
            </NavLink>
          ) : (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/'}
              onClick={tab.onClick}
              className={({ isActive }) => cx('press relative flex h-full flex-col items-center justify-center gap-0.5', isActive ? 'text-ink' : 'text-muted')}
            >
              {({ isActive }) => (
                <>
                  <Icon name={tab.icon} size={23} strokeWidth={isActive ? 2.3 : 1.9} />
                  <span className={cx('max-w-full truncate px-1 text-[10px]', isActive ? 'font-bold' : 'font-medium')}>{tab.label}</span>
                  {!!tab.badge && <span className="tnum absolute top-2 left-[calc(50%+4px)] grid min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-white ring-2 ring-surface">{tab.badge}</span>}
                </>
              )}
            </NavLink>
          ),
        )}
      </div>
    </nav>
  )
}
