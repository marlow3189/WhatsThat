import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Booking, BookingStatus, Chat, Listing, Message, Place, Plan, User } from '../lib/types'
import { relationTo, type Relation } from '../lib/circles'
import { ME, seedChats, seedListings, seedUsers } from './seed'

interface State {
  users: Record<string, User>
  listings: Listing[]
  bookings: Booking[]
  chats: Chat[]
  /** bieżąca lokalizacja (GPS albo miasto z profilu) */
  here: Place
  invited: string[]
  /** kiedy ostatnio otworzyłem dany czat */
  readAt: Record<string, number>
}

const KEY = 'whatsthat:v1'

function initial(): State {
  const users = Object.fromEntries(seedUsers.map((u) => [u.id, u]))
  return { users, listings: seedListings, bookings: [], chats: seedChats, here: users[ME].place, invited: [], readAt: {} }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initial(), ...JSON.parse(raw) }
  } catch {
    /* brak dostępu do storage: działamy na danych demo */
  }
  return initial()
}

const uid = () => Math.random().toString(36).slice(2, 10)

function useStoreValue() {
  const [state, setState] = useState<State>(load)
  const timers = useRef<number[]>([])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* zbyt duże zdjęcia albo zablokowany storage */
    }
  }, [state])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const me = state.users[ME]
  const relation = useCallback((userId: string): Relation => relationTo(ME, userId, state.users), [state.users])

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))

  const pushMessage = (chatId: string, msg: Omit<Message, 'id' | 'at'>) =>
    setState((s) => ({
      ...s,
      chats: s.chats.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, { ...msg, id: uid(), at: Date.now() }] } : c)),
    }))

  const openChat = (listing: Listing): string => {
    const existing = state.chats.find((c) => c.listingId === listing.id && c.members.includes(ME))
    if (existing) return existing.id
    const id = uid()
    setState((s) => ({ ...s, chats: [{ id, listingId: listing.id, members: [ME, listing.ownerId], messages: [] }, ...s.chats] }))
    return id
  }

  const sendMessage = (chatId: string, text: string, photo?: string) => {
    pushMessage(chatId, { from: ME, text, photo })
    const chat = state.chats.find((c) => c.id === chatId)
    const other = chat?.members.find((m) => m !== ME)
    if (other && chat && chat.messages.filter((m) => m.from === other).length < 4) {
      later(1400, () => pushMessage(chatId, { from: other, text: autoReply(text) }))
    }
  }

  const setBookingStatus = (bookingId: string, status: BookingStatus) =>
    setState((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)) }))

  const requestBooking = (b: Omit<Booking, 'id' | 'status' | 'photosBefore' | 'photosAfter' | 'createdAt'>, chatId: string) => {
    const id = uid()
    setState((s) => ({
      ...s,
      bookings: [{ ...b, id, status: 'requested', photosBefore: [], photosAfter: [], createdAt: Date.now() }, ...s.bookings],
    }))
    pushMessage(chatId, { from: ME, bookingId: id })
    later(1800, () => {
      setBookingStatus(id, 'accepted')
      pushMessage(chatId, { from: b.ownerId, text: 'Pasuje, akceptuję! Zrób zdjęcia przy odbiorze, ja zrobię swoje.' })
    })
    return id
  }

  const addProtocolPhoto = (bookingId: string, phase: 'before' | 'after', photo: string) =>
    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) => {
        if (b.id !== bookingId) return b
        return phase === 'before'
          ? { ...b, photosBefore: [...b.photosBefore, photo], status: b.status === 'accepted' ? 'active' : b.status }
          : { ...b, photosAfter: [...b.photosAfter, photo] }
      }),
    }))

  const addListing = (l: Omit<Listing, 'id' | 'createdAt' | 'ownerId'>) => {
    const id = uid()
    setState((s) => ({ ...s, listings: [{ ...l, id, ownerId: ME, createdAt: Date.now() }, ...s.listings] }))
    return id
  }

  const boost = (listingId: string) =>
    setState((s) => ({
      ...s,
      listings: s.listings.map((l) => (l.id === listingId ? { ...l, boostedUntil: Date.now() + 7 * 86_400_000 } : l)),
    }))

  const setPlan = (plan: Plan) => setState((s) => ({ ...s, users: { ...s.users, [ME]: { ...s.users[ME], plan } } }))
  const setHere = (here: Place) => setState((s) => ({ ...s, here }))
  const invite = (contact: string) => setState((s) => ({ ...s, invited: [...new Set([...s.invited, contact])] }))
  const markRead = (chatId: string) => setState((s) => ({ ...s, readAt: { ...s.readAt, [chatId]: Date.now() } }))
  const reset = () => setState(initial())

  return {
    ...state,
    me,
    relation,
    openChat,
    sendMessage,
    requestBooking,
    setBookingStatus,
    addProtocolPhoto,
    addListing,
    boost,
    setPlan,
    setHere,
    invite,
    markRead,
    reset,
  }
}

function autoReply(text: string): string {
  const t = text.toLowerCase()
  if (/(kiedy|godzin|odbi)/.test(t)) return 'Najlepiej po 18, adres podeślę w wiadomości.'
  if (/(cena|tanie|taniej|rabat|zniżk)/.test(t)) return 'Na dłużej niż tydzień dam 20% taniej.'
  if (/(dzięk|super|ok)/.test(t)) return '👍'
  return 'Jasne, daj znać kiedy pasuje.'
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

/** Ogłoszenia widoczne dla mnie, z wyliczonym kręgiem właściciela. */
export function useVisibleListings() {
  const { listings, relation } = useStore()
  return useMemo(
    () =>
      listings
        .filter((l) => l.ownerId !== ME)
        .map((l) => ({ listing: l, rel: relation(l.ownerId) }))
        .filter(({ listing, rel }) => rel.circle <= listing.visibility),
    [listings, relation],
  )
}
