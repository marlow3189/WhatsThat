# Obok: koncept, model biznesowy, koszty i prawo

> Codzienny, lokalny handel między ludźmi: sprzedaż, odsprzedaż, wyprzedaże garażowe, wynajem, usługi,
> praca dorywcza, wymiana, „szukam” i oddawanie za darmo. Najpierw znajomi z telefonu, potem znajomi znajomych,
> potem okolica (promień w km, miejscowość, region, kraj). Konto to numer telefonu. Bez haseł, bez prowizji.
> Startujemy w Polsce, aplikacja jest gotowa na 9 języków i 11 krajów.

Kolejność priorytetów: **UX, potem UI, potem nazwa**. Nazwa robocza siedzi w jednym pliku (`src/config.ts`).

---

## 1. Nazwa

### Czy „WhatsThat” zostałaby zablokowana?
Nie automatycznie. Aplikację o tej nazwie da się uruchomić. Problem pojawia się w trzech momentach:

1. **Rejestracja znaku towarowego.** Meta (WhatsApp) składa sprzeciwy wobec znaków z „Whats-”: m.in.
   WHATSPAY (zarzut: wprowadzanie w błąd co do powiązania z WhatsAppem i rozwadnianie znaku), WHATSAROUND,
   WHATSGOOD, WHATSMINER, WHATSMODE. Spór to koszty prawnika i miesiące niepewności.
2. **Sklepy z aplikacjami.** Apple i Google usuwają aplikacje na skargę właściciela znaku, gdy nazwa sugeruje
   powiązanie ze znaną marką. Nasza aplikacja ma czat, kontakty z telefonu i wysyła linki na WhatsAppa,
   więc taka skarga byłaby mocna.
3. **Po sukcesie.** Najgorszy moment na zmianę nazwy to chwila, gdy jest już ruch i wydane pieniądze na reklamę.

Do tego „what’s that” to zwykła fraza i nazwa wielu aplikacji, więc trudno wygrać w wyszukiwarce.

### Propozycje sprawdzone pod kątem świata
Sprawdzone wyszukiwarką w październiku 2026 (bez dostępu do baz znaków i domen, to trzeba zrobić osobno):

| Nazwa | Co znaczy | Wymowa w 9 językach | Kolizje znalezione | Ocena |
|---|---|---|---|---|
| **Neiby** | od „neighbour”, sąsiad | łatwa wszędzie („nej-bi”) | nie znaleziono | **najlepsza na świat** |
| **Mamto** | „Mam to” po polsku, „Mám to” po czesku i słowacku | łatwa wszędzie | nie znaleziono | **najlepsza na start w Europie Środkowej** |
| Obok | „obok, blisko” | łatwa, ale znaczenie tylko po polsku | wtyczka do e-booków, firma IT w USA (inne branże) | dobra na Polskę |
| Okolo | „około, wokół” | łatwa | **zajęta**: aplikacja łącząca lokalnych producentów z klientami (FR) i rosyjska platforma B2B | odpada |
| Blizo | „blisko” | łatwa | **zajęta**: dostawy warzyw i owoców | odpada |
| Blisko | „blisko” | — | **zajęta**: aplikacja samorządowa BLISKO | odpada |
| Krugo, Obbo | — | — | **zajęte** | odpadają |

**Rekomendacja:** Neiby, jeśli od początku myślisz o świecie; Mamto, jeśli najpierw Polska, Czechy i Słowacja.
Przed decyzją: domeny (`.com`, `.app`, `.pl`, `.eu`), EUIPO TMview w klasach 9, 35, 38, 42 i nazwy w App Store / Google Play.

## 2. Konkurencja i co z niej bierzemy

| Kto | Co robi najlepiej | Co przejmujemy | Czego im brakuje |
|---|---|---|---|
| OLX, Allegro Lokalnie | ogromny wybór ogłoszeń | szerokie drzewo kategorii, „Szukam”, wyróżnienie firm | znajomych, ochrony przed oszustwami „na kuriera”, rolnika z płatnością |
| Otomoto, mobile.de, Otodom | auta i nieruchomości | osobne kategorie aut, mieszkań, kwater pracowniczych | taniej oferty dla osób prywatnych (patrz punkt 5) |
| Vinted | moda z drugiej ręki, wysyłka przez automaty | kategoria „Moda z drugiej ręki”, wysyłka InPost i inni | lokalnego odbioru, innych kategorii |
| FB Marketplace i grupy | ludzie już tam są | wysyłanie linków na grupy jednym przyciskiem | porządku i bezpieczeństwa |
| **Co Jest Sąsiad** | portal sąsiedzki: ogłoszenia, czat, praca w okolicy, mapa, „Zaufany Sąsiad” | **praca dorywcza**, **pomoc sąsiedzka**, **zgubione i znalezione**, **wydarzenia**, odznaka **Zaufany sąsiad** | kręgu znajomych z kontaktów, płatności, wynajmu z kalendarzem |
| **Po sąsiedzku** | oddawanie za darmo, wybór komu oddać, oceny | rodzaj „Oddam lub pożyczę”, czat pod ofertą | sprzedaży, wynajmu, usług |
| **BLISKO** (ponad 500 gmin) | komunikaty gminy, odpady, ostrzeżenia, zgłoszenia mieszkańców | później: kanał „Gmina” z komunikatami lokalnymi (B2G) | handlu między ludźmi |
| Hygglo, Pozycz.to | wynajem rzeczy | kalendarz, kaucja, zdjęcia przy wydaniu i zwrocie | znajomych, niskich kosztów |

Świadomie **nie** bierzemy przycisku SOS z Co Jest Sąsiad: aplikacja handlowa nie może udawać numeru alarmowego
i brać na siebie odpowiedzialności za wezwanie pomocy. W razie zagrożenia: 112.

**Różnica w jednym zdaniu:** zaczynasz od ludzi, których masz w telefonie; płacisz BLIK-iem bez prowizji;
konto zastrzegasz jednym przyciskiem.

## 3. Jak działa aplikacja (stan prototypu)

**Rejestracja (9 kroków, ok. 1 minuty):** język (PL, EN, DE, UK, CS, SK, HU, IT, ES) → kraj i region
(w Polsce województwo) → numer telefonu z prefiksem kraju ustawionym automatycznie → kod SMS → imię i opcjonalny e-mail →
**zainteresowania** → kontakty → powiadomienia (domyślnie: nowe od znajomych, wiadomości, płatności) → zasady w 9 punktach
z akceptacją (zapisujemy datę).

**Główna bez przytłaczania:** „Nowe od znajomych” (avatary i kafelki), potem po jednym rzędzie kafelków na każde
zainteresowanie. **Pierwszy kafelek w rzędzie zawsze „Polecane”**: firma albo ktoś z drugiej linii znajomych,
którego nie masz w kontaktach. Na dole wyprzedaże garażowe i karta „Poleć znajomym”.

**Widoczność ogłoszenia:** tylko znajomi · znajomi znajomych · wszyscy (najpierw znajomi, potem okolica) ·
**incognito** (znajomi nie widzą, obcy widzą bez imienia; serwer nie wysyła obcym identyfikatora sprzedającego) ·
**ukryj przed wybranymi osobami**. Odbiorca może **nie pokazywać rzeczy danej osoby** albo **zapomnieć kontakt**.

**Kupno, rezerwacja, wynajem:** BLIK, szybki przelew albo gotówka przy odbiorze. **Kto pierwszy zapłaci, ten ma**:
płatność od razu rezerwuje rzecz albo zmniejsza zapas (sprawdzane po stronie serwera). Dostawa: odbiór osobisty,
InPost, Orlen Paczka, DPD Pickup, DHL POP, Poczta Polska, kurier, dowolny inny przewoźnik.
Pod każdą ofertą **szybkie pytania** do czatu i **„Twoje prawa”** w dymku: osobno dla zakupu od osoby prywatnej i od firmy.

**Rolnik, krok po kroku** (ekran „Mój stragan”):
1. Jednym stuknięciem dodaje produkt z listy (jajka, mleko, ser, ziemniaki, marchew, cebula, pomidory, ogórki, kapusta,
   jabłka, truskawki, miód, drewno) albo **„Inne, dopisz sam”**; podaje cenę i zapas.
2. Klient wybiera ilość i godzinę odbioru, płaci BLIK-iem albo szybkim przelewem.
3. Rolnik dostaje powiadomienie „Płatność od Ani: 13,20 zł”, status **Opłacone**.
4. Pakuje, stuka **Spakowane**; klient dostaje powiadomienie, że może odebrać.
5. Klient potwierdza **Odebrane**. Tak samo działa rezerwacja rzeczy i zwykły zakup.

Na straganie: lista do spakowania, przełącznik „dostępne dziś”, zapas ±10 jednym stuknięciem, wspólne godziny odbioru
i krótkie „Warto wiedzieć” (RHD, sanepid, zwolnienie podatkowe).

**Polecanie jak w WhatsAppie:** „Zaproś SMS-em” otwiera SMS z linkiem do instalacji, wysyłany z telefonu użytkownika
(koszt dla nas 0 zł). Do tego udostępnianie ogłoszeń: WhatsApp, Messenger, SMS, e-mail, Telegram, Viber, Facebook, X,
Instagram i TikTok (te dwa nie przyjmują linków z zewnątrz, więc kopiujemy link i podpowiadamy, gdzie go wkleić).

**Bezpieczeństwo:** numer ukryty przed obcymi; zastrzeżenie numeru jednym przyciskiem (lub na stronie www przez e-mail
albo zaufaną osobę); odblokowanie kodem SMS i dwiema zaufanymi osobami; ostrzeżenie dla znajomych; ostrzeżenie przed
linkami do płatności w czacie; zgłaszanie ogłoszeń.

**Historia na serwerze, nie w telefonie.** W produkcji czaty i zamówienia są w bazie w UE, a telefon trzyma tylko
podręczną pamięć. Prototyp (bez serwera) zapisuje dane demo w przeglądarce.

## 4. Cennik

| Plan | Cena brutto | Co daje |
|---|---|---|
| **Darmowy** | 0 zł | **3 nowe ogłoszenia w miesiącu**, czat, płatności, znajomi bez ograniczeń. Raz w roku odnowienie konta za 1 zł / 1 € / 1 $ (lub równowartość) |
| **Roczny** (osoba prywatna) | **99 zł** · 24 € · 27 $ | bez limitu: auta, nieruchomości, kwatery, cały asortyment rolnika |
| **Firma** | **499 zł** · 100 € · 119 $ | faktury, profil firmy, kilka osób na koncie: wypożyczalnie, gospodarstwa, kwatery |

- **0% prowizji** od transakcji. Zawsze.
- **Bonus za polecenia** (3 osoby = 3 miesiące gratis) działa tylko na planie Rocznym i Firma.
- **Koniec subskrypcji:** data ważności w profilu, przypomnienia 30, 7 i 1 dzień przed końcem (powiadomienie i baner).
  Po wygaśnięciu konto wraca do darmowego, nic nie znika, tylko nowe ogłoszenia mają limit.
- Ceny w innych walutach (CZK, HUF, UAH, GBP) to zaokrąglone propozycje w `src/lib/pricing.ts`.

**Uwaga do odnowienia za 1 zł:** opłata operatora przy płatności BLIK w Stripe to 1,6% + 1 zł, czyli więcej niż 1 zł.
Każde takie odnowienie to strata ok. 2 groszy plus koszt obsługi. Jego sens to nie przychód, tylko **czyszczenie martwych
i fałszywych kont**. Tańsza alternatywa o tym samym efekcie: odnowienie potwierdzane kodem SMS (ok. 0,15 zł kosztu).

**Po co roczna opłata (po ludzku):** płacisz raz w roku i masz spokój, bez miesięcznych opłat i bez płacenia
za każde ogłoszenie osobno. Limit 3 darmowych ogłoszeń w miesiącu wystarcza zwykłej osobie, a zatrzymuje spamerów
i handlarzy, którzy chcieliby wrzucać setki ogłoszeń za darmo.

## 5. Jak wygrać z Otodom, nieruchomosci-online i innymi

1. **Cena.** Portale nieruchomości biorą pieniądze za każde ogłoszenie i każde odświeżenie. U nas osoba prywatna
   płaci 99 zł za cały rok bez limitu, a biuro czy właściciel kwater 499 zł.
2. **Znajomi.** Mieszkania i pokoje bardzo często wynajmuje się „po znajomości”. U nas ogłoszenie trafia najpierw do
   znajomych i znajomych znajomych, z informacją „przez kogo się znacie”. Tego portale nie mają.
3. **Kwatery pracownicze** jako osobna kategoria z ceną za noc. To nisza, którą duże portale traktują marginalnie.
4. **Wysyłanie linku na grupy** (WhatsApp, Messenger, FB) jednym przyciskiem, z podglądem.
5. **Strony SEO** „mieszkanie na wynajem [miejscowość]”, „kwatery pracownicze [powiat]”: publiczne strony ogłoszeń
   renderowane na serwerze.

**Ile osób na 10 tys. zł miesięcznie:** 120 tys. zł rocznie to **1 213 planów rocznych** po 99 zł, jeśli korzystasz
ze zwolnienia z VAT, albo **1 491**, jeśli jesteś płatnikiem VAT (99 zł brutto = 80,49 zł netto).
Przykładowy miks: 800 planów rocznych + 80 firm = 119 tys. zł rocznie.

## 6. Koszty, żeby nie wtopić

Ceny dostawców z października 2026: Supabase Pro 25 USD (100 tys. aktywnych, 8 GB bazy, 250 GB transferu w cenie),
SMS PRO w Polsce 0,11–0,17 zł netto, Cloudflare R2 0,015 USD/GB bez opłat za transfer, Stripe BLIK 1,6% + 1 zł.
Model jest w `src/lib/costs.ts` i w panelu operatora w aplikacji.

**Miesięcznie** (8% nowych osób w miesiącu, płatności za plany przez Stripe, bez VAT, ZUS i Twojej pensji):

| Aktywni użytkownicy | 1 000 | 10 000 | 100 000 |
|---|---|---|---|
| Baza, logowanie, czat | 93 zł | 93 zł | 278 zł |
| SMS z kodem | 21 zł | 174 zł | 1 364 zł |
| Zdjęcia, e-maile, push | 0 zł | 1 zł | 82 zł |
| Prowizje operatora za plany (6% płaci) | 13 zł | 129 zł | 1 292 zł |
| Księgowość, domena, sklepy | 445 zł | 445 zł | 445 zł |
| Obsługa i moderacja | 0 zł (Ty) | 0 zł (Ty) | 8 000 zł |
| **Koszty razem** | **572 zł** | **841 zł** | **11 461 zł** |
| Przychód przy 2% płacących | 165 zł | 1 650 zł | 16 500 zł |
| Przychód przy 6% płacących | 495 zł | 4 950 zł | 49 500 zł |

Wniosek: do ok. 2–3 tys. aktywnych dokładasz kilkaset zł miesięcznie (głównie księgowość). Od ok. 10 tys. aktywnych
usługa się spina nawet przy 2% płacących. Największy zmienny koszt to SMS; po pierwszym logowaniu przechodzimy na klucze
dostępu (passkey), więc SMS jest głównie przy rejestracji.

**Jednorazowo i rocznie:** znak towarowy UE (EUIPO) 850 € za pierwszą klasę, 50 € za drugą, 150 € za każdą kolejną;
Apple Developer 99 USD rocznie (dopiero gdy wejdziemy do App Store); Google Play 25 USD jednorazowo; Chrome Web Store 5 USD
jednorazowo; Edge Add-ons bez opłat; regulamin i polityka prywatności od prawnika orientacyjnie kilka tysięcy złotych.

## 7. Prawo: jak zminimalizować Twoją odpowiedzialność

Najważniejsze decyzje, które już są w produkcie albo w schemacie bazy:

| Ryzyko | Co zrobiliśmy | Co zostaje po Twojej stronie |
|---|---|---|
| **Odpowiedzialność osobista** | — | **Prowadź serwis jako spółka z o.o.** (albo prosta spółka akcyjna), a nie jednoosobową działalność: przy JDG odpowiadasz całym majątkiem. Rozważ ubezpieczenie OC dla usług IT. |
| **Treści użytkowników** (DSA art. 6) | Jesteśmy hostingiem: nie odpowiadamy za ogłoszenia, dopóki szybko reagujemy na zgłoszenia. Zgłoszenie jest pod każdym ogłoszeniem, decyzja w panelu operatora automatycznie wysyła **uzasadnienie** obu stronom (art. 16–17). Punkt kontaktowy: `kontakt@…` (art. 11–12). | Reagować na zgłoszenia. Jako mikro lub mała firma jesteś zwolniony z systemu odwołań i raportów przejrzystości (art. 19, 29) do 12 miesięcy po przekroczeniu progów. |
| **Pieniądze** | Nie przechowujemy cudzych pieniędzy. Płatności idą przez licencjonowanego operatora prosto na konto sprzedającego. | Umowa z operatorem. |
| **KYC sprzedających** | Robi to operator płatności w swoim formularzu; my tylko otwieramy ten formularz i zapisujemy status „zweryfikowany”. Nie przechowujemy dokumentów. | Nic. |
| **Kaucja** | Między ludźmi, gotówką lub BLIK-iem przy wydaniu. Aplikacja tylko ją zapisuje; zdjęcia z datą z serwera to wspólny dowód. W regulaminie: nie jesteśmy stroną ani depozytariuszem. | Nic. |
| **Ubezpieczenie** | Nie sprzedajemy. | Nic. |
| **Konsument / Omnibus** | Firmy oznaczone „Firma”. Dymek „Twoje prawa” przy każdym zakupie: od osoby prywatnej brak 14 dni na zwrot, ale odpowiedzialność za ukryte wady; od firmy 14 dni na odstąpienie i 2 lata zgodności z umową. | Nic. |
| **DAC7** | Automatycznie: liczymy transakcje sprzedawców; od 25 transakcji lub 1 500 € aplikacja sama prosi o dane (imię i nazwisko, adres, NIP/PESEL, data urodzenia); od 1 grudnia panel operatora pokazuje, kogo zgłosić, czego brakuje, i przygotowuje plik; jednym przyciskiem powiadamiasz sprzedawców. Objęte: sprzedaż towarów (poza osobami z < 30 transakcji i < 2 000 €), najem nieruchomości (kwatery!), najem pojazdów, usługi osobiste. Wynajem zwykłych rzeczy nie jest objęty. | Raz w roku, do **31 stycznia**, wysłać informację **DPI-IS** (XML według schematu Ministerstwa Finansów). Sprawdzić z doradcą, czy potrzebny jest formularz rejestracyjny DPI-FR. |
| **Rolnik** | „Warto wiedzieć” na straganie: RHD na własną odpowiedzialność, sanepid / inspekcja weterynaryjna dla mięsa, nabiału i przetworów, zwolnienie podatkowe do limitu. | Nic. |
| **RODO** | Kontakty jako skróty na telefonie, numer ukryty przed obcymi, dane w UE, usunięcie konta w ustawieniach. | Rejestr czynności, umowy powierzenia (Supabase, SMS, operator płatności). |
| **VAT za plany** | — | Plany sprzedawane konsumentom w innych krajach UE: po przekroczeniu 10 000 € rocznie VAT kraju klienta przez OSS. |

**Regulamin w 9 językach:** krótkie zasady (9 punktów) są w aplikacji w każdym języku i trzeba je zaakceptować
przy rejestracji. Pełny regulamin: [`docs/legal/regulamin.pl.md`](legal/regulamin.pl.md) i
[`docs/legal/terms.en.md`](legal/terms.en.md). Pozostałe języki tłumaczy się z wersji angielskiej po sprawdzeniu
przez prawnika. Wiążąca jest wersja polska.

Nie da się wyłączyć odpowiedzialności całkowicie (np. za umyślne działanie czy wobec konsumentów), ale powyższy
układ ogranicza ją do minimum i zostawia Ci jeden obowiązek roczny (DAC7) oraz reagowanie na zgłoszenia.

## 8. Telefon, strona i komputer

- **Etap 1: aplikacja ze strony (PWA).** iPhone: Safari → Udostępnij → „Do ekranu początkowego” (push od iOS 16.4).
  Android: Chrome → „Zainstaluj aplikację”, a do Google Play ta sama aplikacja jako Trusted Web Activity.
  Plan kupuje się na stronie, więc nie płacimy Apple ani Google 15–30%.
- **Komputer: rozszerzenie** do Chrome i Edge (otwiera się w panelu bocznym) oraz Safari (konwersja `npm run safari:extension`,
  wymaga Maca z Xcode). Menu pod prawym przyciskiem **„Wystaw na Obok”** przenosi tytuł strony, zaznaczony tekst i zdjęcie
  do formularza: można wystawić coś, co oglądasz na OLX czy Allegro. Budowanie: `npm run build:extension`.
- **Etap 2: App Store i Google Play** natywnie (Capacitor), gdy będzie ruch.

## 9. Plan startu

1. **Walidacja (2–4 tygodnie):** strona z listą oczekujących; 20 rozmów z mieszkańcami jednego powiatu, 5 z rolnikami,
   3 z właścicielami kwater.
2. **Start w powiecie** (np. piaseczyńskim): rolnicy, wyprzedaże garażowe, narzędzia, kwatery. 300 ogłoszeń przed reklamą.
3. **Płatności, push, strony ogłoszeń** (miesiące 2–4).
4. **Kolejne powiaty**, potem Czechy, Słowacja i społeczność ukraińska (języki już są).

Marketing i filmy: [MARKETING.md](MARKETING.md).

## 10. Następne kroki w kodzie

1. Supabase: logowanie numerem (SMS), tabele, RLS i automaty z `supabase/migrations/0001_init.sql` (schemat nie był
   jeszcze uruchamiany na prawdziwej bazie; przed startem przejść go na projekcie testowym).
2. Operator płatności: konto sprzedającego (KYC u operatora), BLIK i szybki przelew, webhook → `orders.status = 'paid'`.
3. Przewoźnicy: InPost ShipX API albo agregator (Furgonetka, Apaczka) do etykiet i śledzenia.
4. Web Push + FCM/APNs z tabeli `notifications`; pg_cron dla przypomnień i DAC7.
5. Publiczne strony ogłoszeń z podglądem, strona `/zastrzez`, generator XML DPI-IS.
