export type Lang = 'pl' | 'en' | 'de' | 'uk' | 'cs' | 'sk' | 'hu' | 'it' | 'es'

export type Currency = 'PLN' | 'EUR' | 'USD' | 'CZK' | 'HUF' | 'UAH' | 'GBP'

/** Kręgi zaufania: 1 = znajomi, 2 = znajomi znajomych, 3 = wszyscy. */
export type Circle = 1 | 2 | 3

/** Co ktoś robi z ogłoszeniem. „wanted” = szukam. */
export type Kind = 'sell' | 'rent' | 'service' | 'give' | 'swap' | 'garage' | 'wanted'

export type Unit = 'item' | 'kg' | 'pack' | 'bag' | 'litre' | 'tonne' | 'm3' | 'hour' | 'day' | 'week' | 'month' | 'night' | 'fixed'

export type Plan = 'free' | 'annual' | 'business'

/** Sposoby przekazania. Nikogo nie ograniczamy: „other” to dowolny przewoźnik. */
export type Delivery = 'pickup' | 'inpost' | 'orlen' | 'dpd' | 'dhl' | 'poczta' | 'courier' | 'other'

export type PayMethod = 'blik' | 'transfer' | 'cash'

export interface Place {
  lat: number
  lng: number
  town: string
  /** województwo w PL, region / land / kraj związkowy gdzie indziej */
  voivodeship: string
  country?: string
}

export interface User {
  id: string
  name: string
  hue: number
  place: Place
  friends: string[]
  since: number
  restricted?: boolean
  business?: boolean
  /** po 10 udanych transakcjach bez sporów */
  trusted?: boolean
  deals?: number
  /** ma konto u operatora płatności (KYC zrobione) */
  payouts?: boolean
  /** branża, w której ktoś działa (id kategorii), pokazywana znajomym przy rejestracji */
  work?: string
  /** pseudonim widoczny dla osób spoza kręgu znajomych (zamiast imienia) */
  pseudonym?: string
  /** numer telefonu; obcy widzą tylko kierunkowy i dwie pierwsze cyfry */
  phone?: string
  /** godziny sprzedaży / pracy, np. „pon–sob 6:00–13:00” (piekarz, warzywniak) */
  hours?: string
}

/** Ulubiony dostawca z tematem, np. piekarz: „chleb i bułki”. */
export interface Favorite {
  id: string
  topic: string
}

/** Adres podajemy dopiero przy pierwszej wysyłce kurierem (minimalizacja danych). */
export interface Address {
  street: string
  postcode: string
  city: string
}

export type ListingStatus = 'active' | 'reserved' | 'sold' | 'removed'

export interface Listing {
  id: string
  ownerId: string
  kind: Kind
  category: string
  sub?: string
  title: string
  description: string
  /** w groszach / centach waluty ogłoszenia; brak = za darmo / wymiana */
  price?: number
  currency?: Currency
  unit: Unit
  condition?: 'new' | 'used'
  deal?: boolean
  /** ile zostało (rolnik); przy rzeczach pojedynczych brak */
  stock?: number
  pickupHours?: string
  delivery: Delivery[]
  shippingPrice?: number
  deposit?: number
  garageDate?: string
  swapFor?: string
  photo?: string
  place: Place
  visibility: Circle
  /** incognito: znajomi nie widzą, obcy widzą bez imienia */
  incognito?: boolean
  hiddenFrom?: string[]
  promoted?: boolean
  status: ListingStatus
  /** kiedy kupione (plakietka „Kupione” wisi jeszcze dobę) */
  soldAt?: number
  /** rolnik: „dziś niedostępne” bez kasowania */
  paused?: boolean
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
  delivery: Delivery
  lockerCode?: string
  total: number
  currency: Currency
  pay: PayMethod
  status: OrderStatus
  note?: string
  photosBefore: string[]
  photosAfter: string[]
  chatId: string
  createdAt: number
  paidAt?: number
  /**
   * Bezpieczna płatność: pieniądze czekają u licencjonowanego operatora płatności (nie u nas)
   * i trafiają do sprzedającego po odbiorze (kod odbioru) albo automatycznie po 48 h bez zgłoszenia.
   */
  handoverCode?: string
  releasedAt?: number
  refundedAt?: number
  /** wynajem: kaucja jako blokada na karcie, zwalniana po potwierdzeniu zwrotu */
  deposit?: number
  depositStatus?: 'held' | 'released' | 'claimed'
  dispute?: Dispute
}

export type DisputeReason = 'not_received' | 'not_as_described' | 'damaged' | 'not_returned' | 'deposit' | 'no_show'

/** Zgłoszony problem z transakcją: wypłata wstrzymana, druga strona ma 48 h na odpowiedź, potem mediacja. */
export interface Dispute {
  reason: DisputeReason
  by: string
  note?: string
  at: number
  status: 'open' | 'proposed' | 'mediation' | 'resolved'
  /** propozycja drugiej strony */
  proposal?: 'refund' | 'partial' | 'release'
  /** kwota zwrotu przy propozycji częściowej */
  amount?: number
  outcome?: 'refund' | 'partial' | 'release'
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

export type ReportReason = 'scam' | 'illegal' | 'fake' | 'rights' | 'offensive' | 'other'

/** Zgłoszenie treści (DSA art. 16) i decyzja z uzasadnieniem (art. 17). */
export interface Report {
  id: string
  listingId: string
  reporterId: string
  reason: ReportReason
  note?: string
  at: number
  status: 'new' | 'removed' | 'kept'
  decidedAt?: number
}

export interface Account {
  onboarded: boolean
  lang: Lang
  country: string
  currency: Currency
  name: string
  phone: string
  email: string
  place: Place
  interests: string[]
  termsAcceptedAt?: number
  plan: Plan
  planUntil?: number
  /** do kiedy darmowe konto może wystawiać (pierwszy rok gratis, potem odświeżenie 10 zł/rok) */
  refreshDue: number
  kyc: 'none' | 'pending' | 'verified'
  restricted: boolean
  trusted: string[]
  unlockApprovals: string[]
  notif: NotificationPrefs
  invited: string[]
  /** pseudonim dla osób spoza kręgu znajomych */
  pseudonym?: string
  address?: Address
  favorites: Favorite[]
  /** komunikaty o zagrożeniach (RCB, IMGW, Meteoalarm…) na głównej */
  warnings?: boolean
  /** wygląd: „color” (neutralny z kolorowymi akcentami) albo „blue” (niebieski z wersji 5) */
  skin?: 'color' | 'blue'
  /** kiedy ukryto reklamę na głównej (plan darmowy) */
  adHiddenAt?: number
  contactsAllowed: boolean
  /** osoby, których rzeczy nie chcę widzieć */
  muted: string[]
  /** znajomi „zapomniani”: nie liczą się już jako krąg 1 */
  forgotten: string[]
}
