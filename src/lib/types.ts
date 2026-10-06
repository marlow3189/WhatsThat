/** Kręgi zaufania: 1 = znajomi, 2 = znajomi znajomych, 3 = market publiczny. */
export type Circle = 1 | 2 | 3

/** Co można zrobić z ogłoszeniem. */
export type Mode = 'rent' | 'sell' | 'lend' | 'swap'

export type Category =
  | 'narzedzia'
  | 'ogrod'
  | 'outdoor'
  | 'sport'
  | 'auto'
  | 'elektronika'
  | 'dom'
  | 'impreza'
  | 'dzieci'
  | 'inne'

export interface Place {
  lat: number
  lng: number
  city: string
  voivodeship: string
}

export interface User {
  id: string
  name: string
  hue: number
  place: Place
  rating: number
  reviews: number
  verified: boolean
  friends: string[]
  plan: Plan
  bio?: string
}

export type Plan = 'free' | 'pro' | 'biznes'

export interface Listing {
  id: string
  ownerId: string
  title: string
  description: string
  category: Category
  mode: Mode
  /** grosze za dzień (wynajem) */
  pricePerDay?: number
  /** grosze (sprzedaż) */
  price?: number
  /** grosze, blokada na karcie, nie pobranie */
  deposit?: number
  /** wartość rzeczy w groszach — podstawa ochrony */
  value?: number
  swapFor?: string
  emoji: string
  photo?: string
  place: Place
  /** najszerszy krąg, który widzi ogłoszenie */
  visibility: Circle
  crossPost: CrossPostTarget[]
  createdAt: number
  boostedUntil?: number
}

export type CrossPostTarget = 'olx' | 'allegro' | 'ebay' | 'vinted' | 'facebook'

export type BookingStatus = 'requested' | 'accepted' | 'active' | 'returned' | 'declined'

export interface Booking {
  id: string
  listingId: string
  renterId: string
  ownerId: string
  from: string
  to: string
  circle: Circle
  protection: boolean
  quote: Quote
  status: BookingStatus
  photosBefore: string[]
  photosAfter: string[]
  createdAt: number
}

export interface Message {
  id: string
  from: string
  at: number
  text?: string
  bookingId?: string
  photo?: string
  system?: boolean
}

export interface Chat {
  id: string
  listingId: string
  members: [string, string]
  messages: Message[]
}

export interface QuoteLine {
  label: string
  amount: number
  hint?: string
}

export interface Quote {
  /** co płaci biorący (bez kaucji) */
  total: number
  /** co dostaje właściciel */
  ownerPayout: number
  /** przychód platformy brutto (opłata serwisowa + marża z ochrony) */
  platformRevenue: number
  /** szacowany koszt operatora płatności */
  processingCost: number
  /** przychód platformy po kosztach płatności */
  platformNet: number
  /** blokada na karcie, zwalniana po zwrocie */
  depositHold: number
  lines: QuoteLine[]
  inApp: boolean
}
