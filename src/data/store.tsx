import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Account, AppNotification, Chat, Lang, Listing, Message, NotificationPrefs, Order, OrderStatus, Place, User } from '../lib/types'
import { relationTo, type Relation } from '../lib/circles'
import { canPublish, PLANS } from '../lib/pricing'
import { town } from '../lib/geo'
import { zl, formatPLN } from '../lib/money'
import { translator, type Key } from '../i18n'
import { ME, seedListings, seedOrders, seedUsers } from './seed'

interface State {
  account: Account
  users: Record<string, User>
  listings: Listing[]
  orders: Order[]
  chats: Chat[]
  notifications: AppNotification[]
  readAt: Record<string, number>
  friendDemoDone: boolean
}

export interface Toast {
  id: string
  text: string
  link?: string
}

const KEY = 'obok:v2'

export const DEFAULT_NOTIF: NotificationPrefs = {
  friendsNew: true,
  messages: true,
  orders: true,
  fofNew: false,
  nearby: false,
  quiet: true,
}

function initial(): State {
  const now = Date.now()
  const users = seedUsers(now)
  const { orders, chats } = seedOrders(now)
  const t = translator('pl')
  return {
    account: {
      onboarded: false,
      lang: 'pl',
      name: '',
      phone: '',
      email: '',
      place: users[0].place,
      plan: 'free',
      restricted: false,
      trusted: [],
      unlockApprovals: [],
      notif: DEFAULT_NOTIF,
      invited: [],
      contactsAllowed: false,
    },
    users: Object.fromEntries(users.map((u) => [u.id, u])),
    listings: seedListings(now, users),
    orders,
    chats,
    notifications: [
      { id: 'n1', at: now - 30 * 60_000, text: t('n.friendNew', { name: 'Kasia Nowak', title: 'Oddam regał IKEA Kallax 4×2' }), link: '/l/l8', read: false },
      { id: 'n2', at: now - 26 * 3600_000, text: t('n.restrictedFriend', { name: 'Bartek Wiśniewski' }), read: false, tone: 'warn' },
    ],
    readAt: {},
    friendDemoDone: false,
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initial(), ...JSON.parse(raw) }
  } catch {
    /* brak dostępu do pamięci przeglądarki: działamy na danych demo */
  }
  return initial()
}

const uid = () => Math.random().toString(36).slice(2, 10)

export interface PlaceOrderInput {
  listing: Listing
  qty: number
  total: number
  pay: 'blik' | 'cash'
  from?: string
  to?: string
  pickup?: string
  note?: string
}

function useStoreValue() {
  const [state, setState] = useState<State>(load)
  const [toast, setToast] = useState<Toast | null>(null)
  /** zwiększany przy każdym stuknięciu „Dodaj”, żeby formularz zaczynał od nowa */
  const [addNonce, setAddNonce] = useState(0)
  const timers = useRef<number[]>([])
  const latest = useRef(state)
  latest.current = state
  const t = useMemo(() => translator(state.account.lang), [state.account.lang])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* zbyt duże zdjęcia albo zablokowana pamięć */
    }
  }, [state])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    document.documentElement.lang = state.account.lang
  }, [state.account.lang])

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))

  const users = useMemo<Record<string, User>>(
    () => ({ ...state.users, [ME]: { ...state.users[ME], name: state.account.name || '—', place: state.account.place, restricted: state.account.restricted } }),
    [state.users, state.account.name, state.account.place, state.account.restricted],
  )
  const relation = useCallback((userId: string): Relation => relationTo(ME, userId, users), [users])

  const notify = (n: Omit<AppNotification, 'id' | 'at' | 'read'>, pref: keyof NotificationPrefs) => {
    const item = { ...n, id: uid(), at: Date.now(), read: false }
    setState((s) => ({ ...s, notifications: [item, ...s.notifications] }))
    if (latest.current.account.notif[pref]) setToast({ id: item.id, text: item.text, link: item.link })
  }

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(id)
  }, [toast])

  /* --- konto ------------------------------------------------------------ */

  const patchAccount = (patch: Partial<Account>) => setState((s) => ({ ...s, account: { ...s.account, ...patch } }))

  const finishOnboarding = (patch: Partial<Account>) => {
    patchAccount({ ...patch, onboarded: true })
    // Demo: chwilę później znajomy dodaje coś nowego i przychodzi powiadomienie.
    if (!state.friendDemoDone) {
      later(9000, () => {
        const now = Date.now()
        const listing: Listing = {
          id: 'l-trailer', ownerId: 'marek', kind: 'rent', category: 'cars', sub: 'trailer',
          title: 'Przyczepka samochodowa 750 kg', description: 'Z plandeką, wtyczka 13-pin z adapterem. Odbiór na Mokotowie.',
          price: zl(70), unit: 'day', deposit: zl(500), place: { ...town('Warszawa'), lat: 52.24, lng: 20.98 }, visibility: 2, createdAt: now,
        }
        setState((s) => ({ ...s, friendDemoDone: true, listings: [listing, ...s.listings] }))
        notify({ text: translator(latest.current.account.lang)('n.friendNew', { name: 'Marek Zieliński', title: listing.title }), link: '/l/l-trailer' }, 'friendsNew')
      })
    }
  }

  const setLang = (lang: Lang) => patchAccount({ lang })
  const setPlace = (place: Place) => patchAccount({ place })
  const setNotif = (key: keyof NotificationPrefs, value: boolean) =>
    setState((s) => ({ ...s, account: { ...s.account, notif: { ...s.account.notif, [key]: value } } }))
  const setTrusted = (trusted: string[]) => patchAccount({ trusted: trusted.slice(0, 2) })
  const buyAnnual = () => patchAccount({ plan: 'annual', planUntil: Date.now() + 365 * 86_400_000 })
  const invite = (contact: string) =>
    setState((s) => {
      const invited = [...new Set([...s.account.invited, contact])]
      // 3 zaproszenia = 3 miesiące bez limitu
      const reward = invited.length >= 3 && s.account.plan === 'free'
      return {
        ...s,
        account: { ...s.account, invited, ...(reward ? { plan: 'annual', planUntil: Date.now() + 90 * 86_400_000 } : {}) },
      }
    })

  const restrict = () => patchAccount({ restricted: true, unlockApprovals: [] })

  const requestUnlock = () => {
    const trusted = state.account.trusted
    if (trusted.length < 2) return
    trusted.forEach((id, i) =>
      later(1500 * (i + 1), () =>
        setState((s) => {
          const approvals = [...new Set([...s.account.unlockApprovals, id])]
          return { ...s, account: { ...s.account, unlockApprovals: approvals, restricted: approvals.length < 2 } }
        }),
      ),
    )
  }

  /* --- ogłoszenia --------------------------------------------------------- */

  const myActive = state.listings.filter((l) => l.ownerId === ME).length
  const canAdd = !state.account.restricted && canPublish(myActive, state.account.plan)

  const addListing = (l: Omit<Listing, 'id' | 'createdAt' | 'ownerId'>): string | null => {
    if (!canAdd) return null
    const id = uid()
    setState((s) => ({ ...s, listings: [{ ...l, id, ownerId: ME, createdAt: Date.now() }, ...s.listings] }))
    return id
  }

  /* --- czaty -------------------------------------------------------------- */

  const pushMessage = (chatId: string, msg: Omit<Message, 'id' | 'at'>) =>
    setState((s) => ({
      ...s,
      chats: s.chats.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, { ...msg, id: uid(), at: Date.now() }] } : c)),
    }))

  const openChat = (listing: Listing, other = listing.ownerId): string => {
    const existing = state.chats.find((c) => c.listingId === listing.id && c.members.includes(other) && c.members.includes(ME))
    if (existing) return existing.id
    const id = uid()
    setState((s) => ({ ...s, chats: [{ id, listingId: listing.id, members: [ME, other], messages: [] }, ...s.chats] }))
    return id
  }

  const sendMessage = (chatId: string, text: string, photo?: string) => {
    if (state.account.restricted) return
    pushMessage(chatId, { from: ME, text, photo })
    const chat = state.chats.find((c) => c.id === chatId)
    const other = chat?.members.find((m) => m !== ME)
    if (other && chat && chat.messages.filter((m) => m.from === other).length < 5) {
      later(1400, () => pushMessage(chatId, { from: other, text: autoReply(text, state.account.lang) }))
    }
  }

  const markRead = (chatId: string) => setState((s) => ({ ...s, readAt: { ...s.readAt, [chatId]: Date.now() } }))
  const markNotificationsRead = () => setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }))

  /* --- zamówienia --------------------------------------------------------- */

  const setOrder = (id: string, patch: Partial<Order>) =>
    setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) }))

  const placeOrder = ({ listing, qty, total, pay, from, to, pickup, note }: PlaceOrderInput): string | null => {
    if (state.account.restricted) return null
    const chatId = openChat(listing)
    const id = uid()
    const instantPay = listing.kind === 'sell' && pay === 'blik'
    const status: OrderStatus = listing.kind === 'sell' ? (instantPay ? 'paid' : 'accepted') : 'requested'
    const order: Order = {
      id, listingId: listing.id, buyerId: ME, sellerId: listing.ownerId, qty, total, pay, from, to, pickup, note,
      status, photosBefore: [], photosAfter: [], chatId, createdAt: Date.now(), paidAt: instantPay ? Date.now() : undefined,
    }
    setState((s) => ({ ...s, orders: [order, ...s.orders] }))
    if (note) pushMessage(chatId, { from: ME, text: note })
    pushMessage(chatId, { from: ME, orderId: id })
    const tl = translator(state.account.lang)
    // Symulacja drugiej strony w wersji demo.
    if (status === 'requested') {
      later(1800, () => {
        setOrder(id, { status: 'accepted' })
        pushMessage(chatId, { from: listing.ownerId, text: autoReply('ok', state.account.lang) })
      })
    } else if (status === 'paid') {
      later(4000, () => {
        setOrder(id, { status: 'ready' })
        pushMessage(chatId, { from: listing.ownerId, text: tl('n.ready', { title: listing.title }) })
        notify({ text: tl('n.ready', { title: listing.title }), link: `/zamowienie/${id}` }, 'orders')
      })
    }
    return id
  }

  const payOrder = (id: string) => setOrder(id, { status: 'paid', pay: 'blik', paidAt: Date.now() })

  const advanceOrder = (id: string, status: OrderStatus) => {
    setOrder(id, { status })
    const order = state.orders.find((o) => o.id === id)
    // Kupujący odbiera chwilę po spakowaniu (symulacja).
    if (order && order.sellerId === ME && status === 'ready') later(3000, () => setOrder(id, { status: 'done' }))
  }

  const addProtocolPhoto = (id: string, phase: 'before' | 'after', photo: string) =>
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) =>
        o.id !== id ? o : phase === 'before' ? { ...o, photosBefore: [...o.photosBefore, photo] } : { ...o, photosAfter: [...o.photosAfter, photo] },
      ),
    }))

  const reset = () => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* nic */
    }
    setState(initial())
  }

  const visibleListings = useMemo(
    () =>
      state.listings
        .filter((l) => l.ownerId !== ME && !users[l.ownerId]?.restricted)
        .map((l) => ({ listing: l, rel: relation(l.ownerId) }))
        .filter(({ listing, rel }) => rel.circle <= listing.visibility),
    [state.listings, users, relation],
  )

  return {
    ...state,
    users,
    t,
    toast,
    addNonce,
    restartAdd: () => setAddNonce((n) => n + 1),
    dismissToast: () => setToast(null),
    relation,
    visibleListings,
    myActive,
    canAdd,
    limit: PLANS[state.account.plan].activeListings,
    finishOnboarding,
    setLang,
    setPlace,
    setNotif,
    setTrusted,
    buyAnnual,
    invite,
    restrict,
    requestUnlock,
    addListing,
    openChat,
    sendMessage,
    markRead,
    markNotificationsRead,
    placeOrder,
    payOrder,
    advanceOrder,
    addProtocolPhoto,
    reset,
    formatPLN,
  }
}

function autoReply(text: string, lang: Lang): string {
  const replies: Record<Lang, Record<'time' | 'price' | 'thanks' | 'ok', string>> = {
    pl: { time: 'Najlepiej po 17, adres podeślę w wiadomości.', price: 'Przy większej ilości dam taniej.', thanks: '👍', ok: 'Pasuje, potwierdzam. Do zobaczenia!' },
    en: { time: 'Best after 5 pm, I’ll send the address.', price: 'I can do a better price for more.', thanks: '👍', ok: 'Works for me, confirmed. See you!' },
    de: { time: 'Am besten nach 17 Uhr, die Adresse schicke ich dir.', price: 'Bei größerer Menge mache ich es günstiger.', thanks: '👍', ok: 'Passt, bestätigt. Bis dann!' },
    uk: { time: 'Найкраще після 17:00, адресу надішлю.', price: 'При більшій кількості зроблю дешевше.', thanks: '👍', ok: 'Підходить, підтверджую. До зустрічі!' },
  }
  const r = replies[lang]
  const s = text.toLowerCase()
  if (/(kiedy|godz|odbi|when|wann|коли)/.test(s)) return r.time
  if (/(cen|tani|price|preis|ціна|дешев)/.test(s)) return r.price
  if (/(dzię|thank|danke|дяку)/.test(s)) return r.thanks
  return r.ok
}

type Store = ReturnType<typeof useStoreValue>
const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore poza StoreProvider')
  return v
}

export type { Key }
