# Miliorbit: koncept, model biznesowy, koszty i prawo

> **Twoja orbita: znajomi i sąsiedzi.** Aplikacja do ogarniania codziennych spraw z ludźmi obok:
> potrzebujesz piasku, wpisujesz „piasek” i widzisz, kto w okolicy go ma; sąsiad wynajmuje kosiarkę za 20 zł za dzień.
> Codzienny, lokalny handel między ludźmi: sprzedaż, odsprzedaż, wyprzedaże garażowe, wynajem, usługi,
> praca dorywcza, wymiana, „szukam” i oddawanie za darmo. Najpierw znajomi z telefonu, potem znajomi znajomych,
> potem okolica (promień w km, miejscowość, region, kraj). Konto to numer telefonu. Bez haseł, bez prowizji.
> Startujemy w Polsce, aplikacja jest gotowa na 9 języków i 11 krajów.

Kolejność priorytetów: **UX, potem UI, potem nazwa**. Marka siedzi w jednym pliku (`src/config.ts`): **Miliorbit**, `miliorbit.com`.

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

### Decyzja: Miliorbit (domena `miliorbit.com` kupiona)
**Mili** (po polsku: mili ludzie, sympatyczni sąsiedzi; w wielu językach brzmi jak „mile”, czyli bliska odległość)
+ **orbit** (krąg ludzi wokół Ciebie). Wymowa prosta w 9 językach („mi-li-or-bit”). Pasuje do mechaniki aplikacji:
znajomi na bliskiej orbicie, ich znajomi na dalszej, sąsiedzi w promieniu kilku km. Hasło: *„Twoja orbita”*.

Co sprawdziłem (wyszukiwarka, 7 października 2026): nie znalazłem firmy, aplikacji ani znaku o nazwie „Miliorbit”.
Wyszukiwarka to nie baza znaków towarowych. **Do zrobienia przed wydaniem pieniędzy na reklamę:** wyszukanie „MILIORBIT”
w EUIPO TMview i WIPO Global Brand Database (klasy 9, 35, 38, 42), sprawdzenie App Store i Google Play, rezerwacja
`miliorbit.app`, `.pl`, `.eu` i nazw w social media (@miliorbit). Zgłoszenie znaku UE: 850 € za klasę 9 + 50 € za drugą
+ 150 € za każdą kolejną.

Odrzucone wcześniej: Orbifolk (zastąpiony przez Miliorbit), Obok (znaczenie tylko po polsku), Neiby, Mamto (zostają jako zapas),
Okolo, Blizo, Blisko, Krugo, Obbo (zajęte).

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
**zainteresowania: wszystkie włączone (sugerowane)**, przy każdej kategorii liczba osób z Twojej orbity, która w niej działa,
a na górze „Twoi znajomi działają w branżach: od rolnika 1, narzędzia i maszyny 1…” → kontakty (widać, kto już jest) →
powiadomienia (wszystko włączone, cisza nocna) → **5 najważniejszych zasad** z ikonami, link do pełnego regulaminu
w 9 językach i „Akceptuję regulamin” (zapisujemy datę).

**Sąsiedzi zawsze widoczni.** Oferty z promienia 3 km pokazujemy bez względu na zainteresowania (kosiarka sąsiada,
przyczepka). Wyłączyć można tylko konkretną osobę („Ukryte osoby”) albo ukryć przed nią własne ogłoszenie.

**Główna:** pasek z miastem i pogodą (Open-Meteo), pytanie „Czego potrzebujesz?” z podpowiedziami AI („Wybrukować podjazd”,
„Jajka od znajomych”), **„Twoja orbita”** (znajomi, ich znajomi, oferty do 5 km), „Nowe od znajomych”, „Sąsiedzi obok”,
potem po jednym rzędzie kafelków na każde zainteresowanie. **Pierwszy kafelek w rzędzie zawsze „Polecane”**: firma albo ktoś z drugiej linii znajomych,
którego nie masz w kontaktach. Na dole wyprzedaże garażowe i karta „Poleć znajomym”.

**Widoczność ogłoszenia:** tylko znajomi · znajomi znajomych · wszyscy (najpierw znajomi, potem okolica) ·
**incognito** (znajomi nie widzą, obcy widzą bez imienia; serwer nie wysyła obcym identyfikatora sprzedającego) ·
**ukryj przed wybranymi osobami**. Odbiorca może **nie pokazywać rzeczy danej osoby** albo **zapomnieć kontakt**.

**Planer AI („short road map”):** wpisujesz cel, np. „wybrukować podjazd”, a dostajesz kroki z ofertami pod każdy:
piasek (skład budowlany), kostka, zagęszczarka (od znajomego Marka), gilotyna do kostki (wypożyczalnia), brukarz
(znajomy znajomego). Znajomi zawsze pierwsi. Zwykłe słowo („jajka”) daje wyniki pogrupowane: od znajomych,
od znajomych znajomych, z okolicy. W prototypie plany są gotowe dla najczęstszych spraw (brukowanie, przeprowadzka,
ogród); w produkcji plan układa Claude (`supabase/functions/plan`, model `claude-opus-5-5`, odpowiedź w schemacie JSON),
a oferty dobiera baza. Model nie widzi danych użytkowników, tylko tekst celu. Koszt: kilka groszy za plan, więc
w planie darmowym np. 10 planów miesięcznie, w płatnych bez limitu.

**Kupno, rezerwacja, wynajem:** BLIK, szybki przelew albo gotówka przy odbiorze. **Kto pierwszy zapłaci, ten ma**:
po płatności rzecz pojedyncza od razu znika z oferty jako **„Kupione”** (plakietka wisi jeszcze dobę, potem ogłoszenie
znika); przy wielu sztukach maleje zapas, a „Kupione” pojawia się dopiero przy zerze; wynajem zajmuje termin
(sprawdzane po stronie serwera). Dostawa: odbiór osobisty,
InPost, Orlen Paczka, DPD Pickup, DHL POP, Poczta Polska, kurier, dowolny inny przewoźnik.
Pod każdą ofertą **szybkie pytania** do czatu i **„Twoje prawa”** w dymku: osobno dla zakupu od osoby prywatnej i od firmy.

**Gdy coś pójdzie nie tak (rozwiązane w aplikacji):**

| Sytuacja | Co się dzieje |
|---|---|
| Kupujący zapłacił, sprzedający nie wydał | Pieniądze **nie trafiają do sprzedającego**, tylko czekają u operatora płatności. Kupujący zgłasza „Nie dostałem rzeczy” → wypłata wstrzymana → zwrot. Bez wydania w terminie zwrot automatyczny. |
| Rzecz niezgodna z opisem | Zgłoszenie w zamówieniu przed potwierdzeniem odbioru; druga strona ma 48 h na propozycję (zwrot całości / części), potem mediacja. |
| Wydanie rzeczy | Kupujący podaje **4-cyfrowy kod odbioru** dopiero z rzeczą w ręku; sprzedający wpisuje kod → wypłata. Bez zgłoszenia wypłata automatycznie 48 h po wydaniu. |
| Wynajmujący zepsuł rzecz | Kaucja to **blokada na karcie**; zdjęcia z datą przy wydaniu i zwrocie; właściciel ma 48 h na zgłoszenie szkody → część kaucji na naprawę albo mediacja. Później: opcjonalne ubezpieczenie wynajmu u partnera (np. kilka % ceny). |
| Wynajmujący nie oddał rzeczy | Zgłoszenie „Nie wróciła na czas” → kaucja zatrzymana, konto oznaczone, przy kradzieży zgłoszenie na policję (dajemy dane z aplikacji na wniosek organów). |
| Właściciel nie oddaje kaucji | Kaucji nie oddaje „ręcznie” właściciel: zwalnia ją system po potwierdzeniu zwrotu albo po 48 h bez zgłoszenia szkody. |
| Gotówka | Płacisz przy odbiorze, po obejrzeniu. Aplikacja ostrzega przed zaliczkami poza aplikacją. |

Mediację prowadzi człowiek (operator albo zewnętrzny mediator), z uzasadnieniem dla obu stron. Decyzję wykonuje
operator płatności (zwrot / wypłata). Nadal nie jesteśmy stroną umowy ani nie trzymamy pieniędzy; prawo do sądu zostaje.

**Mapa celów:** wyniki wyszukiwania i plan AI na mapie: Ty w środku, kręgi odległości, numerowane punkty kroków,
„Trasa przez wszystkie punkty” w Mapach Google (najpierw najbliższy). Dane demo przesuwają się do wybranego miasta
(np. Katowice), żeby „obok” znaczyło obok.

**Relacje znajomych** jak w WhatsAppie i na Instagramie: kółka z nowymi ofertami, stuknięcie otwiera pełny ekran,
pasek postępu, „Zobacz ofertę” i „Napisz”. Na komputerze rzędy przewija się strzałkami albo przeciągnięciem myszą.

**Alerty sąsiedzkie:** zaginione zwierzę, zbiórka (np. poszukiwania, sprzątanie parku), znaleziona rzecz. Zawsze
za darmo, poza limitem, na górze głównej u sąsiadów do 10 km.

**Ostrzeżenia o zagrożeniach (zależnie od kraju):** w Polsce ostrzeżenia meteo IMGW-PIB z oficjalnego API (po kodach
TERYT województwa) i link do komunikatów RCB. Alert RCB to SMS wysyłany przez operatorów do wszystkich telefonów
w zasięgu; RCB nie udostępnia publicznego API, więc go nie powielamy, tylko kierujemy do źródła. Niemcy: NINA (BBK),
reszta UE: Meteoalarm (CC BY 4.0). Ostrzeżenie zawsze ze źródłem; wyłączysz je w ustawieniach powiadomień.

**Twoja orbita na mapie:** pod kartą orbity mapa ludzi wokół: znajomi z imienia, ich znajomi i sąsiedzi pod
pseudonimem albo „Osoba #n” z dwiema pierwszymi cyframi numeru, z przybliżonym położeniem. Stuknięcie pokazuje, co ktoś
oferuje lub umie zrobić i ile minut zajmie dotarcie (pieszo, rowerem, autem; szacunek bez korków, w produkcji serwer
tras). Zasięg: 2 km, 5 km, 25 km, kraj, cała Europa (sprawy przygraniczne).

**Ulubieni z tematem:** gwiazdka na profilu, np. „Piekarnia u Zosi · chleb i bułki · pon–sob 6:00–13:00 · otwarte”.
Rezerwacja z przedpłatą działa już dziś (odbiór o ustalonej godzinie, nic się nie marnuje). Docelowo: szafka
z kodem QR przed piekarnią, otwierana po zapłacie.

**Opał i ogrzewanie:** osobna kategoria (pellet, ekogroszek, węgiel, drewno i brykiet, olej opałowy, gaz w butlach),
jednostki „worek”, „t”, „m³”, plan „Opał na zimę” (opał → transport → przegląd komina) i plakietka „Najtaniej”
przy porównaniu w tej samej jednostce. Skład opału albo sąsiad z zalegającym pelletem wystawia to w minutę.

**Adres dopiero przy wysyłce:** przy rejestracji pytamy tylko o miejscowość. Ulicę i kod podajesz przy pierwszej
wysyłce kurierem; sprzedawca widzi adres dopiero po opłaceniu takiego zamówienia (minimalizacja danych, RODO art. 5).

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
| **Darmowy** | 0 zł w pierwszym roku, potem **10 zł za rok** · 2,50 € · 2,99 $ | **2 nowe ogłoszenia w miesiącu**, czat, płatności, znajomi bez ograniczeń. Kupowanie, czaty i przeglądanie zawsze za darmo |
| **Roczny** (osoba prywatna) | **99 zł** · 24 € · 27 $ | bez limitu: auta, nieruchomości, kwatery, cały asortyment rolnika |
| **Firma** | **499 zł** · 100 € · 119 $ | faktury, profil firmy, kilka osób na koncie: wypożyczalnie, gospodarstwa, kwatery |

- **0% prowizji** od transakcji. Zawsze.
- **Polecenia bez nagród pieniężnych:** „Siła Twojej orbity” pokazuje, ile spraw załatwisz u swoich i czego w okolicy
  brakuje. Ludzie zapraszają, bo sami na tym zyskują (szybciej i bliżej), a nie dla rabatu; to też chroni przed
  wyłudzaniem nagród fikcyjnymi numerami. Do tego kod QR do aplikacji (plakaty u lokalnych firm).
- **Reklamy tylko na planie darmowym:** jedna chmurka „Reklama” na głównej, znika po stuknięciu X (wraca po 3 dniach),
  z „Dlaczego to widzę?” (DSA art. 26). Plan Roczny i Firma: bez reklam.
- **Koniec subskrypcji:** data ważności w profilu, przypomnienia 30, 7 i 1 dzień przed końcem (powiadomienie i baner).
  Po wygaśnięciu konto wraca do darmowego, nic nie znika, tylko nowe ogłoszenia mają limit.
- Ceny w innych walutach (CZK, HUF, UAH, GBP) to zaokrąglone propozycje w `src/lib/pricing.ts`.

**Dlaczego 10 zł za rok zamiast 1 zł:** przy 1 zł prowizja BLIK w Stripe (1,6% + 1 zł) zjadała całą kwotę.
Przy 10 zł zostaje ok. 8,80 zł. Ważniejsze jest co innego: **każdy, kto wystawia, staje się płacącym klientem**.
Dotąd płaciło ok. 2–6% aktywnych (plany 99 i 499 zł); z odświeżeniem płaci też część „darmowych”. Przy 25% aktywnych,
którzy odświeżają konto, to dodatkowo ok. 2 tys. zł miesięcznie przy 10 tys. aktywnych. Do tego karta albo BLIK
raz w roku potwierdza, że za kontem stoi prawdziwa osoba (mniej oszustów i martwych kont).

**Dlaczego 2 ogłoszenia, a nie 3:** dwa to rytm „coś co dwa tygodnie”, wystarczy zwykłej osobie. Kto wystawia częściej
(rolnik, handlarz, wypożyczalnia), szybciej trafia na plan Roczny albo Firma. Ogłoszenia „Szukam” i „Oddam za darmo”
można w przyszłości zwolnić z limitu, jeśli zabraknie ruchu w okolicy (decyzja po pierwszych danych).

**Po co roczna opłata (po ludzku):** płacisz raz w roku i masz spokój, bez miesięcznych opłat i bez płacenia
za każde ogłoszenie osobno. Limit zatrzymuje spamerów i handlarzy, którzy chcieliby wrzucać setki ogłoszeń za darmo.

### Reklamy: ile mogą dać
Lokalne firmy (skład budowlany, warsztat, wypożyczalnia) kupują chmurkę w swoim mieście, bez profilowania ludzi.
Przykład: 10 tys. aktywnych × ok. 20 wejść na główną miesięcznie = 200 tys. wyświetleń. Przy lokalnej cenie
ok. 10 zł za 1 000 wyświetleń to ok. 2 000 zł miesięcznie; pakiet dla firmy np. 49 zł za tydzień w jednym mieście.
Google AdSense na stronie WWW daje zwykle kilka złotych za 1 000 wyświetleń (wymaga zgody na cookies),
więc to tylko uzupełnienie, gdy lokalnych reklam brakuje.

**Pomiar marketingu:** GA4, Meta Pixel i TikTok Pixel po zgodzie użytkownika (`src/lib/analytics.ts`, kroki w
[WDROZENIE.md](WDROZENIE.md)). Zdarzenia: rejestracja, nowe ogłoszenie, zaproszenie, zakup, plan.

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

**Miesięcznie** (8% nowych osób w miesiącu, 6% na planie 99 zł, 25% odświeża darmowe konto za 10 zł od drugiego roku,
płatności przez Stripe, bez VAT, ZUS i Twojej pensji):

| Aktywni użytkownicy | 1 000 | 10 000 | 100 000 |
|---|---|---|---|
| Baza, logowanie, czat | 93 zł | 93 zł | 278 zł |
| SMS z kodem | 21 zł | 174 zł | 1 364 zł |
| Zdjęcia, e-maile, push | 0 zł | 1 zł | 82 zł |
| Prowizje operatora za plany i odświeżenia | 37 zł | 371 zł | 3 709 zł |
| Księgowość, domena, sklepy | 445 zł | 445 zł | 445 zł |
| Obsługa i moderacja | 0 zł (Ty) | 0 zł (Ty) | 8 000 zł |
| **Koszty razem** | **596 zł** | **1 083 zł** | **13 877 zł** |
| Przychód: 2% płaci 99 zł + odświeżenia | 373 zł | 3 733 zł | 37 333 zł |
| Przychód: 6% płaci 99 zł + odświeżenia | 703 zł | 7 033 zł | 70 333 zł |
| w tym same odświeżenia 10 zł | 208 zł | 2 083 zł | 20 833 zł |

AI w planerze (Claude): ok. 1–3 tys. tokenów na plan; przy 10 tys. aktywnych i 2 planach na osobę miesięcznie to
rząd kilkuset złotych. Gotowe plany dla najczęstszych celów trzymamy w pamięci podręcznej, więc model liczy tylko nowe.

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

- **Najpierw telefon: Google Play i App Store** (Capacitor, ten sam kod). Domena `miliorbit.com` to strona, która prowadzi
  do sklepów (Android → Google Play, iPhone → App Store, komputer → kod QR), a linki z aplikacji otwierają się w aplikacji.
  Ta sama aplikacja działa w przeglądarce pod `miliorbit.com/app/` dla tych, którzy nie chcą instalować.
- **Prowizje sklepów:** płatności między ludźmi za rzeczy i usługi w realu (Bezpieczna płatność przez Stripe) **nie** idą
  przez sklepy. Plany (Roczny, Firma, odświeżenie) to usługa cyfrowa: kupione w aplikacji na iPhonie i z Google Play
  wymagają płatności sklepu (dla małych firm 15%, programy Apple Small Business i Google Play do 1 mln USD rocznie).
  Na stronie `/app/` plan kosztuje tyle samo bez prowizji sklepu. Czy w UE można w aplikacji podać link do zakupu na
  stronie (DMA) i na jakich warunkach, sprawdź z prawnikiem przed startem.
- **Komputer: rozszerzenie** do Chrome i Edge (otwiera się w panelu bocznym) oraz Safari (konwersja `npm run safari:extension`,
  wymaga Maca z Xcode). Menu pod prawym przyciskiem **„Wystaw na Miliorbit”** przenosi tytuł strony, zaznaczony tekst i zdjęcie
  do formularza: można wystawić coś, co oglądasz na OLX czy Allegro. Budowanie: `npm run build:extension`.
- **Aplikacja w przeglądarce (PWA)** jako dodatek: iPhone Safari → Udostępnij → „Do ekranu początkowego”, Android Chrome →
  „Dodaj do ekranu głównego”.

## 9. Panel okolicy: pogoda, paliwa, ostrzeżenia

- **Pogoda (jest):** temperatura i stan nieba w pasku na głównej, ostrzeżenie „jutro opady 70%” (przyda się, gdy ktoś
  pożycza kosiarkę albo planuje brukowanie). Źródło: Open-Meteo, bez klucza i bez śledzenia; gdy brak sieci, panel znika.
  Przy ruchu komercyjnym Open-Meteo wymaga płatnego planu (ok. kilkudziesięciu euro miesięcznie) albo własnej instancji.
- **Ceny paliw (jest moduł):** ekran „Paliwa w okolicy”: Pb95, ON, LPG, najtańsza stacja, odległość i minuty dojazdu,
  źródło ceny i godzina. Trzy źródła: **stacja przez API** (funkcja `fuel-prices`, klucz stacji, ceny z systemu kasowego),
  **zgłoszenia kierowców** (z limitem 20 dziennie na osobę) i **cena orientacyjna** (wyraźnie oznaczona).
  W Polsce nie ma darmowego, oficjalnego API cen ze stacji, więc stacje zapraszamy do podawania cen same
  (darmowa widoczność, później płatne wyróżnienie). W UE część krajów publikuje ceny oficjalnie (np. Niemcy:
  MTS-K przez Tankerkönig, Włochy: MIMIT, Hiszpania: Geoportal, Francja: prix-carburants), co ułatwia wejście tam.
- **Model dla stacji:** wpis i API za darmo; wyróżnienie „Polecana stacja” w okolicy jako reklama lokalna.

## 10. Plan startu

1. **Walidacja (2–4 tygodnie):** strona z listą oczekujących; 20 rozmów z mieszkańcami jednego powiatu, 5 z rolnikami,
   3 z właścicielami kwater.
2. **Start w powiecie** (np. piaseczyńskim): rolnicy, wyprzedaże garażowe, narzędzia, kwatery. 300 ogłoszeń przed reklamą.
3. **Płatności, push, strony ogłoszeń** (miesiące 2–4).
4. **Kolejne powiaty**, potem Czechy, Słowacja i społeczność ukraińska (języki już są).

Marketing i filmy: [MARKETING.md](MARKETING.md). Wdrożenie krok po kroku: [WDROZENIE.md](WDROZENIE.md). Bezpieczeństwo: [BEZPIECZENSTWO.md](BEZPIECZENSTWO.md).

## 11. Następne kroki w kodzie

1. Supabase: logowanie numerem (SMS), tabele, RLS i automaty z `supabase/migrations/0001_init.sql` (schemat nie był
   jeszcze uruchamiany na prawdziwej bazie; przed startem przejść go na projekcie testowym).
2. Operator płatności: konto sprzedającego (KYC u operatora), BLIK i szybki przelew, webhook → `orders.status = 'paid'`.
3. Przewoźnicy: InPost ShipX API albo agregator (Furgonetka, Apaczka) do etykiet i śledzenia.
4. Web Push + FCM/APNs z tabeli `notifications`; pg_cron dla przypomnień i DAC7.
5. Publiczne strony ogłoszeń z podglądem, strona `/zastrzez`, generator XML DPI-IS.
6. Bezpieczna płatność i spory: `0002_safety.sql` (spory, kaucje, zaproszenia, reklamy, limity zapytań, dziennik),
   Edge Functions do wypłat i zwrotów u operatora płatności.
7. Planer AI: wdrożyć `supabase/functions/plan` (sekret `ANTHROPIC_API_KEY`), limit zapytań na konto, pamięć gotowych planów.
