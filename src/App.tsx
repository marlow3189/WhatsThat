import type { ReactNode } from 'react'
import { HashRouter, MemoryRouter, NavLink, Route, Routes } from 'react-router'
import { StoreProvider, useStore } from './data/store'
import { cx } from './components/ui'
import { Discover } from './screens/Discover'
import { ListingScreen } from './screens/Listing'
import { AddListing } from './screens/AddListing'
import { Chats, ChatScreen } from './screens/Chats'
import { CircleScreen } from './screens/Circle'
import { Profile } from './screens/Profile'
import { Protocol } from './screens/Protocol'

// Podgląd jednoplikowy działa w ramce bez dostępu do adresu, więc trasy trzyma w pamięci.
const Router = import.meta.env.MODE === 'preview' ? MemoryRouter : HashRouter

export function App() {
  return (
    <StoreProvider>
      <Router>
        <div className="mx-auto flex min-h-full max-w-[34rem] flex-col bg-bg sm:border-x sm:border-line">
          <main className="flex flex-1 flex-col pb-24">
            <Routes>
              <Route path="/" element={<Discover />} />
              <Route path="/l/:id" element={<ListingScreen />} />
              <Route path="/dodaj" element={<AddListing />} />
              <Route path="/czaty" element={<Chats />} />
              <Route path="/czat/:id" element={<ChatScreen />} />
              <Route path="/krag" element={<CircleScreen />} />
              <Route path="/ja" element={<Profile />} />
              <Route path="/protokol/:id" element={<Protocol />} />
            </Routes>
          </main>
          <TabBar />
        </div>
      </Router>
    </StoreProvider>
  )
}

function TabBar() {
  const { chats, readAt } = useStore()
  const unread = chats.filter((c) => {
    const last = c.messages.at(-1)
    return last && last.from !== 'me' && last.at > (readAt[c.id] ?? 0)
  }).length
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[34rem] border-t border-line bg-surface/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Główna nawigacja"
    >
      <div className="grid grid-cols-5 items-end px-2 pt-1.5 pb-2">
        <Tab to="/" label="Odkrywaj" icon={<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35" />} />
        <Tab to="/krag" label="Krąg" icon={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>} />
        <NavLink to="/dodaj" className="flex flex-col items-center gap-0.5" aria-label="Dodaj ogłoszenie">
          <span className="-mt-5 grid size-13 place-items-center rounded-2xl bg-brand text-brand-ink shadow-lg">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </span>
          <span className="text-[11px] font-semibold text-muted">Dodaj</span>
        </NavLink>
        <Tab to="/czaty" label="Czaty" badge={unread} icon={<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />} />
        <Tab to="/ja" label="Ja" icon={<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>} />
      </div>
    </nav>
  )
}

function Tab({ to, label, icon, badge }: { to: string; label: string; icon: ReactNode; badge?: number }) {
  return (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => cx('relative flex flex-col items-center gap-0.5 py-1', isActive ? 'text-brand' : 'text-muted')}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {icon}
      </svg>
      <span className="text-[11px] font-semibold">{label}</span>
      {!!badge && (
        <span className="absolute top-0 right-[calc(50%-18px)] grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-ink">{badge}</span>
      )}
    </NavLink>
  )
}
