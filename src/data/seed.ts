import type { Chat, Kind, Listing, Order, Place, Unit, User } from '../lib/types'
import { town } from '../lib/geo'
import { zl } from '../lib/money'

/** Dane demo. W produkcji pochodzą z Supabase (supabase/migrations). */

export const ME = 'me'

const near = (base: Place, dLat: number, dLng: number): Place => ({ ...base, lat: base.lat + dLat, lng: base.lng + dLng })
const waw = town('Warszawa')
const min = 60_000
const hour = 60 * min
const day = 24 * hour

const user = (id: string, name: string, hue: number, place: Place, friends: string[], extra: Partial<User> = {}): User => ({
  id, name, hue, place, friends, phoneTail: String(10 + ((hue * 7) % 89)), since: Date.UTC(2026, 3, 1), ...extra,
})

export function seedUsers(now: number): User[] {
  return [
    user(ME, '', 24, near(waw, -0.03, 0.01), ['kasia', 'marek', 'tomek', 'ola', 'bartek']),
    user('kasia', 'Kasia Nowak', 330, near(waw, -0.02, 0.02), [ME, 'marek', 'ania']),
    user('marek', 'Marek Zieliński', 210, near(waw, 0.01, -0.03), [ME, 'kasia', 'ania', 'jozef']),
    user('tomek', 'Tomek Wójcik', 140, near(waw, 0.05, 0.04), [ME, 'ewa']),
    user('ola', 'Ola Kamińska', 280, near(waw, -0.06, -0.02), [ME, 'ewa']),
    user('bartek', 'Bartek Wiśniewski', 260, near(waw, 0.08, -0.06), [ME, 'ola'], { restricted: true, since: now - 400 * day }),
    user('ania', 'Ania Lewandowska', 30, near(waw, 0.02, 0.05), ['kasia', 'marek']),
    user('jozef', 'Józef Malinowski', 95, town('Tarczyn'), ['marek']),
    user('ewa', 'Ewa Szymańska', 100, town('Pruszków'), ['tomek', 'ola']),
    user('kwatery', 'Kwatery Piaseczno', 190, town('Piaseczno'), [], { business: true }),
    user('wypozyczalnia', 'Wypożyczalnia Mokotów', 45, near(waw, -0.025, 0), [], { business: true }),
    user('grzegorz', 'Grzegorz Pawlak', 160, town('Konstancin-Jeziorna'), []),
    user('iryna', 'Iryna Bondarenko', 300, near(waw, 0.03, -0.01), []),
    user('jan', 'Jan Kowalczyk', 120, town('Kraków'), []),
    user('zofia', 'Zofia Mazur', 350, town('Gdańsk'), []),
    user('michal', 'Michał Krawczyk', 70, town('Poznań'), []),
    user('natalia', 'Natalia Kaczmarek', 320, town('Wrocław'), []),
  ]
}

interface Seed {
  owner: string
  kind: Kind
  category: string
  sub?: string
  title: string
  description: string
  price?: number
  unit?: Unit
  ago: number
  extra?: Partial<Listing>
}

export function seedListings(now: number, users: User[]): Listing[] {
  const items: Seed[] = [
    { owner: 'kasia', kind: 'rent', category: 'sport', sub: 'camping', title: 'Namiot 4-osobowy Coleman', description: 'Używany trzy razy, z tropikiem i śledziami. Idealny na weekend nad jeziorem.', price: 25, unit: 'day', ago: 2 * hour, extra: { deposit: zl(200), visibility: 2 } },
    { owner: 'marek', kind: 'rent', category: 'tools', sub: 'power', title: 'Wiertarko-wkrętarka Makita 18V', description: 'Dwie baterie, ładowarka, komplet wierteł do betonu i drewna.', price: 20, unit: 'day', ago: 5 * hour, extra: { deposit: zl(150) } },
    { owner: 'jozef', kind: 'sell', category: 'farm', sub: 'eggs', title: 'Jajka od kur z wolnego wybiegu', description: 'Zbierane codziennie rano. Kury chodzą po sadzie. Odbiór w gospodarstwie albo w sobotę na targu w Piasecznie.', price: 1.2, unit: 'item', ago: 3 * hour, extra: { stock: 180, pickupHours: 'pon–sob 16:00–19:00', visibility: 3 } },
    { owner: 'jozef', kind: 'sell', category: 'farm', sub: 'veg', title: 'Ziemniaki Vineta, worek albo na kilogramy', description: 'Tegoroczne, nie pryskane po kwitnieniu. Mogę przesypać do Twojej torby.', price: 2.5, unit: 'kg', ago: 1 * day, extra: { stock: 400, pickupHours: 'pon–sob 16:00–19:00' } },
    { owner: 'jozef', kind: 'sell', category: 'farm', sub: 'honey', title: 'Miód wielokwiatowy 1 l', description: 'Z własnej pasieki, słoik 1,3 kg.', price: 55, unit: 'item', ago: 2 * day, extra: { stock: 24, pickupHours: 'pon–sob 16:00–19:00' } },
    { owner: 'tomek', kind: 'rent', category: 'cars', sub: 'carcare', title: 'Box dachowy Thule 420 l', description: 'Pasuje do większości belek. Pomogę zamontować.', price: 30, unit: 'day', ago: 9 * hour, extra: { deposit: zl(400), visibility: 2 } },
    { owner: 'ola', kind: 'sell', category: 'kids', sub: 'strollers', title: 'Wózek spacerowy Baby Jogger', description: 'Mały wyrósł. Kompletny, z folią przeciwdeszczową.', price: 450, unit: 'fixed', ago: 1 * day, extra: { condition: 'used' } },
    { owner: 'kasia', kind: 'give', category: 'home', sub: 'furniture', title: 'Oddam regał IKEA Kallax 4×2', description: 'Biały, w dobrym stanie. Trzeba odebrać samemu, 2. piętro bez windy.', ago: 30 * min, extra: { visibility: 2 } },
    { owner: 'ola', kind: 'sell', category: 'fashion', sub: 'women', title: 'Kurtka zimowa The North Face, M', description: 'Noszona jeden sezon. Mogę wysłać paczkomatem.', price: 260, unit: 'fixed', ago: 4 * day, extra: { condition: 'used', shipping: true } },
    { owner: 'kwatery', kind: 'rent', category: 'homes', sub: 'workers', title: 'Kwatery pracownicze, 12 miejsc', description: 'Pokoje 2- i 3-osobowe, kuchnia, pralka, parking dla busa. Faktura VAT. Minimum tydzień.', price: 35, unit: 'night', ago: 6 * day },
    { owner: 'grzegorz', kind: 'sell', category: 'cars', sub: 'car', title: 'Skoda Octavia III 1.6 TDI, 2016', description: '214 000 km, serwisowana w ASO, drugi właściciel. Do obejrzenia w Konstancinie.', price: 32900, unit: 'fixed', ago: 2 * day, extra: { condition: 'used' } },
    { owner: 'iryna', kind: 'service', category: 'services', sub: 'clean', title: 'Sprzątanie mieszkań i biur', description: 'Własne środki. Mówię po polsku i ukraińsku. Mokotów, Ursynów, Wilanów.', price: 45, unit: 'hour', ago: 8 * hour },
    { owner: 'ewa', kind: 'garage', category: 'other', sub: 'misc', title: 'Wyprzedaż garażowa: książki, zabawki, rowery', description: 'Wyprowadzamy się. Wszystko od 2 zł. ul. Lipowa 12, wjazd od podwórka.', ago: 1 * day, extra: { garageDate: new Date(now + 4 * day).toISOString().slice(0, 10), pickupHours: '9:00–14:00' } },
    { owner: 'wypozyczalnia', kind: 'rent', category: 'tools', sub: 'build', title: 'Rusztowanie warszawskie, 4 m', description: 'Komplet z blatami. Dowóz w promieniu 15 km za 40 zł.', price: 55, unit: 'day', ago: 3 * day, extra: { deposit: zl(400) } },
    { owner: 'marek', kind: 'service', category: 'services', sub: 'move', title: 'Bus z kierowcą, przeprowadzki', description: 'Ford Transit, pomogę nosić. Wieczory i weekendy.', price: 90, unit: 'hour', ago: 3 * day, extra: { visibility: 2 } },
    { owner: 'tomek', kind: 'swap', category: 'sport', sub: 'bikes', title: 'Rower szosowy, rama 54', description: 'Shimano 105, zadbany.', ago: 5 * day, extra: { swapFor: 'rower gravel albo MTB' } },
    { owner: 'ania', kind: 'rent', category: 'events', sub: 'tables', title: 'Stół i 8 krzeseł ogrodowych', description: 'Na komunię, grilla, urodziny. Składane, zmieszczą się do kombi.', price: 50, unit: 'day', ago: 2 * day },
    { owner: 'jan', kind: 'rent', category: 'sport', sub: 'winter', title: 'Narty 170 cm, buty 43, kijki', description: 'Komplet po serwisie. Zakopane w godzinę.', price: 35, unit: 'day', ago: 2 * day },
    { owner: 'zofia', kind: 'rent', category: 'sport', sub: 'water', title: 'Deska SUP z wiosłem', description: 'Odbiór w Brzeźnie, pięć minut od plaży.', price: 60, unit: 'day', ago: 3 * day },
    { owner: 'michal', kind: 'sell', category: 'farm', sub: 'fruit', title: 'Jabłka Szampion, skrzynka 15 kg', description: 'Z sadu pod Poznaniem. Dowożę w soboty.', price: 45, unit: 'item', ago: 1 * day, extra: { stock: 30 } },
    { owner: 'natalia', kind: 'rent', category: 'fashion', sub: 'occasion', title: 'Suknia wieczorowa, rozmiar 38', description: 'Założona raz. Pralnia po stronie wypożyczającej.', price: 80, unit: 'day', ago: 4 * day },
    { owner: ME, kind: 'sell', category: 'kids', sub: 'toys', title: 'Rower dziecięcy 16 cali', description: 'Z bocznymi kółkami, kask gratis.', price: 180, unit: 'fixed', ago: 2 * day, extra: { condition: 'used' } },
  ]
  return items.map((s, i) => {
    const owner = users.find((u) => u.id === s.owner)!
    return {
      id: `l${i + 1}`,
      ownerId: s.owner,
      kind: s.kind,
      category: s.category,
      sub: s.sub,
      title: s.title,
      description: s.description,
      price: s.price !== undefined ? zl(s.price) : undefined,
      unit: s.unit ?? 'fixed',
      place: near(owner.place, (i % 5) * 0.002, (i % 3) * 0.002),
      visibility: 3,
      createdAt: now - s.ago,
      ...s.extra,
    }
  })
}

/** Zamówienie na Twoje ogłoszenie, żeby było widać stronę sprzedającego. */
export function seedOrders(now: number): { orders: Order[]; chats: Chat[] } {
  const chats: Chat[] = [
    {
      id: 'c1', listingId: 'l1', members: [ME, 'kasia'],
      messages: [
        { id: 'm1', from: 'kasia', at: now - 3 * hour, text: 'Hej! Bierzesz namiot na weekend?' },
        { id: 'm2', from: ME, at: now - 2.5 * hour, text: 'Tak, od piątku. Mogę odebrać w czwartek wieczorem?' },
        { id: 'm3', from: 'kasia', at: now - 2 * hour, text: 'Jasne, po 18 jestem w domu.' },
      ],
    },
    {
      id: 'c2', listingId: 'l22', members: [ME, 'ania'],
      messages: [
        { id: 'm4', from: 'ania', at: now - 40 * min, text: 'Dzień dobry, zapłaciłam za rowerek. Mogę odebrać jutro rano?' },
        { id: 'm5', from: 'ania', at: now - 39 * min, orderId: 'o1' },
      ],
    },
  ]
  const orders: Order[] = [
    {
      id: 'o1', listingId: 'l22', buyerId: 'ania', sellerId: ME, qty: 1, pickup: 'pick.tomorrow',
      total: zl(180), pay: 'blik', status: 'paid', photosBefore: [], photosAfter: [], chatId: 'c2',
      createdAt: now - 40 * min, paidAt: now - 40 * min,
    },
  ]
  return { orders, chats }
}
