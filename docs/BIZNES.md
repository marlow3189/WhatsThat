# WhatsThat — koncept, model biznesowy i plan startu

> **WhatsThat** to aplikacja do mikro-wynajmu, pożyczania, wymiany i sprzedaży rzeczy.
> Najpierw w kręgu znajomych (jak WhatsApp: z kontaktów w telefonie), potem znajomi znajomych,
> a na końcu otwarty market w promieniu X km, w mieście, województwie albo w całym kraju.

---

## 1. Jedno zdanie

**„Pożycz od znajomego, wynajmij od sąsiada, sprzedaj wszędzie”**: WhatsApp-owa prostota, OLX-owa
szerokość i kaucja oraz ochrona, których OLX nie ma.

## 2. Nazwa

Rekomendacja: **WhatsThat** („co to?”, „a to co?”, „masz to?”). Brzmi jak pytanie, które
zadaje się znajomemu: *„Masz wiertarkę? A co to za namiot?”*. Krótka, międzynarodowa i działa w PL, DE i EN.

Inne nazwy z prefiksem *Whats*, gdyby domena albo znak towarowy były zajęte:

| Nazwa | Co sugeruje | Uwagi |
|---|---|---|
| **WhatsThat** | pytanie o rzecz, ciekawość | rekomendowana |
| WhatsLend | pożyczanie | jasna funkcja, słabiej działa przy sprzedaży |
| WhatsSpare | „co masz zbędnego” | dobra pod EU/UK |
| WhatsNear | lokalność | podkreśla market w promieniu km |
| WhatsHandy | „pod ręką” | narzędzia, DIY |
| WhatsSwap | wymiana | węższa |

**Ryzyko znaku towarowego.** Meta aktywnie broni marki *WhatsApp*. Żeby nie prosić się o sprzeciw:
- nie używaj zieleni WhatsAppa ani ikony dymka (w projekcie logo to trzy koncentryczne kręgi w kolorach pomarańcz, fiolet i niebieski),
- przed rejestracją sprawdź bazy **EUIPO** (TMview) i **UPRP**, domeny `.app`, `.pl`, `.com`, `.de`,
- zarejestruj znak słowno-graficzny w klasach 9, 35, 39 i 42, a nazwę przetestuj z prawnikiem od własności intelektualnej.

## 3. Konkurencja (podsumowanie z wcześniejszej rozmowy)

| Gracz | Co robi | Słabość, którą wykorzystujemy |
|---|---|---|
| Hygglo (Fat Llama) | największy wynajem P2P w Europie | prowizje ok. 26%, brak PL, brak warstwy znajomych |
| Peerby (NL) | sąsiedzkie pożyczanie | brak modelu zarobku, nie urósł komercyjnie |
| Pozycz.to | katalog ogłoszeń do pożyczenia | bez płatności, kaucji i ochrony, tylko tablica kontaktów |
| Borro.pl | lista oczekujących | jeszcze nie działa |
| OLX, Allegro Lokalnie, Vinted, FB Marketplace | sprzedaż | nie obsługują wynajmu (kalendarza, kaucji, zwrotu), brak kręgu zaufania |
| Grupy FB „oddam/pożyczę [osiedle]” | społeczność | chaos, zero bezpieczeństwa, brak płatności |

**Luka:** nikt w Polsce nie łączy (a) wynajmu z płatnością i kaucją w aplikacji, (b) kręgu znajomych
jako pierwszego filtra zaufania, (c) sprzedaży, wymiany i pożyczania w jednym miejscu.

## 4. Produkt: trzy kręgi

| Krąg | Kto | Opłaty | Rola w biznesie |
|---|---|---|---|
| 1. Znajomi | kontakty z telefonu | **0%**, rozliczenie gotówką, BLIK-iem albo w aplikacji | silnik wirusowy, nie zarobek |
| 2. Znajomi znajomych | „znasz przez Marka” | **5%** po stronie biorącego (min. 1 zł) | zaufanie pożyczone od wspólnego znajomego |
| 3. Market | wszyscy w promieniu km, mieście, województwie, kraju | **10%** po stronie biorącego (min. 2 zł) + opcjonalna ochrona | główny przychód transakcyjny |

Każde ogłoszenie ma suwak „kto to zobaczy?”. Właściciel zawsze dostaje **100% swojej ceny**, bo
opłatę płaci biorący. To prosty komunikat marketingowy: *„Hygglo bierze ~26%, my 10% i to od biorącego”*.

Co już jest w prototypie (`src/`):
- wyszukiwanie w kręgach + filtr: promień km (1–100), miasto, województwo, kraj, GPS,
- tryby: wynajem, za darmo, sprzedaż, wymiana; 10 kategorii,
- wycena na żywo (opłata, ochrona, kaucja jako blokada na karcie),
- czat jak w WhatsAppie z kartą rezerwacji,
- protokół zdjęć przy odbiorze i zwrocie z wypalonym znacznikiem czasu,
- krąg: znajomi, znajomi znajomych z informacją „przez kogo”, zaproszenia z nagrodą,
- plany Free, Pro i Biznes, limit ogłoszeń w markecie, wystawianie na inne portale (Pro), wyróżnienia,
- kalkulator „ile zarobią Twoje rzeczy”.

## 5. Cennik

| Źródło przychodu | Cena | Uzasadnienie |
|---|---|---|
| Opłata serwisowa, market | 10% od biorącego, min. 2 zł | połowa tego, co bierze Hygglo |
| Opłata serwisowa, znajomi znajomych | 5%, min. 1 zł | pokrywa koszt płatności i ochrony |
| Ochrona przed zniszczeniem | 8% wartości wynajmu, min. 3 zł; ok. 40% zostaje u nas | polisa partnera ubezpieczeniowego |
| Bezpieczny zakup (sprzedaż) | 4% + 1 zł w markecie, 2% + 1 zł w kręgu 2 | model Vinted; gotówka przy odbiorze = 0 zł |
| Wyróżnienie | 4,99 zł / 7 dni; podbicie 1,99 zł | model OLX |
| **Pro** | 19 zł/mies. | bez limitu w markecie, wystawianie na OLX/Allegro/eBay/Vinted/FB, kalendarz, statystyki |
| **Biznes** | 79 zł/mies. | wypożyczalnie i firmy: rezerwacje online, faktury, profil firmy |

Darmowe zawsze: wszystko między znajomymi, pożyczanie za darmo, wymiana i 5 ogłoszeń w markecie.

### Ekonomia jednostkowa (z `src/lib/fees.ts`)

Przykład: wiertarka 30 zł/dzień × 3 dni = 90 zł.

| Wariant | Biorący płaci | Właściciel dostaje | Nasz przychód | Koszt płatności (1,5% + 1 zł) | **Zostaje nam** |
|---|---|---|---|---|---|
| Market + ochrona | 106,20 zł | 90,00 zł | 11,88 zł | 2,59 zł | **9,29 zł** |
| Market bez ochrony | 99,00 zł | 90,00 zł | 9,00 zł | 2,49 zł | **6,51 zł** |
| Znajomi znajomych | 94,50 zł | 90,00 zł | 4,50 zł | 2,42 zł | **2,08 zł** |
| Sprzedaż 200 zł, bezpieczny zakup | 209,00 zł | 200,00 zł | 9,00 zł | 4,14 zł | **4,86 zł** |

Wniosek: **10 000 zł netto miesięcznie z samych transakcji to ok. 1 100 wynajmów z ochroną miesięcznie.**
To wymaga płynnego marketu w kilku miastach, czyli roku albo dwóch pracy. Te same 10 000 zł daje
**ok. 130 firm na planie Biznes**. Dlatego kolejność zarabiania poniżej jest ważniejsza niż sam cennik.

## 6. Najbardziej dochodowe kierunki (od najszybszego zwrotu)

1. **Biznes dla małych wypożyczalni (SaaS, 79 zł/mies.).** Wypożyczalnie narzędzi, przyczep,
   sprzętu eventowego, kajaków i nart często działają na telefonie i grupie na Facebooku. Dostają
   rezerwacje online, kalendarz, kaucje i widoczność w okolicy. Zalety: przychód od pierwszego miesiąca,
   sprzedaż bezpośrednia (lista z Google Maps + telefon), a każda firma wnosi od razu 20–200 rzeczy,
   czyli podaż, której marketplace potrzebuje najbardziej.
2. **Wystawianie na wiele portali (Pro, 19 zł/mies.).** Jedno ogłoszenie trafia na OLX, Allegro
   Lokalnie, eBay, Vinted i FB, a po sprzedaży znika wszędzie. W USA takie narzędzia (Vendoo, List Perfectly)
   kosztują ok. 10–70 USD/mies. Najważniejsze: **działa bez efektu sieci**. Użytkownik ma korzyść, nawet gdy
   żaden znajomy nie ma jeszcze aplikacji. Allegro ma publiczne REST API, OLX ma API partnerskie
   (wymaga zgody), eBay ma Sell API. Vinted i FB Marketplace nie dają publicznego API, więc tam
   „asystowane wystawianie”: gotowy tekst i zdjęcia + przycisk udostępnij.
3. **Opłata od wynajmu w markecie + ochrona.** Najwyższy potencjał długoterminowy, ale dopiero gdy
   w promieniu 2–5 km jest kilkaset rzeczy. Ochrona (ubezpieczenie) podnosi przychód z transakcji o ok. 40%.
4. **Wyróżnienia i podbicia.** Rośnie liniowo z liczbą ogłoszeń, zero kosztów krańcowych.
5. **Partnerstwa:**
   - **InPost / Orlen Paczka**: wypożyczanie małych rzeczy przez paczkomaty (odbiór i zwrot bez spotkania).
     W Polsce to unikatowa przewaga, której nie ma Hygglo. Prowizja od wysyłki.
   - **Ubezpieczyciel / insurtech**: prowizja od polis per wynajem.
   - **Marki** (elektronarzędzia, drony, aparaty): „wypróbuj przed zakupem”, płatne kampanie i afiliacja.
   - **Spółdzielnie, wspólnoty, gminy**: „biblioteka rzeczy” w wersji white-label (B2G, programy GOZ/ESG).

## 7. Jak to ugryźć: plan startu

**Etap 0: walidacja (2–4 tygodnie, prawie 0 zł)**
- Landing page z listą oczekujących i ankietą: „co pożyczyłbyś sąsiadowi, za ile?”.
- 20 rozmów z ludźmi z jednego osiedla i 10 z wypożyczalniami.
- Test ręczny: grupa na WhatsAppie/FB dla jednego osiedla, ogłoszenia obsługiwane ręcznie.
- Kryterium przejścia: ≥ 30% rozmówców wystawiłoby coś od razu, ≥ 3 wypożyczalnie chcą testu.

**Etap 1: MVP w jednym mieście, jednej dzielnicy (miesiące 1–3)**
- Ten prototyp + Supabase (logowanie numerem telefonu, kontakty, zdjęcia, czat w czasie rzeczywistym).
- Kategorie startowe o wysokiej rotacji i rzadkim użyciu: narzędzia, ogród, camping/outdoor,
  imprezy (stoły, namioty, nagłośnienie), akcesoria auto (box dachowy, przyczepka, bagażnik rowerowy), rzeczy dziecięce.
- Podaż przed popytem: 300 rzeczy w promieniu 3 km przed jakąkolwiek reklamą.
  Źródła: Twoje rzeczy, 30 „power lenderów” (dożywotnio 0% i Pro gratis), 10 wypożyczalni (Biznes gratis na 3 miesiące).

**Etap 2: pieniądze (miesiące 3–6)**
- Stripe Connect: płatności, KYC, wypłaty, kaucja jako blokada karty.
- Ochrona z partnerem ubezpieczeniowym.
- Aplikacje Android i iOS (Capacitor, ten sam kod).
- Pro z wystawianiem na OLX/Allegro/eBay.

**Etap 3: skala (miesiące 6–12)**
- Kolejne dzielnice i 4–5 miast. Nowe miasto otwieramy dopiero po zebraniu podaży jak w etapie 1.
- Pilotaż DACH (Niemcy, Austria): ta sama aplikacja, nazwa działa po niemiecku.

**Wskaźniki, które mówią „działa”**
- Płynność: ≥ 20% ogłoszeń w markecie dostaje prośbę o wynajem w ciągu 30 dni.
- Gęstość: ≥ 50 rzeczy w promieniu 2 km od przeciętnego użytkownika.
- Wiralność: współczynnik K (zaproszeni, którzy dołączyli, na użytkownika) ≥ 0,3.
- Retencja: ≥ 25% użytkowników aktywnych po 8 tygodniach.

## 8. Marketing i rozprzestrzenianie

**Wbudowane w produkt (najtańsze):**
- **WhatsApp jako kanał dystrybucji, nie konkurent.** Każde ogłoszenie ma link, który otwiera się
  w przeglądarce bez instalacji, z podglądem (zdjęcie, cena). Ludzie wrzucają go na swoje grupy.
- Onboarding przez kontakty: *„12 Twoich znajomych już tu jest, Kasia wystawiła namiot”*.
- Powiadomienie do znajomych, gdy ktoś z kręgu wystawi coś nowego.
- **„Zaproś 3 osoby = 3 miesiące Pro”** (już w aplikacji, zakładka Krąg).
- Kalkulator „ile zarobią Twoje rzeczy” jako materiał do udostępnienia.

**Lokalnie, offline:**
- Plakaty z kodem QR na klatkach i w windach we współpracy ze spółdzielniami:
  *„Pożycz wiertarkę od sąsiada z 3. piętra”*. Kosztuje grosze, a działa na bardzo małym obszarze.
- Ambasadorzy osiedlowi: 50 pierwszych power lenderów w mieście, 0% prowizji dożywotnio.
- Stoisko na pikniku osiedlowym, Dniu Sąsiada, festynie gminnym.

**Online:**
- Grupy FB „Oddam / zamienię / pożyczę [miasto]”: wrzucanie ogłoszeń z linkiem do aplikacji.
- Krótkie wideo (TikTok, Reels, Shorts): *„Zarobiłem 600 zł na rzeczach z piwnicy”*,
  *„Pożyczyłem przyczepkę od sąsiada zamiast płacić 150 zł w wypożyczalni”*. Współpraca z lokalnymi twórcami.
- SEO long-tail: publiczne strony ogłoszeń i kategorii „wynajem [rzecz] [miasto]”
  (osobna strona renderowana na serwerze, np. Next.js albo Astro, czytająca z Supabase).
- Reklamy Meta z geotargetowaniem 3–5 km wokół dzielnicy startowej, 20–30 zł dziennie, tylko po zebraniu podaży.

**Sezonowość, pod którą planujemy kampanie:**
marzec–maj: ogród, myjki, rusztowania · maj: komunie (stoły, krzesła, namioty) · czerwiec–sierpień:
camping, kajaki, boxy dachowe · wrzesień: przeprowadzki · grudzień–luty: narty, sprzęt imprezowy.

**PR:** sharing economy, oszczędność i ekologia. Popularna statystyka o wiertarce używanej „13 minut przez całe życie”
dobrze się klika, ale jej źródło jest niepewne. Lepiej podawać własne dane z aplikacji, np. „średnio 9 dni wynajmu rocznie na rzecz”.

## 9. O co nie zapytałeś, a trzeba to przemyśleć

**Prawo i podatki**
- **DAC7**: platforma raportuje sprzedawców do KAS. Dotyczy m.in. sprzedaży towarów (z wyłączeniem sprzedawców
  poniżej 30 transakcji *i* 2000 EUR rocznie) oraz **wynajmu środków transportu** (przyczepki, auta, rowery).
  Wynajem zwykłych rzeczy, jak wiertarka, może nie być objęty. Zakres warto potwierdzić z doradcą podatkowym.
  Schemat bazy ma już widok `dac7_sellers`.
- **Podatki użytkowników**: przychód z prywatnego najmu rzeczy to przychód z najmu (ryczałt 8,5%). To obowiązek
  użytkownika, ale warto o tym informować w FAQ.
- **Płatności**: Stripe Connect przejmuje KYC i licencję płatniczą. Bez niego obracanie cudzymi pieniędzmi wymaga zgody KNF.
- **Kaucja**: blokada na karcie (autoryzacja bez obciążenia) wygasa zwykle po **7 dniach**. Przy dłuższych wynajmach
  blokujemy kartę tuż przed odbiorem albo pobieramy kaucję i zwracamy ją po zwrocie. BLIK nie obsługuje blokad,
  więc przy BLIK-u zamiast kaucji proponujemy ochronę.
- **Ochrona to ubezpieczenie.** Obietnica „pokrywamy szkody” bez ubezpieczyciela może zostać uznana za działalność
  ubezpieczeniową. Ochrona musi być produktem partnera albo jasno opisanym funduszem gwarancyjnym z limitami.
- **Omnibus i prawa konsumenta**: platforma musi pokazywać, czy sprzedający to firma (plan Biznes) czy osoba prywatna.
  Przy firmach przysługuje konsumentowi prawo odstąpienia i reklamacja.
- **RODO i kontakty**: numery z książki telefonicznej hashujemy na telefonie (SHA-256), na serwer trafia tylko skrót.
  Wyraźna zgoda i uzasadnienie wymagane też przez App Store i Google Play.
- **App Store / Google Play**: rzeczy fizyczne i usługi płacone poza sklepem są OK. Abonament Pro to funkcja
  cyfrowa, więc w aplikacji iOS podlega płatnościom Apple (15–30%). Najprościej sprzedawać Pro i Biznes przez
  stronę www, zgodnie z aktualnymi zasadami Apple dla UE.

**Spory i bezpieczeństwo**
- Protokół zdjęć z czasem serwera przy odbiorze i zwrocie (w prototypie znacznik jest wypalany na zdjęciu).
- Prosta ścieżka sporu: 48 h na zgłoszenie, porównanie zdjęć, decyzja o kaucji, odwołanie do ubezpieczyciela.
- Weryfikacja tożsamości przy pierwszym wynajmie w markecie powyżej określonej wartości.
- Lista rzeczy zakazanych: broń, leki, alkohol, rzeczy wymagające uprawnień.

**Ryzyka biznesowe**
- **Zimny start** to ryzyko numer 1. Ograniczamy je trybem jednoosobowym (wystawianie na inne portale, kalkulator),
  firmami Biznes jako gotową podażą i startem w jednej dzielnicy.
- **Niska częstotliwość użycia**: wiertarkę wynajmuje się kilka razy w roku. Sprzedaż, wymiana i pożyczanie
  w jednej aplikacji podnoszą częstotliwość wizyt.
- **Omijanie platformy** (umówimy się poza aplikacją): w kręgu znajomych to akceptujemy. W markecie chronią nas
  ochrona, kaucja i opinie, które działają tylko w aplikacji.
- Fat Llama potrzebowała ok. 5 lat i kilkunastu mln USD, żeby wyjść na plus. Solo: niskie koszty stałe,
  jedno miasto, przychód z planu Biznes i Pro zanim zacznie działać market.

## 10. Technologia

| Warstwa | Wybór | Dlaczego |
|---|---|---|
| Aplikacja | React + Vite, PWA | jeden kod dla www, Androida i iOS |
| Mobile | Capacitor | natywne kontakty, aparat, GPS, push |
| Backend | Supabase (Postgres + PostGIS, Auth, Storage, Realtime) | RLS pilnuje kręgów, `listings_nearby` szuka w promieniu km |
| Płatności | Stripe Connect (+ BLIK, Przelewy24) | KYC, wypłaty, blokady kaucji |
| Logowanie | numer telefonu + SMS (Supabase Auth + Twilio / SMSAPI) | jak WhatsApp, pasuje do kontaktów |
| Wystawianie dalej | Allegro REST API, OLX Partner API, eBay Sell API | plan Pro |
| SEO | osobna strona Next.js lub Astro z publicznymi ogłoszeniami | aplikacja w Capacitorze nie jest indeksowana |

Koszty stałe na starcie: Supabase Free lub Pro (ok. 25 USD), domena, konta deweloperskie Apple (99 USD/rok)
i Google (25 USD jednorazowo), SMS-y. Razem poniżej 300 zł miesięcznie do pierwszych tysięcy użytkowników.

## 11. Następne kroki w kodzie

1. Podpiąć Supabase: logowanie numerem telefonu, `profiles`, `listings`, `listings_nearby`, Storage na zdjęcia.
2. Kontakty: `@capacitor-community/contacts`, hashowanie numerów na urządzeniu, dopasowanie z `phone_hashes`.
3. Realtime na czacie i powiadomienia push (Capacitor Push Notifications + FCM/APNs).
4. Stripe Connect przez Supabase Edge Functions: `PaymentIntent` z `capture_method=manual` na kaucję.
5. Publiczne strony ogłoszeń z podglądem (Open Graph) do udostępniania na WhatsAppie.
6. Integracja Allegro jako pierwsza (publiczne API), potem OLX Partner.
