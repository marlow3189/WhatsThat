import type { Chat, Delivery, Kind, Listing, Order, Place, Unit, User } from '../lib/types'
import type { SaleAggregate, SellerData } from '../lib/dac7'
import { town } from '../lib/geo'
import { zl } from '../lib/money'

/** Dane demo. W produkcji pochodzą z Supabase (supabase/migrations). */

export const ME = 'me'

const near = (base: Place, dLat: number, dLng: number): Place => ({ ...base, lat: base.lat + dLat, lng: base.lng + dLng })
const waw = town('Warszawa')
const min = 60_000
const hour = 60 * min
const day = 24 * hour

/** Numery demo: stałe dla danej osoby (obcy widzą tylko „+48 60…”). */
const phoneOf = (id: string) => {
  let h = 0
  for (const c of id) h = (h * 131 + c.charCodeAt(0)) % 1_000_000_000
  const n = String(500_000_000 + (h % 300_000_000))
  return `+48 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`
}

const user = (id: string, name: string, hue: number, place: Place, friends: string[], extra: Partial<User> = {}): User => ({
  id, name, hue, place, friends, since: Date.UTC(2026, 3, 1), payouts: true, phone: phoneOf(id), ...extra,
})

export function seedUsers(now: number): User[] {
  return [
    user(ME, '', 24, near(waw, -0.03, 0.01), ['kasia', 'marek', 'tomek', 'ola', 'bartek'], { payouts: false }),
    user('kasia', 'Kasia Nowak', 330, near(waw, -0.02, 0.02), [ME, 'marek', 'ania'], { work: 'farm' }),
    user('marek', 'Marek Zieliński', 210, near(waw, 0.01, -0.03), [ME, 'kasia', 'ania', 'jozef', 'piotr'], { work: 'tools' }),
    user('tomek', 'Tomek Wójcik', 140, near(waw, 0.012, 0.01), [ME, 'ewa'], { work: 'cars' }),
    user('ola', 'Ola Kamińska', 280, near(waw, -0.06, -0.02), [ME, 'ewa', 'magda'], { work: 'beauty' }),
    user('bartek', 'Bartek Wiśniewski', 260, near(waw, 0.08, -0.06), [ME, 'ola'], { restricted: true, since: now - 400 * day }),
    user('ania', 'Ania Lewandowska', 30, near(waw, 0.02, 0.05), ['kasia', 'marek'], { trusted: true, deals: 14 }),
    user('jozef', 'Józef Malinowski', 95, town('Tarczyn'), ['marek'], { trusted: true, deals: 212, work: 'farm' }),
    user('piotr', 'Piotr Brukarz', 25, town('Piaseczno'), ['marek'], { trusted: true, deals: 48, work: 'services', pseudonym: 'Brukarz Piotr' }),
    user('henryk', 'Henryk Wróbel', 60, near(waw, 0.005, -0.004), [], { pseudonym: 'Heniek z Lipowej' }),
    user('stefan', 'Stefan Nowicki', 200, near(waw, 0.018, 0.022), ['tomek']),
    user('sklad', 'Skład Budowlany „Budmat”', 35, town('Piaseczno'), [], { business: true, hours: 'pon–sob 7:00–17:00' }),
    user('opal', 'Skład Opału „Ciepły Dom”', 15, near(waw, -0.045, 0.03), [], { business: true, hours: 'pon–sob 7:00–16:00', work: 'heating' }),
    user('piekarnia', 'Piekarnia u Zosi', 40, near(waw, 0.004, 0.006), [], { business: true, hours: 'pon–sob 6:00–13:00', work: 'farm' }),
    user('ewa', 'Ewa Szymańska', 100, town('Pruszków'), ['tomek', 'ola']),
    user('magda', 'Magda Kowalska', 340, town('Konstancin-Jeziorna'), ['ola']),
    user('kwatery', 'Kwatery „Pod Lipą”', 190, town('Piaseczno'), [], { business: true }),
    user('wypozyczalnia', 'Wypożyczalnia Sprzętu „Centrum”', 45, near(waw, -0.025, 0), [], { business: true, hours: 'pon–pt 8:00–18:00' }),
    user('opony', 'Auto-Serwis „Opony24”', 205, town('Grójec'), [], { business: true }),
    user('zlota', 'Złota Rączka 24h', 160, town('Piaseczno'), [], { business: true }),
    user('grzegorz', 'Grzegorz Pawlak', 150, town('Konstancin-Jeziorna'), []),
    user('iryna', 'Iryna Bondarenko', 300, near(waw, 0.03, -0.01), [], { trusted: true, deals: 31, pseudonym: 'Iryna – sprzątanie' }),
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
  delivery?: Delivery[]
  extra?: Partial<Listing>
}

const SHIP: Delivery[] = ['pickup', 'inpost', 'orlen', 'dpd']

export function seedListings(now: number, users: User[]): Listing[] {
  const items: Seed[] = [
    { owner: 'kasia', kind: 'rent', category: 'sport', sub: 'camping', title: 'Namiot 4-osobowy Coleman', description: 'Używany trzy razy, z tropikiem i śledziami. Idealny na weekend nad jeziorem.', price: 25, unit: 'day', ago: 2 * hour, extra: { deposit: zl(200), visibility: 2 } },
    { owner: 'marek', kind: 'rent', category: 'tools', sub: 'power', title: 'Wiertarko-wkrętarka Makita 18V', description: 'Dwie baterie, ładowarka, komplet wierteł do betonu i drewna.', price: 20, unit: 'day', ago: 5 * hour, extra: { deposit: zl(150) } },
    { owner: 'jozef', kind: 'sell', category: 'farm', sub: 'eggs', title: 'Jajka od kur z wolnego wybiegu', description: 'Zbierane codziennie rano. Kury chodzą po sadzie. Odbiór w gospodarstwie albo w sobotę na targu w Piasecznie.', price: 1.2, unit: 'item', ago: 3 * hour, extra: { stock: 180, pickupHours: 'pon–sob 16:00–19:00', promoted: true } },
    { owner: 'jozef', kind: 'sell', category: 'farm', sub: 'veg', title: 'Ziemniaki Vineta, na kilogramy', description: 'Tegoroczne, nie pryskane po kwitnieniu. Mogę przesypać do Twojej torby.', price: 2.5, unit: 'kg', ago: 1 * day, extra: { stock: 400, pickupHours: 'pon–sob 16:00–19:00' } },
    { owner: 'jozef', kind: 'sell', category: 'farm', sub: 'honey', title: 'Miód wielokwiatowy 1,3 kg', description: 'Z własnej pasieki.', price: 55, unit: 'item', ago: 2 * day, extra: { stock: 24, pickupHours: 'pon–sob 16:00–19:00' } },
    { owner: 'jozef', kind: 'service', category: 'jobs', sub: 'harvest', title: 'Pomoc przy zbiorze jabłek, sobota', description: 'Szukam 3 osób na 6 godzin. Obiad i skrzynka jabłek gratis.', price: 28, unit: 'hour', ago: 6 * hour },
    { owner: 'tomek', kind: 'rent', category: 'cars', sub: 'carcare', title: 'Box dachowy Thule 420 l', description: 'Pasuje do większości belek. Pomogę zamontować.', price: 30, unit: 'day', ago: 9 * hour, extra: { deposit: zl(400), visibility: 2 } },
    { owner: 'ola', kind: 'sell', category: 'kids', sub: 'strollers', title: 'Wózek spacerowy Baby Jogger', description: 'Mały wyrósł. Kompletny, z folią przeciwdeszczową.', price: 450, ago: 1 * day, delivery: ['pickup', 'courier'], extra: { condition: 'used', shippingPrice: zl(39) } },
    { owner: 'kasia', kind: 'give', category: 'home', sub: 'furniture', title: 'Oddam regał IKEA Kallax 4×2', description: 'Biały, w dobrym stanie. Trzeba odebrać samemu, 2. piętro bez windy.', ago: 30 * min, extra: { visibility: 2 } },
    { owner: 'ola', kind: 'sell', category: 'fashion', sub: 'women', title: 'Kurtka zimowa The North Face, M', description: 'Noszona jeden sezon.', price: 260, ago: 4 * day, delivery: SHIP, extra: { condition: 'used', shippingPrice: zl(15.99) } },
    { owner: 'magda', kind: 'sell', category: 'beauty', sub: 'perfume', title: 'Perfumy Chloé 75 ml, napoczęte', description: 'Użyte kilka razy, zostało ok. 90%. Oryginał z perfumerii, mam paragon.', price: 180, ago: 5 * hour, delivery: SHIP, extra: { condition: 'used', shippingPrice: zl(13.99) } },
    { owner: 'magda', kind: 'sell', category: 'beauty', sub: 'handmade', title: 'Mydła naturalne z olejem konopnym', description: 'Robię sama, zestaw 3 sztuk.', price: 36, unit: 'pack', ago: 2 * day, delivery: SHIP, extra: { stock: 15, promoted: true, shippingPrice: zl(12.99) } },
    { owner: 'kwatery', kind: 'rent', category: 'homes', sub: 'workers', title: 'Kwatery pracownicze, 12 miejsc', description: 'Pokoje 2- i 3-osobowe, kuchnia, pralka, parking dla busa. Faktura VAT. Minimum tydzień.', price: 35, unit: 'night', ago: 6 * day, extra: { promoted: true } },
    { owner: 'grzegorz', kind: 'sell', category: 'cars', sub: 'car', title: 'Skoda Octavia III 1.6 TDI, 2016', description: '214 000 km, serwisowana w ASO, drugi właściciel. Do obejrzenia w Konstancinie.', price: 32900, ago: 2 * day, extra: { condition: 'used' } },
    { owner: 'opony', kind: 'sell', category: 'cars', sub: 'tyres', title: 'Opony zimowe 205/55 R16, komplet z montażem', description: 'Nowe, rocznik 2026. Montaż i wyważenie w cenie, termin w 2 dni.', price: 1290, ago: 1 * day, extra: { condition: 'new', promoted: true } },
    { owner: 'iryna', kind: 'service', category: 'services', sub: 'clean', title: 'Sprzątanie mieszkań i biur', description: 'Własne środki. Mówię po polsku i ukraińsku. Mokotów, Ursynów, Wilanów.', price: 45, unit: 'hour', ago: 8 * hour },
    { owner: 'zlota', kind: 'service', category: 'services', sub: 'repair', title: 'Złota rączka: drobne naprawy w 24 h', description: 'Montaż mebli, karnisze, gniazdka, cieknący kran. Faktura.', price: 80, unit: 'hour', ago: 3 * day, extra: { promoted: true } },
    { owner: 'ewa', kind: 'garage', category: 'other', sub: 'other', title: 'Wyprzedaż garażowa: książki, zabawki, rowery', description: 'Wyprowadzamy się. Wszystko od 2 zł. ul. Lipowa 12, wjazd od podwórka.', ago: 1 * day, extra: { garageDate: new Date(now + 4 * day).toISOString().slice(0, 10), pickupHours: '9:00–14:00' } },
    { owner: 'wypozyczalnia', kind: 'rent', category: 'tools', sub: 'build', title: 'Rusztowanie warszawskie, 4 m', description: 'Komplet z blatami. Dowóz w promieniu 15 km za 40 zł.', price: 55, unit: 'day', ago: 3 * day, extra: { deposit: zl(400), promoted: true } },
    { owner: 'marek', kind: 'service', category: 'services', sub: 'move', title: 'Bus z kierowcą, przeprowadzki', description: 'Ford Transit, pomogę nosić. Wieczory i weekendy.', price: 90, unit: 'hour', ago: 3 * day, extra: { visibility: 2 } },
    { owner: 'tomek', kind: 'swap', category: 'sport', sub: 'bikes', title: 'Rower szosowy, rama 54', description: 'Shimano 105, zadbany.', ago: 5 * day, extra: { swapFor: 'rower gravel albo MTB' } },
    { owner: 'ania', kind: 'rent', category: 'events', sub: 'tables', title: 'Stół i 8 krzeseł ogrodowych', description: 'Na komunię, grilla, urodziny. Składane, zmieszczą się do kombi.', price: 50, unit: 'day', ago: 2 * day },
    { owner: 'ania', kind: 'wanted', category: 'cars', sub: 'trailer', title: 'Szukam przyczepki na sobotę', description: 'Do przewiezienia gałęzi z działki, Piaseczno–Mokotów.', ago: 50 * min },
    { owner: 'magda', kind: 'give', category: 'community', sub: 'lost', title: 'Znaleziony kot, szary pręgowany', description: 'Kręci się przy ul. Sienkiewicza od wtorku. Ma obrożę bez adresu.', ago: 20 * hour },
    { owner: 'jan', kind: 'rent', category: 'sport', sub: 'winter', title: 'Narty 170 cm, buty 43, kijki', description: 'Komplet po serwisie.', price: 35, unit: 'day', ago: 2 * day },
    { owner: 'zofia', kind: 'rent', category: 'sport', sub: 'water', title: 'Deska SUP z wiosłem', description: 'Odbiór w Brzeźnie, pięć minut od plaży.', price: 60, unit: 'day', ago: 3 * day },
    { owner: 'michal', kind: 'sell', category: 'farm', sub: 'fruit', title: 'Jabłka Szampion, skrzynka 15 kg', description: 'Z sadu pod Poznaniem. Dowożę w soboty.', price: 45, unit: 'item', ago: 1 * day, extra: { stock: 30 } },
    { owner: 'natalia', kind: 'rent', category: 'fashion', sub: 'occasion', title: 'Suknia wieczorowa, rozmiar 38', description: 'Założona raz. Pralnia po stronie wypożyczającej.', price: 80, unit: 'day', ago: 4 * day },
    { owner: ME, kind: 'sell', category: 'kids', sub: 'toys', title: 'Rower dziecięcy 16 cali', description: 'Z bocznymi kółkami, kask gratis.', price: 180, ago: 40 * day, extra: { condition: 'used' } },
    // Sąsiad kilkaset metrów dalej: nikt go nie zna, ale jego kosiarka i przyczepka są „obok”.
    { owner: 'henryk', kind: 'rent', category: 'tools', sub: 'gardentools', title: 'Kosiarka spalinowa Honda, 20 zł za dzień', description: 'Kosz 70 l, napęd. Paliwo we własnym zakresie. Mogę też przyjść i skosić za 40 zł za godzinę.', price: 20, unit: 'day', ago: 4 * hour, extra: { deposit: zl(100) } },
    { owner: 'henryk', kind: 'rent', category: 'cars', sub: 'trailer', title: 'Przyczepka lekka 1,5 m, bez hamulca', description: 'Na gałęzie, trawę, meble. Odbiór spod domu.', price: 50, unit: 'day', ago: 2 * day },
    // Brukowanie podjazdu: piasek ze składu, kostka, zagęszczarka od Marka, gilotyna z wypożyczalni, brukarz znajomego.
    { owner: 'sklad', kind: 'sell', category: 'home', sub: 'materials', title: 'Piasek płukany 0–2 mm, na tony', description: 'Pod podsypkę i do zapraw. Dowóz wywrotką do 15 km, 150 zł za kurs.', price: 120, unit: 'tonne', ago: 1 * day, delivery: ['pickup', 'courier'], extra: { stock: 60, shippingPrice: zl(150), promoted: true } },
    { owner: 'sklad', kind: 'sell', category: 'home', sub: 'materials', title: 'Kostka brukowa Holland 6 cm, paleta 10,8 m²', description: 'Szara, z atestem. Paleta zwrotna.', price: 520, unit: 'item', ago: 2 * day, delivery: ['pickup', 'courier'], extra: { stock: 30, shippingPrice: zl(150), condition: 'new' } },
    { owner: 'marek', kind: 'rent', category: 'tools', sub: 'build', title: 'Zagęszczarka gruntowa 90 kg', description: 'Do podbudowy pod kostkę. Zmieści się do kombi z przyczepką, pomogę załadować.', price: 90, unit: 'day', ago: 7 * hour, extra: { deposit: zl(500) } },
    { owner: 'wypozyczalnia', kind: 'rent', category: 'tools', sub: 'build', title: 'Gilotyna do kostki brukowej', description: 'Tnie kostkę do 10 cm bez pyłu.', price: 60, unit: 'day', ago: 4 * day, extra: { deposit: zl(300) } },
    { owner: 'piotr', kind: 'service', category: 'services', sub: 'reno', title: 'Brukarstwo: podjazdy, ścieżki, obrzeża', description: 'Wycena na miejscu gratis. Mam ekipę na 2–3 dni, terminy od listopada.', price: 95, unit: 'hour', ago: 1 * day },
    { owner: 'kasia', kind: 'sell', category: 'farm', sub: 'eggs', title: 'Jajka od moich kur, 10 sztuk', description: 'Mam 8 kurek na działce. Zostawię pod drzwiami albo odbierz wieczorem.', price: 12, unit: 'pack', ago: 5 * hour, extra: { stock: 6 } },
    // Alerty sąsiedzkie: zawsze darmowe, z powiadomieniem dla okolicy.
    { owner: 'tomek', kind: 'wanted', category: 'community', sub: 'missing', title: 'Zaginął pies Fafik, beagle', description: 'Uciekł wczoraj ok. 19 z ogrodu. Brązowo-biały, czerwona obroża z numerem. Jeśli go widzisz, napisz albo zadzwoń. Nagroda.', ago: 3 * hour, extra: { visibility: 3 } },
    { owner: 'ania', kind: 'service', category: 'community', sub: 'meet', title: 'Zbiórka: sprzątanie parku w sobotę 10:00', description: 'Spotykamy się przy głównej bramie parku. Worki i rękawice zapewniamy, weź wodę. Potem wspólny grill.', ago: 7 * hour, extra: { visibility: 3, garageDate: new Date(now + 3 * day).toISOString().slice(0, 10) } },
    // Sezon grzewczy: skład opału, sąsiad z nadwyżką pelletu, rolnik z drewnem.
    { owner: 'opal', kind: 'sell', category: 'heating', sub: 'pellet', title: 'Pellet drzewny A1, worki 15 kg', description: 'Certyfikat ENplus A1, niska popielność. Paleta 65 worków taniej. Dowóz do 20 km.', price: 23.5, unit: 'bag', ago: 5 * hour, delivery: ['pickup', 'courier'], extra: { stock: 1300, shippingPrice: zl(120), promoted: true, condition: 'new' } },
    { owner: 'opal', kind: 'sell', category: 'heating', sub: 'ecopea', title: 'Ekogroszek 26–28 MJ/kg, na tony', description: 'Workowany po 25 kg albo luzem. Świadectwo jakości paliwa przy każdej dostawie.', price: 1490, unit: 'tonne', ago: 1 * day, delivery: ['pickup', 'courier'], extra: { stock: 40, shippingPrice: zl(150), condition: 'new' } },
    { owner: 'opal', kind: 'sell', category: 'heating', sub: 'coal', title: 'Węgiel orzech, na tony', description: 'Kaloryczność 26–28 MJ/kg. Ważenie przy odbiorze.', price: 1590, unit: 'tonne', ago: 2 * day, delivery: ['pickup', 'courier'], extra: { stock: 30, shippingPrice: zl(150), condition: 'new' } },
    { owner: 'stefan', kind: 'sell', category: 'heating', sub: 'pellet', title: 'Zostało mi 20 worków pelletu, taniej', description: 'Zmieniłem ogrzewanie na pompę ciepła. Pellet 6 mm, suchy, w garażu. Odbiór własny.', price: 19, unit: 'bag', ago: 6 * hour, extra: { stock: 20, condition: 'new', deal: true } },
    { owner: 'jozef', kind: 'sell', category: 'heating', sub: 'wood', title: 'Drewno kominkowe dąb i buk, sezonowane', description: 'Sezonowane 2 lata, wilgotność poniżej 20%. Przywiozę przyczepką.', price: 390, unit: 'm3', ago: 1 * day, delivery: ['pickup', 'courier'], extra: { stock: 25, shippingPrice: zl(80) } },
    { owner: 'zlota', kind: 'service', category: 'services', sub: 'repair', title: 'Kominiarz: przegląd i czyszczenie przewodów', description: 'Protokół do ubezpieczenia, przegląd kotła na paliwo stałe.', price: 150, unit: 'fixed', ago: 3 * day },
    // Piekarnia z rezerwacją i przedpłatą: nic się nie marnuje, odbiór o ustalonej godzinie.
    { owner: 'piekarnia', kind: 'sell', category: 'farm', sub: 'bread', title: 'Chleb na zakwasie 800 g', description: 'Pieczony od 4 rano. Zarezerwuj i zapłać wcześniej, odłożymy na Twoje nazwisko.', price: 14, unit: 'item', ago: 2 * hour, extra: { stock: 24, pickupHours: 'pon–sob 6:00–13:00', promoted: true } },
    { owner: 'piekarnia', kind: 'sell', category: 'farm', sub: 'bread', title: 'Bułki kajzerki, 10 sztuk', description: 'Świeże co rano. Przy przedpłacie odbierasz bez kolejki.', price: 9, unit: 'pack', ago: 2 * hour, extra: { stock: 30, pickupHours: 'pon–sob 6:00–13:00' } },
    { owner: 'ola', kind: 'give', category: 'home', sub: 'decor', title: 'Kartony po przeprowadzce, 20 sztuk', description: 'Mocne, z taśmą. Do odebrania z klatki.', ago: 1 * day },
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
      currency: 'PLN',
      unit: s.unit ?? 'fixed',
      delivery: s.delivery ?? ['pickup'],
      place: near(owner.place, (i % 5) * 0.002, (i % 3) * 0.002),
      visibility: 3,
      status: 'active',
      createdAt: now - s.ago,
      ...s.extra,
    } satisfies Listing
  })
}

/** Rezerwacja Twojego roweru, żeby było widać stronę sprzedającego. */
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
      id: 'c2', listingId: 'l29', members: [ME, 'ania'],
      messages: [
        { id: 'm4', from: 'ania', at: now - 40 * min, text: 'Dzień dobry, rezerwuję rowerek. Zapłacę gotówką przy odbiorze jutro rano, może być?' },
        { id: 'm5', from: 'ania', at: now - 39 * min, orderId: 'o1' },
      ],
    },
  ]
  const orders: Order[] = [
    {
      id: 'o1', listingId: 'l29', buyerId: 'ania', sellerId: ME, qty: 1, pickup: 'pick.tomorrow', delivery: 'pickup',
      total: zl(180), currency: 'PLN', pay: 'cash', status: 'accepted', photosBefore: [], photosAfter: [], chatId: 'c2',
      createdAt: now - 40 * min,
    },
  ]
  return { orders, chats }
}

/** Zbiorcza sprzedaż w 2026 r. do panelu DAC7 (dane demo). */
export const seedSales: SaleAggregate[] = [
  { sellerId: 'jozef', activity: 'goods', count: 342, totalPln: zl(26_480) },
  { sellerId: 'jozef', activity: 'services', count: 4, totalPln: zl(2_016) },
  { sellerId: 'kwatery', activity: 'property', count: 58, totalPln: zl(61_250) },
  { sellerId: 'grzegorz', activity: 'goods', count: 1, totalPln: zl(32_900) },
  { sellerId: 'iryna', activity: 'services', count: 31, totalPln: zl(5_580) },
  { sellerId: 'ola', activity: 'goods', count: 3, totalPln: zl(890) },
  { sellerId: 'magda', activity: 'goods', count: 27, totalPln: zl(1_420) },
  { sellerId: 'marek', activity: 'transport', count: 2, totalPln: zl(140) },
]

export const seedSellerData: Record<string, SellerData> = {
  jozef: { name: 'Józef Malinowski', address: 'Tarczyn, ul. Sadowa 4', taxId: '7120000000', birthDate: '1961-05-12' },
  kwatery: { name: 'Kwatery Piaseczno sp. z o.o.', address: 'Piaseczno, ul. Puławska 50', taxId: '1230000000' },
  grzegorz: { name: 'Grzegorz Pawlak', address: 'Konstancin-Jeziorna' },
  iryna: { name: 'Iryna Bondarenko', address: 'Warszawa, ul. Puławska 100', birthDate: '1990-02-01' },
  marek: { name: 'Marek Zieliński' },
}
