# Analiza: Co Jest Sąsiad a Regioorbit (od ogółu do szczegółu)

Źródła: opis aplikacji w Google Play (`pl.cojestsasiad.app`) i artykuł zlotowskie.pl „Co jest, sąsiad? Używam!”.
Stan: październik 2026. Wnioski i to, co z nich wdrożyliśmy w wersji 7.

## 1. Pozycjonowanie

| | Co Jest Sąsiad | Regioorbit |
|---|---|---|
| Obietnica | darmowa tablica dla osiedla, miasta, gminy | „wszystko obok, najpierw znajomi” |
| Kategorie | Praca, Pożyczę, Oddam, Pomoc, Handel, Zamiana, Usługi, Zaginione, Forum, Wydarzenia | sprzedaż, wynajem, usługi, szukam, oddam / pożyczę, wymiana, wyprzedaż garażowa + sąsiedzi (pomoc, pytania, wydarzenia, zaginione) |
| Zaufanie | logowanie Google, bez weryfikacji, odznaka „Zaufany Sąsiad” za oceny | numer telefonu + SMS, kręgi z kontaktów (znajomi, znajomi znajomych), „Zaufany sąsiad” po 10 transakcjach bez sporów, zastrzeżenie konta |
| Pieniądze | brak płatności w aplikacji | Bezpieczna płatność (pieniądze czekają do odbioru), kaucja jako blokada, spory |
| Bezpieczeństwo | SOS: jeden przycisk, alarm do wszystkich znajomych | SOS z 112, bliskimi i sąsiadami pomocnikami (niżej) |
| Codzienność | ogłoszenia i forum | paliwa, opał, piekarz z godzinami, rolnik, planer AI, ostrzeżenia IMGW/RCB |

**Wniosek:** Co Jest Sąsiad wygrywa prostotą i „sąsiedzkością” (pomoc, forum, wydarzenia, praca z jawną stawką).
Regioorbit wygrywa zaufaniem, pieniędzmi i codziennymi sprawami. Brakowało nam warstwy sąsiedzkiej i SOS.

## 2. Co przejęliśmy i zrobiliśmy lepiej (wersja 7)

| Funkcja | U nich | U nas |
|---|---|---|
| **SOS** | jedno dotknięcie, alarm do wszystkich znajomych | przycisk **112 na górze**; alarm po **przytrzymaniu 2 s** i **3 s na anulowanie** (mniej fałszywych alarmów); trafia do **5 wybranych osób** i **sąsiadów, którzy zgodzili się pomagać** (1 km); rodzaj zdarzenia; statusy na żywo (odczytane, dzwoni, jedzie · 13 min); **SMS z mapą bez internetu**; „Jestem bezpieczny/a, zakończ”; podgląd, jak alarm wygląda u znajomego |
| **„Jestem bezpieczny/a”** | brak | jednym dotknięciem, także przy ostrzeżeniu 2. i 3. stopnia na głównej |
| **„Odprowadź mnie”** | brak | lokalizacja na żywo dla bliskich na 15, 30 albo 60 min, pasek u góry, wyłącza się sama |
| **Forum** | ogólne forum | **Pytania do sąsiadów**: odpowiedzi z informacją, kto to (z kontaktów, „zna: Kasię”), polecenia z kręgu |
| **Wydarzenia** | lista | data, **„Będę”**, licznik i którzy znajomi idą |
| **Pomoc** | kategoria | **„Poproś o pomoc” / „Pomogę”** (otwiera czat z gotową wiadomością), zawsze za darmo |
| **Praca** | stawki netto, bez agencji i CV | stawka zawsze z dopiskiem **netto**, podpowiedź przy dodawaniu |
| **Układ** | kategorie na start | **Tablica okolicy** na głównej z zakładkami (Wszystko, Pomoc, Pytania, Wydarzenia, Praca) i kafelki „Sąsiedzi: zawsze za darmo” na górze ekranu Dodaj |

## 3. Układ aplikacji (logika ekranów)

- **5 zakładek:** Główna, Szukaj, + (dodaj), Czaty, Ja. Standard z Instagrama i Messengera, nie trzeba uczyć.
- **SOS w 1 dotknięciu** z głównej (czerwony przycisk obok dzwonka) i z zakładki Ja. Skróty z ikony (przytrzymanie:
  SOS, Dodaj, Szukaj) działają w wersji z przeglądarki dodanej do ekranu; w aplikacji ze sklepu dodamy je jako skróty systemowe.
- **Kolejność na głównej = pilność:** ostrzeżenia (z „Jestem bezpieczny/a”) → alerty z okolicy (zaginione) → tablica
  okolicy → Twoja orbita → na co dzień → nowe u znajomych → sąsiedzi → Twoje ogłoszenia → zainteresowania.
- **Rejestracja** zostaje krótka: język, okolica, numer + SMS, imię, płeć (raz), zainteresowania, kontakty, powiadomienia,
  zasady. Każdy ekran mówi, po co jest.

## 4. Tożsamość i prywatność (Twoje wymagania)

- **Dostęp do kontaktów** z jasnym wyjaśnieniem przed oknem systemu: numery zamieniane w telefonie na skróty, imiona
  zostają w telefonie, serwer tylko porównuje i nic nie zapisuje, można udostępnić wybrane kontakty, „Jak to działa?”.
- **Anonimowy klucz** w Twoim formacie: `anonym` + kraj + płeć + cyfry, np. `anonymplm4829175530`, i awatar z tego klucza.
  Zmiana względem przykładu `anonymplm0048693487111`: **cyfry nie są numerem telefonu**. Gdyby były, każdy obcy
  odczytałby Twój numer z awatara, a ukrywamy go przed obcymi (i RODO wymaga minimalizacji danych). Cyfry to skrót
  numeru z tajnym kluczem serwera: stały, unikalny, nie do odwrócenia.
- **Płeć m / w / x** wybierana raz: po zatwierdzeniu pozostałe opcje są zablokowane (wyszarzone z kłódką) w rejestracji
  i w Prywatności. Bazę też to pilnuje (wyzwalacz w `0004_identity_sos.sql`), więc nie da się tego obejść.
  Pomyłkę poprawia tylko pomoc (RODO daje prawo do sprostowania danych, więc całkowity zakaz zmiany byłby niezgodny z prawem).

## 5. Telefon przede wszystkim

- Domena prowadzi do instalacji: Android → Google Play, iPhone → App Store, komputer → kod QR i wersja w przeglądarce.
- Linki z aplikacji (`regioorbit.com/l/…`, zaproszenia `/z/…`) otwierają się w aplikacji (App Links / Universal Links),
  a bez aplikacji pokazują sklep i podgląd w przeglądarce. `/sos` i `/zastrzez` otwierają się od razu, bez pytań.
- W przeglądarce na telefonie aplikacja podpowiada pobranie wersji ze sklepu (pasek, który da się ukryć na 2 tygodnie).
- **Szybkość:** języki inne niż polski i pełny regulamin doładowują się dopiero, gdy są potrzebne. Paczka startowa
  spadła z 312 kB do 187 kB (gzip), czyli o 40%.

## 6. Czego jeszcze brakuje (kolejność według przewagi)

1. **Prawdziwe powiadomienia push dla SOS** (Android: wysoki priorytet i ekran pełny; iPhone: *Critical Alerts*
   wymaga zgody Apple) i statusy SOS na żywo z Supabase Realtime.
2. **Grupy: blok, osiedle, wieś** z kodem zaproszenia od zarządcy albo sołtysa. To główna droga wzrostu Co Jest Sąsiad
   (osiedla), a u nas daje dodatkowo zaufanie.
3. **Wspólne zamówienia opału** (tona pelletu albo węgla z dowozem dla kilku domów taniej). Pasuje do kategorii opał
   i daje wyraźną oszczędność.
4. **Harmonogram wywozu śmieci i komunikaty gminy** jako powód, żeby otwierać aplikację codziennie.
5. **Oceny po transakcji w obie strony** i jawne kryteria „Zaufanego sąsiada” na profilu.
6. **Szybkie logowanie Google / Apple** po pierwszej weryfikacji numerem (numer zostaje, bo na nim stoją kontakty i SOS)
   oraz passkey.
7. **Tryb seniora** (większy tekst, prostsza główna) dla wsi i starszych sąsiadów.
8. **Karta medyczna ICE** tylko na telefonie (dane o zdrowiu to szczególna kategoria z art. 9 RODO, więc wyłącznie lokalnie
   i za wyraźną zgodą) i mapa AED, jeśli znajdzie się źródło danych z licencją.
