# Start: jak testować Miliorbit u siebie

Ta instrukcja jest na teraz: chcesz klikać aplikację na swoim telefonie i komputerze, zgłaszać poprawki i widzieć je
po kilku minutach. Bezpieczeństwo i start publiczny są w [WDROZENIE.md](WDROZENIE.md) i dopisujemy je po kolei.
Plan łączenia aplikacji z bazą danych: [PLAN.md](PLAN.md).

## Czy robimy aplikację na Androida i iPhone'a od razu?

| | Odpowiedź | Co masz |
|---|---|---|
| **Android (.apk)** | **Tak, już jest.** GitHub sam buduje plik APK po każdej zmianie w kodzie i od razu uruchamia go na emulatorze (zrzuty ekranu). Na telefonie bez blokady instalujesz go bez Google Play; na Samsungu z „Automatyczną blokadą” użyj emulatora albo testu w Google Play. | sposób 2 poniżej |
| **iPhone** | Na iPhonie nie ma plików .apk, a instalacja poza App Store wymaga konta **Apple Developer (99 USD/rok)** i **TestFlight**. Mac nie jest potrzebny: aplikację na iPhone'a zbuduje automat GitHuba na macOS. | teraz: wersja z przeglądarki dodana do ekranu początkowego (sposób 3); TestFlight w kroku 9 [planu](PLAN.md) |

**Zrób już teraz (czeka się długo):** załóż konto Apple Developer jako **firma**. Potrzebny jest numer D-U-N-S spółki
(darmowy, czeka się do 2 tygodni), a samo konto Apple sprawdza kilka dni. Wtedy iPhone nie będzie czekał na resztę.

## Sposoby testowania (od najprostszego)

| Sposób | Czas | Dla kogo | Dane |
|---|---|---|---|
| 1. Prototyp w Claude | 0 min | Ty, na każdym urządzeniu | przykładowe, na urządzeniu |
| 2a. Zrzuty z emulatora w chmurze | 0 min, samo się robi | podgląd, czy nowa wersja działa | przykładowe |
| 2b. Emulator w przeglądarce (Appetize) | 10 min, raz | klikanie prawdziwej aplikacji Android w przeglądarce, także na telefonie | jak wyżej |
| 2c. Emulator na komputerze (Android Studio) | 30 min, raz | bez limitów czasu, najpewniejszy | jak wyżej |
| 2d. Plik APK na telefonie | 5 min | telefony bez „Automatycznej blokady” | jak wyżej |
| 2e. Test wewnętrzny w Google Play | po założeniu konta Google Play | **Samsung z blokadą**, znajomi testerzy | jak wyżej |
| 3. Strona testowa (Cloudflare Pages) | 15 min, raz | każdy telefon i komputer, także Samsung z blokadą | przykładowe, a po kroku 1 planu z bazy |
| 4. Na własnym komputerze | 20 min, raz | gdy chcesz zobaczyć zmianę przed wysłaniem | jak wyżej |

> **Samsung: „Unbekannte App gesperrt” / „Nieznana aplikacja zablokowana”.** To **Automatyczna blokada**
> (Ustawienia → Bezpieczeństwo i prywatność → Automatyczna blokada). Przepuszcza tylko Google Play i Galaxy Store,
> nawet gdy dasz zgodę „Instaluj nieznane aplikacje”. **Nie musisz jej wyłączać.** Na telefonie testuj stronę (sposób 3),
> a aplikację Android na emulatorze (2a–2c), aż będzie test w Google Play (2e), który blokada przepuszcza.

W każdej wersji w zakładce **Ja** na samym dole jest napis typu `Miliorbit 0.8 · bb8137b · demo` (w wersji
deweloperskiej z dopiskiem `· DEV`). To numer wersji
(skrót zmiany w GitHubie) i tryb: **demo** = dane przykładowe tylko na tym urządzeniu, **live** = baza danych.
Podawaj go przy zgłaszaniu błędów.

---

## 1. Prototyp w Claude

**Gdzie jesteś:** telefon, przeglądarka, zalogowany w claude.ai.
**Zrób:** otwórz `https://claude.ai/artifact/DUiRFHSqmtWnXs8iBSvFtC` (albo zeskanuj kod QR z rozmowy).
**Uwaga:** to podgląd w ramce Claude. Mapa, GPS i aparat mogą tu działać inaczej niż w aplikacji.

---

## 2. Aplikacja na Androida

Dwie aplikacje, każda zawsze pod tym samym adresem:

| Aplikacja na telefonie | Z gałęzi | Plik APK | Strona z plikiem i zrzutami |
|---|---|---|---|
| **Miliorbit** (testowa, do pokazywania) | domyślnej | `https://github.com/marlow3189/WhatsThat/releases/download/android-test/miliorbit-test.apk` | `…/releases/tag/android-test` |
| **Miliorbit DEV** (najnowsze zmiany) | `dev` ([PLAN.md](PLAN.md), krok 0) | `https://github.com/marlow3189/WhatsThat/releases/download/android-dev/miliorbit-dev.apk` | `…/releases/tag/android-dev` |

Obie instalują się obok siebie i mają osobne dane. Wersja DEV pojawi się, gdy założysz gałąź `dev`.

### 2a. Zrzuty z emulatora w chmurze (nic nie robisz)

**Gdzie jesteś:** dowolna przeglądarka, strona wydania `…/releases/tag/android-test`.
**Co się dzieje:** po każdej zmianie GitHub buduje APK i uruchamia je na **dwóch** emulatorach telefonu Pixel 6:
**Android 14** i **Android 16** (od Androida 15 aplikacja rysuje się pod paskiem stanu, jak na nowych Samsungach).
Na każdym przechodzi rejestrację, Okolicę, SOS, **całe dodanie ogłoszenia** (Sprzedaż → kategoria → opis → Opublikuj),
Szukaj i Ja, a potem **stuka palcem** (prawdziwe dotknięcia ekranu) w zakładki i górne przyciski.
**Sprawdź:** w sekcji **Assets** są pliki `api34-…` i `api36-…`: zrzuty `01-start.png` … , `wynik.txt`
(„OK: wszystkie kroki przeszły”) i `dotyk.txt` (lista stuknięć: ✓ działa, ✗ nie działa, z położeniem przycisku).
Stuknij obrazek, żeby go zobaczyć. Jeśli któryś krok się nie udał, jego zrzut ma w nazwie `-blad`.

### 2b. Emulator w przeglądarce: Appetize (klikasz sam)

**Gdzie jesteś:** komputer, przeglądarka, **appetize.io**.
**Po co:** prawdziwy Android w karcie przeglądarki. Link działa też na telefonie (także na Samsungu z blokadą,
bo nic się nie instaluje).

**Zrób:**
1. Na komputerze pobierz plik APK (link na górze sekcji 2).
2. **appetize.io** → **Sign Up** (darmowe konto, bez karty) → potwierdź e-mail.
3. W panelu **Upload** (albo *New app*) → wybierz `miliorbit-test.apk` → platforma **Android** → **Upload**.
4. Na stronie aplikacji kliknij ekran telefonu (**Tap to play**). Możesz wybrać model (np. Pixel 7), wersję Androida
   i język (*Language: Polish*). Skopiuj link do aplikacji (`https://appetize.io/app/…`): otworzysz go też na telefonie.
5. Nowa wersja: na stronie aplikacji w Appetize **Upload new version** (albo *Update*) z nowym plikiem APK. Link zostaje.

**Uwaga:** darmowy plan ma ograniczoną liczbę minut w miesiącu (zwykle kilkadziesiąt). Zamykaj kartę po teście.
Automatyczne wgrywanie każdej nowej wersji: napisz agentowi „podłącz Appetize do GitHub Actions” (będzie potrzebny
token API z Appetize zapisany przez Ciebie jako sekret w GitHubie).

### 2c. Emulator na komputerze: Android Studio (bez limitów)

**Gdzie jesteś:** komputer z Windows albo Mac, min. 8 GB RAM (lepiej 16 GB), ok. 15 GB miejsca na dysku.
**Po co:** pełny telefon z Androidem na ekranie komputera, bez limitu czasu, z udawanym GPS.

**Zrób raz:**
1. **developer.android.com/studio** → **Download Android Studio** → zainstaluj z domyślnymi ustawieniami
   (zaznaczone *Android Virtual Device*). Pierwsze uruchomienie: **Next** do końca (pobierze składniki, ok. 10 minut).
2. Ekran powitalny → **More Actions** (albo ⋮) → **Virtual Device Manager** → **+** (*Create Virtual Device*) →
   **Phone → Pixel 8** → **Next** → obraz systemu z góry listy (ikonka pobierania obok nazwy) → **Next** → **Finish**.
3. Przy nowym urządzeniu **▶** (Start). Po minucie pojawi się okno z telefonem.

**Za każdym razem:**
1. Pobierz na komputer najnowszy `miliorbit-test.apk` (link na górze sekcji 2).
2. **Przeciągnij plik myszką na okno emulatora.** Instaluje się sam, na starszej wersji też (dane zostają).
3. Na emulatorze przesuń palcem (myszą) w górę → ikona **Miliorbit**.

**Przydatne:** położenie ustawisz w oknie emulatora: **⋯** (*Extended controls*) → **Location** → wpisz miasto →
**Set location**. Język telefonu: w emulatorze *Settings → System → Languages*.
**Błąd o wirtualizacji (HAXM, hypervisor, VT-x):** Windows: *Panel sterowania → Programy → Włącz lub wyłącz funkcje
systemu Windows* → zaznacz **Windows Hypervisor Platform** → uruchom ponownie. Jeśli nadal błąd: włącz *Intel VT-x* /
*AMD-V (SVM)* w BIOS-ie komputera.

### 2d. Plik APK na telefonie (telefony bez „Automatycznej blokady”)

**Gdzie jesteś:** telefon z Androidem, Chrome.
1. Otwórz link do pliku APK (na górze sekcji 2) → **Pobierz** → stuknij pobrany plik.
2. Android zapyta o zgodę na instalację z tego źródła: **Ustawienia** → **Zezwalaj z tego źródła** → wróć → **Zainstaluj**.
3. Google Play Protect może ostrzec o nieznanej aplikacji: **Więcej szczegółów** → **Zainstaluj mimo to**.
Nowa wersja instaluje się na starej (dane zostają). Na Samsungu z włączoną Automatyczną blokadą instalacja się nie
uda: użyj 2b, 2c albo 2e.

### 2e. Test wewnętrzny w Google Play (także Samsung z blokadą)

**Po co:** aplikacja instaluje się ze Sklepu Play, więc przepuszcza ją każda blokada. Do 100 testerów, nowe wersje
dostępne kilka minut po wysłaniu.

**Zrób raz:** [PLAN.md](PLAN.md), **krok 3** (konto Google Play masz; klucz do wysyłki, sekrety w GitHubie, pierwsza
paczka ręcznie). Potem każda nowa wersja to jedno kliknięcie: GitHub → **Actions → Google Play → Run workflow**.
**Na telefonie:** otwórz link do testów z Play Console → **Zostań testerem** → **Pobierz z Google Play**.

---

## 3. Strona testowa w internecie (Cloudflare Pages)

**Gdzie jesteś:** komputer, przeglądarka, najpierw **dash.cloudflare.com**.
**Po co:** stały adres typu `https://miliorbit.pages.dev`, który działa na każdym telefonie i komputerze. Każda zmiana
w kodzie publikuje się sama w 1–2 minuty, a każda gałąź agenta dostaje osobny adres podglądu. Domena miliorbit.com
nie jest do tego potrzebna (podłączysz ją później, etap 2 w [WDROZENIE.md](WDROZENIE.md)).

**Zrób:**
1. Załóż konto na **dash.cloudflare.com** (e-mail, hasło, potwierdzenie e-mailem). Włącz 2FA: **My Profile → Authentication**.
2. W menu po lewej **Workers & Pages** (albo **Compute → Workers & Pages**) → **Create** → zakładka **Pages** →
   **Connect to Git** (albo *Import an existing Git repository*).
3. **Connect GitHub** → zaloguj się w GitHubie → wybierz **Only select repositories** → `WhatsThat` → **Install & Authorize**.
4. Wybierz repozytorium `marlow3189/WhatsThat` → **Begin setup** i wpisz:

   | Pole | Wartość |
   |---|---|
   | *Project name* | `miliorbit` (jeśli zajęte: `miliorbit-test`) |
   | *Production branch* | `claude/p2p-rental-marketplace-bimvf6` (po utworzeniu `main` zmienisz na `main`) |
   | *Framework preset* | `None` |
   | *Build command* | `npm run build` |
   | *Build output directory* | `dist` |
   | *Environment variables* → **Add variable** | `NODE_VERSION` = `22` |

5. **Save and Deploy**. Po 1–2 minutach zobaczysz **Success** i adres `https://miliorbit.pages.dev`.
6. **Settings → Builds** (albo *Builds & deployments*) → *Preview branches* / *Branch deployments*: **All non-Production branches**.
   Każda gałąź agenta dostanie adres `https://<nazwa-gałęzi>.miliorbit.pages.dev`.

**Sprawdź:**
- `https://miliorbit.pages.dev` pokazuje stronę główną z przyciskami Google Play i App Store
  (Google Play pokaże „nie znaleziono”, dopóki aplikacji nie ma w sklepie, tak ma być).
- `https://miliorbit.pages.dev/app/` otwiera aplikację.
- Na iPhonie: `…/app/` w **Safari** → **Udostępnij** → **Do ekranu początkowego**. Ikona Miliorbit działa jak aplikacja.
- Na Androidzie w Chrome: menu **⋮** → **Dodaj do ekranu głównego** (albo zainstaluj APK, sposób 2).
- **Ja → Panel operatora (demo) → Baza danych**: tryb **demo** (do kroku 1 planu tak ma być).

**Gdy build jest czerwony:** projekt → **Deployments** → kliknij nieudany → **View details** → skopiuj ostatnie
30 linijek logu i wklej agentowi z poleceniem „napraw build w Cloudflare”.

---

## 4. Na własnym komputerze (opcjonalnie)

**Gdzie jesteś:** komputer, **terminal** (Windows: *Terminal* albo *PowerShell*; Mac: *Terminal*).
**Po co:** widzisz zmiany od razu, zanim trafią do internetu.

**Zrób raz:**
1. Zainstaluj **Node.js 22 LTS** (nodejs.org → *LTS*) i **Git** (git-scm.com). Uruchom ponownie terminal.
2. W terminalu:
   ```bash
   git clone https://github.com/marlow3189/WhatsThat.git
   cd WhatsThat
   npm install
   ```

**Za każdym razem:**
```bash
git pull           # pobierz najnowsze zmiany agenta
npm install        # doinstaluj nowe biblioteki, jeśli są
npm run dev        # aplikacja: http://localhost:5173
```
Na telefonie w tej samej sieci Wi-Fi: `npm run dev -- --host`, w terminalu pojawi się adres `Network: http://192.168.…:5173`.
Otwórz go w telefonie. Testy automatyczne: `npm test`. Zatrzymanie serwera: `Ctrl+C`.

---

## Jak zgłaszać poprawki (pętla z agentem)

1. Testujesz (sposób 2 albo 3) i zapisujesz uwagi. Najlepiej w tym formacie:
   ```
   Wersja: Miliorbit 0.7 · bb8137b · demo, telefon: Samsung A54 / iPhone 13, sposób: APK / strona
   Ekran: Dodaj → Zapytaj sąsiadów
   Zrobiłem: wpisałem pytanie, stuknąłem Dalej
   Stało się: przycisk nic nie robi
   Oczekiwałem: przejście do „Kto widzi”
   (zrzut ekranu)
   ```
2. Wklejasz to agentowi w Claude Code. Kilka uwag naraz to dobry pomysł: agent poprawi je w jednej paczce.
3. Agent poprawia, uruchamia testy i wysyła zmiany na GitHuba.
4. Po 1–2 minutach nowa wersja jest na stronie testowej, a po ok. 5 minutach nowe APK. Na dole zakładki **Ja**
   sprawdzasz, czy numer wersji się zmienił, i testujesz jeszcze raz.

**Dobre polecenia dla agenta:**
- „Przetestowałem, oto uwagi: … Popraw, sprawdź na 390 px i daj znać, kiedy będzie nowe APK.”
- „Zrób fazę 1 z docs/PLAN.md. Adres i klucz anon Supabase są już w Cloudflare i w GitHub Variables.”
- „Pokaż mi, co się zmieniło od wczoraj, w punktach.”

## Bezpieczeństwo na etapie testów (minimum)

- Do testów używaj danych przykładowych albo swoich. Nie zapraszaj jeszcze obcych osób z prawdziwymi danymi.
- Klucz **anon** Supabase może być w Cloudflare i GitHub Variables (jest publiczny z założenia). Klucza
  **service_role**, kluczy Stripe i Anthropic nigdy nie wklejaj do czatu, kodu ani zmiennych strony.
- Plik `android/app/miliorbit-test.keystore` jest jawny celowo i służy tylko do APK testowych. Do Google Play
  używamy osobnego, tajnego klucza do wysyłki (PLAN.md, krok 3).
