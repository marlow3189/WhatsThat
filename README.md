# Regioorbit

**Twoja orbita: znajomi i sąsiedzi.** Potrzebujesz piasku? Wpisz „piasek” i zobacz, kto obok go ma.
Codzienny, lokalny handel między ludźmi: sprzedaż, odsprzedaż, wyprzedaże garażowe, wynajem, usługi,
wymiana i oddawanie za darmo. **Najpierw znajomi z telefonu, potem okolica.** Konto to numer telefonu,
bez haseł i bez prowizji. Marka jest w `src/config.ts` (regioorbit.com).

- **Kręgi:** znajomi (wzajemne kontakty), znajomi znajomych, wszyscy w promieniu km / miejscowości / województwie / kraju.
- **Rolnik:** cena za kg albo sztukę, klient płaci BLIK-iem, rolnik widzi „Opłacone”, pakuje, klient odbiera.
- **Zastrzeżenie numeru:** jeden przycisk; odblokowanie kodem SMS i potwierdzeniem dwóch zaufanych osób.
- **Języki:** polski, angielski, niemiecki, ukraiński, czeski, słowacki, węgierski, włoski, hiszpański, hindi.
- **Regiony:** województwa, Bundesländer, kraje, vármegye, obwody, wspólnoty, stany Indii i USA (`src/lib/regions.ts`).
- **Planer AI i głos:** cel („wybrukować podjazd”) → kroki z ofertami z orbity, znajomi pierwsi (`src/lib/planner.ts`,
  na żywo `supabase/functions/plan` z Claude przez `src/lib/ai.ts`); mikrofon i czytanie planu na głos (`src/lib/voice.ts`).
- **Sąsiedzi:** oferty do 3 km widać zawsze; ukryć można tylko konkretną osobę. Pogoda na głównej (Open-Meteo).
- **Cennik:** 2 nowe ogłoszenia w miesiącu za darmo (pierwszy rok gratis, potem 10 zł/rok), Roczny 99 zł, Firma 499 zł, 0% prowizji.
- **Bezpieczna płatność:** pieniądze czekają u operatora do kodu odbioru, spory z 48 h na odpowiedź i mediacją, kaucja jako blokada na karcie.
- **Mapa:** wyniki i plan AI na mapie z trasą przez wszystkie punkty.
- **Twoja orbita na mapie:** ludzie wokół (znajomi z imienia, reszta pod pseudonimem lub „Osoba #n”), minuty dojazdu, zasięg 2 km – Europa.
- **Na co dzień:** ceny paliw w okolicy (stacje przez API, kierowcy, ceny orientacyjne), opał i ogrzewanie, ulubieni z godzinami (piekarz).
- **Ostrzeżenia:** IMGW-PIB i link do RCB w Polsce, NINA w Niemczech, Meteoalarm w UE; zawsze ze źródłem.
- **Najpierw telefon:** aplikacja na Androida i iPhone'a (Capacitor). Domena `regioorbit.com` to strona z linkami do sklepów
  (`site/`), ta sama aplikacja działa w przeglądarce pod `/app/`. Linki `regioorbit.com/l/…` otwierają się w aplikacji.
- **Kod QR:** jedna strona `/pobierz` kieruje Androida do Google Play, iPhone'a do App Store (adresy w `site/stores.json`).
- **SOS:** najpierw 112, potem alarm (przytrzymanie 2 s, 3 s na anulowanie) do bliskich i sąsiadów pomocników z położeniem;
  bez internetu SMS; „Jestem bezpieczny/a” po ostrzeżeniach; „Odprowadź mnie” (lokalizacja na 15–60 min).
- **Tablica okolicy:** prośby o pomoc, pytania do sąsiadów z odpowiedziami, wydarzenia z „Będę”, praca dorywcza ze stawką netto.
- **Kontakty i anonimowy klucz:** kontakty porównywane tylko jako skróty numerów; obcy widzą klucz `anonym` + kraj + płeć
  (m/w/x, wybór raz na zawsze) + 10 cyfr, które nie są numerem telefonu, i awatar z tego klucza.
- **Wygląd:** menu jak w WhatsAppie (5 zakładek: Okolica, Szukaj, Dodaj, Czaty, Ja), czcionka systemu, dwa motywy, [docs/DESIGN.md](docs/DESIGN.md).
- **Gmina i instytucje:** komunikaty i wywóz śmieci tylko od zweryfikowanych instytucji (`supabase/migrations/0005_institutions.sql`).
- **Kupione:** po płatności rzecz pojedyncza znika z oferty („Kupione” przez dobę), przy wielu sztukach maleje zapas.
- **Nowoczesne API przeglądarki:** licznik na ikonie (Badging), wyszukiwanie głosem (Web Speech).
- **Komputer:** rozszerzenie do Chrome, Edge i Safari z menu „Wystaw na Regioorbit”.

**Wydanie krok po kroku (wersja testowa na Vercel, potem Google Play, App Store i PWA): [docs/WYDANIE.md](docs/WYDANIE.md)** · **Testowanie u siebie (APK, strona testowa): [docs/START.md](docs/START.md)** · Master plan krok po kroku: **[docs/PLAN.md](docs/PLAN.md)** · Strategia, nazwa, koszty, prawo: **[docs/BIZNES.md](docs/BIZNES.md)** · Analiza konkurencji: **[docs/ANALIZA.md](docs/ANALIZA.md)** · Wdrożenie krok po kroku: **[docs/WDROZENIE.md](docs/WDROZENIE.md)** · Bezpieczeństwo: **[docs/BEZPIECZENSTWO.md](docs/BEZPIECZENSTWO.md)** · Marketing i filmy: **[docs/MARKETING.md](docs/MARKETING.md)** · Regulamin: **[docs/legal/](docs/legal/)**

## Uruchomienie

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # testy cennika, planera, odległości, kręgów i tłumaczeń
npm run build          # dist/: strona z linkami do sklepów + dist/app (aplikacja: /app/ i webDir Capacitora)
npm run build:preview  # dist-preview/index.html: cała aplikacja w jednym pliku
npm run build:extension  # rozszerzenie przeglądarki: extension/ + release/regioorbit-extension.zip
```

Rozszerzenie: w Chrome lub Edge wejdź w `chrome://extensions`, włącz tryb dewelopera i „Załaduj rozpakowane” → folder
`extension/`. Safari: `npm run safari:extension` na Macu z Xcode.

Prototyp działa bez serwera: dane demo są w `src/data/seed.ts`, zmiany zapisują się w pamięci przeglądarki.
Kod SMS i BLIK w wersji demo: dowolne 6 cyfr. „Wyloguj i wyczyść dane demo” w zakładce **Ja** zaczyna od nowa.

## iPhone i Android

Aplikacja na telefon to główny produkt; wersja w przeglądarce (`/app/`, także jako PWA) jest dodatkiem.
Wersje do sklepów z tego samego kodu (szczegóły, uprawnienia i linki do aplikacji: etap 9 w `docs/WDROZENIE.md`):

- **Android:** projekt jest w `android/`. Plik APK do testów buduje GitHub Actions po każdej zmianie
  (`.github/workflows/android.yml`), stały link: Releases → `android-test` → `regioorbit-test.apk`, a z gałęzi `dev` osobna
  aplikacja „Regioorbit DEV” (`android-dev`). Google Play: `.github/workflows/play.yml` (docs/PLAN.md, krok 3).
  Własne wtyczki: mikrofon (`VoicePlugin.java`) i numery z kontaktów bez imion (`PhoneNumbersPlugin.java`).
  Lokalnie: `npm run cap:android` (Android Studio).
- **iPhone:** projekt `ios/` (Capacitor, Swift Package Manager). `.github/workflows/ios.yml` po każdej zmianie buduje i uruchamia
  aplikację na symulatorze iPhone'a (zrzut w Artifacts), a na żądanie wysyła ją do TestFlight (docs/WYDANIE.md, część 2E).

## Struktura

| Ścieżka | Co tam jest |
|---|---|
| `src/config.ts` | nazwa, domena, linki do sklepów (z `site/stores.json`) |
| `site/` | strona regioorbit.com: linki do sklepów, `/pobierz`, `/open` (linki bez aplikacji), polityka prywatności, `_headers`, `_redirects`, `.well-known` |
| `scripts/build-site.mjs` | składa `dist/`: strona + `dist/app` + kod QR |
| `src/lib/identity.ts`, `src/lib/contacts.ts` | anonimowy klucz i awatar, skróty numerów z kontaktów |
| `src/lib/platform.ts` | telefon czy przeglądarka, link → ekran aplikacji |
| `src/screens/Sos.tsx` | SOS, „Jestem bezpieczny/a”, „Odprowadź mnie” |
| `src/i18n/` | teksty interfejsu w 10 językach + test kompletności |
| `src/lib/categories.ts` | drzewo kategorii w 10 językach |
| `src/lib/backend.ts`, `src/lib/live.ts` | tryb demo / na żywo, logowanie, profil, ogłoszenia z bazy |
| `src/lib/pricing.ts` | plany i ceny w walutach, limit miesięczny, przypomnienia, „kto pierwszy zapłaci” |
| `src/lib/dac7.ts`, `src/lib/costs.ts` | raport DAC7 (progi, braki, termin, plik) i model kosztów |
| `extension/` | rozszerzenie MV3: panel boczny, menu „Wystaw na Regioorbit” |
| `src/lib/circles.ts`, `src/lib/geo.ts` | kręgi zaufania, odległości, województwa |
| `src/data/store.tsx` | stan: konto, ogłoszenia, zamówienia, czaty, powiadomienia, zastrzeżenie |
| `src/screens/` | Rejestracja, Okolica, Szukaj, Ogłoszenie, Zamówienie, Dodaj, Czaty, Ja, Mój stragan, Bezpieczeństwo, Panel operatora |
| `supabase/migrations/0001_init.sql` | schemat: PostGIS, kręgi, limit 3 ogłoszeń, zastrzeżenie i odblokowanie, zamówienia, powiadomienia, RLS, DAC7 |
