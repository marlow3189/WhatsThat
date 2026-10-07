# Start: jak testować Miliorbit u siebie

Ta instrukcja jest na teraz: chcesz klikać aplikację na swoim telefonie i komputerze, zgłaszać poprawki i widzieć je
po kilku minutach. Bezpieczeństwo i start publiczny są w [WDROZENIE.md](WDROZENIE.md) i dopisujemy je po kolei.
Plan łączenia aplikacji z bazą danych: [PLAN.md](PLAN.md).

## Czy robimy aplikację na Androida i iPhone'a od razu?

| | Odpowiedź | Co masz |
|---|---|---|
| **Android (.apk)** | **Tak, już jest.** GitHub sam buduje plik APK po każdej zmianie w kodzie. Instalujesz go na telefonie bez Google Play. | sposób 2 poniżej |
| **iPhone** | Na iPhonie nie ma plików .apk, a instalacja poza App Store wymaga konta **Apple Developer (99 USD/rok)** i **TestFlight**. Mac nie jest potrzebny: aplikację na iPhone'a zbuduje automat GitHuba na macOS. | teraz: wersja z przeglądarki dodana do ekranu początkowego (sposób 3); TestFlight w fazie 7 [planu](PLAN.md) |

**Zrób już teraz (czeka się długo):** załóż konto Apple Developer jako **firma**. Potrzebny jest numer D-U-N-S spółki
(darmowy, czeka się do 2 tygodni), a samo konto Apple sprawdza kilka dni. Wtedy iPhone nie będzie czekał na resztę.

## Cztery sposoby testowania (od najprostszego)

| Sposób | Czas | Dla kogo | Dane |
|---|---|---|---|
| 1. Prototyp w Claude | 0 min | Ty, na każdym urządzeniu | przykładowe, na urządzeniu |
| 2. APK na Androida z GitHuba | 5 min | telefony z Androidem | przykładowe, a po fazie 1 z bazy |
| 3. Strona testowa (Cloudflare Pages) | 15 min, raz | każdy telefon i komputer, także znajomi testerzy | jak wyżej |
| 4. Na własnym komputerze | 20 min, raz | gdy chcesz zobaczyć zmianę przed wysłaniem | jak wyżej |

W każdej wersji w zakładce **Ja** na samym dole jest napis typu `Miliorbit 0.7 · bb8137b · demo`. To numer wersji
(skrót zmiany w GitHubie) i tryb: **demo** = dane przykładowe tylko na tym urządzeniu, **live** = baza danych.
Podawaj go przy zgłaszaniu błędów.

---

## 1. Prototyp w Claude

**Gdzie jesteś:** telefon, przeglądarka, zalogowany w claude.ai.
**Zrób:** otwórz `https://claude.ai/artifact/DUiRFHSqmtWnXs8iBSvFtC` (albo zeskanuj kod QR z rozmowy).
**Uwaga:** to podgląd w ramce Claude. Mapa, GPS i aparat mogą tu działać inaczej niż w aplikacji.

---

## 2. Android: plik APK z GitHuba

**Gdzie jesteś:** telefon z Androidem, przeglądarka Chrome.
**Po co:** prawdziwa aplikacja z ikoną Miliorbit, z GPS, aparatem i wibracją, bez Google Play.

**Zrób:**
1. Otwórz na telefonie stronę wydań:
   `https://github.com/marlow3189/WhatsThat/releases/tag/android-test`
2. W sekcji **Assets** stuknij **miliorbit-test.apk**. Chrome zapyta, czy pobrać plik: **Pobierz**.
3. Stuknij pobrany plik (pasek pobierania albo **Pliki → Pobrane**).
4. Android pokaże „Ze względów bezpieczeństwa telefon nie może instalować nieznanych aplikacji z tego źródła”:
   **Ustawienia** → włącz **Zezwalaj z tego źródła** → wróć → **Zainstaluj**.
5. Jeśli Google Play Protect ostrzeże o nieznanej aplikacji: **Więcej szczegółów** → **Zainstaluj mimo to**.
   To normalne dla wersji testowych spoza sklepu.

**Sprawdź:** na ekranie jest ikona Miliorbit, aplikacja startuje od wyboru języka, przy „Użyj mojej lokalizacji”
telefon pyta o zgodę na położenie.

**Nowa wersja:** po każdej zmianie w kodzie GitHub buduje nowe APK (ok. 5 minut). Pobierz je tak samo i zainstaluj
na starym; dane zostają. Gdyby telefon napisał „Aplikacja nie została zainstalowana”, odinstaluj starą i zainstaluj nową.

**Wersja z innej gałęzi** (np. gdy agent robi coś osobno): github.com → repozytorium → **Actions** → **Android APK** →
najnowszy przebieg z zielonym ✓ → na dole **Artifacts** → plik `.zip` z APK w środku (trzeba być zalogowanym).

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
- **Ja → Panel operatora (demo) → Baza danych**: tryb **demo** (do fazy 1 tak ma być).

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
- Plik `android/app/miliorbit-test.keystore` jest jawny celowo i służy tylko do APK testowych. Do Google Play agent
  przygotuje osobny, tajny klucz (faza 7).
