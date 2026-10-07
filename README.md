# Miliorbit

**Twoja orbita: znajomi i sąsiedzi.** Potrzebujesz piasku? Wpisz „piasek” i zobacz, kto obok go ma.
Codzienny, lokalny handel między ludźmi: sprzedaż, odsprzedaż, wyprzedaże garażowe, wynajem, usługi,
wymiana i oddawanie za darmo. **Najpierw znajomi z telefonu, potem okolica.** Konto to numer telefonu,
bez haseł i bez prowizji. Marka jest w `src/config.ts` (miliorbit.com).

- **Kręgi:** znajomi (wzajemne kontakty), znajomi znajomych, wszyscy w promieniu km / miejscowości / województwie / kraju.
- **Rolnik:** cena za kg albo sztukę, klient płaci BLIK-iem, rolnik widzi „Opłacone”, pakuje, klient odbiera.
- **Zastrzeżenie numeru:** jeden przycisk; odblokowanie kodem SMS i potwierdzeniem dwóch zaufanych osób.
- **Języki:** polski, angielski, niemiecki, ukraiński, czeski, słowacki, węgierski, włoski, hiszpański.
- **Planer AI:** cel („wybrukować podjazd”) → kroki z ofertami z orbity, znajomi pierwsi (`src/lib/planner.ts`,
  w produkcji `supabase/functions/plan` z Claude).
- **Sąsiedzi:** oferty do 3 km widać zawsze; ukryć można tylko konkretną osobę. Pogoda na głównej (Open-Meteo).
- **Cennik:** 2 nowe ogłoszenia w miesiącu za darmo (pierwszy rok gratis, potem 10 zł/rok), Roczny 99 zł, Firma 499 zł, 0% prowizji.
- **Bezpieczna płatność:** pieniądze czekają u operatora do kodu odbioru, spory z 48 h na odpowiedź i mediacją, kaucja jako blokada na karcie.
- **Mapa:** wyniki i plan AI na mapie z trasą przez wszystkie punkty.
- **Twoja orbita na mapie:** ludzie wokół (znajomi z imienia, reszta pod pseudonimem lub „Osoba #n”), minuty dojazdu, zasięg 2 km – Europa.
- **Na co dzień:** ceny paliw w okolicy (stacje przez API, kierowcy, ceny orientacyjne), opał i ogrzewanie, ulubieni z godzinami (piekarz).
- **Ostrzeżenia:** IMGW-PIB i link do RCB w Polsce, NINA w Niemczech, Meteoalarm w UE; zawsze ze źródłem.
- **Kod QR:** jedna strona `/pobierz` kieruje Androida do Google Play, iPhone'a do App Store.
- **Wygląd:** dwa motywy (Kolorowy i Niebieski), opis w [docs/DESIGN.md](docs/DESIGN.md).
- **Kupione:** po płatności rzecz pojedyncza znika z oferty („Kupione” przez dobę), przy wielu sztukach maleje zapas.
- **Nowoczesne API przeglądarki:** płynne przejścia (View Transitions), licznik na ikonie (Badging), wyszukiwanie głosem.
- **Komputer:** rozszerzenie do Chrome, Edge i Safari z menu „Wystaw na Miliorbit”.

Strategia, nazwa, koszty, prawo: **[docs/BIZNES.md](docs/BIZNES.md)** · Wdrożenie krok po kroku: **[docs/WDROZENIE.md](docs/WDROZENIE.md)** · Bezpieczeństwo: **[docs/BEZPIECZENSTWO.md](docs/BEZPIECZENSTWO.md)** · Marketing i filmy: **[docs/MARKETING.md](docs/MARKETING.md)** · Regulamin: **[docs/legal/](docs/legal/)**

## Uruchomienie

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # testy cennika, planera, odległości, kręgów i tłumaczeń
npm run build          # dist/: strona (PWA) i webDir dla Capacitora
npm run build:preview  # dist-preview/index.html: cała aplikacja w jednym pliku
npm run build:extension  # rozszerzenie przeglądarki: extension/ + release/miliorbit-extension.zip
```

Rozszerzenie: w Chrome lub Edge wejdź w `chrome://extensions`, włącz tryb dewelopera i „Załaduj rozpakowane” → folder
`extension/`. Safari: `npm run safari:extension` na Macu z Xcode.

Prototyp działa bez serwera: dane demo są w `src/data/seed.ts`, zmiany zapisują się w pamięci przeglądarki.
Kod SMS i BLIK w wersji demo: dowolne 6 cyfr. „Wyloguj i wyczyść dane demo” w zakładce **Ja** zaczyna od nowa.

## iPhone i Android

Najpierw jako aplikacja ze strony (PWA): Safari → Udostępnij → „Do ekranu początkowego”, Chrome → „Zainstaluj aplikację”.
Wersje do sklepów z tego samego kodu:

```bash
npx cap add android && npm run cap:android   # wymaga Android Studio
npx cap add ios && npm run cap:ios           # wymaga macOS i Xcode
```

## Struktura

| Ścieżka | Co tam jest |
|---|---|
| `src/config.ts` | nazwa i domena |
| `src/i18n/` | teksty interfejsu w 9 językach + test kompletności |
| `src/lib/categories.ts` | drzewo kategorii w 4 językach |
| `src/lib/pricing.ts` | plany i ceny w walutach, limit miesięczny, przypomnienia, „kto pierwszy zapłaci” |
| `src/lib/dac7.ts`, `src/lib/costs.ts` | raport DAC7 (progi, braki, termin, plik) i model kosztów |
| `extension/` | rozszerzenie MV3: panel boczny, menu „Wystaw na Miliorbit” |
| `src/lib/circles.ts`, `src/lib/geo.ts` | kręgi zaufania, odległości, województwa |
| `src/data/store.tsx` | stan: konto, ogłoszenia, zamówienia, czaty, powiadomienia, zastrzeżenie |
| `src/screens/` | Rejestracja, Główna, Szukaj, Ogłoszenie, Zamówienie, Dodaj, Czaty, Ja, Mój stragan, Bezpieczeństwo, Panel operatora |
| `supabase/migrations/0001_init.sql` | schemat: PostGIS, kręgi, limit 3 ogłoszeń, zastrzeżenie i odblokowanie, zamówienia, powiadomienia, RLS, DAC7 |
