import type { Kind, Lang, Unit } from './types'

export type Labels = Record<Lang, string>

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

/** Kolejność języków: pl, en, de, uk, cs, sk, hu, it, es, hi. */
const L = (pl: string, en: string, de: string, uk: string, cs: string, sk: string, hu: string, it: string, es: string, hi: string): Labels => ({ pl, en, de, uk, cs, sk, hu, it, es, hi })
const s = (id: string, ...l: Parameters<typeof L>): SubCategory => ({ id, label: L(...l) })

/** „Inne” w każdej kategorii, żeby zawsze dało się dopisać coś spoza listy. */
const OTHER = s('other', 'Inne', 'Other', 'Sonstiges', 'Інше', 'Ostatní', 'Ostatné', 'Egyéb', 'Altro', 'Otros', 'अन्य')

const ALL: Kind[] = ['sell', 'rent', 'give', 'swap', 'garage', 'wanted']

/**
 * Drzewo kategorii zebrane z tego, co powtarza się na OLX, Allegro, Otomoto, Otodom, Vinted
 * i w aplikacjach sąsiedzkich, przycięte do lokalnych, codziennych spraw.
 */
export const CATEGORIES: Category[] = [
  {
    id: 'farm', icon: 'leaf', kinds: ['sell', 'wanted'],
    label: L('Od rolnika', 'From the farm', 'Vom Bauernhof', 'Від фермера', 'Z farmy', 'Z farmy', 'Termelőtől', 'Dalla fattoria', 'De la granja', 'खेत से'),
    subs: [
      s('veg', 'Warzywa', 'Vegetables', 'Gemüse', 'Овочі', 'Zelenina', 'Zelenina', 'Zöldség', 'Verdura', 'Verduras', 'सब्ज़ियाँ'),
      s('fruit', 'Owoce', 'Fruit', 'Obst', 'Фрукти', 'Ovoce', 'Ovocie', 'Gyümölcs', 'Frutta', 'Fruta', 'फल'),
      s('eggs', 'Jaja i nabiał', 'Eggs and dairy', 'Eier und Milchprodukte', 'Яйця та молочне', 'Vejce a mléčné výrobky', 'Vajcia a mliečne výrobky', 'Tojás és tejtermék', 'Uova e latticini', 'Huevos y lácteos', 'अंडे और डेयरी'),
      s('honey', 'Miód i przetwory', 'Honey and preserves', 'Honig und Eingemachtes', 'Мед і консервація', 'Med a zavařeniny', 'Med a zaváraniny', 'Méz és befőttek', 'Miele e conserve', 'Miel y conservas', 'शहद और अचार-मुरब्बे'),
      s('meat', 'Mięso i wędliny', 'Meat and cured meats', 'Fleisch und Wurst', "М'ясо та ковбаси", 'Maso a uzeniny', 'Mäso a údeniny', 'Hús és felvágott', 'Carne e salumi', 'Carne y embutidos', 'मीट और मीट प्रोडक्ट'),
      s('plants', 'Sadzonki i nasiona', 'Seedlings and seeds', 'Setzlinge und Samen', 'Розсада та насіння', 'Sazenice a semena', 'Sadenice a semená', 'Palánták és vetőmag', 'Piantine e semi', 'Plantones y semillas', 'पौधे और बीज'),
      s('hay', 'Siano, słoma, pasze', 'Hay, straw, feed', 'Heu, Stroh, Futter', 'Сіно, солома, корми', 'Seno, sláma, krmivo', 'Seno, slama, krmivo', 'Széna, szalma, takarmány', 'Fieno, paglia, mangimi', 'Heno, paja, pienso', 'चारा, भूसा, दाना'),
      s('wood', 'Drewno opałowe', 'Firewood', 'Brennholz', 'Дрова', 'Palivové dřevo', 'Palivové drevo', 'Tűzifa', 'Legna da ardere', 'Leña', 'जलाऊ लकड़ी'),
      s('bread', 'Pieczywo i wypieki', 'Bread and bakes', 'Brot und Gebäck', 'Хліб і випічка', 'Pečivo', 'Pečivo', 'Pékáru', 'Pane e dolci', 'Pan y bollería', 'ब्रेड और बेकरी'),
      OTHER,
    ],
  },
  {
    id: 'heating', icon: 'flame', kinds: ['sell', 'wanted', 'give'],
    label: L('Opał i ogrzewanie', 'Heating fuel', 'Brennstoffe und Heizen', 'Паливо та опалення', 'Palivo a topení', 'Palivo a kúrenie', 'Tüzelő és fűtés', 'Combustibili e riscaldamento', 'Combustible y calefacción', 'ईंधन और हीटिंग'),
    subs: [
      s('pellet', 'Pellet', 'Wood pellets', 'Pellets', 'Пелети', 'Pelety', 'Pelety', 'Pellet', 'Pellet', 'Pellets', 'लकड़ी के पेलेट'),
      s('ecopea', 'Ekogroszek', 'Pea coal', 'Kohlenkörner (Ekogroszek)', 'Екогорішок', 'Ořech 2 (eko hrášek)', 'Orech (eko hrášok)', 'Borsószén', 'Carbone pisello', 'Carbón granulado', 'छोटा कोयला (पी कोल)'),
      s('coal', 'Węgiel', 'Coal', 'Kohle', 'Вугілля', 'Uhlí', 'Uhlie', 'Szén', 'Carbone', 'Carbón', 'कोयला'),
      s('wood', 'Drewno i brykiet', 'Firewood and briquettes', 'Brennholz und Briketts', 'Дрова та брикети', 'Dřevo a brikety', 'Drevo a brikety', 'Tűzifa és brikett', 'Legna e bricchetti', 'Leña y briquetas', 'लकड़ी और ब्रिकेट'),
      s('oil', 'Olej opałowy', 'Heating oil', 'Heizöl', 'Пічне паливо', 'Topný olej', 'Vykurovací olej', 'Fűtőolaj', 'Gasolio da riscaldamento', 'Gasóleo de calefacción', 'हीटिंग तेल'),
      s('lpg', 'Gaz w butlach', 'Bottled gas', 'Flaschengas', 'Газ у балонах', 'Plyn v lahvích', 'Plyn vo fľašiach', 'PB-gázpalack', 'Gas in bombole', 'Gas embotellado', 'गैस सिलेंडर'),
      OTHER,
    ],
  },
  {
    id: 'cars', icon: 'car', kinds: ['sell', 'rent', 'swap', 'wanted'],
    label: L('Motoryzacja', 'Vehicles', 'Fahrzeuge', 'Транспорт', 'Auto-moto', 'Auto-moto', 'Járművek', 'Motori', 'Motor', 'गाड़ियाँ'),
    subs: [
      s('car', 'Samochody osobowe', 'Cars', 'Pkw', 'Легкові авто', 'Osobní auta', 'Osobné autá', 'Személyautók', 'Auto', 'Coches', 'कारें'),
      s('moto', 'Motocykle i skutery', 'Motorcycles and scooters', 'Motorräder und Roller', 'Мотоцикли та скутери', 'Motorky a skútry', 'Motorky a skútre', 'Motorok és robogók', 'Moto e scooter', 'Motos y scooters', 'बाइक और स्कूटर'),
      s('van', 'Dostawcze', 'Vans', 'Transporter', 'Вантажні та бусики', 'Dodávky', 'Dodávky', 'Kisteherautók', 'Furgoni', 'Furgonetas', 'वैन और टेम्पो'),
      s('trailer', 'Przyczepy i lawety', 'Trailers', 'Anhänger', 'Причепи', 'Přívěsy', 'Prívesy', 'Utánfutók', 'Rimorchi', 'Remolques', 'ट्रॉली और ट्रेलर'),
      s('parts', 'Części', 'Parts', 'Ersatzteile', 'Запчастини', 'Díly', 'Diely', 'Alkatrészek', 'Ricambi', 'Recambios', 'स्पेयर पार्ट्स'),
      s('tyres', 'Opony i felgi', 'Tyres and wheels', 'Reifen und Felgen', 'Шини та диски', 'Pneumatiky a disky', 'Pneumatiky a disky', 'Gumik és felnik', 'Pneumatici e cerchi', 'Neumáticos y llantas', 'टायर और रिम'),
      s('carcare', 'Akcesoria, boxy dachowe', 'Accessories, roof boxes', 'Zubehör, Dachboxen', 'Аксесуари, багажники', 'Příslušenství, střešní boxy', 'Príslušenstvo, strešné boxy', 'Kiegészítők, tetőboxok', 'Accessori, box tetto', 'Accesorios, cofres de techo', 'एक्सेसरीज़, रूफ़ बॉक्स'),
      OTHER,
    ],
  },
  {
    id: 'homes', icon: 'house', kinds: ['rent', 'sell', 'wanted'],
    label: L('Nieruchomości', 'Property', 'Immobilien', 'Нерухомість', 'Reality', 'Reality', 'Ingatlan', 'Immobili', 'Inmuebles', 'प्रॉपर्टी'),
    subs: [
      s('flat', 'Mieszkania', 'Flats', 'Wohnungen', 'Квартири', 'Byty', 'Byty', 'Lakások', 'Appartamenti', 'Pisos', 'फ़्लैट'),
      s('house', 'Domy', 'Houses', 'Häuser', 'Будинки', 'Domy', 'Domy', 'Házak', 'Case', 'Casas', 'मकान'),
      s('room', 'Pokoje', 'Rooms', 'Zimmer', 'Кімнати', 'Pokoje', 'Izby', 'Szobák', 'Stanze', 'Habitaciones', 'कमरे'),
      s('workers', 'Kwatery pracownicze', 'Worker housing', 'Monteurzimmer', 'Житло для працівників', 'Ubytovny pro pracovníky', 'Ubytovne pre pracovníkov', 'Munkásszállások', 'Alloggi per lavoratori', 'Alojamiento para trabajadores', 'कामगारों के लिए कमरे'),
      s('plot', 'Działki', 'Plots', 'Grundstücke', 'Ділянки', 'Pozemky', 'Pozemky', 'Telkek', 'Terreni', 'Terrenos', 'प्लॉट'),
      s('garage', 'Garaże i miejsca parkingowe', 'Garages and parking', 'Garagen und Stellplätze', 'Гаражі та паркомісця', 'Garáže a parkovací místa', 'Garáže a parkovacie miesta', 'Garázsok és parkolók', 'Garage e posti auto', 'Garajes y plazas', 'गैराज और पार्किंग'),
      s('storage', 'Magazyny i lokale', 'Storage and premises', 'Lager und Gewerbe', 'Склади та приміщення', 'Sklady a prostory', 'Sklady a priestory', 'Raktárak és üzlethelyiségek', 'Magazzini e locali', 'Almacenes y locales', 'गोदाम और दुकानें'),
      OTHER,
    ],
  },
  {
    id: 'services', icon: 'hand', kinds: ['service', 'wanted'],
    label: L('Usługi', 'Services', 'Dienstleistungen', 'Послуги', 'Služby', 'Služby', 'Szolgáltatások', 'Servizi', 'Servicios', 'सेवाएँ'),
    subs: [
      s('repair', 'Złota rączka, naprawy', 'Handyman, repairs', 'Handwerker, Reparaturen', 'Майстер на годину', 'Hodinový manžel, opravy', 'Hodinový manžel, opravy', 'Ezermester, javítás', 'Tuttofare, riparazioni', 'Manitas, reparaciones', 'मिस्त्री, मरम्मत'),
      s('reno', 'Remonty i budowa', 'Renovation', 'Renovierung', 'Ремонт і будівництво', 'Rekonstrukce', 'Rekonštrukcie', 'Felújítás', 'Ristrutturazioni', 'Reformas', 'रेनोवेशन और निर्माण'),
      s('clean', 'Sprzątanie', 'Cleaning', 'Reinigung', 'Прибирання', 'Úklid', 'Upratovanie', 'Takarítás', 'Pulizie', 'Limpieza', 'साफ़-सफ़ाई'),
      s('move', 'Transport, przeprowadzki', 'Transport, moving', 'Transport, Umzug', 'Перевезення, переїзди', 'Doprava, stěhování', 'Doprava, sťahovanie', 'Szállítás, költöztetés', 'Trasporti, traslochi', 'Transporte, mudanzas', 'ढुलाई, शिफ़्टिंग'),
      s('garden', 'Ogród, koszenie, odśnieżanie', 'Garden, mowing, snow', 'Garten, Mähen, Winterdienst', 'Сад, косіння, сніг', 'Zahrada, sekání, sníh', 'Záhrada, kosenie, sneh', 'Kert, fűnyírás, hó', 'Giardino, sfalcio, neve', 'Jardín, césped, nieve', 'बागवानी, घास कटाई, बर्फ़ हटाना'),
      s('care', 'Opieka: dzieci, seniorzy, zwierzęta', 'Care: kids, seniors, pets', 'Betreuung: Kinder, Senioren, Tiere', 'Догляд: діти, літні, тварини', 'Péče: děti, senioři, zvířata', 'Opatrovanie: deti, seniori, zvieratá', 'Gondozás: gyerek, idős, állat', 'Assistenza: bambini, anziani, animali', 'Cuidado: niños, mayores, mascotas', 'देखभाल: बच्चे, बुज़ुर्ग, पालतू'),
      s('lessons', 'Korepetycje', 'Tutoring', 'Nachhilfe', 'Репетиторство', 'Doučování', 'Doučovanie', 'Korrepetálás', 'Ripetizioni', 'Clases particulares', 'ट्यूशन'),
      s('beautyservice', 'Fryzjer, kosmetyczka', 'Hair and beauty', 'Friseur, Kosmetik', 'Перукар, косметолог', 'Kadeřnice, kosmetička', 'Kaderníčka, kozmetička', 'Fodrász, kozmetikus', 'Parrucchiere, estetista', 'Peluquería, estética', 'नाई, ब्यूटी पार्लर'),
      OTHER,
    ],
  },
  {
    id: 'jobs', icon: 'bag', kinds: ['service', 'wanted'],
    label: L('Praca dorywcza', 'Odd jobs', 'Gelegenheitsjobs', 'Підробіток', 'Brigády', 'Brigády', 'Alkalmi munka', 'Lavoretti', 'Trabajos puntuales', 'पार्ट-टाइम काम'),
    subs: [
      s('harvest', 'Zbiory i prace w polu', 'Harvest and farm work', 'Ernte und Feldarbeit', 'Збір урожаю, польові роботи', 'Sklizeň a práce na poli', 'Zber a práce na poli', 'Betakarítás, mezőgazdasági munka', 'Raccolta e lavori agricoli', 'Cosecha y campo', 'फ़सल कटाई और खेत का काम'),
      s('helping', 'Pomoc przy przeprowadzce, budowie', 'Help moving, building', 'Hilfe bei Umzug, Bau', 'Допомога з переїздом, будовою', 'Pomoc se stěhováním, stavbou', 'Pomoc so sťahovaním, stavbou', 'Segítség költözésnél, építkezésnél', 'Aiuto traslochi, cantiere', 'Ayuda en mudanzas, obras', 'शिफ़्टिंग, निर्माण में मदद'),
      s('events', 'Obsługa imprez', 'Event staff', 'Eventpersonal', 'Обслуговування заходів', 'Obsluha akcí', 'Obsluha podujatí', 'Rendezvényi munka', 'Personale eventi', 'Personal de eventos', 'इवेंट स्टाफ़'),
      s('delivery', 'Dostawy, kierowca', 'Delivery, driver', 'Lieferung, Fahrer', 'Доставка, водій', 'Rozvoz, řidič', 'Rozvoz, vodič', 'Kiszállítás, sofőr', 'Consegne, autista', 'Reparto, conductor', 'डिलीवरी, ड्राइवर'),
      OTHER,
    ],
  },
  {
    id: 'tools', icon: 'wrench', kinds: ['rent', 'sell', 'give', 'swap', 'wanted'],
    label: L('Narzędzia i maszyny', 'Tools and machines', 'Werkzeuge und Maschinen', 'Інструменти та техніка', 'Nářadí a stroje', 'Náradie a stroje', 'Szerszámok és gépek', 'Attrezzi e macchine', 'Herramientas y máquinas', 'औज़ार और मशीनें'),
    subs: [
      s('power', 'Elektronarzędzia', 'Power tools', 'Elektrowerkzeuge', 'Електроінструменти', 'Elektrické nářadí', 'Elektrické náradie', 'Elektromos szerszámok', 'Elettroutensili', 'Herramientas eléctricas', 'बिजली के औज़ार'),
      s('build', 'Budowlane, rusztowania', 'Building, scaffolding', 'Bau, Gerüste', 'Будівельні, риштування', 'Stavební, lešení', 'Stavebné, lešenie', 'Építőipari, állvány', 'Edilizia, ponteggi', 'Construcción, andamios', 'निर्माण, मचान'),
      s('gardentools', 'Ogrodowe', 'Garden tools', 'Gartengeräte', 'Садові', 'Zahradní', 'Záhradné', 'Kerti gépek', 'Attrezzi da giardino', 'Jardinería', 'बागवानी के औज़ार'),
      s('agri', 'Ciągniki i maszyny rolnicze', 'Tractors and farm machines', 'Traktoren und Landmaschinen', 'Трактори та агротехніка', 'Traktory a zemědělské stroje', 'Traktory a poľnohospodárske stroje', 'Traktorok, mezőgazdasági gépek', 'Trattori e macchine agricole', 'Tractores y maquinaria agrícola', 'ट्रैक्टर और खेती की मशीनें'),
      s('gen', 'Agregaty, sprężarki', 'Generators, compressors', 'Generatoren, Kompressoren', 'Генератори, компресори', 'Elektrocentrály, kompresory', 'Elektrocentrály, kompresory', 'Aggregátorok, kompresszorok', 'Generatori, compressori', 'Generadores, compresores', 'जनरेटर, कंप्रेसर'),
      OTHER,
    ],
  },
  {
    id: 'home', icon: 'sofa', kinds: ALL,
    label: L('Dom i ogród', 'Home and garden', 'Haus und Garten', 'Дім і сад', 'Dům a zahrada', 'Dom a záhrada', 'Otthon és kert', 'Casa e giardino', 'Hogar y jardín', 'घर और बगीचा'),
    subs: [
      s('furniture', 'Meble', 'Furniture', 'Möbel', 'Меблі', 'Nábytek', 'Nábytok', 'Bútor', 'Mobili', 'Muebles', 'फ़र्नीचर'),
      s('appliances', 'AGD', 'Appliances', 'Haushaltsgeräte', 'Побутова техніка', 'Spotřebiče', 'Spotrebiče', 'Háztartási gépek', 'Elettrodomestici', 'Electrodomésticos', 'घरेलू उपकरण'),
      s('decor', 'Wyposażenie i dekoracje', 'Homeware', 'Einrichtung', 'Декор і побут', 'Vybavení a dekorace', 'Vybavenie a dekorácie', 'Lakberendezés', 'Arredo e decorazioni', 'Decoración', 'घर का सामान और सजावट'),
      s('gardenitems', 'Ogród', 'Garden', 'Garten', 'Сад', 'Zahrada', 'Záhrada', 'Kert', 'Giardino', 'Jardín', 'बगीचा'),
      s('materials', 'Materiały budowlane', 'Building materials', 'Baumaterial', 'Будматеріали', 'Stavební materiál', 'Stavebný materiál', 'Építőanyag', 'Materiali edili', 'Materiales de construcción', 'निर्माण सामग्री'),
      OTHER,
    ],
  },
  {
    id: 'beauty', icon: 'drop', kinds: ['sell', 'give', 'swap', 'wanted'],
    label: L('Uroda i kosmetyki', 'Beauty and cosmetics', 'Beauty und Kosmetik', 'Краса та косметика', 'Krása a kosmetika', 'Krása a kozmetika', 'Szépség és kozmetikum', 'Bellezza e cosmetici', 'Belleza y cosmética', 'ब्यूटी और कॉस्मेटिक्स'),
    subs: [
      s('skincare', 'Pielęgnacja', 'Skincare', 'Hautpflege', 'Догляд', 'Péče o pleť', 'Starostlivosť o pleť', 'Bőrápolás', 'Cura della pelle', 'Cuidado facial', 'स्किनकेयर'),
      s('makeup', 'Makijaż', 'Make-up', 'Make-up', 'Макіяж', 'Make-up', 'Make-up', 'Smink', 'Trucco', 'Maquillaje', 'मेकअप'),
      s('perfume', 'Perfumy', 'Perfume', 'Parfum', 'Парфуми', 'Parfémy', 'Parfumy', 'Parfüm', 'Profumi', 'Perfumes', 'परफ़्यूम'),
      s('hair', 'Włosy', 'Hair', 'Haare', 'Волосся', 'Vlasy', 'Vlasy', 'Haj', 'Capelli', 'Cabello', 'बालों की देखभाल'),
      s('handmade', 'Naturalne i rękodzieło', 'Natural and handmade', 'Natur und handgemacht', 'Натуральне та ручна робота', 'Přírodní a ruční výroba', 'Prírodné a ručná výroba', 'Natúr és kézműves', 'Naturali e artigianali', 'Natural y artesanal', 'प्राकृतिक और हाथ से बना'),
      OTHER,
    ],
  },
  {
    id: 'fashion', icon: 'shirt', kinds: ['sell', 'give', 'swap', 'rent', 'wanted'],
    label: L('Moda z drugiej ręki', 'Second-hand fashion', 'Second-Hand-Mode', 'Одяг з рук', 'Móda z druhé ruky', 'Móda z druhej ruky', 'Használt divat', 'Moda usata', 'Moda de segunda mano', 'सेकंड-हैंड फ़ैशन'),
    subs: [
      s('women', 'Damska', 'Women', 'Damen', 'Жіночий', 'Dámská', 'Dámska', 'Női', 'Donna', 'Mujer', 'महिलाएँ'),
      s('men', 'Męska', 'Men', 'Herren', 'Чоловічий', 'Pánská', 'Pánska', 'Férfi', 'Uomo', 'Hombre', 'पुरुष'),
      s('kidsfashion', 'Dziecięca', 'Kids', 'Kinder', 'Дитячий', 'Dětská', 'Detská', 'Gyerek', 'Bambini', 'Niños', 'बच्चे'),
      s('shoes', 'Buty', 'Shoes', 'Schuhe', 'Взуття', 'Boty', 'Topánky', 'Cipők', 'Scarpe', 'Zapatos', 'जूते-चप्पल'),
      s('occasion', 'Na okazje', 'Occasionwear', 'Festmode', 'Святковий', 'Společenská', 'Spoločenská', 'Alkalmi', 'Da cerimonia', 'De fiesta', 'शादी-पार्टी के कपड़े'),
      s('bags', 'Torebki i dodatki', 'Bags and accessories', 'Taschen und Accessoires', 'Сумки та аксесуари', 'Kabelky a doplňky', 'Kabelky a doplnky', 'Táskák és kiegészítők', 'Borse e accessori', 'Bolsos y accesorios', 'बैग और एक्सेसरीज़'),
      OTHER,
    ],
  },
  {
    id: 'kids', icon: 'stroller', kinds: ALL,
    label: L('Dziecko', 'Kids', 'Kinder', 'Діти', 'Děti', 'Deti', 'Gyerek', 'Bambini', 'Niños', 'बच्चे'),
    subs: [
      s('strollers', 'Wózki i foteliki', 'Strollers and car seats', 'Kinderwagen und Kindersitze', 'Візки та автокрісла', 'Kočárky a autosedačky', 'Kočíky a autosedačky', 'Babakocsik és autósülések', 'Passeggini e seggiolini', 'Carritos y sillas de coche', 'प्रैम और कार सीट'),
      s('toys', 'Zabawki i gry', 'Toys and games', 'Spielzeug', 'Іграшки', 'Hračky', 'Hračky', 'Játékok', 'Giocattoli', 'Juguetes', 'खिलौने और गेम'),
      s('kidsfurniture', 'Meble dziecięce', 'Kids furniture', 'Kindermöbel', 'Дитячі меблі', 'Dětský nábytek', 'Detský nábytok', 'Gyerekbútor', 'Mobili per bambini', 'Muebles infantiles', 'बच्चों का फ़र्नीचर'),
      s('school', 'Do szkoły', 'School', 'Schule', 'До школи', 'Do školy', 'Do školy', 'Iskolai', 'Scuola', 'Colegio', 'स्कूल का सामान'),
      OTHER,
    ],
  },
  {
    id: 'electronics', icon: 'phone', kinds: ALL,
    label: L('Elektronika', 'Electronics', 'Elektronik', 'Електроніка', 'Elektronika', 'Elektronika', 'Elektronika', 'Elettronica', 'Electrónica', 'इलेक्ट्रॉनिक्स'),
    subs: [
      s('phones', 'Telefony', 'Phones', 'Handys', 'Телефони', 'Telefony', 'Telefóny', 'Telefonok', 'Telefoni', 'Móviles', 'फ़ोन'),
      s('computers', 'Komputery', 'Computers', 'Computer', "Комп'ютери", 'Počítače', 'Počítače', 'Számítógépek', 'Computer', 'Ordenadores', 'कंप्यूटर'),
      s('tv', 'RTV i audio', 'TV and audio', 'TV und Audio', 'ТВ та аудіо', 'TV a audio', 'TV a audio', 'TV és audio', 'TV e audio', 'TV y audio', 'TV और ऑडियो'),
      s('photo', 'Foto i drony', 'Cameras and drones', 'Foto und Drohnen', 'Фото та дрони', 'Foto a drony', 'Foto a drony', 'Fotó és drón', 'Foto e droni', 'Foto y drones', 'कैमरा और ड्रोन'),
      s('gaming', 'Konsole i gry', 'Consoles and games', 'Konsolen und Spiele', 'Консолі та ігри', 'Konzole a hry', 'Konzoly a hry', 'Konzolok és játékok', 'Console e giochi', 'Consolas y juegos', 'कंसोल और गेम'),
      OTHER,
    ],
  },
  {
    id: 'sport', icon: 'bike', kinds: ALL,
    label: L('Sport i wypoczynek', 'Sport and leisure', 'Sport und Freizeit', 'Спорт і відпочинок', 'Sport a volný čas', 'Šport a voľný čas', 'Sport és szabadidő', 'Sport e tempo libero', 'Deporte y ocio', 'खेलकूद और मनोरंजन'),
    subs: [
      s('bikes', 'Rowery', 'Bikes', 'Fahrräder', 'Велосипеди', 'Kola', 'Bicykle', 'Kerékpárok', 'Biciclette', 'Bicicletas', 'साइकिलें'),
      s('camping', 'Camping i turystyka', 'Camping and hiking', 'Camping und Wandern', 'Кемпінг і туризм', 'Kemping a turistika', 'Kemping a turistika', 'Kemping és túrázás', 'Campeggio ed escursioni', 'Camping y senderismo', 'कैंपिंग और ट्रेकिंग'),
      s('winter', 'Narty, snowboard', 'Ski, snowboard', 'Ski, Snowboard', 'Лижі, сноуборд', 'Lyže, snowboard', 'Lyže, snowboard', 'Sí, snowboard', 'Sci, snowboard', 'Esquí, snowboard', 'स्की, स्नोबोर्ड'),
      s('water', 'Kajaki, SUP, wędkarstwo', 'Kayaks, SUP, fishing', 'Kajak, SUP, Angeln', 'Каяки, SUP, риболовля', 'Kajaky, paddleboard, rybaření', 'Kajaky, paddleboard, rybárstvo', 'Kajak, SUP, horgászat', 'Kayak, SUP, pesca', 'Kayak, SUP, pesca', 'कयाक, SUP, मछली पकड़ना'),
      s('fitness', 'Fitness', 'Fitness', 'Fitness', 'Фітнес', 'Fitness', 'Fitness', 'Fitnesz', 'Fitness', 'Fitness', 'फ़िटनेस'),
      s('music', 'Instrumenty', 'Instruments', 'Instrumente', 'Музичні інструменти', 'Hudební nástroje', 'Hudobné nástroje', 'Hangszerek', 'Strumenti musicali', 'Instrumentos', 'वाद्य यंत्र'),
      OTHER,
    ],
  },
  {
    id: 'events', icon: 'tent', kinds: ['rent', 'service', 'sell', 'wanted'],
    label: L('Imprezy i uroczystości', 'Parties and events', 'Feste und Feiern', 'Свята та події', 'Oslavy a akce', 'Oslavy a podujatia', 'Rendezvények', 'Feste ed eventi', 'Fiestas y eventos', 'पार्टी और समारोह'),
    subs: [
      s('tents', 'Namioty i pawilony', 'Marquees', 'Festzelte', 'Намети', 'Párty stany', 'Párty stany', 'Rendezvénysátrak', 'Gazebo e tensostrutture', 'Carpas', 'टेंट और शामियाना'),
      s('tables', 'Stoły, krzesła, zastawa', 'Tables, chairs, tableware', 'Tische, Stühle, Geschirr', 'Столи, стільці, посуд', 'Stoly, židle, nádobí', 'Stoly, stoličky, riad', 'Asztalok, székek, edények', 'Tavoli, sedie, stoviglie', 'Mesas, sillas, vajilla', 'मेज़, कुर्सियाँ, बर्तन'),
      s('sound', 'Nagłośnienie i światło', 'Sound and lighting', 'Ton und Licht', 'Звук і світло', 'Ozvučení a světla', 'Ozvučenie a svetlá', 'Hangosítás és fény', 'Audio e luci', 'Sonido e iluminación', 'साउंड और लाइट'),
      s('decorations', 'Dekoracje', 'Decorations', 'Dekoration', 'Декорації', 'Dekorace', 'Dekorácie', 'Dekoráció', 'Decorazioni', 'Decoración', 'सजावट'),
      OTHER,
    ],
  },
  {
    id: 'pets', icon: 'paw', kinds: ['sell', 'give', 'service', 'wanted'],
    label: L('Zwierzęta', 'Pets', 'Tiere', 'Тварини', 'Zvířata', 'Zvieratá', 'Állatok', 'Animali', 'Animales', 'जानवर'),
    subs: [
      s('petgear', 'Akcesoria', 'Accessories', 'Zubehör', 'Аксесуари', 'Potřeby', 'Potreby', 'Felszerelés', 'Accessori', 'Accesorios', 'एक्सेसरीज़'),
      s('adopt', 'Oddam w dobre ręce', 'Adoption', 'Abzugeben', 'Віддам у добрі руки', 'Daruji do dobrých rukou', 'Darujem do dobrých rúk', 'Örökbefogadás', 'Adozione', 'Adopción', 'गोद लें'),
      s('farmanimals', 'Zwierzęta gospodarskie', 'Farm animals', 'Nutztiere', 'Сільгосп тварини', 'Hospodářská zvířata', 'Hospodárske zvieratá', 'Haszonállatok', 'Animali da fattoria', 'Animales de granja', 'मवेशी'),
      OTHER,
    ],
  },
  {
    id: 'community', icon: 'users', kinds: ['wanted', 'give', 'service'],
    label: L('Sąsiedzi', 'Neighbours', 'Nachbarn', 'Сусіди', 'Sousedé', 'Susedia', 'Szomszédok', 'Vicini', 'Vecinos', 'पड़ोसी'),
    subs: [
      s('missing', 'Zaginione zwierzęta', 'Missing pets', 'Vermisste Tiere', 'Зниклі тварини', 'Ztracená zvířata', 'Stratené zvieratá', 'Elveszett állatok', 'Animali scomparsi', 'Mascotas perdidas', 'खोए पालतू'),
      s('meet', 'Zbiórki i miejsca spotkań', 'Meet-ups and gathering points', 'Treffpunkte und Sammelaktionen', 'Збори та місця зустрічі', 'Srazy a místa setkání', 'Zrazy a miesta stretnutia', 'Gyülekezők és találkozópontok', 'Ritrovi e punti di raccolta', 'Quedadas y puntos de encuentro', 'मीट-अप और मिलने की जगहें'),
      s('help', 'Pomoc sąsiedzka', 'Neighbourly help', 'Nachbarschaftshilfe', 'Сусідська допомога', 'Sousedská výpomoc', 'Susedská výpomoc', 'Szomszédsegítség', 'Aiuto tra vicini', 'Ayuda vecinal', 'पड़ोसी की मदद'),
      s('ask', 'Pytania do sąsiadów', 'Ask the neighbours', 'Fragen an die Nachbarn', 'Питання до сусідів', 'Dotazy na sousedy', 'Otázky pre susedov', 'Kérdés a szomszédoknak', 'Domande ai vicini', 'Preguntas a los vecinos', 'पड़ोसियों से सवाल'),
      s('lost', 'Zgubione i znalezione', 'Lost and found', 'Fundsachen', 'Загублене і знайдене', 'Ztráty a nálezy', 'Straty a nálezy', 'Elveszett és talált', 'Oggetti smarriti', 'Objetos perdidos', 'खोया-पाया'),
      s('localevents', 'Wydarzenia w okolicy', 'Local events', 'Veranstaltungen', 'Події поруч', 'Akce v okolí', 'Podujatia v okolí', 'Helyi események', 'Eventi in zona', 'Eventos cerca', 'आस-पास के इवेंट'),
      OTHER,
    ],
  },
  {
    id: 'other', icon: 'box', kinds: ALL,
    label: L('Inne', 'Other', 'Sonstiges', 'Інше', 'Ostatní', 'Ostatné', 'Egyéb', 'Altro', 'Otros', 'अन्य'),
    subs: [
      s('books', 'Książki', 'Books', 'Bücher', 'Книги', 'Knihy', 'Knihy', 'Könyvek', 'Libri', 'Libros', 'किताबें'),
      s('collect', 'Kolekcje i antyki', 'Collectibles', 'Sammeln und Antiquitäten', 'Колекції та антикваріат', 'Sběratelství a starožitnosti', 'Zberateľstvo a starožitnosti', 'Gyűjtemények, régiségek', 'Collezionismo e antiquariato', 'Coleccionismo y antigüedades', 'संग्रह और एंटीक'),
      s('tickets', 'Bilety', 'Tickets', 'Tickets', 'Квитки', 'Vstupenky', 'Vstupenky', 'Jegyek', 'Biglietti', 'Entradas', 'टिकट'),
      OTHER,
    ],
  },
]

export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
export const subById = (cat: string, sub?: string) => categoryById(cat).subs.find((x) => x.id === sub)

/** Gotowe produkty dla rolnika: jedno stuknięcie, potem tylko cena i zapas. */
export interface FarmTemplate {
  id: string
  sub: string
  unit: Unit
  label: Labels
}

const f = (id: string, sub: string, unit: Unit, ...l: Parameters<typeof L>): FarmTemplate => ({ id, sub, unit, label: L(...l) })

export const FARM_TEMPLATES: FarmTemplate[] = [
  f('eggs', 'eggs', 'item', 'Jajka', 'Eggs', 'Eier', 'Яйця', 'Vejce', 'Vajcia', 'Tojás', 'Uova', 'Huevos', 'अंडे'),
  f('milk', 'eggs', 'litre', 'Mleko', 'Milk', 'Milch', 'Молоко', 'Mléko', 'Mlieko', 'Tej', 'Latte', 'Leche', 'दूध'),
  f('cheese', 'eggs', 'kg', 'Ser', 'Cheese', 'Käse', 'Сир', 'Sýr', 'Syr', 'Sajt', 'Formaggio', 'Queso', 'पनीर'),
  f('potatoes', 'veg', 'kg', 'Ziemniaki', 'Potatoes', 'Kartoffeln', 'Картопля', 'Brambory', 'Zemiaky', 'Burgonya', 'Patate', 'Patatas', 'आलू'),
  f('carrots', 'veg', 'kg', 'Marchew', 'Carrots', 'Karotten', 'Морква', 'Mrkev', 'Mrkva', 'Sárgarépa', 'Carote', 'Zanahorias', 'गाजर'),
  f('onions', 'veg', 'kg', 'Cebula', 'Onions', 'Zwiebeln', 'Цибуля', 'Cibule', 'Cibuľa', 'Hagyma', 'Cipolle', 'Cebollas', 'प्याज़'),
  f('tomatoes', 'veg', 'kg', 'Pomidory', 'Tomatoes', 'Tomaten', 'Помідори', 'Rajčata', 'Paradajky', 'Paradicsom', 'Pomodori', 'Tomates', 'टमाटर'),
  f('cucumbers', 'veg', 'kg', 'Ogórki', 'Cucumbers', 'Gurken', 'Огірки', 'Okurky', 'Uhorky', 'Uborka', 'Cetrioli', 'Pepinos', 'खीरा'),
  f('cabbage', 'veg', 'item', 'Kapusta', 'Cabbage', 'Kohl', 'Капуста', 'Zelí', 'Kapusta', 'Káposzta', 'Cavolo', 'Col', 'पत्ता गोभी'),
  f('apples', 'fruit', 'kg', 'Jabłka', 'Apples', 'Äpfel', 'Яблука', 'Jablka', 'Jablká', 'Alma', 'Mele', 'Manzanas', 'सेब'),
  f('strawberries', 'fruit', 'kg', 'Truskawki', 'Strawberries', 'Erdbeeren', 'Полуниця', 'Jahody', 'Jahody', 'Eper', 'Fragole', 'Fresas', 'स्ट्रॉबेरी'),
  f('honey', 'honey', 'item', 'Miód', 'Honey', 'Honig', 'Мед', 'Med', 'Med', 'Méz', 'Miele', 'Miel', 'शहद'),
  f('wood', 'wood', 'fixed', 'Drewno opałowe', 'Firewood', 'Brennholz', 'Дрова', 'Palivové dřevo', 'Palivové drevo', 'Tűzifa', 'Legna', 'Leña', 'जलाऊ लकड़ी'),
]
