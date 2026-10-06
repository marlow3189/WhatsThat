import type { Kind, Lang } from './types'

type Labels = Record<Lang, string>

export interface SubCategory {
  id: string
  label: Labels
}

export interface Category {
  id: string
  icon: string
  label: Labels
  /** rodzaje ogłoszeń, które mają tu sens; pierwszy jest domyślny */
  kinds: Kind[]
  subs: SubCategory[]
}

const L = (pl: string, en: string, de: string, uk: string): Labels => ({ pl, en, de, uk })
const s = (id: string, pl: string, en: string, de: string, uk: string): SubCategory => ({ id, label: L(pl, en, de, uk) })

const ALL: Kind[] = ['sell', 'rent', 'give', 'swap', 'garage']

/**
 * Drzewo kategorii zebrane z tego, co powtarza się na OLX, Allegro, Otomoto, Otodom i Vinted,
 * przycięte do lokalnych, codziennych spraw.
 */
export const CATEGORIES: Category[] = [
  {
    id: 'farm', icon: 'leaf', kinds: ['sell'],
    label: L('Od rolnika', 'From the farm', 'Vom Bauernhof', 'Від фермера'),
    subs: [
      s('veg', 'Warzywa', 'Vegetables', 'Gemüse', 'Овочі'),
      s('fruit', 'Owoce', 'Fruit', 'Obst', 'Фрукти'),
      s('eggs', 'Jaja i nabiał', 'Eggs and dairy', 'Eier und Milchprodukte', 'Яйця та молочне'),
      s('honey', 'Miód i przetwory', 'Honey and preserves', 'Honig und Eingemachtes', 'Мед і консервація'),
      s('plants', 'Sadzonki i nasiona', 'Seedlings and seeds', 'Setzlinge und Samen', 'Розсада та насіння'),
      s('hay', 'Siano, słoma, pasze', 'Hay, straw, feed', 'Heu, Stroh, Futter', 'Сіно, солома, корми'),
      s('wood', 'Drewno opałowe', 'Firewood', 'Brennholz', 'Дрова'),
    ],
  },
  {
    id: 'cars', icon: 'car', kinds: ['sell', 'rent', 'swap'],
    label: L('Motoryzacja', 'Vehicles', 'Fahrzeuge', 'Транспорт'),
    subs: [
      s('car', 'Samochody osobowe', 'Cars', 'Pkw', 'Легкові авто'),
      s('moto', 'Motocykle i skutery', 'Motorcycles and scooters', 'Motorräder und Roller', 'Мотоцикли та скутери'),
      s('van', 'Dostawcze', 'Vans', 'Transporter', 'Вантажні та бусики'),
      s('trailer', 'Przyczepy i lawety', 'Trailers', 'Anhänger', 'Причепи'),
      s('parts', 'Części', 'Parts', 'Ersatzteile', 'Запчастини'),
      s('tyres', 'Opony i felgi', 'Tyres and wheels', 'Reifen und Felgen', 'Шини та диски'),
      s('carcare', 'Akcesoria, boxy dachowe', 'Accessories, roof boxes', 'Zubehör, Dachboxen', 'Аксесуари, багажники'),
    ],
  },
  {
    id: 'homes', icon: 'house', kinds: ['rent', 'sell'],
    label: L('Nieruchomości', 'Property', 'Immobilien', 'Нерухомість'),
    subs: [
      s('flat', 'Mieszkania', 'Flats', 'Wohnungen', 'Квартири'),
      s('house', 'Domy', 'Houses', 'Häuser', 'Будинки'),
      s('room', 'Pokoje', 'Rooms', 'Zimmer', 'Кімнати'),
      s('workers', 'Kwatery pracownicze', 'Worker housing', 'Monteurzimmer', 'Житло для працівників'),
      s('plot', 'Działki', 'Plots', 'Grundstücke', 'Ділянки'),
      s('garage', 'Garaże i miejsca parkingowe', 'Garages and parking', 'Garagen und Stellplätze', 'Гаражі та паркомісця'),
      s('storage', 'Magazyny i lokale', 'Storage and premises', 'Lager und Gewerbe', 'Склади та приміщення'),
    ],
  },
  {
    id: 'services', icon: 'hand', kinds: ['service'],
    label: L('Usługi', 'Services', 'Dienstleistungen', 'Послуги'),
    subs: [
      s('repair', 'Złota rączka, naprawy', 'Handyman, repairs', 'Handwerker, Reparaturen', 'Майстер на годину'),
      s('reno', 'Remonty i budowa', 'Renovation', 'Renovierung', 'Ремонт і будівництво'),
      s('clean', 'Sprzątanie', 'Cleaning', 'Reinigung', 'Прибирання'),
      s('move', 'Transport, przeprowadzki', 'Transport, moving', 'Transport, Umzug', 'Перевезення, переїзди'),
      s('garden', 'Ogród, koszenie, odśnieżanie', 'Garden, mowing, snow', 'Garten, Mähen, Winterdienst', 'Сад, косіння, сніг'),
      s('care', 'Opieka: dzieci, seniorzy, zwierzęta', 'Care: kids, seniors, pets', 'Betreuung: Kinder, Senioren, Tiere', 'Догляд: діти, літні, тварини'),
      s('lessons', 'Korepetycje', 'Tutoring', 'Nachhilfe', 'Репетиторство'),
      s('beauty', 'Uroda i zdrowie', 'Beauty and health', 'Schönheit und Gesundheit', 'Краса і здоровʼя'),
    ],
  },
  {
    id: 'tools', icon: 'wrench', kinds: ['rent', 'sell', 'give', 'swap'],
    label: L('Narzędzia i maszyny', 'Tools and machines', 'Werkzeuge und Maschinen', 'Інструменти та техніка'),
    subs: [
      s('power', 'Elektronarzędzia', 'Power tools', 'Elektrowerkzeuge', 'Електроінструменти'),
      s('build', 'Budowlane, rusztowania', 'Building, scaffolding', 'Bau, Gerüste', 'Будівельні, риштування'),
      s('gardentools', 'Ogrodowe', 'Garden tools', 'Gartengeräte', 'Садові'),
      s('agri', 'Ciągniki i maszyny rolnicze', 'Tractors and farm machines', 'Traktoren und Landmaschinen', 'Трактори та агротехніка'),
      s('gen', 'Agregaty, sprężarki', 'Generators, compressors', 'Generatoren, Kompressoren', 'Генератори, компресори'),
    ],
  },
  {
    id: 'home', icon: 'sofa', kinds: ALL,
    label: L('Dom i ogród', 'Home and garden', 'Haus und Garten', 'Дім і сад'),
    subs: [
      s('furniture', 'Meble', 'Furniture', 'Möbel', 'Меблі'),
      s('appliances', 'AGD', 'Appliances', 'Haushaltsgeräte', 'Побутова техніка'),
      s('decor', 'Wyposażenie i dekoracje', 'Homeware', 'Einrichtung', 'Декор і побут'),
      s('gardenitems', 'Ogród', 'Garden', 'Garten', 'Сад'),
      s('materials', 'Materiały budowlane', 'Building materials', 'Baumaterial', 'Будматеріали'),
    ],
  },
  {
    id: 'fashion', icon: 'shirt', kinds: ['sell', 'give', 'swap', 'rent'],
    label: L('Moda z drugiej ręki', 'Second-hand fashion', 'Second-Hand-Mode', 'Одяг з рук'),
    subs: [
      s('women', 'Damska', 'Women', 'Damen', 'Жіночий'),
      s('men', 'Męska', 'Men', 'Herren', 'Чоловічий'),
      s('kidsfashion', 'Dziecięca', 'Kids', 'Kinder', 'Дитячий'),
      s('shoes', 'Buty', 'Shoes', 'Schuhe', 'Взуття'),
      s('occasion', 'Na okazje, suknie, garnitury', 'Occasionwear', 'Festmode', 'Святковий'),
      s('bags', 'Torebki i dodatki', 'Bags and accessories', 'Taschen und Accessoires', 'Сумки та аксесуари'),
    ],
  },
  {
    id: 'kids', icon: 'stroller', kinds: ALL,
    label: L('Dziecko', 'Kids', 'Kinder', 'Діти'),
    subs: [
      s('strollers', 'Wózki i foteliki', 'Strollers and car seats', 'Kinderwagen und Kindersitze', 'Візки та автокрісла'),
      s('toys', 'Zabawki i gry', 'Toys and games', 'Spielzeug', 'Іграшки'),
      s('kidsfurniture', 'Meble dziecięce', 'Kids furniture', 'Kindermöbel', 'Дитячі меблі'),
      s('school', 'Do szkoły', 'School', 'Schule', 'До школи'),
    ],
  },
  {
    id: 'electronics', icon: 'phone', kinds: ALL,
    label: L('Elektronika', 'Electronics', 'Elektronik', 'Електроніка'),
    subs: [
      s('phones', 'Telefony', 'Phones', 'Handys', 'Телефони'),
      s('computers', 'Komputery', 'Computers', 'Computer', "Комп'ютери"),
      s('tv', 'RTV i audio', 'TV and audio', 'TV und Audio', 'ТВ та аудіо'),
      s('photo', 'Foto i dron', 'Cameras and drones', 'Foto und Drohnen', 'Фото та дрони'),
      s('gaming', 'Konsole i gry', 'Consoles and games', 'Konsolen und Spiele', 'Консолі та ігри'),
    ],
  },
  {
    id: 'sport', icon: 'bike', kinds: ALL,
    label: L('Sport i wypoczynek', 'Sport and leisure', 'Sport und Freizeit', 'Спорт і відпочинок'),
    subs: [
      s('bikes', 'Rowery', 'Bikes', 'Fahrräder', 'Велосипеди'),
      s('camping', 'Camping i turystyka', 'Camping and hiking', 'Camping und Wandern', 'Кемпінг і туризм'),
      s('winter', 'Narty, snowboard', 'Ski, snowboard', 'Ski, Snowboard', 'Лижі, сноуборд'),
      s('water', 'Kajaki, SUP, wędkarstwo', 'Kayaks, SUP, fishing', 'Kajak, SUP, Angeln', 'Каяки, SUP, риболовля'),
      s('fitness', 'Fitness', 'Fitness', 'Fitness', 'Фітнес'),
      s('music', 'Instrumenty', 'Instruments', 'Instrumente', 'Інструменти музичні'),
    ],
  },
  {
    id: 'events', icon: 'tent', kinds: ['rent', 'service', 'sell'],
    label: L('Imprezy i uroczystości', 'Parties and events', 'Feste und Feiern', 'Свята та події'),
    subs: [
      s('tents', 'Namioty i pawilony', 'Marquees', 'Festzelte', 'Намети'),
      s('tables', 'Stoły, krzesła, zastawa', 'Tables, chairs, tableware', 'Tische, Stühle, Geschirr', 'Столи, стільці, посуд'),
      s('sound', 'Nagłośnienie i światło', 'Sound and lighting', 'Ton und Licht', 'Звук і світло'),
      s('decorations', 'Dekoracje', 'Decorations', 'Dekoration', 'Декорації'),
    ],
  },
  {
    id: 'pets', icon: 'paw', kinds: ['sell', 'give', 'service'],
    label: L('Zwierzęta', 'Pets', 'Tiere', 'Тварини'),
    subs: [
      s('petgear', 'Akcesoria', 'Accessories', 'Zubehör', 'Аксесуари'),
      s('adopt', 'Oddam w dobre ręce', 'Adoption', 'Abzugeben', 'Віддам у добрі руки'),
      s('farmanimals', 'Zwierzęta gospodarskie', 'Farm animals', 'Nutztiere', 'Сільгосп тварини'),
    ],
  },
  {
    id: 'other', icon: 'box', kinds: ALL,
    label: L('Inne', 'Other', 'Sonstiges', 'Інше'),
    subs: [
      s('books', 'Książki', 'Books', 'Bücher', 'Книги'),
      s('collect', 'Kolekcje i antyki', 'Collectibles', 'Sammeln und Antiquitäten', 'Колекції та антикваріат'),
      s('tickets', 'Bilety', 'Tickets', 'Tickets', 'Квитки'),
      s('misc', 'Różne', 'Misc', 'Verschiedenes', 'Різне'),
    ],
  },
]

export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
export const subById = (cat: string, sub?: string) => categoryById(cat).subs.find((s) => s.id === sub)
