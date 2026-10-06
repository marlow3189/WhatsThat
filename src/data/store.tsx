import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Account, AppNotification, Chat, DisputeReason, Lang, Listing, Message, NotificationPrefs, Order, OrderStatus, PayMethod, Delivery, Place, Plan, Report, ReportReason, User } from '../lib/types'
import { relationTo, type Relation } from '../lib/circles'
import { DAY, FREE_PER_MONTH, PRICES, YEAR, afterPayment, canPublish, daysLeft, effectivePlan, handoverCode, inviteMonths, isAvailable, isCommunity, isShown, listingsThisMonth, needsRefresh, renewalReminder, withBonusMonths } from '../lib/pricing'
import { relocateDemo, shiftPlace } from '../lib/demo'
import { track } from '../lib/analytics'
import { town } from '../lib/geo'
import { zl } from '../lib/money'
import { localeOf, translator } from '../i18n'
import { ME, seedListings, seedOrders, seedUsers } from './seed'

interface State {
  account: Account
  users: Record<string, User>
  listings: Listing[]
  orders: Order[]
  chats: Chat[]
  notifications: AppNotification[]
  reports: Report[]
  readAt: Record<string, number>
  /** obejrzane relacje znajomych (id ogłoszeń) */
  seen: string[]
  friendDemoDone: boolean
  remindedAt?: number
}

export interface Toast {
  id: string
  text: string
  link?: string
}

const KEY = 'orbifolk:v5'

/** Wszystko włączone (sugerowane); cisza nocna chroni przed nadmiarem. */
export const DEFAULT_NOTIF: NotificationPrefs = { friendsNew: true, messages: true, orders: true, fofNew: true, nearby: true, quiet: true }

function initial(): State {
  const now = Date.now()
  const users = seedUsers(now)
  const { orders, chats } = seedOrders(now)
  const t = translator('pl')
  return {
    account: {
      onboarded: false,
      lang: 'pl',
      country: 'PL',
      currency: 'PLN',
      name: '',
      phone: '',
      email: '',
      place: users[0].place,
      interests: [],
      plan: 'free',
      refreshDue: now + YEAR,
      kyc: 'none',
      restricted: false,
      trusted: [],
      unlockApprovals: [],
      notif: DEFAULT_NOTIF,
      invited: [],
      inviteRewards: 0,
      contactsAllowed: false,
      muted: [],
      forgotten: [],
    },
    users: Object.fromEntries(users.map((u) => [u.id, u])),
    listings: seedListings(now, users),
    orders,
    chats,
    notifications: [
      { id: 'n1', at: now - 30 * 60_000, text: t('n.friendNew', { name: 'Kasia Nowak', title: 'Oddam regał IKEA Kallax 4×2' }), link: '/l/l9', read: false },
      { id: 'n2', at: now - 26 * 3600_000, text: t('n.restrictedFriend', { name: 'Bartek Wiśniewski' }), read: false, tone: 'warn' },
    ],
    reports: [
      { id: 'Z-1042', listingId: 'l11', reporterId: 'grzegorz', reason: 'fake', note: 'Cena podejrzanie niska jak na oryginał.', at: now - 5 * 3600_000, status: 'new' },
    ],
    readAt: {},
    seen: [],
    friendDemoDone: false,
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initial(), ...JSON.parse(raw) }
  } catch {
    /* brak dostępu do pamięci: działamy na danych demo */
  }
  return initial()
}

const uid = () => Math.random().toString(36).slice(2, 10)

export interface PlaceOrderInput {
  listing: Listing
  qty: number
  total: number
  pay: PayMethod
  delivery: Delivery
  lockerCode?: string
  from?: string
  to?: string
  pickup?: string
  note?: string
}

function useStoreValue() {
  const [state, setState] = useState<State>(load)
  const [toast, setToast] = useState<Toast | null>(null)
  const [addNonce, setAddNonce] = useState(0)
  const timers = useRef<number[]>([])
  const latest = useRef(state)
  latest.current = state
  const t = useMemo(() => translator(state.account.lang), [state.account.lang])
  const locale = localeOf(state.account.lang)

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
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(id)
  }, [toast])

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))
  const patchAccount = (patch: Partial<Account>) => setState((s) => ({ ...s, account: { ...s.account, ...patch } }))

  /** Graf znajomości z uwzględnieniem „zapomnianych” kontaktów. */
  const users = useMemo<Record<string, User>>(() => {
    const forgotten = new Set(state.account.forgotten)
    const me = state.users[ME]
    return {
      ...state.users,
      [ME]: {
        ...me,
        name: state.account.name || '—',
        place: state.account.place,
        restricted: state.account.restricted,
        payouts: state.account.kyc === 'verified',
        friends: me.friends.filter((f) => !forgotten.has(f)),
      },
    }
  }, [state.users, state.account])
  const relation = useCallback((userId: string): Relation => relationTo(ME, userId, users), [users])

  const notify = (n: Omit<AppNotification, 'id' | 'at' | 'read'>, pref: keyof NotificationPrefs) => {
    const item = { ...n, id: uid(), at: Date.now(), read: false }
    setState((s) => ({ ...s, notifications: [item, ...s.notifications] }))
    if (latest.current.account.notif[pref]) setToast({ id: item.id, text: item.text, link: item.link })
  }

  /* --- plan i przypomnienia ---------------------------------------------- */

  const plan: Plan = effectivePlan(state.account)
  const left = daysLeft(state.account)
  const reminder = renewalReminder(left)
  useEffect(() => {
    if (!reminder || left === null) return
    const last = latest.current.remindedAt ?? 0
    if (Date.now() - last < DAY) return
    setState((s) => ({ ...s, remindedAt: Date.now() }))
    notify({ text: translator(latest.current.account.lang)('n.renew', { n: left }), link: '/ja' }, 'orders')
  }, [reminder]) // eslint-disable-line react-hooks/exhaustive-deps

  const buyPlan = (p: Exclude<Plan, 'free'>) => {
    patchAccount({ plan: p, planUntil: Math.max(Date.now(), effectivePlan(state.account) === p ? state.account.planUntil ?? 0 : 0) + YEAR })
    track('subscribe', { value: PRICES[state.account.currency][p] / 100, currency: state.account.currency })
  }
  /** Odświeżenie darmowego konta na kolejny rok (10 zł). */
  const refresh = () => patchAccount({ refreshDue: Math.max(Date.now(), state.account.refreshDue) + YEAR })

  /* --- konto ------------------------------------------------------------- */

  const finishOnboarding = (patch: Partial<Account>) => {
    const place = patch.place ?? state.account.place
    const polish = (patch.country ?? state.account.country) === 'PL'
    setState((s) => {
      const moved = relocateDemo(s.users, s.listings, place, polish, ME)
      return { ...s, ...moved, account: { ...s.account, ...patch, onboarded: true, termsAcceptedAt: Date.now() } }
    })
    track('sign_up')
    if (!state.friendDemoDone) {
      later(9000, () => {
        const now = Date.now()
        const listing: Listing = {
          id: 'l-trailer', ownerId: 'marek', kind: 'rent', category: 'cars', sub: 'trailer',
          title: 'Przyczepka samochodowa 750 kg', description: 'Z plandeką, wtyczka 13-pin z adapterem. Odbiór na Mokotowie.',
          price: zl(70), currency: 'PLN', unit: 'day', deposit: zl(500), delivery: ['pickup'], place: shiftPlace({ ...town('Warszawa'), lat: 52.24, lng: 20.98 }, place, polish),
          visibility: 2, status: 'active', createdAt: now,
        }
        setState((s) => ({ ...s, friendDemoDone: true, listings: [listing, ...s.listings] }))
        notify({ text: translator(latest.current.account.lang)('n.friendNew', { name: 'Marek Zieliński', title: listing.title }), link: '/l/l-trailer' }, 'friendsNew')
      })
    }
  }

  const setLang = (lang: Lang) => patchAccount({ lang })
  const setPlace = (place: Place) => patchAccount({ place })
  const setInterests = (interests: string[]) => patchAccount({ interests })
  const setNotif = (key: keyof NotificationPrefs, value: boolean) =>
    setState((s) => ({ ...s, account: { ...s.account, notif: { ...s.account.notif, [key]: value } } }))
  const setTrusted = (trusted: string[]) => patchAccount({ trusted: trusted.slice(0, 2) })

  /** Zaproszenia: każde 100 unikalnych numerów = miesiąc planu Rocznego gratis. */
  const invite = (...contacts: string[]) => {
    let months = 0
    track('invite', { count: contacts.length })
    setState((s) => {
      const invited = [...new Set([...s.account.invited, ...contacts])]
      months = inviteMonths(invited.length, s.account.inviteRewards)
      const bonus = months ? withBonusMonths(s.account, months) : {}
      return { ...s, account: { ...s.account, invited, inviteRewards: s.account.inviteRewards + months, ...bonus } }
    })
    later(50, () => months && notify({ text: translator(latest.current.account.lang)('f.bonus', { n: months }), link: '/ja' }, 'orders'))
  }
  const hideAd = () => patchAccount({ adHiddenAt: Date.now() })

  const startKyc = () => {
    patchAccount({ kyc: 'pending' })
    later(2200, () => patchAccount({ kyc: 'verified' }))
  }

  const mute = (userId: string, on: boolean) =>
    setState((s) => ({ ...s, account: { ...s.account, muted: on ? [...new Set([...s.account.muted, userId])] : s.account.muted.filter((x) => x !== userId) } }))
  const forget = (userId: string) => patchAccount({ forgotten: [...new Set([...state.account.forgotten, userId])] })

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

  const mine = state.listings.filter((l) => l.ownerId === ME && l.status !== 'removed')
  const addedThisMonth = listingsThisMonth(mine)
  const mustRefresh = needsRefresh(plan, state.account.refreshDue)
  const canAdd = !state.account.restricted && canPublish(plan, addedThisMonth, state.account.refreshDue)

  const addListing = (l: Omit<Listing, 'id' | 'createdAt' | 'ownerId' | 'status'>): string | null => {
    if (state.account.restricted || (!canAdd && !isCommunity(l))) return null
    const id = uid()
    setState((s) => ({ ...s, listings: [{ ...l, id, ownerId: ME, status: 'active', createdAt: Date.now() }, ...s.listings] }))
    track('listing_created')
    return id
  }

  const updateListing = (id: string, patch: Partial<Listing>) =>
    setState((s) => ({ ...s, listings: s.listings.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))

  const report = (listingId: string, reason: ReportReason, note?: string): string => {
    const id = `Z-${1043 + state.reports.length}`
    setState((s) => ({ ...s, reports: [{ id, listingId, reporterId: ME, reason, note, at: Date.now(), status: 'new' }, ...s.reports] }))
    return id
  }

  /** Decyzja moderatora z automatycznym uzasadnieniem dla obu stron (DSA art. 16–17). */
  const decideReport = (id: string, decision: 'removed' | 'kept') => {
    const r = state.reports.find((x) => x.id === id)
    setState((s) => ({
      ...s,
      reports: s.reports.map((x) => (x.id === id ? { ...x, status: decision, decidedAt: Date.now() } : x)),
      listings: decision === 'removed' && r ? s.listings.map((l) => (l.id === r.listingId ? { ...l, status: 'removed' } : l)) : s.listings,
    }))
  }

  /* --- czaty -------------------------------------------------------------- */

  const pushMessage = (chatId: string, msg: Omit<Message, 'id' | 'at'>) =>
    setState((s) => ({
      ...s,
      chats: s.chats.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, { ...msg, id: uid(), at: Date.now() }] } : c)),
    }))

  const openChat = (listing: Listing, other = listing.ownerId): string => {
    const existing = latest.current.chats.find((c) => c.listingId === listing.id && c.members.includes(other) && c.members.includes(ME))
    if (existing) return existing.id
    const id = uid()
    const chat: Chat = { id, listingId: listing.id, members: [ME, other], messages: [] }
    latest.current = { ...latest.current, chats: [chat, ...latest.current.chats] }
    setState((s) => ({ ...s, chats: [chat, ...s.chats] }))
    return id
  }

  const sendMessage = (chatId: string, text: string, photo?: string) => {
    if (state.account.restricted) return
    pushMessage(chatId, { from: ME, text, photo })
    const chat = latest.current.chats.find((c) => c.id === chatId)
    const other = chat?.members.find((m) => m !== ME)
    if (other && chat && chat.messages.filter((m) => m.from === other).length < 5) {
      later(1400, () => pushMessage(chatId, { from: other, text: autoReply(text, latest.current.account.lang) }))
    }
  }

  const markSeen = (listingId: string) => setState((s) => (s.seen.includes(listingId) ? s : { ...s, seen: [...s.seen, listingId] }))
  const markRead = (chatId: string) => setState((s) => ({ ...s, readAt: { ...s.readAt, [chatId]: Date.now() } }))
  const markNotificationsRead = () => setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }))

  /* --- zamówienia --------------------------------------------------------- */

  const setOrder = (id: string, patch: Partial<Order>) =>
    setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) }))

  /** Kto pierwszy zapłaci, ten ma: płatność od razu zmniejsza zapas albo rezerwuje rzecz. */
  const reserve = (listingId: string, qty: number) =>
    setState((s) => ({ ...s, listings: s.listings.map((l) => (l.id === listingId ? { ...l, ...afterPayment(l, qty) } : l)) }))

  const placeOrder = ({ listing, qty, total, pay, delivery, lockerCode, from, to, pickup, note }: PlaceOrderInput): string | null => {
    if (state.account.restricted) return null
    const current = latest.current.listings.find((l) => l.id === listing.id)
    if (!current || !isAvailable(current)) return null
    const chatId = openChat(listing)
    const id = uid()
    const online = pay !== 'cash'
    const instant = listing.kind === 'sell' && online
    const status: OrderStatus = listing.kind === 'sell' ? (instant ? 'paid' : 'requested') : 'requested'
    const order: Order = {
      id, listingId: listing.id, buyerId: ME, sellerId: listing.ownerId, qty, total, currency: listing.currency ?? 'PLN', pay, delivery, lockerCode,
      from, to, pickup, note, status, photosBefore: [], photosAfter: [], chatId, createdAt: Date.now(), paidAt: instant ? Date.now() : undefined,
      handoverCode: online ? handoverCode() : undefined,
      deposit: listing.kind === 'rent' ? listing.deposit : undefined,
    }
    setState((s) => ({ ...s, orders: [order, ...s.orders] }))
    if (instant) {
      reserve(listing.id, qty)
      track('purchase', { value: total / 100, currency: order.currency })
    }
    if (note) pushMessage(chatId, { from: ME, text: note })
    pushMessage(chatId, { from: ME, orderId: id })
    const tl = translator(state.account.lang)
    if (status === 'requested') {
      later(1800, () => {
        setOrder(id, { status: 'accepted' })
        pushMessage(chatId, { from: listing.ownerId, text: autoReply('ok', latest.current.account.lang) })
      })
    } else {
      later(4000, () => {
        setOrder(id, { status: 'ready' })
        pushMessage(chatId, { from: listing.ownerId, text: tl('n.ready', { title: listing.title }) })
        notify({ text: tl('n.ready', { title: listing.title }), link: `/zamowienie/${id}` }, 'orders')
      })
    }
    return id
  }

  const payOrder = (id: string, pay: PayMethod) => {
    const order = state.orders.find((o) => o.id === id)
    setOrder(id, { status: 'paid', pay, paidAt: Date.now(), handoverCode: order?.handoverCode ?? handoverCode(), depositStatus: order?.deposit ? 'held' : undefined })
    if (order) reserve(order.listingId, order.qty)
  }

  /** „Odebrane”: operator płatności wypłaca sprzedającemu, kaucja (blokada na karcie) zostaje zwolniona. */
  const advanceOrder = (id: string, status: OrderStatus) => {
    const order = state.orders.find((o) => o.id === id)
    const done = status === 'done' && order
    setOrder(id, {
      status,
      ...(done && order.paidAt && !order.dispute ? { releasedAt: Date.now() } : {}),
      ...(done && order.depositStatus === 'held' ? { depositStatus: 'released' as const } : {}),
    })
    if (order && order.sellerId === ME && status === 'ready') later(3000, () => setOrder(id, { status: 'done', releasedAt: order.paidAt ? Date.now() : undefined }))
    if (order && order.sellerId === ME && status === 'accepted' && order.pay === 'cash') reserve(order.listingId, order.qty)
  }

  /**
   * Zgłoszenie problemu: wypłata albo kaucja zostają wstrzymane u operatora płatności,
   * druga strona ma 48 h na odpowiedź (w demo odpowiada po chwili), potem mediacja.
   */
  const openDispute = (id: string, reason: DisputeReason, note?: string) => {
    const order = state.orders.find((o) => o.id === id)
    if (!order) return
    const tl = translator(state.account.lang)
    setOrder(id, { dispute: { reason, by: ME, note, at: Date.now(), status: 'open' }, ...(order.depositStatus === 'held' && reason === 'damaged' ? { depositStatus: 'held' } : {}) })
    pushMessage(order.chatId, { from: ME, text: `${tl('d.opened')}: ${tl(`d.r.${reason}`)}${note ? ` — ${note}` : ''}` })
    const other = order.buyerId === ME ? order.sellerId : order.buyerId
    later(2500, () => {
      const proposal = reason === 'damaged' && order.sellerId === ME ? 'partial' : 'refund'
      setState((s) => ({
        ...s,
        orders: s.orders.map((o) => (o.id === id && o.dispute ? { ...o, dispute: { ...o.dispute, status: 'proposed', proposal, amount: proposal === 'partial' ? Math.round((o.deposit ?? o.total) / 2) : o.total } } : o)),
      }))
      pushMessage(order.chatId, { from: other, text: tl('d.otherReply') })
      notify({ text: tl('d.proposalIn'), link: `/zamowienie/${id}` }, 'orders')
    })
  }

  /** Przyjęcie propozycji kończy spór; odrzucenie przekazuje sprawę do mediacji (decyzja w 5 dni roboczych). */
  const settleDispute = (id: string, accept: boolean) =>
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => {
        if (o.id !== id || !o.dispute) return o
        if (!accept) return { ...o, dispute: { ...o.dispute, status: 'mediation' } }
        const outcome = o.dispute.proposal ?? 'refund'
        return {
          ...o,
          status: outcome === 'refund' ? 'cancelled' : 'done',
          refundedAt: outcome === 'refund' ? Date.now() : o.refundedAt,
          releasedAt: outcome !== 'refund' ? Date.now() : o.releasedAt,
          depositStatus: o.depositStatus === 'held' ? (outcome === 'partial' ? 'claimed' : 'released') : o.depositStatus,
          dispute: { ...o.dispute, status: 'resolved', outcome },
        }
      }),
      // zwrot za rzecz, której nie było: ogłoszenie wraca do oferty
      listings: s.listings.map((l) => {
        const o = s.orders.find((x) => x.id === id)
        return accept && o?.listingId === l.id && o.dispute?.proposal === 'refund' && l.status === 'sold' ? { ...l, status: 'active', soldAt: undefined, stock: l.stock === undefined ? undefined : l.stock + o.qty } : l
      }),
    }))

  const addProtocolPhoto = (id: string, phase: 'before' | 'after', photo: string) =>
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => (o.id !== id ? o : phase === 'before' ? { ...o, photosBefore: [...o.photosBefore, photo] } : { ...o, photosAfter: [...o.photosAfter, photo] })),
    }))

  const reset = () => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* nic */
    }
    setState(initial())
  }

  /** Co widzę: krąg, wyciszeni, ukryte przede mną, incognito (znajomi nie widzą). */
  const visibleListings = useMemo(() => {
    const muted = new Set(state.account.muted)
    return state.listings
      .filter((l) => l.ownerId !== ME && isShown(l) && !users[l.ownerId]?.restricted && !muted.has(l.ownerId))
      .filter((l) => !l.hiddenFrom?.includes(ME))
      .map((l) => ({ listing: l, rel: relation(l.ownerId) }))
      .filter(({ listing, rel }) => (listing.incognito ? rel.circle === 3 : rel.circle <= listing.visibility))
  }, [state.listings, state.account.muted, users, relation])

  return {
    ...state,
    users,
    t,
    locale,
    toast,
    dismissToast: () => setToast(null),
    addNonce,
    restartAdd: () => setAddNonce((n) => n + 1),
    relation,
    visibleListings,
    plan,
    daysLeft: left,
    reminder,
    mine,
    addedThisMonth,
    freeLimit: FREE_PER_MONTH,
    canAdd,
    mustRefresh,
    finishOnboarding,
    setLang,
    setPlace,
    setInterests,
    setNotif,
    setTrusted,
    buyPlan,
    refresh,
    invite,
    hideAd,
    startKyc,
    mute,
    forget,
    restrict,
    requestUnlock,
    addListing,
    updateListing,
    report,
    decideReport,
    openChat,
    sendMessage,
    markRead,
    markSeen,
    markNotificationsRead,
    placeOrder,
    payOrder,
    advanceOrder,
    openDispute,
    settleDispute,
    addProtocolPhoto,
    reset,
  }
}

function autoReply(text: string, lang: Lang): string {
  const r: Record<string, [string, string, string, string]> = {
    pl: ['Najlepiej po 17, adres podeślę w wiadomości.', 'Przy większej ilości dam taniej.', '👍', 'Pasuje, potwierdzam. Do zobaczenia!'],
    en: ['Best after 5 pm, I’ll send the address.', 'I can do a better price for more.', '👍', 'Works for me, confirmed. See you!'],
    de: ['Am besten nach 17 Uhr, die Adresse schicke ich dir.', 'Bei größerer Menge mache ich es günstiger.', '👍', 'Passt, bestätigt. Bis dann!'],
    uk: ['Найкраще після 17:00, адресу надішлю.', 'При більшій кількості зроблю дешевше.', '👍', 'Підходить, підтверджую. До зустрічі!'],
    cs: ['Nejlépe po 17. hodině, adresu pošlu.', 'Při větším množství dám slevu.', '👍', 'Hodí se, potvrzuji. Uvidíme se!'],
    sk: ['Najlepšie po 17. hodine, adresu pošlem.', 'Pri väčšom množstve dám zľavu.', '👍', 'Hodí sa, potvrdzujem. Uvidíme sa!'],
    hu: ['Legjobb 17 óra után, a címet elküldöm.', 'Nagyobb mennyiségnél olcsóbban adom.', '👍', 'Rendben, visszaigazolom. Találkozunk!'],
    it: ['Meglio dopo le 17, ti mando l’indirizzo.', 'Per quantità maggiori faccio uno sconto.', '👍', 'Va bene, confermato. A presto!'],
    es: ['Mejor después de las 17, te paso la dirección.', 'Si llevas más, te lo dejo más barato.', '👍', 'Me va bien, confirmado. ¡Hasta luego!'],
  }
  const [time, price, thanks, ok] = r[lang] ?? r.pl
  const s = text.toLowerCase()
  if (/(kiedy|godz|odbi|when|wann|коли|kdy|kedy|mikor|quando|cuándo)/.test(s)) return time
  if (/(cen|tani|price|preis|ціна|cena|ár|prezzo|precio)/.test(s)) return price
  if (/(dzię|thank|danke|дяку|děkuj|ďakuj|köszön|grazie|gracias)/.test(s)) return thanks
  return ok
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
