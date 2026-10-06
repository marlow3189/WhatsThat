export type Lang = 'pl' | 'en' | 'de' | 'uk'

/** Kręgi zaufania: 1 = znajomi, 2 = znajomi znajomych, 3 = wszyscy. */
export type Circle = 1 | 2 | 3

/** Co ktoś robi z ogłoszeniem. */
export type Kind = 'sell' | 'rent' | 'service' | 'give' | 'swap' | 'garage'

export type Unit = 'item' | 'kg' | 'pack' | 'hour' | 'day' | 'week' | 'month' | 'night' | 'fixed'

export type Plan = 'free' | 'annual'

export interface Place {
  lat: number
  lng: number
  town: string
  voivodeship: string
}

export interface User {
  id: string
  name: string
  /** ostatnie cyfry do wyświetlania znajomym, pełny numer nigdy nie trafia do obcych */
  phoneTail: string
  hue: number
  place: Place
  friends: string[]
  since: number
  restricted?: boolean
  business?: boolean
}

export interface Listing {
  id: string
  ownerId: string
  kind: Kind
  category: string
  sub?: string
  title: string
  description: string
  /** grosze; brak = za darmo / wymiana */
  price?: number
  unit: Unit
  condition?: 'new' | 'used'
  deal?: boolean
  /** ile sztuk / kg zostało (np. rolnik) */
  stock?: number
  pickupHours?: string
  shipping?: boolean
  /** grosze, informacyjnie: płatna właścicielowi, nie przez nas */
  deposit?: number
  garageDate?: string
  swapFor?: string
  photo?: string
  place: Place
  visibility: Circle
  createdAt: number
}

export type OrderStatus = 'requested' | 'accepted' | 'paid' | 'ready' | 'done' | 'cancelled'

export interface Order {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  qty: number
  from?: string
  to?: string
  pickup?: string
  total: number
  pay: 'blik' | 'cash'
  status: OrderStatus
  note?: string
  photosBefore: string[]
  photosAfter: string[]
  chatId: string
  createdAt: number
  paidAt?: number
}

export interface Message {
  id: string
  from: string
  at: number
  text?: string
  photo?: string
  orderId?: string
}

export interface Chat {
  id: string
  listingId: string
  members: [string, string]
  messages: Message[]
}

export interface NotificationPrefs {
  friendsNew: boolean
  messages: boolean
  orders: boolean
  fofNew: boolean
  nearby: boolean
  quiet: boolean
}

export interface AppNotification {
  id: string
  at: number
  text: string
  link?: string
  read: boolean
  tone?: 'warn'
}

export interface Account {
  onboarded: boolean
  lang: Lang
  name: string
  phone: string
  email: string
  place: Place
  plan: Plan
  planUntil?: number
  restricted: boolean
  trusted: string[]
  unlockApprovals: string[]
  notif: NotificationPrefs
  invited: string[]
  contactsAllowed: boolean
}
