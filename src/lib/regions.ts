import { VOIVODESHIPS, distanceKm } from './geo'

/** Jeden region: nazwa (oficjalna, w języku kraju; Indie i USA po angielsku), stolica regionu i jej współrzędne. */
export interface Region {
  region: string
  town: string
  lat: number
  lng: number
}

/**
 * Regiony pierwszego rzędu dla każdego obsługiwanego kraju, alfabetycznie w języku kraju.
 * Punkt regionu to jego stolica (siedziba władz), używana jako domyślne położenie.
 */
export const REGIONS: Record<string, Region[]> = {
  PL: VOIVODESHIPS.map((v) => ({ region: v.voivodeship, town: v.town, lat: v.lat, lng: v.lng })),

  // 13 krajów + Praga
  CZ: [
    { region: 'Hlavní město Praha', town: 'Praha', lat: 50.0755, lng: 14.4378 },
    { region: 'Jihočeský kraj', town: 'České Budějovice', lat: 48.9745, lng: 14.4743 },
    { region: 'Jihomoravský kraj', town: 'Brno', lat: 49.1951, lng: 16.6068 },
    { region: 'Karlovarský kraj', town: 'Karlovy Vary', lat: 50.2306, lng: 12.8711 },
    { region: 'Kraj Vysočina', town: 'Jihlava', lat: 49.3961, lng: 15.5912 },
    { region: 'Královéhradecký kraj', town: 'Hradec Králové', lat: 50.2092, lng: 15.8328 },
    { region: 'Liberecký kraj', town: 'Liberec', lat: 50.7663, lng: 15.0543 },
    { region: 'Moravskoslezský kraj', town: 'Ostrava', lat: 49.8209, lng: 18.2625 },
    { region: 'Olomoucký kraj', town: 'Olomouc', lat: 49.5938, lng: 17.2509 },
    { region: 'Pardubický kraj', town: 'Pardubice', lat: 50.0343, lng: 15.7812 },
    { region: 'Plzeňský kraj', town: 'Plzeň', lat: 49.7384, lng: 13.3736 },
    { region: 'Středočeský kraj', town: 'Praha', lat: 50.0755, lng: 14.4378 },
    { region: 'Ústecký kraj', town: 'Ústí nad Labem', lat: 50.6607, lng: 14.0323 },
    { region: 'Zlínský kraj', town: 'Zlín', lat: 49.2265, lng: 17.6707 },
  ],

  // 8 samosprávnych krajov
  SK: [
    { region: 'Banskobystrický kraj', town: 'Banská Bystrica', lat: 48.7395, lng: 19.1535 },
    { region: 'Bratislavský kraj', town: 'Bratislava', lat: 48.1486, lng: 17.1077 },
    { region: 'Košický kraj', town: 'Košice', lat: 48.7164, lng: 21.2611 },
    { region: 'Nitriansky kraj', town: 'Nitra', lat: 48.3069, lng: 18.0864 },
    { region: 'Prešovský kraj', town: 'Prešov', lat: 48.9985, lng: 21.2339 },
    { region: 'Trenčiansky kraj', town: 'Trenčín', lat: 48.8945, lng: 18.0444 },
    { region: 'Trnavský kraj', town: 'Trnava', lat: 48.3774, lng: 17.5872 },
    { region: 'Žilinský kraj', town: 'Žilina', lat: 49.2231, lng: 18.7394 },
  ],

  // 19 vármegye + főváros (węgierska kolejność: cs po c, gy po g, sz po s)
  HU: [
    { region: 'Bács-Kiskun vármegye', town: 'Kecskemét', lat: 46.8964, lng: 19.6897 },
    { region: 'Baranya vármegye', town: 'Pécs', lat: 46.0727, lng: 18.2323 },
    { region: 'Békés vármegye', town: 'Békéscsaba', lat: 46.6736, lng: 21.0877 },
    { region: 'Borsod-Abaúj-Zemplén vármegye', town: 'Miskolc', lat: 48.1035, lng: 20.7784 },
    { region: 'Budapest', town: 'Budapest', lat: 47.4979, lng: 19.0402 },
    { region: 'Csongrád-Csanád vármegye', town: 'Szeged', lat: 46.253, lng: 20.1414 },
    { region: 'Fejér vármegye', town: 'Székesfehérvár', lat: 47.186, lng: 18.4221 },
    { region: 'Győr-Moson-Sopron vármegye', town: 'Győr', lat: 47.6875, lng: 17.6504 },
    { region: 'Hajdú-Bihar vármegye', town: 'Debrecen', lat: 47.5316, lng: 21.6273 },
    { region: 'Heves vármegye', town: 'Eger', lat: 47.9025, lng: 20.3772 },
    { region: 'Jász-Nagykun-Szolnok vármegye', town: 'Szolnok', lat: 47.1621, lng: 20.1825 },
    { region: 'Komárom-Esztergom vármegye', town: 'Tatabánya', lat: 47.5692, lng: 18.4048 },
    { region: 'Nógrád vármegye', town: 'Salgótarján', lat: 48.0935, lng: 19.7999 },
    { region: 'Pest vármegye', town: 'Budapest', lat: 47.4979, lng: 19.0402 },
    { region: 'Somogy vármegye', town: 'Kaposvár', lat: 46.3594, lng: 17.7968 },
    { region: 'Szabolcs-Szatmár-Bereg vármegye', town: 'Nyíregyháza', lat: 47.9495, lng: 21.7244 },
    { region: 'Tolna vármegye', town: 'Szekszárd', lat: 46.3474, lng: 18.7062 },
    { region: 'Vas vármegye', town: 'Szombathely', lat: 47.2307, lng: 16.6218 },
    { region: 'Veszprém vármegye', town: 'Veszprém', lat: 47.0933, lng: 17.9115 },
    { region: 'Zala vármegye', town: 'Zalaegerszeg', lat: 46.8417, lng: 16.8416 },
  ],

  // 16 Länder
  DE: [
    { region: 'Baden-Württemberg', town: 'Stuttgart', lat: 48.7758, lng: 9.1829 },
    { region: 'Bayern', town: 'München', lat: 48.1351, lng: 11.582 },
    { region: 'Berlin', town: 'Berlin', lat: 52.52, lng: 13.405 },
    { region: 'Brandenburg', town: 'Potsdam', lat: 52.3906, lng: 13.0645 },
    { region: 'Bremen', town: 'Bremen', lat: 53.0793, lng: 8.8017 },
    { region: 'Hamburg', town: 'Hamburg', lat: 53.5511, lng: 9.9937 },
    { region: 'Hessen', town: 'Wiesbaden', lat: 50.0782, lng: 8.2398 },
    { region: 'Mecklenburg-Vorpommern', town: 'Schwerin', lat: 53.6355, lng: 11.4012 },
    { region: 'Niedersachsen', town: 'Hannover', lat: 52.3759, lng: 9.732 },
    { region: 'Nordrhein-Westfalen', town: 'Düsseldorf', lat: 51.2277, lng: 6.7735 },
    { region: 'Rheinland-Pfalz', town: 'Mainz', lat: 49.9929, lng: 8.2473 },
    { region: 'Saarland', town: 'Saarbrücken', lat: 49.2402, lng: 6.9969 },
    { region: 'Sachsen', town: 'Dresden', lat: 51.0504, lng: 13.7373 },
    { region: 'Sachsen-Anhalt', town: 'Magdeburg', lat: 52.1205, lng: 11.6276 },
    { region: 'Schleswig-Holstein', town: 'Kiel', lat: 54.3233, lng: 10.1228 },
    { region: 'Thüringen', town: 'Erfurt', lat: 50.9848, lng: 11.0299 },
  ],

  // 9 Bundesländer
  AT: [
    { region: 'Burgenland', town: 'Eisenstadt', lat: 47.8457, lng: 16.5233 },
    { region: 'Kärnten', town: 'Klagenfurt am Wörthersee', lat: 46.6247, lng: 14.3053 },
    { region: 'Niederösterreich', town: 'St. Pölten', lat: 48.2047, lng: 15.6256 },
    { region: 'Oberösterreich', town: 'Linz', lat: 48.3069, lng: 14.2858 },
    { region: 'Salzburg', town: 'Salzburg', lat: 47.8095, lng: 13.055 },
    { region: 'Steiermark', town: 'Graz', lat: 47.0707, lng: 15.4395 },
    { region: 'Tirol', town: 'Innsbruck', lat: 47.2692, lng: 11.4041 },
    { region: 'Vorarlberg', town: 'Bregenz', lat: 47.5031, lng: 9.7471 },
    { region: 'Wien', town: 'Wien', lat: 48.2082, lng: 16.3738 },
  ],

  // 24 області + Київ + АР Крим + Севастополь (podział według prawa Ukrainy i prawa międzynarodowego)
  UA: [
    { region: 'Автономна Республіка Крим', town: 'Сімферополь', lat: 44.9521, lng: 34.1024 },
    { region: 'Вінницька область', town: 'Вінниця', lat: 49.2331, lng: 28.4682 },
    { region: 'Волинська область', town: 'Луцьк', lat: 50.7472, lng: 25.3254 },
    { region: 'Дніпропетровська область', town: 'Дніпро', lat: 48.4647, lng: 35.0462 },
    { region: 'Донецька область', town: 'Донецьк', lat: 48.0159, lng: 37.8029 },
    { region: 'Житомирська область', town: 'Житомир', lat: 50.2547, lng: 28.6587 },
    { region: 'Закарпатська область', town: 'Ужгород', lat: 48.6208, lng: 22.2879 },
    { region: 'Запорізька область', town: 'Запоріжжя', lat: 47.8388, lng: 35.1396 },
    { region: 'Івано-Франківська область', town: 'Івано-Франківськ', lat: 48.9226, lng: 24.7111 },
    { region: 'Київ', town: 'Київ', lat: 50.4501, lng: 30.5234 },
    { region: 'Київська область', town: 'Київ', lat: 50.4501, lng: 30.5234 },
    { region: 'Кіровоградська область', town: 'Кропивницький', lat: 48.5079, lng: 32.2623 },
    { region: 'Луганська область', town: 'Луганськ', lat: 48.574, lng: 39.3078 },
    { region: 'Львівська область', town: 'Львів', lat: 49.8397, lng: 24.0297 },
    { region: 'Миколаївська область', town: 'Миколаїв', lat: 46.975, lng: 31.9946 },
    { region: 'Одеська область', town: 'Одеса', lat: 46.4825, lng: 30.7233 },
    { region: 'Полтавська область', town: 'Полтава', lat: 49.5883, lng: 34.5514 },
    { region: 'Рівненська область', town: 'Рівне', lat: 50.6199, lng: 26.2516 },
    { region: 'Севастополь', town: 'Севастополь', lat: 44.6166, lng: 33.5254 },
    { region: 'Сумська область', town: 'Суми', lat: 50.9077, lng: 34.7981 },
    { region: 'Тернопільська область', town: 'Тернопіль', lat: 49.5535, lng: 25.5948 },
    { region: 'Харківська область', town: 'Харків', lat: 49.9935, lng: 36.2304 },
    { region: 'Херсонська область', town: 'Херсон', lat: 46.6354, lng: 32.6169 },
    { region: 'Хмельницька область', town: 'Хмельницький', lat: 49.4229, lng: 26.9871 },
    { region: 'Черкаська область', town: 'Черкаси', lat: 49.4444, lng: 32.0598 },
    { region: 'Чернівецька область', town: 'Чернівці', lat: 48.2921, lng: 25.9358 },
    { region: 'Чернігівська область', town: 'Чернігів', lat: 51.4982, lng: 31.2893 },
  ],

  // 20 regioni
  IT: [
    { region: 'Abruzzo', town: "L'Aquila", lat: 42.3498, lng: 13.3995 },
    { region: 'Basilicata', town: 'Potenza', lat: 40.6404, lng: 15.8056 },
    { region: 'Calabria', town: 'Catanzaro', lat: 38.9098, lng: 16.5877 },
    { region: 'Campania', town: 'Napoli', lat: 40.8518, lng: 14.2681 },
    { region: 'Emilia-Romagna', town: 'Bologna', lat: 44.4949, lng: 11.3426 },
    { region: 'Friuli-Venezia Giulia', town: 'Trieste', lat: 45.6495, lng: 13.7768 },
    { region: 'Lazio', town: 'Roma', lat: 41.9028, lng: 12.4964 },
    { region: 'Liguria', town: 'Genova', lat: 44.4056, lng: 8.9463 },
    { region: 'Lombardia', town: 'Milano', lat: 45.4642, lng: 9.19 },
    { region: 'Marche', town: 'Ancona', lat: 43.6158, lng: 13.5189 },
    { region: 'Molise', town: 'Campobasso', lat: 41.5603, lng: 14.6627 },
    { region: 'Piemonte', town: 'Torino', lat: 45.0703, lng: 7.6869 },
    { region: 'Puglia', town: 'Bari', lat: 41.1171, lng: 16.8719 },
    { region: 'Sardegna', town: 'Cagliari', lat: 39.2238, lng: 9.1217 },
    { region: 'Sicilia', town: 'Palermo', lat: 38.1157, lng: 13.3615 },
    { region: 'Toscana', town: 'Firenze', lat: 43.7696, lng: 11.2558 },
    { region: 'Trentino-Alto Adige', town: 'Trento', lat: 46.0748, lng: 11.1217 },
    { region: 'Umbria', town: 'Perugia', lat: 43.1107, lng: 12.3908 },
    { region: "Valle d'Aosta", town: 'Aosta', lat: 45.7372, lng: 7.3201 },
    { region: 'Veneto', town: 'Venezia', lat: 45.4408, lng: 12.3155 },
  ],

  // 17 comunidades autónomas + Ceuta i Melilla; pełna nazwa tam, gdzie krótka myli się ze stolicą
  ES: [
    { region: 'Andalucía', town: 'Sevilla', lat: 37.3891, lng: -5.9845 },
    { region: 'Aragón', town: 'Zaragoza', lat: 41.6488, lng: -0.8891 },
    { region: 'Asturias', town: 'Oviedo', lat: 43.3614, lng: -5.8494 },
    // stolica dzielona z Las Palmas de Gran Canaria
    { region: 'Canarias', town: 'Santa Cruz de Tenerife', lat: 28.4636, lng: -16.2518 },
    { region: 'Cantabria', town: 'Santander', lat: 43.4623, lng: -3.8099 },
    { region: 'Castilla y León', town: 'Valladolid', lat: 41.6523, lng: -4.7245 },
    { region: 'Castilla-La Mancha', town: 'Toledo', lat: 39.8628, lng: -4.0273 },
    { region: 'Cataluña', town: 'Barcelona', lat: 41.3874, lng: 2.1686 },
    { region: 'Ceuta', town: 'Ceuta', lat: 35.8894, lng: -5.3213 },
    { region: 'Comunidad de Madrid', town: 'Madrid', lat: 40.4168, lng: -3.7038 },
    { region: 'Comunidad Valenciana', town: 'Valencia', lat: 39.4699, lng: -0.3763 },
    { region: 'Extremadura', town: 'Mérida', lat: 38.9161, lng: -6.3437 },
    { region: 'Galicia', town: 'Santiago de Compostela', lat: 42.8782, lng: -8.5448 },
    { region: 'Islas Baleares', town: 'Palma', lat: 39.5696, lng: 2.6502 },
    { region: 'La Rioja', town: 'Logroño', lat: 42.4627, lng: -2.445 },
    { region: 'Melilla', town: 'Melilla', lat: 35.2923, lng: -2.9381 },
    { region: 'Navarra', town: 'Pamplona', lat: 42.8125, lng: -1.6458 },
    { region: 'País Vasco', town: 'Vitoria-Gasteiz', lat: 42.8467, lng: -2.6716 },
    { region: 'Región de Murcia', town: 'Murcia', lat: 37.9922, lng: -1.1307 },
  ],

  // 9 regionów Anglii + Szkocja, Walia, Irlandia Północna
  GB: [
    { region: 'East Midlands', town: 'Nottingham', lat: 52.9548, lng: -1.1581 },
    { region: 'East of England', town: 'Cambridge', lat: 52.2053, lng: 0.1218 },
    { region: 'London', town: 'London', lat: 51.5074, lng: -0.1278 },
    { region: 'North East', town: 'Newcastle upon Tyne', lat: 54.9783, lng: -1.6178 },
    { region: 'North West', town: 'Manchester', lat: 53.4808, lng: -2.2426 },
    { region: 'Northern Ireland', town: 'Belfast', lat: 54.5973, lng: -5.9301 },
    { region: 'Scotland', town: 'Edinburgh', lat: 55.9533, lng: -3.1883 },
    { region: 'South East', town: 'Brighton', lat: 50.8225, lng: -0.1372 },
    { region: 'South West', town: 'Bristol', lat: 51.4545, lng: -2.5879 },
    { region: 'Wales', town: 'Cardiff', lat: 51.4816, lng: -3.1791 },
    { region: 'West Midlands', town: 'Birmingham', lat: 52.4862, lng: -1.8904 },
    { region: 'Yorkshire and the Humber', town: 'Leeds', lat: 53.8008, lng: -1.5491 },
  ],

  // 50 stanów + Dystrykt Kolumbii
  US: [
    { region: 'Alabama', town: 'Montgomery', lat: 32.3668, lng: -86.3 },
    { region: 'Alaska', town: 'Juneau', lat: 58.3019, lng: -134.4197 },
    { region: 'Arizona', town: 'Phoenix', lat: 33.4484, lng: -112.074 },
    { region: 'Arkansas', town: 'Little Rock', lat: 34.7465, lng: -92.2896 },
    { region: 'California', town: 'Sacramento', lat: 38.5816, lng: -121.4944 },
    { region: 'Colorado', town: 'Denver', lat: 39.7392, lng: -104.9903 },
    { region: 'Connecticut', town: 'Hartford', lat: 41.7658, lng: -72.6734 },
    { region: 'Delaware', town: 'Dover', lat: 39.1582, lng: -75.5244 },
    { region: 'District of Columbia', town: 'Washington', lat: 38.9072, lng: -77.0369 },
    { region: 'Florida', town: 'Tallahassee', lat: 30.4383, lng: -84.2807 },
    { region: 'Georgia', town: 'Atlanta', lat: 33.749, lng: -84.388 },
    { region: 'Hawaii', town: 'Honolulu', lat: 21.3069, lng: -157.8583 },
    { region: 'Idaho', town: 'Boise', lat: 43.615, lng: -116.2023 },
    { region: 'Illinois', town: 'Springfield', lat: 39.7817, lng: -89.6501 },
    { region: 'Indiana', town: 'Indianapolis', lat: 39.7684, lng: -86.1581 },
    { region: 'Iowa', town: 'Des Moines', lat: 41.5868, lng: -93.625 },
    { region: 'Kansas', town: 'Topeka', lat: 39.0473, lng: -95.6752 },
    { region: 'Kentucky', town: 'Frankfort', lat: 38.2009, lng: -84.8733 },
    { region: 'Louisiana', town: 'Baton Rouge', lat: 30.4515, lng: -91.1871 },
    { region: 'Maine', town: 'Augusta', lat: 44.3106, lng: -69.7795 },
    { region: 'Maryland', town: 'Annapolis', lat: 38.9784, lng: -76.4922 },
    { region: 'Massachusetts', town: 'Boston', lat: 42.3601, lng: -71.0589 },
    { region: 'Michigan', town: 'Lansing', lat: 42.7325, lng: -84.5555 },
    { region: 'Minnesota', town: 'Saint Paul', lat: 44.9537, lng: -93.09 },
    { region: 'Mississippi', town: 'Jackson', lat: 32.2988, lng: -90.1848 },
    { region: 'Missouri', town: 'Jefferson City', lat: 38.5767, lng: -92.1735 },
    { region: 'Montana', town: 'Helena', lat: 46.5891, lng: -112.0391 },
    { region: 'Nebraska', town: 'Lincoln', lat: 40.8136, lng: -96.7026 },
    { region: 'Nevada', town: 'Carson City', lat: 39.1638, lng: -119.7674 },
    { region: 'New Hampshire', town: 'Concord', lat: 43.2081, lng: -71.5376 },
    { region: 'New Jersey', town: 'Trenton', lat: 40.2206, lng: -74.7597 },
    { region: 'New Mexico', town: 'Santa Fe', lat: 35.687, lng: -105.9378 },
    { region: 'New York', town: 'Albany', lat: 42.6526, lng: -73.7562 },
    { region: 'North Carolina', town: 'Raleigh', lat: 35.7796, lng: -78.6382 },
    { region: 'North Dakota', town: 'Bismarck', lat: 46.8083, lng: -100.7837 },
    { region: 'Ohio', town: 'Columbus', lat: 39.9612, lng: -82.9988 },
    { region: 'Oklahoma', town: 'Oklahoma City', lat: 35.4676, lng: -97.5164 },
    { region: 'Oregon', town: 'Salem', lat: 44.9429, lng: -123.0351 },
    { region: 'Pennsylvania', town: 'Harrisburg', lat: 40.2732, lng: -76.8867 },
    { region: 'Rhode Island', town: 'Providence', lat: 41.824, lng: -71.4128 },
    { region: 'South Carolina', town: 'Columbia', lat: 34.0007, lng: -81.0348 },
    { region: 'South Dakota', town: 'Pierre', lat: 44.3683, lng: -100.351 },
    { region: 'Tennessee', town: 'Nashville', lat: 36.1627, lng: -86.7816 },
    { region: 'Texas', town: 'Austin', lat: 30.2672, lng: -97.7431 },
    { region: 'Utah', town: 'Salt Lake City', lat: 40.7608, lng: -111.891 },
    { region: 'Vermont', town: 'Montpelier', lat: 44.2601, lng: -72.5754 },
    { region: 'Virginia', town: 'Richmond', lat: 37.5407, lng: -77.436 },
    { region: 'Washington', town: 'Olympia', lat: 47.0379, lng: -122.9007 },
    { region: 'West Virginia', town: 'Charleston', lat: 38.3498, lng: -81.6326 },
    { region: 'Wisconsin', town: 'Madison', lat: 43.0731, lng: -89.4012 },
    { region: 'Wyoming', town: 'Cheyenne', lat: 41.14, lng: -104.8202 },
  ],

  // 28 stanów + 8 terytoriów związkowych
  IN: [
    // Port Blair przemianowane w 2024 r. na Sri Vijaya Puram
    { region: 'Andaman and Nicobar Islands', town: 'Sri Vijaya Puram', lat: 11.6234, lng: 92.7265 },
    { region: 'Andhra Pradesh', town: 'Amaravati', lat: 16.5131, lng: 80.5165 },
    { region: 'Arunachal Pradesh', town: 'Itanagar', lat: 27.0844, lng: 93.6053 },
    { region: 'Assam', town: 'Dispur', lat: 26.1433, lng: 91.7898 },
    { region: 'Bihar', town: 'Patna', lat: 25.5941, lng: 85.1376 },
    { region: 'Chandigarh', town: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
    { region: 'Chhattisgarh', town: 'Raipur', lat: 21.2514, lng: 81.6296 },
    { region: 'Dadra and Nagar Haveli and Daman and Diu', town: 'Daman', lat: 20.3974, lng: 72.8328 },
    { region: 'Delhi', town: 'New Delhi', lat: 28.6139, lng: 77.209 },
    { region: 'Goa', town: 'Panaji', lat: 15.4909, lng: 73.8278 },
    { region: 'Gujarat', town: 'Gandhinagar', lat: 23.2156, lng: 72.6369 },
    { region: 'Haryana', town: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
    { region: 'Himachal Pradesh', town: 'Shimla', lat: 31.1048, lng: 77.1734 },
    // stolica letnia; zimą Dżammu
    { region: 'Jammu and Kashmir', town: 'Srinagar', lat: 34.0837, lng: 74.7973 },
    { region: 'Jharkhand', town: 'Ranchi', lat: 23.3441, lng: 85.3096 },
    { region: 'Karnataka', town: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
    { region: 'Kerala', town: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366 },
    { region: 'Ladakh', town: 'Leh', lat: 34.1526, lng: 77.5771 },
    { region: 'Lakshadweep', town: 'Kavaratti', lat: 10.5669, lng: 72.642 },
    { region: 'Madhya Pradesh', town: 'Bhopal', lat: 23.2599, lng: 77.4126 },
    { region: 'Maharashtra', town: 'Mumbai', lat: 19.076, lng: 72.8777 },
    { region: 'Manipur', town: 'Imphal', lat: 24.817, lng: 93.9368 },
    { region: 'Meghalaya', town: 'Shillong', lat: 25.5788, lng: 91.8933 },
    { region: 'Mizoram', town: 'Aizawl', lat: 23.7271, lng: 92.7176 },
    { region: 'Nagaland', town: 'Kohima', lat: 25.6751, lng: 94.1086 },
    { region: 'Odisha', town: 'Bhubaneswar', lat: 20.2961, lng: 85.8245 },
    { region: 'Puducherry', town: 'Puducherry', lat: 11.9416, lng: 79.8083 },
    { region: 'Punjab', town: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
    { region: 'Rajasthan', town: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { region: 'Sikkim', town: 'Gangtok', lat: 27.3389, lng: 88.6065 },
    { region: 'Tamil Nadu', town: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { region: 'Telangana', town: 'Hyderabad', lat: 17.385, lng: 78.4867 },
    { region: 'Tripura', town: 'Agartala', lat: 23.8315, lng: 91.2868 },
    { region: 'Uttar Pradesh', town: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { region: 'Uttarakhand', town: 'Dehradun', lat: 30.3165, lng: 78.0322 },
    { region: 'West Bengal', town: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  ],
}

/** Słowo na region w danym kraju, do etykiety pola (klucz tłumaczenia wybiera ekran). */
export const REGION_KIND: Record<
  string,
  'voivodeship' | 'state' | 'land' | 'county' | 'region' | 'province' | 'oblast' | 'community' | 'nation'
> = {
  PL: 'voivodeship',
  DE: 'land',
  AT: 'land',
  US: 'state',
  IN: 'state',
  HU: 'county',
  UA: 'oblast',
  ES: 'community',
  IT: 'region',
  CZ: 'region',
  SK: 'region',
  GB: 'nation',
}

export const regionsOf = (country: string): Region[] => REGIONS[country] ?? []

/**
 * Region i miasto najbliżej podanego punktu (GPS) w danym kraju; null, gdy kraj nie ma listy.
 * Liczy odległość do stolic regionów, więc przy granicach regionów to tylko przybliżenie.
 */
export function nearestRegion(country: string, lat: number, lng: number): Region | null {
  let best: Region | null = null
  let bestD = Infinity
  for (const r of regionsOf(country)) {
    const d = distanceKm({ lat, lng }, r)
    if (d < bestD) {
      best = r
      bestD = d
    }
  }
  return best
}
