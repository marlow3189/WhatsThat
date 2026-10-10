# Regioorbit: wdrożenie krok po kroku (dla początkujących)

Ta instrukcja prowadzi od zera do działającej aplikacji. Nie zakłada wiedzy programistycznej.

> **Na teraz (testy u siebie):** zacznij od [START.md](START.md) i [PLAN.md](PLAN.md). Ta instrukcja to droga do startu
> publicznego: domena, ochrona, płatności, sklepy.

**Jak to jest ułożone:** Regioorbit to przede wszystkim **aplikacja na telefon** (Android z Google Play, iPhone z App
Store). Domena **regioorbit.com** to strona, która prowadzi do instalacji: telefon z Androidem trafia do Google Play,
iPhone do App Store, komputer widzi kod QR. Ta sama aplikacja działa też w przeglądarce pod **regioorbit.com/app/**
(dla tych, którzy nie chcą instalować). Linki udostępniane z aplikacji (`regioorbit.com/l/…`, zaproszenia
`regioorbit.com/z/…`) otwierają się od razu w aplikacji, jeśli jest zainstalowana, a jeśli nie, pokazują sklep.

Każdy krok ma ten sam układ:

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
| **Gałąź (branch)** | Osobna „wersja robocza” kodu. Gałąź **domyślna** (default) to ta, którą GitHub pokazuje na start; zwykle nazywa się `main`. U Ciebie na razie jedyną i domyślną gałęzią jest `claude/p2p-rental-marketplace-bimvf6`. |
| **Commit** | Zapisana paczka zmian z opisem („co zmieniłem i po co”). |
| **Pull request (PR)** | Wniosek „włącz zmiany z gałęzi A do gałęzi B”. Ma opis, listę zmian, komentarze i przycisk **Merge**. PR to *propozycja zmian*. |
| **Build (budowanie)** | Zamiana kodu źródłowego na pliki, które rozumie przeglądarka. Robi to komenda `npm run build`. |
| **Hosting** | Serwer, który pokazuje stronę ludziom. U nas **Cloudflare Pages** (darmowy). |
| **Domena** | Adres strony: `regioorbit.com`. Kupiona u **rejestratora**, u Ciebie w **Hostingerze**. Rejestrator pobiera opłatę roczną; to, kto obsługuje DNS, można ustawić gdzie indziej. |
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
| **CI** | Automat, który przy każdej zmianie sprawdza kod: typy, testy, budowanie, audyt bezpieczeństwa. U nas GitHub Actions (`.github/workflows/ci.yml`). Zielony ✓ przy commicie = sprawdzenie przeszło, czerwony ✗ = coś jest zepsute. CI to *kontrola*, a nie PR: PR tylko pokazuje wynik CI. |
| **PWA** | Strona, którą można dodać do ekranu telefonu jak aplikację. U nas to dodatek do aplikacji ze sklepu (`/app/`). |
| **Capacitor** | Narzędzie, które z naszego kodu robi aplikację na Androida i iPhone'a (`npm run cap:android`, `cap:ios`). |
| **App Links / Universal Links** | Link `https://regioorbit.com/l/…` otwiera się od razu w zainstalowanej aplikacji. Telefon sprawdza to w plikach `/.well-known/assetlinks.json` (Android) i `/.well-known/apple-app-site-association` (iPhone). |
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

Na każdym koncie włącz **logowanie dwuetapowe (2FA)**. Używaj jednego firmowego e-maila, np. `hello@regioorbit.com`.

---

## Etap 0. Firma i formalności (równolegle z resztą, 1–2 tygodnie)

**Gdzie jesteś:** S24 (ekrs.ms.gov.pl), bank, biuro rachunkowe, kancelaria.
**Po co:** spółka z o.o. odpowiada swoim majątkiem, nie Twoim prywatnym.

**Zrób:**
1. Załóż **spółkę z o.o.** przez S24 (ok. 350 zł + kapitał zakładowy min. 5 000 zł). Otwórz konto firmowe.
2. Umów **biuro rachunkowe** (ok. 400 zł/mies.). Powiedz im: platforma internetowa, abonamenty, reklamy, raporty DAC7.
3. Umów **prawnika**: regulamin (`docs/legal/`), polityka prywatności, zgody marketingowe, model „Bezpiecznej płatności”
   (czy wystarczy licencja operatora płatności), reklamy (DSA art. 26).
4. **Znak towarowy** REGIOORBIT w EUIPO (euipo.europa.eu): klasy 9, 35, 38, 42. Koszt: 850 € + 50 € + 150 € za każdą kolejną.
5. Dokup domeny `regioorbit.app`, `regioorbit.pl`, `regioorbit.eu` (ochrona marki).

**Agent:** „Przygotuj listę pytań do prawnika na podstawie docs/legal, docs/BIZNES.md i docs/BEZPIECZENSTWO.md”.

---

## Etap 1. Gałąź produkcyjna, PR i CI (10 minut)

**Gdzie jesteś:** GitHub → repozytorium `marlow3189/WhatsThat`.
**Po co:** hosting (Cloudflare) musi wiedzieć, z której gałęzi budować stronę, którą widzą ludzie.

**Stan teraz (z Twojego zrzutu):** jest jedna gałąź `claude/p2p-rental-marketplace-bimvf6`, oznaczona jako
*default*, i zielony ✓ przy ostatnim commicie. Gałęzi `main` nie ma, więc wcześniejsze polecenie „zrób PR do main”
nie miało do czego się odnieść. Masz dwie drogi:

| Droga | Na czym polega | Kiedy |
|---|---|---|
| **A. Bez `main`** | W Cloudflare (etap 3) jako *Production branch* wpisujesz `claude/p2p-rental-marketplace-bimvf6`. Każda zmiana agenta od razu trafia na stronę. | Teraz, przed startem, gdy nikt jeszcze z aplikacji nie korzysta. |
| **B. Z `main` (zalecana na start publiczny)** | `main` = wersja dla ludzi, gałęzie agenta = praca w toku. Zmiana trafia na stronę dopiero, gdy klikniesz **Merge** w PR. | Najpóźniej przed pierwszymi użytkownikami. |

**Zrób (droga B, 2 minuty):**
1. GitHub → repozytorium → **Branches** (link nad listą plików, obok nazwy gałęzi) → **New branch**.
2. *Branch name:* `main`, *Source:* `claude/p2p-rental-marketplace-bimvf6` → **Create branch**.
3. **Settings** → **General** → *Default branch* → ikona strzałek → wybierz `main` → **Update** → potwierdź.
4. (Opcjonalnie) **Settings → Branches → Add branch ruleset**: dla `main` zaznacz *Require a pull request before merging*
   i *Require status checks to pass* → wybierz `check` (to nasze CI). Wtedy nic niesprawdzonego nie trafi do ludzi.

**Jak potem wygląda praca:** agent pracuje na swojej gałęzi → robi **PR** do `main` → GitHub uruchamia **CI** →
przy zielonym ✓ Ty klikasz **Merge pull request** → Cloudflare sam publikuje nową wersję.

**Sprawdź:** w zakładce *Code* przełącznik gałęzi pokazuje `main` jako *default*, a przy ostatnim commicie jest zielony ✓.

**Co już masz podłączone, a czego jeszcze nie:**

| Element | Stan |
|---|---|
| GitHub (repozytorium, historia zmian) | ✅ |
| Claude Code (agent zapisuje zmiany na gałęzi) | ✅ |
| CI (automatyczne testy przy każdej zmianie, zielony ✓) | ✅ |
| Domena regioorbit.com (kupiona w Hostingerze) | ✅ kupiona, ☐ DNS do ustawienia (etap 2) |
| Cloudflare (hosting strony, ochrona) | ☐ etapy 2–4 |
| Supabase (baza, logowanie SMS), Stripe (płatności) | ☐ etapy 6–7 |
| Sklepy Google Play i App Store | ☐ etap 9 |
| Piksele reklamowe (GA4, Meta, TikTok) | ☐ etap 5 |

**Agent:** „Utwórz PR z mojej gałęzi do main i obserwuj CI” (po utworzeniu `main`; agent zrobi PR, Ty klikasz Merge).

**Język Claude Code raz po polsku, raz po niemiecku:** to język interfejsu, nie projektu. Zależy od ustawień konta
claude.ai i języka przeglądarki; czasem miesza go też automatyczne tłumaczenie Chrome (ikona tłumacza w pasku adresu,
wyłącz „Zawsze tłumacz”). Na kod i wdrożenie nie ma to wpływu.

---

## Etap 2. Domena z Hostingera i Cloudflare (30 minut + do 24 h czekania)

**Gdzie jesteś:** **Cloudflare** (dash.cloudflare.com) i **Hostinger hPanel** (hpanel.hostinger.com).
**Po co:** domena ma prowadzić na stronę z linkami do aplikacji i na `/app/`, szybko i bezpiecznie.

**Dlaczego Cloudflare:** jeden darmowy dostawca daje hosting strony (Pages), sieć serwerów blisko ludzi (w Polsce
m.in. Warszawa, więc strona ładuje się szybko), automatyczny HTTPS, ochronę przed atakami DDoS i botami (WAF,
Bot Fight Mode, Turnstile przy SMS), szybki DNS z DNSSEC i nagłówki bezpieczeństwa z pliku `site/_headers`.
Hosting współdzielony w Hostingerze jest wolniejszy, nie buduje sam aplikacji z GitHuba i nie ma tej ochrony.

**Czy mogę zostawić domenę w Hostingerze?** Tak. **Nie przenosisz domeny**, zmieniasz tylko to, kto obsługuje jej DNS
(serwery nazw). Domena nadal jest Twoja i odnawiasz ją w Hostingerze. Przeniesienie samej rejestracji do Cloudflare
Registrar (odnowienie po kosztach, bez marży) jest możliwe, ale nieobowiązkowe i dopiero po 60 dniach od zakupu
(blokada ICANN dla nowych domen).

### Wariant A (zalecany): serwery nazw Cloudflare, domena zostaje w Hostingerze

1. **Cloudflare** → **Add a domain** → `regioorbit.com` → plan **Free** → Cloudflare przejrzy obecne rekordy DNS.
2. Sprawdź listę rekordów. Jeśli masz pocztę w Hostingerze (np. `hello@regioorbit.com`), muszą być rekordy **MX**,
   **TXT** z `v=spf1…` i rekordy DKIM. Brakujące dopisz (skopiuj z hPanel → *Domeny* → *DNS / Serwery nazw* →
   *Rekordy DNS*). Bez nich poczta przestanie działać.
3. Cloudflare pokaże dwa **serwery nazw** (np. `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`). Skopiuj je.
4. **Hostinger hPanel** → **Domeny** → **Portfolio domen** → przy `regioorbit.com` **Zarządzaj** → przy *DNS / Serwery nazw*
   **Edytuj** → **Zmień serwery nazw** → wklej oba adresy z Cloudflare (pozostałe pola puste) → **Zapisz**.
   Jeśli w Hostingerze był włączony **DNSSEC**, najpierw go wyłącz.
5. Cloudflare → **Check nameservers**. Zmiana trwa od kilku minut do 24 h; dostaniesz e-mail, gdy domena będzie *Active*.
6. Po aktywacji: Cloudflare → **DNS → Settings → DNSSEC → Enable** → skopiuj dane rekordu **DS** → hPanel → *DNS* →
   *DNSSEC* → dodaj. (Chroni przed podszyciem się pod Twoją domenę.)

### Wariant B: DNS zostaje w Hostingerze

1. Strona działa tylko pod **`www.regioorbit.com`** (Cloudflare Pages podłącza domenę główną bez `www` wyłącznie wtedy,
   gdy DNS jest w Cloudflare).
2. hPanel → *DNS* → dodaj rekord **CNAME**: nazwa `www`, cel `<twój-projekt>.pages.dev` (adres z etapu 3).
3. hPanel → *Domeny* → **Przekierowania** → `regioorbit.com` → **301** na `https://www.regioorbit.com`.
4. W kodzie zmień domenę na `www.regioorbit.com` (`src/config.ts`, `site/`; poproś agenta), bo linki do aplikacji
   muszą prowadzić dokładnie na adres z plikami `/.well-known`.

### Który lepszy i szybszy?

| | A: serwery nazw Cloudflare | B: DNS w Hostingerze |
|---|---|---|
| Szybkość strony | taka sama sieć Cloudflare | to samo, ale `regioorbit.com` robi dodatkowe przekierowanie |
| Ochrona przed atakami (WAF, boty, Turnstile) | ✅ pełna | ❌ tylko podstawowa |
| Adres bez `www` i linki do aplikacji | ✅ | ⚠️ tylko `www` |
| DNSSEC, szybkie odpowiedzi DNS | ✅ | zależnie od Hostingera |
| Gdzie płacisz za domenę | Hostinger | Hostinger |

**Wybierz A.** Jest tak samo szybkie, a bezpieczniejsze dla Ciebie i użytkowników.

**Sprawdź:** w Cloudflare przy domenie status **Active**; poczta na domenie dalej przychodzi (wyślij testowy e-mail).

---

## Etap 3. Strona i aplikacja w internecie (30 minut, 0 zł)

**Gdzie jesteś:** Cloudflare → **Workers & Pages**.
**Po co:** po tym kroku `https://regioorbit.com` pokazuje stronę z linkami do sklepów, `https://regioorbit.com/app/`
otwiera aplikację w przeglądarce, a każda zmiana w gałęzi produkcyjnej sama się publikuje.

**Zrób:**
1. **Workers & Pages** → **Create** → zakładka **Pages** → **Connect to Git** (albo *Import an existing Git repository*).
2. Połącz konto GitHub, wybierz repozytorium `marlow3189/WhatsThat`.
3. Ustawienia budowania:
   - *Production branch:* `main` (albo `claude/p2p-rental-marketplace-bimvf6`, jeśli wybrałeś drogę A z etapu 1)
   - *Framework preset:* `Vite` (albo *None*)
   - *Build command:* `npm run build`
   - *Build output directory:* `dist` (w środku: strona główna, `app/` z aplikacją i `.well-known/`)
   - *Environment variables:* dodaj `NODE_VERSION` = `22`
4. **Save and Deploy**. Po 1–2 minutach dostaniesz adres `…pages.dev`.
5. W projekcie → **Custom domains** → **Set up a custom domain** → `regioorbit.com`, potem drugi raz `www.regioorbit.com`
   (w wariancie B z etapu 2 tylko `www.regioorbit.com`).

**Sprawdź:**
- `https://regioorbit.com`: strona „Wszystko obok. Najpierw znajomi.” z przyciskami Google Play i App Store, kłódka w pasku.
- `https://regioorbit.com/app/`: aplikacja w przeglądarce.
- `https://regioorbit.com/pobierz`: na telefonie z Androidem od razu otwiera Google Play (cel kodów QR).
- `https://regioorbit.com/l/test`: strona „Otwórz w Regioorbit” (tak wygląda link do ogłoszenia bez aplikacji).
- `https://regioorbit.com/.well-known/apple-app-site-association`: pokazuje JSON (bez przekierowania).
- Na securityheaders.com wpisz adres: wynik **A** (nagłówki są w `site/_headers`).

**Agent:** „Każdy push na main ma przechodzić CI; jeśli nie przechodzi, napraw i zrób PR”.

---

## Etap 4. Ochrona przed atakami (20 minut)

**Gdzie jesteś:** Cloudflare → Twoja domena → **Security**.
**Po co:** blokuje boty, próby włamań i zalewanie strony ruchem.

**Zrób:**
1. **Security → Bots** → włącz **Bot Fight Mode**.
2. **Security → WAF** → włącz dostępne **zarządzane reguły** (managed rules).
3. **SSL/TLS** → tryb **Full (strict)**; **Edge Certificates** → włącz **Always Use HTTPS** i **HSTS**.
4. **Turnstile** (w menu Cloudflare) → **Add site** → `regioorbit.com` → zapisz **Site key** i **Secret key**
   (użyjesz ich w Supabase przy logowaniu numerem, żeby nikt nie wysyłał masowo SMS-ów na Twój koszt).
5. GitHub → repozytorium → **Settings → Code security** → włącz **Secret scanning** i **Push protection**.

**Sprawdź:** w Cloudflare **Security → Events** widać zablokowane zdarzenia (po kilku dniach).

---

## Etap 5. Pomiar marketingu i zgoda na cookies (1 wieczór, 0 zł)

**Gdzie jesteś:** Google Analytics, Meta Events Manager, TikTok Ads Manager, a na końcu Cloudflare Pages.
**Po co:** wiesz, która reklama i który film przynosi rejestracje. Aplikacja sama pokaże pasek zgody
(dwa równe przyciski) i bez zgody nic nie wyśle (`src/lib/analytics.ts`).

**Zrób:**
1. **Google Analytics:** *Administracja* → *Utwórz* → *Usługa* → nazwa „Regioorbit” → *Strumień danych* → *Witryna* →
   `https://regioorbit.com` → skopiuj **Identyfikator pomiaru** (`G-…`).
2. **Meta:** business.facebook.com → **Menedżer zdarzeń** → *Połącz źródła danych* → *Internet* → *Piksel Meta* →
   nazwa → skopiuj **Identyfikator piksela** (same cyfry). Potem *Ustawienia firmy* → *Bezpieczeństwo marki* →
   *Domeny* → dodaj `regioorbit.com` i zweryfikuj rekordem **TXT** (dodajesz go w Cloudflare → DNS → *Add record*).
3. **TikTok:** ads.tiktok.com → *Tools* → *Events* → *Web Events* → *Set up web events* → *Manual setup* → skopiuj **Pixel ID**.
4. **Cloudflare** → Workers & Pages → projekt → **Settings → Variables and Secrets** (zmienne środowiskowe) → dodaj:
   `VITE_GA4_ID`, `VITE_META_PIXEL_ID`, `VITE_TIKTOK_PIXEL_ID` (wzór w pliku `.env.example`) → **Save** →
   **Deployments → Retry deployment** (zmienne `VITE_…` działają dopiero po ponownym zbudowaniu).
5. W każdej kampanii używaj linków z UTM, np. `https://regioorbit.com/?utm_source=tiktok&utm_campaign=opal`.
   Strona główna przekazuje źródło do Google Play (*Install Referrer*), więc wiesz, z której reklamy jest instalacja.
   Zdarzenia z aplikacji ze sklepu mierzysz w Firebase / Google Analytics for Firebase (agent podłączy przy etapie 9).

**Sprawdź:** wejdź na stronę, kliknij „Zgadzam się”, załóż konto demo. GA4 → *Raporty* → *Czas rzeczywisty*;
Meta → *Testuj zdarzenia*; TikTok → *Test events*. Zdarzenia: `sign_up`, `listing_created`, `invite`, `purchase`, `subscribe`.

**Agent:** Routine co poniedziałek: „Podsumuj rejestracje według utm_source z ostatnich 7 dni”.

---

## Etap 6. Baza danych i logowanie numerem (2–3 wieczory, 25 USD/mies. przy starcie)

**Gdzie jesteś:** Supabase (supabase.com) → Twój projekt.
**Po co:** prawdziwe konta, ogłoszenia, czaty i zamówienia na serwerze w UE.

**Zrób:**
1. **New project** → nazwa `regioorbit` → mocne hasło do bazy (zapisz w menedżerze haseł) → region
   **Central EU (Frankfurt)**. Najpierw zrób drugi projekt `regioorbit-test` i na nim ćwicz.
2. **Database → Extensions** → włącz `postgis` i `pg_cron`.
3. **SQL Editor** → **New query** → wklej całą zawartość `supabase/migrations/0001_init.sql` → **Run**.
   Potem tak samo `0002_safety.sql`, `0003_local.sql` i `0004_identity_sos.sql`. Kolejność jest ważna.
   Przed `0004` utwórz sekret do anonimowych kluczy (SQL Editor, losowe 64 znaki, np. z menedżera haseł):
   `select vault.create_secret('<losowe 64 znaki>', 'anon_key_secret');`. Nigdy go nie zmieniaj (zmieniłyby się klucze).
4. **Authentication → Sign In / Providers → Phone** → włącz. Dostawca SMS: Twilio (wbudowany) albo SMSAPI przez
   **Auth Hooks → Send SMS hook**.
5. **Authentication → Attack Protection** (albo *Bot and Abuse Protection*) → **CAPTCHA** → **Cloudflare Turnstile** →
   wklej **Secret key** z etapu 4. Ustaw limit SMS na godzinę.
6. **Authentication → URL Configuration** → *Site URL:* `https://regioorbit.com/app/`; w *Redirect URLs* dodaj też
   `https://regioorbit.com/**` i `capacitor://localhost` (aplikacja na iPhonie) oraz `https://localhost` (Android).
7. **Advisors → Security Advisor** → ma być zero ostrzeżeń (każda tabela ma RLS).
8. **Project Settings → API** → skopiuj **Project URL** i klucz **anon public**. W Cloudflare Pages dodaj zmienne
   `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`. Klucza **service_role** nigdy nie dawaj do aplikacji.

**Sprawdź:** w **Table Editor** widać tabele `profiles`, `listings`, `orders`, `disputes`, `fuel_prices`, `favorites`,
`sos_alerts`, `answers`. W **SQL Editor** test blokady płci: zmiana płci przez użytkownika kończy się błędem
„Płeć można zmienić tylko przez pomoc”.
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

## Etap 9. Aplikacje w Google Play i App Store, kod QR i linki do aplikacji

**Gdzie jesteś:** Google Play Console, App Store Connect, komputer z Android Studio (Android) i Mac z Xcode (iPhone).
**Po co:** aplikacja na telefon to główny produkt; domena prowadzi do sklepów, a linki otwierają się w aplikacji.

**Zrób:**
1. **Konto Google Play** (25 USD) załóż jako **organizacja** (spółka; potrzebny numer D-U-N-S, darmowy). Konto
   prywatne musi przed publikacją przejść test zamknięty z co najmniej 12 testerami przez 14 dni.
2. **Konto Apple Developer** (99 USD/rok), też jako organizacja (D-U-N-S).
3. Aplikacje z naszego kodu (Capacitor), w terminalu w folderze projektu:
   ```bash
   npm run build
   npx cap add android      # raz; tworzy folder android/
   npx cap add ios          # raz, na Macu; tworzy folder ios/
   npm run cap:android      # otwiera Android Studio → Build → Generate Signed App Bundle
   npm run cap:ios          # otwiera Xcode → Product → Archive → wyślij do App Store Connect
   ```
4. **Uprawnienia i opisy** (agent dopisze je do projektów `android/` i `ios/`):
   - Kontakty: wtyczka `@capacitor-community/contacts`; na iPhonie `NSContactsUsageDescription` = tekst z okna zgody
     („Sprawdzamy, kto z Twoich kontaktów jest w Regioorbit. Numery zamieniamy w telefonie na skróty i nie zapisujemy
     książki adresowej.”), na Androidzie `READ_CONTACTS`.
   - Położenie (SOS, okolica): `NSLocationWhenInUseUsageDescription`, `ACCESS_FINE_LOCATION`.
   - Powiadomienia push: `@capacitor/push-notifications` (Firebase dla Androida, klucz APNs dla iPhone'a).
5. **Linki do aplikacji** (otwieranie `regioorbit.com/l/…` w aplikacji):
   - Android: Play Console → *Integralność aplikacji* → *Podpisywanie aplikacji* → skopiuj **SHA-256** certyfikatu
     → wpisz do `site/.well-known/assetlinks.json`. W `android/app/src/main/AndroidManifest.xml` dodaj `intent-filter`
     z `android:autoVerify="true"` dla `https://regioorbit.com` i ścieżek `/l/`, `/u/`, `/z/`, `/sos`, `/zastrzez`.
   - iPhone: w `site/.well-known/apple-app-site-association` zamień `TEAMID` na swój *Team ID* (Apple Developer →
     *Membership*). W Xcode → *Signing & Capabilities* → **Associated Domains** → `applinks:regioorbit.com`.
   - Aplikacja odbiera link sama (`src/App.tsx`, `useDeepLinks`) i otwiera właściwy ekran.
6. **Sklepy wymagają:** adresu polityki prywatności `https://regioorbit.com/prywatnosc` (wersja robocza w `site/prywatnosc.html`,
   uzupełnij dane firmy i daj prawnikowi), adresu do usuwania konta `https://regioorbit.com/prywatnosc#usun-konto`
   (Google Play), formularza **Data safety** (Google) i **App Privacy** (Apple): telefon, imię, przybliżone i dokładne
   położenie (SOS), kontakty (tylko do dopasowania, nie zapisywane), wiadomości, zakupy.
7. **Po publikacji** wpisz adresy sklepów w **`site/stores.json`** (jedno miejsce dla strony, kodu QR i aplikacji):
   `"android"` jest już wpisany (adres znany z nazwy pakietu `com.regioorbit.app`), `"ios"` uzupełnij adresem
   `https://apps.apple.com/app/id…` z App Store Connect. Od tej chwili przyciski i kod QR prowadzą do obu sklepów,
   a Safari na iPhonie pokazuje systemowy pasek „Otwórz w App Store”.

**Sprawdź:** na telefonie z zainstalowaną aplikacją link `https://regioorbit.com/l/…` z SMS-a otwiera aplikację, nie
przeglądarkę. Kod QR z **Ja → Kod QR aplikacji** na Androidzie otwiera Google Play.
**Agent:** „Dodaj projekty Capacitor dla Androida i iOS z uprawnieniami, App Links i Universal Links według etapu 9”.

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
| Po zmianie serwerów nazw nie działa poczta | brak rekordów MX/SPF/DKIM w Cloudflare | przepisz je z Hostingera (etap 2, krok 2) |
| Link `regioorbit.com/l/…` otwiera przeglądarkę zamiast aplikacji | zły SHA-256 / Team ID w `site/.well-known` albo brak `autoVerify` | sprawdź pliki z etapu 9, zainstaluj aplikację ponownie |
| Build w Cloudflare jest czerwony | błąd w kodzie albo brak `NODE_VERSION=22` | otwórz log builda, wklej agentowi: „napraw build” |
| Piksele nic nie liczą | brak zgody albo zmienne bez ponownego wdrożenia | kliknij „Zgadzam się”, zrób *Retry deployment* |
| SMS nie przychodzi | brak środków u dostawcy SMS albo limit | Supabase → *Auth → Logs*; doładuj konto SMS |
| Funkcja serwerowa zwraca 401 | zły lub odwołany klucz | wygeneruj nowy klucz, zapisz skrót w bazie |
| Ktoś zgłasza oszustwo | — | zastrzeż konto w panelu operatora, wstrzymaj wypłaty w Stripe, sprawdź `audit_log` |

Przy incydencie bezpieczeństwa postępuj według `docs/BEZPIECZENSTWO.md`, punkt 5.
