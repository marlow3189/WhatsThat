import type { Category, Chat, Listing, Mode, Place, User } from '../lib/types'
import { CITIES } from '../lib/geo'
import { zl } from '../lib/money'

/** Przykładowe dane demo. Prawdziwa wersja bierze je z Supabase (supabase/migrations). */

const city = (name: string) => CITIES.find((c) => c.city === name)!
const near = (base: Place, dLat: number, dLng: number): Place => ({
  ...base,
  lat: base.lat + dLat,
  lng: base.lng + dLng,
})

const waw = city('Warszawa')
export const ME = 'me'

const user = (
  id: string,
  name: string,
  hue: number,
  place: Place,
  friends: string[],
  extra: Partial<User> = {},
): User => ({ id, name, hue, place, friends, rating: 4.8, reviews: 6, verified: true, plan: 'free', ...extra })

export const seedUsers: User[] = [
  user(ME, 'Ty', 24, near(waw, -0.03, 0.01), ['kasia', 'marek', 'tomek', 'ola'], { reviews: 3, rating: 5 }),
  user('kasia', 'Kasia Nowak', 330, near(waw, -0.02, 0.02), [ME, 'marek', 'ania']),
  user('marek', 'Marek Zieliński', 210, near(waw, 0.01, -0.03), [ME, 'kasia', 'ania', 'piotr'], { plan: 'pro', reviews: 41, rating: 4.9 }),
  user('tomek', 'Tomek Wójcik', 140, near(waw, 0.05, 0.04), [ME, 'ewa']),
  user('ola', 'Ola Kamińska', 280, near(waw, -0.06, -0.02), [ME, 'ewa', 'bartek']),
  user('ania', 'Ania Lewandowska', 30, near(waw, 0.02, 0.05), ['kasia', 'marek'], { reviews: 12 }),
  user('piotr', 'Piotr Dąbrowski', 190, city('Piaseczno'), ['marek'], { reviews: 19, rating: 4.7 }),
  user('ewa', 'Ewa Szymańska', 100, city('Pruszków'), ['tomek', 'ola']),
  user('bartek', 'Bartek Wiśniewski', 260, near(waw, 0.08, -0.06), ['ola'], { verified: false, reviews: 1, rating: 4 }),
  user('wypozyczalnia', 'Narzędziownia Mokotów', 45, near(waw, -0.025, 0.0), [], { plan: 'biznes', reviews: 230, rating: 4.8 }),
  user('jan', 'Jan Kowalczyk', 160, city('Kraków'), [], { reviews: 8 }),
  user('zofia', 'Zofia Mazur', 350, city('Gdańsk'), [], { reviews: 15 }),
  user('michal', 'Michał Krawczyk', 120, city('Poznań'), [], { reviews: 4 }),
  user('natalia', 'Natalia Pawlak', 300, city('Wrocław'), [], { reviews: 22, rating: 4.9 }),
]

let n = 0
const day = 86_400_000
const now = Date.UTC(2026, 9, 6)

function listing(
  ownerId: string,
  title: string,
  emoji: string,
  category: Category,
  mode: Mode,
  money: { day?: number; price?: number; deposit?: number; value?: number; swapFor?: string },
  description: string,
  extra: Partial<Listing> = {},
): Listing {
  n += 1
  const owner = seedUsers.find((u) => u.id === ownerId)!
  return {
    id: `l${n}`,
    ownerId,
    title,
    emoji,
    category,
    mode,
    pricePerDay: money.day !== undefined ? zl(money.day) : undefined,
    price: money.price !== undefined ? zl(money.price) : undefined,
    deposit: money.deposit !== undefined ? zl(money.deposit) : undefined,
    value: money.value !== undefined ? zl(money.value) : undefined,
    swapFor: money.swapFor,
    description,
    place: near(owner.place, (n % 5) * 0.002, (n % 3) * 0.002),
    visibility: 3,
    crossPost: [],
    createdAt: now - n * day * 0.7,
    ...extra,
  }
}

export const seedListings: Listing[] = [
  listing('kasia', 'Namiot 4-osobowy Coleman', '⛺', 'outdoor', 'rent', { day: 25, deposit: 200, value: 900 }, 'Używany 3 razy, z tropikiem i śledziami. Idealny na weekend nad jeziorem.', { visibility: 2 }),
  listing('marek', 'Wiertarko-wkrętarka Makita 18V', '🔧', 'narzedzia', 'rent', { day: 20, deposit: 150, value: 750 }, 'Dwie baterie, ładowarka, komplet wierteł do betonu i drewna.', { boostedUntil: now + 5 * day }),
  listing('marek', 'Myjka ciśnieniowa Kärcher K5', '💦', 'ogrod', 'rent', { day: 45, deposit: 300, value: 1600 }, 'Do kostki, elewacji i auta. Z dyszą rotacyjną.'),
  listing('tomek', 'Box dachowy Thule 420 l', '🚗', 'auto', 'rent', { day: 30, deposit: 400, value: 2200 }, 'Pasuje do większości belek. Pomogę zamontować.', { visibility: 2 }),
  listing('ola', 'Wózek spacerowy Baby Jogger', '👶', 'dzieci', 'sell', { price: 450 }, 'Mały wyrósł. Kompletny, z folią przeciwdeszczową.'),
  listing('kasia', 'Gry planszowe na wieczór', '🎲', 'dom', 'lend', { deposit: 0 }, 'Catan, Dixit, Wsiąść do pociągu. Oddaj po weekendzie.', { visibility: 1 }),
  listing('ania', 'Projektor + ekran 100"', '📽️', 'elektronika', 'rent', { day: 60, deposit: 500, value: 3000 }, 'Full HD, głośnik bluetooth w zestawie. Kino na działce.'),
  listing('piotr', 'Przyczepka samochodowa 750 kg', '🛻', 'auto', 'rent', { day: 70, deposit: 500, value: 4500 }, 'Z plandeką, homologacja, wtyczka 13-pin z adapterem.'),
  listing('ewa', 'Rower szosowy, rama 54', '🚴', 'sport', 'swap', { swapFor: 'rower gravel lub MTB' }, 'Shimano 105. Szukam wymiany na coś do jazdy po lesie.'),
  listing('bartek', 'Konsola PS5 + 2 pady', '🎮', 'elektronika', 'rent', { day: 40, deposit: 800, value: 2400 }, 'Na weekend z kumplami. Gry do dogadania.'),
  listing('wypozyczalnia', 'Młot wyburzeniowy Bosch 16 kg', '🔨', 'narzedzia', 'rent', { day: 90, deposit: 600, value: 5200 }, 'Profesjonalny sprzęt z wypożyczalni. Dłuta w cenie.'),
  listing('wypozyczalnia', 'Rusztowanie warszawskie, 4 m', '🏗️', 'narzedzia', 'rent', { day: 55, deposit: 400, value: 3500 }, 'Komplet z blatami. Dowóz w promieniu 15 km za 40 zł.'),
  listing('tomek', 'Stół i 8 krzeseł ogrodowych', '🪑', 'impreza', 'rent', { day: 50, deposit: 200, value: 1500 }, 'Na komunię, grilla, urodziny. Składane.'),
  listing('ola', 'Kajak dwuosobowy dmuchany', '🛶', 'outdoor', 'rent', { day: 50, deposit: 300, value: 1400 }, 'Z wiosłami i pompką. Mieści się w bagażniku.'),
  listing('marek', 'Kosiarka akumulatorowa', '🌱', 'ogrod', 'sell', { price: 600 }, 'Przeprowadzam się do bloku. Działa bez zarzutu.'),
  listing('jan', 'Sprzęt narciarski 170 cm', '⛷️', 'sport', 'rent', { day: 35, deposit: 300, value: 1800 }, 'Narty, buty 43, kijki. Zakopane w godzinę.'),
  listing('zofia', 'Deska SUP z wiosłem', '🏄', 'sport', 'rent', { day: 60, deposit: 400, value: 2000 }, 'Do odbioru w Brzeźnie, 5 minut od plaży.'),
  listing('michal', 'Aparat Sony A7 III + 28-70', '📷', 'elektronika', 'rent', { day: 110, deposit: 2000, value: 7000 }, 'Na wesele, sesję albo wyjazd. Dwie baterie, karta 128 GB.'),
  listing('natalia', 'Suknia wieczorowa, rozmiar 38', '👗', 'impreza', 'rent', { day: 80, deposit: 300, value: 1200 }, 'Założona raz. Pralnia po stronie wypożyczającej.'),
  listing('piotr', 'Agregat prądotwórczy 3 kW', '⚡', 'narzedzia', 'rent', { day: 65, deposit: 500, value: 2800 }, 'Na działkę i budowę. Benzyna, rozruch ręczny.'),
]

export const seedChats: Chat[] = [
  {
    id: 'c1',
    listingId: 'l1',
    members: [ME, 'kasia'],
    messages: [
      { id: 'm1', from: 'kasia', at: now - 3600_000 * 5, text: 'Hej! Widziałam, że oglądasz namiot 😊 Bierzesz na majówkę?' },
      { id: 'm2', from: ME, at: now - 3600_000 * 4, text: 'Tak, od piątku do niedzieli. Mogę odebrać w czwartek wieczorem?' },
      { id: 'm3', from: 'kasia', at: now - 3600_000 * 3, text: 'Jasne, po 18 jestem w domu.' },
    ],
  },
]
