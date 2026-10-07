# Miliorbit: wdrożenie krok po kroku (dla początkujących)

Ta instrukcja prowadzi od zera do działającej aplikacji pod adresem **miliorbit.com**. Nie zakłada wiedzy
programistycznej. Każdy krok ma ten sam układ:

- **Gdzie jesteś:** w jakim narzędziu (strona, panel, program) wykonujesz krok.
- **Po co:** co ten krok daje.
- **Zrób:** kolejne kliknięcia i wpisy.
- **Sprawdź:** po czym poznasz, że działa.
- **Agent:** co możesz zlecić Claude Code zamiast robić ręcznie.

Nazwy przycisków w panelach (Cloudflare, Supabase, Google) czasem się zmieniają. Jeśli czegoś nie widzisz,
szukaj podobnej nazwy albo zapytaj agenta: „gdzie teraz w Cloudflare jest …?”.

> **Zasada bezpieczeństwa:** konta, hasła, płatności, podpisy i klucze tajne obsługujesz **Ty**. Agent pisze kod,
> konfigurację, testy i instrukcje. Kluczy tajnych (Stripe, Supabase `service_role`, Anthropic) nigdy nie wklejaj
> do czatu ani do repozytorium.

---

## Słowniczek: pojęcia, które pojawią się w instrukcji

| Pojęcie | Co to znaczy po ludzku |
|---|---|
| **Repozytorium (repo)** | Folder z całym kodem aplikacji w internecie, u nas na GitHubie: `marlow3189/WhatsThat`. Pamięta historię każdej zmiany. |
| **Gałąź (branch)** | Osobna „wersja robocza” kodu. Główna gałąź to `main`; nowe rzeczy powstają na gałęziach i potem się je łączy. |
| **Commit** | Zapisana paczka zmian z opisem („co zmieniłem i po co”). |
| **Pull request (PR)** | Prośba o włączenie gałęzi do `main`. Tu widać zmiany, testy i można je zatwierdzić przyciskiem „Merge”. |
| **Build (budowanie)** | Zamiana kodu źródłowego na pliki, które rozumie przeglądarka. Robi to komenda `npm run build`. |
| **Hosting** | Serwer, który pokazuje stronę ludziom. U nas **Cloudflare Pages** (darmowy). |
| **Domena** | Adres strony: `miliorbit.com`. Kupiona u rejestratora (np. OVH, home.pl, nazwa.pl). |
| **DNS** | „Książka telefoniczna internetu”: mówi, na jaki serwer prowadzi domena. Wpisy w DNS to **rekordy** (A, CNAME, TXT). |
| **Serwery nazw (nameservers)** | Kto zarządza DNS-em domeny. Przeniesiemy to do Cloudflare. |
| **HTTPS / certyfikat** | Kłódka w przeglądarce: szyfrowane połączenie. Cloudflare robi je automatycznie. |
| **Zmienna środowiskowa** | Ustawienie podawane aplikacji przy budowaniu, np. identyfikator piksela. Nie jest w kodzie, tylko w panelu. |
| **Sekret** | Zmienna środowiskowa, której nikt nie może zobaczyć (klucz API, hasło). |
| **Baza danych** | Miejsce, gdzie trzymamy konta, ogłoszenia, czaty i zamówienia. U nas **Supabase** (Postgres) w UE. |
| **Migracja** | Plik SQL, który tworzy albo zmienia tabele w bazie. Mamy trzy: `supabase/migrations/0001…0003`. |
| **RLS (Row Level Security)** | Reguły w bazie: kto może czytać i zmieniać który wiersz. Dzięki temu nikt nie podejrzy cudzych czatów. |
| **Funkcja serwerowa (Edge Function)** | Mały program na serwerze Supabase, np. planer AI albo przyjmowanie cen ze stacji paliw. |
| **API** | Sposób, w jaki dwa programy rozmawiają ze sobą (np. system kasowy stacji wysyła nam ceny). |
| **Klucz API** | Hasło dla programu. Trzymamy je jako sekret. |
| **Webhook** | Powiadomienie wysyłane automatycznie z innej usługi, np. Stripe: „płatność przyszła”. |
| **CI** | Automatyczne sprawdzanie kodu przy każdej zmianie (testy, budowanie). U nas GitHub Actions: `.github/workflows/ci.yml`. |
| **PWA** | Strona, którą można zainstalować jak aplikację z ekranu telefonu, bez sklepu. |
| **Piksel / tag** | Kawałek kodu Google, Meta, TikTok, który liczy, skąd przyszli ludzie z reklam. U nas ładuje się dopiero po zgodzie. |
| **UTM** | Dopisek do linku z kampanii, np. `?utm_source=tiktok&utm_campaign=opal`. Dzięki niemu wiesz, która reklama działa. |
| **KYC** | Weryfikacja tożsamości sprzedającego. Robi ją operator płatności (Stripe), nie my. |
| **Operator płatności** | Firma z licencją, która obsługuje pieniądze (Stripe). My nie trzymamy pieniędzy. |
| **Cron** | Zadanie wykonywane automatycznie o ustalonej porze (np. wypłata po 48 h). |
| **Claude Code (agent)** | Asystent AI, który pracuje w repozytorium: pisze kod, uruchamia testy, robi PR. Otwierasz go na claude.ai/code. |

---

## Konta, które będą potrzebne

| Narzędzie | Do czego | Koszt na start |
|---|---|---|
| GitHub (github.com) | kod, historia zmian, automatyczne testy | 0 zł |
| Cloudflare (dash.cloudflare.com) | DNS domeny, hosting strony, ochrona przed atakami | 0 zł |
| Supabase (supabase.com) | baza, logowanie numerem, funkcje serwerowe | 0 zł na testy, 25 USD/mies. przy starcie |
| Stripe (dashboard.stripe.com) | BLIK, Przelewy24, karty, konta sprzedających | prowizja od płatności |
| Google Analytics (analytics.google.com) | statystyki i źródła ruchu | 0 zł |
| Meta Business (business.facebook.com) | piksel Meta, reklamy na Facebooku i Instagramie | 0 zł + budżet reklam |
| TikTok Ads (ads.tiktok.com) | piksel TikTok, reklamy | 0 zł + budżet reklam |
| Anthropic Console (console.anthropic.com) | klucz do planera AI | kilka groszy za plan |
| SMSAPI albo Twilio | kody SMS przy logowaniu | ok. 0,11–0,17 zł za SMS |
| Google Play Console | aplikacja na Androida | 25 USD jednorazowo |
| Apple Developer | aplikacja na iPhone'a | 99 USD rocznie |
| Claude Code (claude.ai/code) | agent, który pisze i poprawia kod | w ramach planu Claude |

Na każdym koncie włącz **logowanie dwuetapowe (2FA)**. Używaj jednego firmowego e-maila, np. `hello@miliorbit.com`.

---

## Etap 0. Firma i formalności (równolegle z resztą, 1–2 tygodnie)

**Gdzie jesteś:** S24 (ekrs.ms.gov.pl), bank, biuro rachunkowe, kancelaria.
**Po co:** spółka z o.o. odpowiada swoim majątkiem, nie Twoim prywatnym.

**Zrób:**
1. Załóż **spółkę z o.o.** przez S24 (ok. 350 zł + kapitał zakładowy min. 5 000 zł). Otwórz konto firmowe.
2. Umów **biuro rachunkowe** (ok. 400 zł/mies.). Powiedz im: platforma internetowa, abonamenty, reklamy, raporty DAC7.
3. Umów **prawnika**: regulamin (`docs/legal/`), polityka prywatności, zgody marketingowe, model „Bezpiecznej płatności”
   (czy wystarczy licencja operatora płatności), reklamy (DSA art. 26).
4. **Znak towarowy** MILIORBIT w EUIPO (euipo.europa.eu): klasy 9, 35, 38, 42. Koszt: 850 € + 50 € + 150 € za każdą kolejną.
5. Dokup domeny `miliorbit.app`, `miliorbit.pl`, `miliorbit.eu` (ochrona marki).

**Agent:** „Przygotuj listę pytań do prawnika na podstawie docs/legal, docs/BIZNES.md i docs/BEZPIECZENSTWO.md”.

---

## Etap 1. Kod w gałęzi głównej (15 minut)

**Gdzie jesteś:** GitHub → repozytorium `marlow3189/WhatsThat`.
**Po co:** cała dotychczasowa praca jest na gałęzi `claude/p2p-rental-marketplace-bimvf6`. Hosting będzie budował
gałąź `main`, więc trzeba ją tam włączyć.

**Zrób:**
1. Wejdź na github.com → repozytorium → zakładka **Pull requests** → **New pull request**.
2. Ustaw: *base:* `main` ← *compare:* `claude/p2p-rental-marketplace-bimvf6` → **Create pull request**.
3. Poczekaj, aż na dole PR pojawi się zielony znaczek przy **CI** (testy przeszły).
4. Kliknij **Merge pull request** → **Confirm merge**.

**Sprawdź:** w zakładce *Code* przy gałęzi `main` widać pliki `docs/WDROZENIE.md` i `public/pobierz.html`.
**Agent:** „Utwórz PR z mojej gałęzi do main i obserwuj CI” (agent zrobi PR, Ty klikasz Merge).

---

## Etap 2. Domena miliorbit.com w Cloudflare (30 minut + do 24 h czekania)

**Gdzie jesteś:** najpierw **Cloudflare** (dash.cloudflare.com), potem panel **rejestratora**, u którego kupiłeś domenę.
**Po co:** Cloudflare będzie zarządzał DNS-em, da darmowy HTTPS i ochronę przed atakami (DDoS, boty).

**Zrób:**
1. Cloudflare → **Add a domain** (albo *Add site*) → wpisz `miliorbit.com` → wybierz plan **Free**.
2. Cloudflare pokaże dwa **serwery nazw** (np. `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`). Skopiuj je.
3. Panel rejestratora → Twoja domena → **Serwery DNS / Nameservers** → zmień na te dwa od Cloudflare → zapisz.
4. Wróć do Cloudflare i kliknij **Check nameservers**. Zmiana trwa od kilku minut do 24 h.

**Sprawdź:** w Cloudflare przy domenie status **Active** (dostaniesz też e-mail).
**Uwaga:** jeśli masz już pocztę na tej domenie (rekordy MX), sprawdź, czy Cloudflare je zaimportował.

---

## Etap 3. Strona i aplikacja w internecie (30 minut, 0 zł)

**Gdzie jesteś:** Cloudflare → **Workers & Pages**.
**Po co:** po tym kroku `https://miliorbit.com` otwiera aplikację, a każda zmiana w `main` sama się publikuje.

**Zrób:**
1. **Workers & Pages** → **Create** → zakładka **Pages** → **Connect to Git** (albo *Import an existing Git repository*).
2. Połącz konto GitHub, wybierz repozytorium `marlow3189/WhatsThat`.
3. Ustawienia budowania:
   - *Production branch:* `main`
   - *Framework preset:* `Vite` (albo *None*)
   - *Build command:* `npm run build`
   - *Build output directory:* `dist`
   - *Environment variables:* dodaj `NODE_VERSION` = `22`
4. **Save and Deploy**. Po 1–2 minutach dostaniesz adres `…pages.dev`.
5. W projekcie → **Custom domains** → **Set up a custom domain** → `miliorbit.com`, potem drugi raz `www.miliorbit.com`.

**Sprawdź:**
- `https://miliorbit.com` otwiera aplikację, w przeglądarce jest kłódka.
- `https://miliorbit.com/pobierz` otwiera stronę pobierania (dla kodu QR).
- Na securityheaders.com wpisz adres: wynik **A** (nagłówki są w `public/_headers`).

**Agent:** „Każdy push na main ma przechodzić CI; jeśli nie przechodzi, napraw i zrób PR”.

---

## Etap 4. Ochrona przed atakami (20 minut)

**Gdzie jesteś:** Cloudflare → Twoja domena → **Security**.
**Po co:** blokuje boty, próby włamań i zalewanie strony ruchem.

**Zrób:**
1. **Security → Bots** → włącz **Bot Fight Mode**.
2. **Security → WAF** → włącz dostępne **zarządzane reguły** (managed rules).
3. **SSL/TLS** → tryb **Full (strict)**; **Edge Certificates** → włącz **Always Use HTTPS** i **HSTS**.
4. **Turnstile** (w menu Cloudflare) → **Add site** → `miliorbit.com` → zapisz **Site key** i **Secret key**
   (użyjesz ich w Supabase przy logowaniu numerem, żeby nikt nie wysyłał masowo SMS-ów na Twój koszt).
5. GitHub → repozytorium → **Settings → Code security** → włącz **Secret scanning** i **Push protection**.

**Sprawdź:** w Cloudflare **Security → Events** widać zablokowane zdarzenia (po kilku dniach).

---

## Etap 5. Pomiar marketingu i zgoda na cookies (1 wieczór, 0 zł)

**Gdzie jesteś:** Google Analytics, Meta Events Manager, TikTok Ads Manager, a na końcu Cloudflare Pages.
**Po co:** wiesz, która reklama i który film przynosi rejestracje. Aplikacja sama pokaże pasek zgody
(dwa równe przyciski) i bez zgody nic nie wyśle (`src/lib/analytics.ts`).

**Zrób:**
1. **Google Analytics:** *Administracja* → *Utwórz* → *Usługa* → nazwa „Miliorbit” → *Strumień danych* → *Witryna* →
   `https://miliorbit.com` → skopiuj **Identyfikator pomiaru** (`G-…`).
2. **Meta:** business.facebook.com → **Menedżer zdarzeń** → *Połącz źródła danych* → *Internet* → *Piksel Meta* →
   nazwa → skopiuj **Identyfikator piksela** (same cyfry). Potem *Ustawienia firmy* → *Bezpieczeństwo marki* →
   *Domeny* → dodaj `miliorbit.com` i zweryfikuj rekordem **TXT** (dodajesz go w Cloudflare → DNS → *Add record*).
3. **TikTok:** ads.tiktok.com → *Tools* → *Events* → *Web Events* → *Set up web events* → *Manual setup* → skopiuj **Pixel ID**.
4. **Cloudflare** → Workers & Pages → projekt → **Settings → Variables and Secrets** (zmienne środowiskowe) → dodaj:
   `VITE_GA4_ID`, `VITE_META_PIXEL_ID`, `VITE_TIKTOK_PIXEL_ID` (wzór w pliku `.env.example`) → **Save** →
   **Deployments → Retry deployment** (zmienne `VITE_…` działają dopiero po ponownym zbudowaniu).
5. W każdej kampanii używaj linków z UTM, np. `https://miliorbit.com/?utm_source=tiktok&utm_campaign=opal`.

**Sprawdź:** wejdź na stronę, kliknij „Zgadzam się”, załóż konto demo. GA4 → *Raporty* → *Czas rzeczywisty*;
Meta → *Testuj zdarzenia*; TikTok → *Test events*. Zdarzenia: `sign_up`, `listing_created`, `invite`, `purchase`, `subscribe`.

**Agent:** Routine co poniedziałek: „Podsumuj rejestracje według utm_source z ostatnich 7 dni”.

---

## Etap 6. Baza danych i logowanie numerem (2–3 wieczory, 25 USD/mies. przy starcie)

**Gdzie jesteś:** Supabase (supabase.com) → Twój projekt.
**Po co:** prawdziwe konta, ogłoszenia, czaty i zamówienia na serwerze w UE.

**Zrób:**
1. **New project** → nazwa `miliorbit` → mocne hasło do bazy (zapisz w menedżerze haseł) → region
   **Central EU (Frankfurt)**. Najpierw zrób drugi projekt `miliorbit-test` i na nim ćwicz.
2. **Database → Extensions** → włącz `postgis` i `pg_cron`.
3. **SQL Editor** → **New query** → wklej całą zawartość `supabase/migrations/0001_init.sql` → **Run**.
   Potem tak samo `0002_safety.sql` i `0003_local.sql`. Kolejność jest ważna.
4. **Authentication → Sign In / Providers → Phone** → włącz. Dostawca SMS: Twilio (wbudowany) albo SMSAPI przez
   **Auth Hooks → Send SMS hook**.
5. **Authentication → Attack Protection** (albo *Bot and Abuse Protection*) → **CAPTCHA** → **Cloudflare Turnstile** →
   wklej **Secret key** z etapu 4. Ustaw limit SMS na godzinę.
6. **Authentication → URL Configuration** → *Site URL:* `https://miliorbit.com`.
7. **Advisors → Security Advisor** → ma być zero ostrzeżeń (każda tabela ma RLS).
8. **Project Settings → API** → skopiuj **Project URL** i klucz **anon public**. W Cloudflare Pages dodaj zmienne
   `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`. Klucza **service_role** nigdy nie dawaj do aplikacji.

**Sprawdź:** w **Table Editor** widać tabele `profiles`, `listings`, `orders`, `disputes`, `fuel_prices`, `favorites`.
**Agent:** „Podłącz `src/data/store.tsx` do Supabase: logowanie numerem, ogłoszenia, czaty (realtime), zamówienia,
ulubieni, orbita (`orbit_people`). Tryb demo ma zostać w podglądzie”. To największe zadanie; agent zrobi je w kilku PR.

---

## Etap 7. Płatności i Bezpieczna płatność (1–2 tygodnie)

**Gdzie jesteś:** Stripe (dashboard.stripe.com), najpierw w **trybie testowym** (przełącznik *Test mode*).
**Po co:** BLIK, Przelewy24 i karty; pieniądze czekają do odbioru, a my ich nie trzymamy.

**Zrób:**
1. Załóż konto Stripe na spółkę. **Settings → Payment methods** → włącz **BLIK**, **Przelewy24**, **Karty**.
2. **Connect** → *Get started* → typ kont sprzedających **Express** (KYC robi Stripe).
3. Model płatności (do potwierdzenia z prawnikiem): **destination charge** z `on_behalf_of` (kwota trafia od razu
   na saldo sprzedającego w Stripe, 0 zł prowizji platformy) i **ręczne wypłaty** (*manual payouts*) na koncie
   sprzedającego: wypłatę na jego bank zlecamy po kodzie odbioru albo 48 h po wydaniu.
4. **Kaucja**: autoryzacja karty bez pobrania (*manual capture*). Blokada na karcie trwa zwykle do 7 dni; przy
   dłuższym wynajmie kaucję pobieramy i zwracamy po oddaniu. BLIK nie obsługuje blokad, więc kaucja tylko kartą.
5. **Developers → API keys** → klucz tajny (`sk_test_…`) dodaj jako sekret w Supabase (etap 8), nigdzie indziej.
6. **Developers → Webhooks** → adres funkcji `stripe-webhook` (agent ją napisze) → zdarzenia `payment_intent.succeeded`,
   `charge.refunded`, `account.updated`.
7. Plany (99 / 499 / 10 zł) to zwykłe płatności dla spółki: **Payment Links** albo **Checkout**.

**Sprawdź:** zakup testowy kartą `4242 4242 4242 4242` zmienia zamówienie na „Opłacone”.
**Agent:** „Napisz funkcje `create-payment`, `stripe-webhook`, `payouts`, `refunds` na kluczach testowych Stripe z testami”.

---

## Etap 8. Funkcje serwerowe: planer AI, ostrzeżenia, ceny paliw (1 wieczór)

**Gdzie jesteś:** terminal na komputerze (albo Claude Code) i Supabase.
**Po co:** funkcje, które muszą działać na serwerze, bo używają kluczy tajnych albo omijają ograniczenia przeglądarki.

**Zrób:**
1. Zainstaluj Node.js 22 (nodejs.org). W terminalu w folderze projektu:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ID projektu z adresu panelu Supabase>
   ```
2. **Planer AI:** console.anthropic.com → *API Keys* → *Create Key*; *Limits* → ustaw miesięczny limit wydatków. Potem:
   ```bash
   npx supabase secrets set ANTHROPIC_API_KEY=<klucz>
   npx supabase functions deploy plan
   ```
   Funkcja używa modelu `claude-opus-5-5`, odpowiada w ustalonym formacie JSON, a przy odmowie modelu przełącza się na
   model zapasowy (`fallbacks: "default"`, nagłówek beta `server-side-fallback-2026-07-01`).
3. **Ostrzeżenia** (IMGW, później Meteoalarm):
   ```bash
   npx supabase functions deploy warnings
   ```
4. **Ceny paliw od stacji:**
   ```bash
   npx supabase functions deploy fuel-prices --no-verify-jwt
   ```
   Stacja dostaje klucz (losowy, min. 32 znaki). W bazie zapisujesz tylko jego skrót SHA-256 w tabeli `station_api_keys`.
   Stacja wysyła ceny tak, jak w panelu stacji w aplikacji (`curl -X POST …/functions/v1/fuel-prices`).

**Sprawdź:** *Edge Functions* w Supabase pokazuje trzy funkcje ze statusem *Active*, a w *Logs* widać wywołania.

---

## Etap 9. Kod QR, strona pobierania i sklepy z aplikacjami

**Gdzie jesteś:** Google Play Console, App Store Connect, a potem plik `public/pobierz.js` (albo agent).
**Po co:** jeden kod QR prowadzi każdego do właściwego miejsca: Android → Google Play, iPhone → App Store,
komputer → oba linki i aplikacja w przeglądarce.

**Zrób:**
1. Dopóki aplikacji nie ma w sklepach, strona `/pobierz` sama podpowiada instalację ze strony (PWA). Kod QR jest
   w aplikacji: **Ja → Kod QR aplikacji** (prowadzi na `https://miliorbit.com/pobierz?ref=…`).
2. **Android:** Google Play Console (25 USD) → aplikacja z `npm run cap:android` (Capacitor) albo jako TWA.
3. **iPhone:** Apple Developer (99 USD/rok) → `npm run cap:ios` na Macu z Xcode → App Store Connect.
4. Po publikacji wpisz adresy sklepów w `public/pobierz.js` (`PLAY_URL`, `APP_STORE_URL`) i opublikuj.
   Od tej chwili ten sam kod QR otwiera sklep właściwy dla telefonu.

**Agent:** „Uzupełnij PLAY_URL i APP_STORE_URL w public/pobierz.js: …” albo „przygotuj wersję Android z Capacitora”.

---

## Etap 10. Codzienna obsługa z agentem (Claude Code)

**Gdzie jesteś:** claude.ai/code (albo aplikacja Claude) → repozytorium `marlow3189/WhatsThat`.
**Po co:** agent przejmuje pracę programistyczną i raporty, Ty decydujesz.

| Co | Jak zlecić | Jak często |
|---|---|---|
| Nowa funkcja albo poprawka | opisz po ludzku, co ma działać; agent robi gałąź, testy i PR | na bieżąco |
| Pilnowanie PR i CI | „obserwuj PR i naprawiaj CI” | przy każdym PR |
| Przegląd bezpieczeństwa | `/security-review` przed wdrożeniem | każde wdrożenie |
| Aktualizacje zależności | Routine: „sprawdź `npm audit` i nieaktualne paczki, przygotuj PR” | co tydzień |
| Raport biznesowy | Routine: „rejestracje, ogłoszenia, płatności, spory i źródła ruchu z 7 dni” | co poniedziałek |
| Kolejka DSA i spory | Routine: „lista zgłoszeń i sporów starszych niż 24 h z propozycją decyzji” | codziennie; **decyduje człowiek** |
| Ceny paliw | Routine: „sprawdź stacje bez aktualizacji od 48 h, przygotuj listę do kontaktu” | co tydzień |
| DAC7 | Routine 1 grudnia: „przygotuj raport DAC7 i listę brakujących danych” | raz w roku |

**Routine** to zadanie, które agent wykonuje sam o ustalonej porze. Poproś: „ustaw cotygodniowe zadanie w poniedziałek
o 8:00: …”. Do usług (Supabase, Stripe, Cloudflare) można podłączyć agenta przez connectory, ale z dostępem
**tylko do odczytu** albo do kont testowych.

Czego agent **nie** robi sam: decyzji w sporach i moderacji (DSA wymaga uzasadnienia przez człowieka), wypłat i zwrotów
na produkcji, zmian regulaminu bez prawnika, wysyłki reklam bez zgody użytkownika.

---

## Gdy coś nie działa

| Objaw | Najczęstsza przyczyna | Co zrobić |
|---|---|---|
| Strona nie otwiera się pod domeną | DNS jeszcze się nie przeniósł | sprawdź status domeny w Cloudflare (*Active*), poczekaj do 24 h |
| Build w Cloudflare jest czerwony | błąd w kodzie albo brak `NODE_VERSION=22` | otwórz log builda, wklej agentowi: „napraw build” |
| Piksele nic nie liczą | brak zgody albo zmienne bez ponownego wdrożenia | kliknij „Zgadzam się”, zrób *Retry deployment* |
| SMS nie przychodzi | brak środków u dostawcy SMS albo limit | Supabase → *Auth → Logs*; doładuj konto SMS |
| Funkcja serwerowa zwraca 401 | zły lub odwołany klucz | wygeneruj nowy klucz, zapisz skrót w bazie |
| Ktoś zgłasza oszustwo | — | zastrzeż konto w panelu operatora, wstrzymaj wypłaty w Stripe, sprawdź `audit_log` |

Przy incydencie bezpieczeństwa postępuj według `docs/BEZPIECZENSTWO.md`, punkt 5.
