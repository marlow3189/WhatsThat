import type { Lang, Listing } from './types'
import type { Relation } from './circles'

/**
 * Planer „co mi pomoże”: cel → kilka kroków → oferty pod każdy krok, znajomi najpierw.
 * W aplikacji demo plany są gotowe (najczęstsze sprawy), w produkcji układa je model
 * (supabase/functions/plan), a dopasowanie ofert zostaje to samo.
 */

type L9 = Record<Lang, string>
const L = (pl: string, en: string, de: string, uk: string, cs: string, sk: string, hu: string, it: string, es: string, hi: string): L9 => ({ pl, en, de, uk, cs, sk, hu, it, es, hi })

export interface PlanStep {
  id: string
  title: L9
  /** początki słów szukanych w tytułach i opisach ogłoszeń (bez polskich znaków, małe litery) */
  terms: string[]
}

export interface Recipe {
  id: string
  /** początki słów w zapytaniu, po których rozpoznajemy cel */
  keywords: string[]
  goal: L9
  steps: PlanStep[]
}

export const RECIPES: Recipe[] = [
  {
    id: 'paving',
    keywords: ['bruk', 'kostk', 'podjazd', 'chodnik', 'pav', 'driveway', 'pflaster', 'einfahrt', 'брук', 'доріжк', 'вимост', 'dlazd', 'dlažb', 'dlazb', 'térk', 'terk', 'burkol', 'paviment', 'vialetto', 'adoquin', 'entrada', 'पेवर', 'आँगन', 'ड्राइववे', 'फ़र्श'],
    goal: L('Wybrukować podjazd', 'Pave a driveway', 'Einfahrt pflastern', 'Вимостити під’їзд', 'Vydláždit příjezd', 'Vydláždiť príjazd', 'Kocsibeálló térkövezése', 'Pavimentare il vialetto', 'Adoquinar la entrada', 'आँगन में पेवर ब्लॉक लगवाना'),
    steps: [
      { id: 'sand', title: L('Piasek na podsypkę', 'Sand for the bedding layer', 'Sand für das Bett', 'Пісок для підсипки', 'Písek do podsypu', 'Piesok do podsypu', 'Homok az ágyazathoz', 'Sabbia per il sottofondo', 'Arena para la base', 'नीचे बिछाने के लिए रेत'), terms: ['piasek', 'piask', 'sand', 'пісок', 'pisek', 'piesok', 'homok', 'sabbia', 'arena', 'रेत', 'बालू'] },
      { id: 'pavers', title: L('Kostka brukowa', 'Paving stones', 'Pflastersteine', 'Бруківка', 'Zámková dlažba', 'Zámková dlažba', 'Térkő', 'Autobloccanti', 'Adoquines', 'पेवर ब्लॉक'), terms: ['kostk', 'bruk', 'paver', 'pflaster', 'dlazb', 'terko', 'autobloccant', 'adoquin', 'पेवर', 'ब्लॉक'] },
      { id: 'compactor', title: L('Zagęszczarka do podbudowy', 'Plate compactor', 'Rüttelplatte', 'Віброплита', 'Vibrační deska', 'Vibračná doska', 'Lapvibrátor', 'Piastra vibrante', 'Bandeja vibratoria', 'प्लेट कॉम्पैक्टर'), terms: ['zageszcz', 'ubijark', 'compactor', 'ruttel', 'вібро', 'vibracn', 'vibrator', 'piastra', 'bandeja', 'कॉम्पैक्टर'] },
      { id: 'cutter', title: L('Gilotyna albo piła do kostki', 'Block splitter or saw', 'Steinknacker oder Säge', 'Гільйотина для бруківки', 'Řezačka dlažby', 'Rezačka dlažby', 'Térkővágó', 'Taglierina per autobloccanti', 'Cortadora de adoquines', 'ब्लॉक कटर या आरी'), terms: ['gilotyn', 'przecinark', 'splitter', 'steinknack', 'гільйотин', 'rezack', 'vago', 'taglierin', 'cortadora', 'कटर'] },
      { id: 'pro', title: L('Brukarz, jeśli nie chcesz sam', 'A paver, if you’d rather not do it yourself', 'Pflasterer, wenn du es nicht selbst machst', 'Майстер, якщо не хочете самі', 'Dlaždič, pokud to nechcete dělat sami', 'Dláždič, ak to nechcete robiť sami', 'Burkoló, ha nem magad csinálod', 'Un posatore, se non vuoi farlo tu', 'Un solador, si no quieres hacerlo tú', 'मिस्त्री, अगर खुद नहीं करना'), terms: ['brukar', 'paving', 'pflasterer', 'dlazdic', 'burkolo', 'posator', 'solador', 'मिस्त्री'] },
    ],
  },
  {
    id: 'moving',
    keywords: ['przeprowadz', 'moving', 'move house', 'umzug', 'переїзд', 'stehov', 'stěhov', 'stahov', 'sťahov', 'koltoz', 'költöz', 'trasloc', 'mudanza', 'शिफ्ट', 'घर बदल', 'सामान ले जा'],
    goal: L('Przeprowadzka', 'Moving house', 'Umzug', 'Переїзд', 'Stěhování', 'Sťahovanie', 'Költözés', 'Trasloco', 'Mudanza', 'घर शिफ़्ट करना'),
    steps: [
      { id: 'boxes', title: L('Kartony', 'Boxes', 'Kartons', 'Коробки', 'Krabice', 'Krabice', 'Dobozok', 'Scatoloni', 'Cajas', 'गत्ते के डिब्बे'), terms: ['karton', 'box', 'krabic', 'doboz', 'scatol', 'caja', 'डिब्ब', 'कार्टन'] },
      { id: 'van', title: L('Bus albo przyczepka', 'A van or trailer', 'Transporter oder Anhänger', 'Бус або причіп', 'Dodávka nebo vozík', 'Dodávka alebo vozík', 'Kisbusz vagy utánfutó', 'Furgone o rimorchio', 'Furgoneta o remolque', 'टेम्पो या ट्रॉली'), terms: ['bus', 'przyczep', 'van', 'transporter', 'anhanger', 'причіп', 'dodavk', 'utanfuto', 'furgon', 'rimorch', 'remolque', 'टेम्पो', 'ट्रॉली', 'वैन'] },
      { id: 'hands', title: L('Pomoc przy noszeniu', 'Help with carrying', 'Hilfe beim Tragen', 'Допомога з перенесенням', 'Pomoc s nošením', 'Pomoc s nosením', 'Segítség a cipekedésben', 'Aiuto a portare', 'Ayuda para cargar', 'सामान उठाने में मदद'), terms: ['przeprowadz', 'nosi', 'moving', 'umzug', 'stehov', 'koltoz', 'trasloc', 'mudanz', 'शिफ्ट', 'मज़दूर'] },
    ],
  },
  {
    id: 'garden',
    keywords: ['kosi', 'trawnik', 'trawa', 'ogrod', 'galez', 'mow', 'lawn', 'rasen', 'mahen', 'газон', 'трав', 'sekat', 'sekani', 'kosit', 'fűny', 'funyi', 'nyir', 'prato', 'tagliare l', 'cesped', 'césped', 'घास', 'लॉन', 'बगीच'],
    goal: L('Skosić trawnik i wywieźć gałęzie', 'Mow the lawn and haul away branches', 'Rasen mähen und Äste wegbringen', 'Скосити газон і вивезти гілки', 'Posekat trávník a odvézt větve', 'Pokosiť trávnik a odviezť konáre', 'Füvet nyírni és elvinni az ágakat', 'Tagliare il prato e portare via i rami', 'Cortar el césped y llevar las ramas', 'घास काटना और टहनियाँ हटवाना'),
    steps: [
      { id: 'mower', title: L('Kosiarka', 'Lawn mower', 'Rasenmäher', 'Газонокосарка', 'Sekačka', 'Kosačka', 'Fűnyíró', 'Tosaerba', 'Cortacésped', 'घास काटने की मशीन'), terms: ['kosiar', 'mower', 'rasenmah', 'газонокос', 'sekack', 'kosack', 'funyiro', 'tosaerb', 'cortacesped', 'मोवर', 'घास'] },
      { id: 'trailer', title: L('Przyczepka na gałęzie', 'A trailer for the branches', 'Anhänger für die Äste', 'Причіп для гілок', 'Vozík na větve', 'Vozík na konáre', 'Utánfutó az ágaknak', 'Rimorchio per i rami', 'Remolque para las ramas', 'टहनियों के लिए ट्रॉली'), terms: ['przyczep', 'trailer', 'anhanger', 'причіп', 'vozik', 'utanfuto', 'rimorch', 'remolque', 'ट्रॉली', 'टेम्पो'] },
      { id: 'help', title: L('Ktoś, kto zrobi to za Ciebie', 'Someone to do it for you', 'Jemand, der es für dich macht', 'Хтось, хто зробить за вас', 'Někdo, kdo to udělá za vás', 'Niekto, kto to urobí za vás', 'Valaki, aki megcsinálja helyetted', 'Qualcuno che lo faccia per te', 'Alguien que lo haga por ti', 'कोई जो यह काम कर दे'), terms: ['skosi', 'kosze', 'ogrod', 'garden', 'gartenpfleg', 'zahrad', 'kert', 'giardin', 'jardin', 'माली', 'बगीच'] },
    ],
  },
  {
    id: 'heating',
    keywords: ['opal', 'opał', 'pellet', 'peletu', 'ekogroszek', 'wegiel', 'węgiel', 'ogrzew', 'heating fuel', 'firewood', 'brennstoff', 'heizmaterial', 'kohle', 'паливо', 'пелет', 'вугілля', 'дрова', 'palivo', 'pelety', 'uhli', 'uhlí', 'uhlie', 'tuzelo', 'tüzelő', 'szen', 'szén', 'combusti', 'legna', 'carbone', 'calefacc', 'leña', 'कोयला', 'जलाऊ', 'ईंधन', 'पेलेट'],
    goal: L('Opał na zimę', 'Heating fuel for winter', 'Brennstoff für den Winter', 'Паливо на зиму', 'Palivo na zimu', 'Palivo na zimu', 'Tüzelő télre', 'Combustibile per l’inverno', 'Combustible para el invierno', 'सर्दियों के लिए ईंधन'),
    steps: [
      { id: 'fuel', title: L('Pellet, ekogroszek, węgiel albo drewno', 'Pellets, pea coal, coal or firewood', 'Pellets, Kohle oder Brennholz', 'Пелети, вугілля або дрова', 'Pelety, uhlí nebo dřevo', 'Pelety, uhlie alebo drevo', 'Pellet, szén vagy tűzifa', 'Pellet, carbone o legna', 'Pellets, carbón o leña', 'पेलेट, कोयला या जलाऊ लकड़ी'), terms: ['pellet', 'ekogroszek', 'wegiel', 'węgiel', 'drewno', 'brykiet', 'kohle', 'brennholz', 'пелет', 'вугілл', 'дров', 'pelet', 'uhli', 'uhlie', 'drevo', 'szen', 'tuzifa', 'carbone', 'legna', 'carbon', 'lena', 'कोयल', 'लकड़', 'पेलेट'] },
      { id: 'haul', title: L('Transport, jeśli nie ma dowozu', 'Transport if there is no delivery', 'Transport, falls keine Lieferung', 'Перевезення, якщо немає доставки', 'Doprava, pokud chybí dovoz', 'Doprava, ak chýba dovoz', 'Szállítás, ha nincs kiszállítás', 'Trasporto, se non c’è consegna', 'Transporte, si no hay entrega', 'ढुलाई, अगर डिलीवरी नहीं है'), terms: ['przyczep', 'bus', 'transit', 'wywrotk', 'trailer', 'anhanger', 'причіп', 'vozik', 'utanfuto', 'rimorch', 'remolque', 'ट्रॉली', 'टेम्पो'] },
      { id: 'sweep', title: L('Przegląd komina i kotła', 'Chimney and boiler check', 'Schornstein- und Kesselprüfung', 'Перевірка димаря та котла', 'Revize komína a kotle', 'Revízia komína a kotla', 'Kémény- és kazánellenőrzés', 'Controllo di canna fumaria e caldaia', 'Revisión de chimenea y caldera', 'चिमनी और बॉयलर की जाँच'), terms: ['kominiar', 'komin', 'chimney', 'schornstein', 'димар', 'kominik', 'kemeny', 'spazzacamin', 'deshollin', 'चिमनी'] },
    ],
  },
]

/** Małe litery, bez znaków diakrytycznych (ł → l), żeby „Piasek”, „piasku” i „PIASEK” się spotkały. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // hindi: kropka nukta (फ़ / फ) bywa pisana albo pomijana, więc porównujemy bez niej
    .replace(/\u093C/g, '')
}

/** Początki słów z zapytania: „jajka” → „jajk”, „piasku” → „pias”. */
export function stems(query: string): string[] {
  return normalize(query)
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter((w) => w.length >= 3)
    .map((w) => (w.length > 5 ? w.slice(0, w.length - 2) : w.length > 4 ? w.slice(0, 4) : w))
}

export function findRecipe(query: string): Recipe | undefined {
  const q = normalize(query)
  if (q.trim().length < 3) return undefined
  return RECIPES.find((r) => r.keywords.some((k) => q.includes(normalize(k))))
}

function words(l: Pick<Listing, 'title' | 'description'>): string[] {
  return normalize(`${l.title} ${l.description}`).split(/[^\p{L}\p{M}\p{N}]+/u)
}

/**
 * Czy ogłoszenie pasuje do któregoś z początków słów (dopasowanie od początku słowa).
 * `maxExtra` ogranicza, o ile liter słowo może być dłuższe od początku: „pias” łapie „piasek”, „piasku”,
 * ale nie „Piaseczno”.
 */
export function matches(l: Pick<Listing, 'title' | 'description'>, terms: string[], maxExtra = Infinity): boolean {
  const ws = words(l)
  return terms.some((t) => {
    const n = normalize(t)
    return ws.some((w) => w.startsWith(n) && w.length - n.length <= maxExtra)
  })
}

export interface Hit {
  listing: Listing
  rel: Relation
  km: number
}

/** Kolejność: znajomi, znajomi znajomych, firmy i reszta okolicy; w środku po odległości. */
export function rank<T extends Hit>(hits: T[]): T[] {
  return [...hits].sort((a, b) => a.rel.circle - b.rel.circle || a.km - b.km)
}

export interface PlannedStep {
  step: PlanStep
  hits: Hit[]
}

/** Gdzie w tytule pada słowo z kroku: [pozycja słowa, -długość dopasowanego początku]; mniej = trafniej. */
function titleScore(title: string, terms: string[]): [number, number] | null {
  const ws = normalize(title).split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean)
  let best: [number, number] | null = null
  for (const t of terms) {
    const n = normalize(t)
    const i = ws.findIndex((w) => w.startsWith(n))
    if (i >= 0 && (!best || i < best[0] || (i === best[0] && -n.length < best[1]))) best = [i, -n.length]
  }
  return best
}

/**
 * Oferty pod kroki planu. Każda oferta trafia do jednego kroku: tego, którego słowo stoi w tytule najwcześniej
 * („Gilotyna do kostki” → gilotyna, nie kostka). Opis liczy się tylko, gdy w tytułach nic nie pasuje.
 */
export function plan(recipe: Recipe, pool: Hit[], perStep = 3): PlannedStep[] {
  const byStep = new Map<string, Hit[]>(recipe.steps.map((s) => [s.id, []]))
  for (const h of pool) {
    let best: { id: string; score: [number, number] } | null = null
    for (const step of recipe.steps) {
      const score = titleScore(h.listing.title, step.terms)
      if (score && (!best || score[0] < best.score[0] || (score[0] === best.score[0] && score[1] < best.score[1]))) best = { id: step.id, score }
    }
    if (best) byStep.get(best.id)!.push(h)
  }
  return recipe.steps.map((step) => {
    const inTitle = byStep.get(step.id)!
    const hits = inTitle.length ? inTitle : pool.filter((h) => matches(h.listing, step.terms))
    return { step, hits: rank(hits).slice(0, perStep) }
  })
}

/** Zwykłe wyszukiwanie słów („jajka”) pogrupowane w kręgi. */
export function searchByCircle(query: string, pool: Hit[]): { friends: Hit[]; fof: Hit[]; nearby: Hit[] } {
  const terms = stems(query)
  const hits = terms.length ? rank(pool.filter((h) => matches(h.listing, terms, 3))) : []
  return {
    friends: hits.filter((h) => h.rel.circle === 1),
    fof: hits.filter((h) => h.rel.circle === 2),
    nearby: hits.filter((h) => h.rel.circle === 3),
  }
}
