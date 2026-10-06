import type { ReactNode } from 'react'
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
import { Me, MyListings, NotificationSettings, Orders } from './screens/Me'
import { Friends, Install, Notifications, Restrict, Trusted } from './screens/Safety'

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
  if (!account.onboarded) return <Onboarding />
  return (
    <div className="mx-auto flex min-h-full max-w-[34rem] flex-col bg-bg sm:border-x sm:border-line">
      <RestrictedBanner />
      <Toast />
      <main className="flex flex-1 flex-col pb-24">
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
          <Route path="/moje" element={<MyListings />} />
          <Route path="/znajomi" element={<Friends />} />
          <Route path="/zastrzez" element={<Restrict />} />
          <Route path="/zaufani" element={<Trusted />} />
          <Route path="/instaluj" element={<Install />} />
          <Route path="/powiadomienia" element={<Notifications />} />
          <Route path="/ustawienia/powiadomienia" element={<NotificationSettings />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  )
}

/** Każde wejście w „Dodaj” zaczyna od nowa, także po stuknięciu zakładki ponownie. */
function AddRoute() {
  const location = useLocation()
  const { addNonce } = useStore()
  return <Add key={`${location.key}-${addNonce}`} />
}

function RestrictedBanner() {
  const { t, account } = useStore()
  if (!account.restricted) return null
  return (
    <Link to="/zastrzez" className="flex items-center gap-2 bg-danger px-4 py-2.5 text-[14px] text-white">
      <Icon name="lock" size={18} />
      <span className="min-w-0 flex-1">{t('r.banner')}</span>
      <span className="font-semibold underline">{t('r.unlock')}</span>
    </Link>
  )
}

/** Powiadomienie w stylu systemowego pusha (w aplikacji natywnej: prawdziwy push). */
function Toast() {
  const { toast, dismissToast } = useStore()
  if (!toast) return null
  const body = (
    <span className="flex items-start gap-3">
      <Icon name="bell" className="mt-0.5 shrink-0 text-accent" />
      <span className="min-w-0 flex-1 text-[15px]">{toast.text}</span>
    </span>
  )
  return (
    <div className="fixed inset-x-0 z-50 mx-auto max-w-[34rem] px-3" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }} role="status">
      {toast.link ? (
        <Link to={toast.link} onClick={dismissToast} className="toast-in block rounded-2xl border border-line bg-surface p-3.5 shadow-lg">{body}</Link>
      ) : (
        <button type="button" onClick={dismissToast} className="toast-in block w-full rounded-2xl border border-line bg-surface p-3.5 text-left shadow-lg">{body}</button>
      )}
    </div>
  )
}

function TabBar() {
  const { t, chats, readAt, restartAdd } = useStore()
  const unread = chats.filter((c) => {
    const last = c.messages.at(-1)
    return last && last.from !== 'me' && last.at > (readAt[c.id] ?? 0)
  }).length
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[34rem] border-t border-line bg-surface/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Menu"
    >
      <div className="grid h-16 grid-cols-5">
        <Tab to="/" label={t('nav.home')} icon="home" />
        <Tab to="/szukaj" label={t('nav.search')} icon="search" />
        <Tab to="/dodaj" label={t('nav.add')} icon="plus" onClick={restartAdd} />
        <Tab to="/wiadomosci" label={t('nav.messages')} icon="chat" badge={unread} />
        <Tab to="/ja" label={t('nav.me')} icon="user" />
      </div>
    </nav>
  )
}

function Tab({ to, label, icon, badge, onClick }: { to: string; label: string; icon: string; badge?: number; onClick?: () => void }): ReactNode {
  return (
    <NavLink to={to} onClick={onClick} end={to === '/'} className={({ isActive }) => cx('relative flex flex-col items-center justify-center gap-0.5', isActive ? 'text-accent' : 'text-muted')}>
      <Icon name={icon} size={24} />
      <span className="max-w-full truncate px-1 text-[11px] font-medium">{label}</span>
      {!!badge && <span className="tnum absolute top-1.5 left-[calc(50%+6px)] grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-ink">{badge}</span>}
    </NavLink>
  )
}
