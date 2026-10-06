# Orbifolk: jak to postawić krok po kroku (i jak obsługiwać agentem)

Instrukcja jest podzielona na **etapy**. Każdy etap kończy się czymś, co działa i co możesz pokazać ludziom.
Nie przechodź dalej, dopóki poprzedni etap nie działa. Przy każdym etapie jest: **cel**, **co kliknąć**, **ile to kosztuje**,
**co możesz zlecić agentowi** (Claude Code) i **jak sprawdzić, że działa**.

> Zasada: konta, hasła, płatności i podpisy robisz **Ty**. Agent pisze kod, konfigurację, testy, instrukcje i raporty.
> Klucze tajne (Stripe, Supabase service_role, Anthropic) nigdy nie trafiają do repozytorium ani do czatu.

Szacunkowo: etapy 1–3 to jeden weekend, etapy 4–6 to 2–4 tygodnie, etap 7 równolegle.

---

## Etap 0. Firma i konta (1–2 tygodnie, równolegle z resztą)

1. **Spółka z o.o.** (S24, ok. 350 zł + kapitał 5 000 zł): odpowiedzialność ograniczona do majątku spółki. Konto firmowe.
2. **Księgowość** (biuro rachunkowe, ok. 400 zł/mies.). Powiedz im: platforma, plany abonamentowe, reklamy, DAC7.
3. **Prawnik** (jednorazowo kilka tys. zł): regulamin (`docs/legal/`), polityka prywatności, umowa z operatorem płatności,
   ocena „Bezpiecznej płatności” pod kątem usług płatniczych (PSD2/KNF), zgody marketingowe.
4. **Znak towarowy** ORBIFOLK w EUIPO (850 € + 50 € + 150 €/klasę; klasy 9, 35, 38, 42).
5. **Domena** `orbifolk.com` przenieś do Cloudflare (DNS za darmo). Dokup `orbifolk.app`, `.pl`, `.eu`.
6. **Skrzynka** `hello@orbifolk.com` (Google Workspace albo Zoho), włącz 2FA wszędzie.

Agent: „Przygotuj listę pytań do prawnika na podstawie docs/legal i docs/BIZNES.md”.

---

## Etap 1. Strona i aplikacja w internecie (1 wieczór, 0 zł)

**Cel:** `https://orbifolk.com` otwiera prototyp, da się go zainstalować na telefonie.

1. Załóż konto **Cloudflare** → *Workers & Pages* → *Create* → *Pages* → *Connect to Git* → wybierz repozytorium
   `marlow3189/WhatsThat`.
2. Ustawienia budowania: *Framework preset* `Vite`, *Build command* `npm run build`, *Build output* `dist`, Node 22.
3. *Custom domains* → dodaj `orbifolk.com` i `www.orbifolk.com`.
4. Nagłówki bezpieczeństwa są w `public/_headers` (CSP, HSTS itd.), Cloudflare wczyta je sam.
5. *Security* → *WAF* → włącz zarządzane reguły (darmowy plan ma podstawowe), *Bot Fight Mode* włączony.

Sprawdź: telefon → `orbifolk.com` → „Dodaj do ekranu początkowego”. Na https://securityheaders.com wynik A.

Agent: „Każdy push na main ma przechodzić CI (`.github/workflows/ci.yml`); jeśli nie przechodzi, napraw”.

---

## Etap 2. Pomiar i zgody (1 wieczór, 0 zł)

**Cel:** wiesz, skąd przychodzą ludzie i które kampanie dają rejestracje.

1. **Google Analytics 4**: analytics.google.com → *Utwórz usługę* → strumień *Sieć* → skopiuj identyfikator `G-…`.
2. **Meta Pixel**: business.facebook.com → *Menedżer zdarzeń* → *Połącz źródło danych* → *Internet* → identyfikator piksela.
   W *Ustawieniach firmy* → *Domeny* zweryfikuj `orbifolk.com` (rekord TXT w Cloudflare).
3. **TikTok Pixel**: ads.tiktok.com → *Assets* → *Events* → *Web Events* → identyfikator.
4. W Cloudflare Pages → *Settings* → *Environment variables* dodaj `VITE_GA4_ID`, `VITE_META_PIXEL_ID`,
   `VITE_TIKTOK_PIXEL_ID` (wzór w `.env.example`) i zrób ponowne wdrożenie.
5. Aplikacja sama pokaże pasek zgody (dwa równe przyciski). Bez zgody nic się nie ładuje (`src/lib/analytics.ts`).
6. Linki w kampaniach zawsze z `utm_source`, `utm_campaign` (np. `orbifolk.com/?utm_source=tiktok&utm_campaign=piasek`).
   Aplikacja zapamiętuje pierwsze źródło i dołącza je do zdarzenia rejestracji.

Zdarzenia, które już wysyłamy: `sign_up`, `listing_created`, `invite`, `purchase`, `subscribe`
(w Meta: CompleteRegistration, Lead, Contact, Purchase, Subscribe).

Sprawdź: GA4 → *Raporty* → *Czas rzeczywisty*; Meta → *Testuj zdarzenia*; TikTok → *Test events*.

Agent: „Dodaj zdarzenie X do pomiaru” albo co tydzień (Routine) „Zrób raport: rejestracje wg utm_source”.

---

## Etap 3. Baza, logowanie numerem i SMS (2–3 wieczory, 25 USD/mies.)

**Cel:** prawdziwe konta, ogłoszenia i czaty na serwerze w UE.

1. **Supabase** → *New project* → region **Frankfurt (eu-central-1)** → plan Pro (25 USD) przy starcie publicznym.
2. *SQL Editor* → uruchom po kolei `supabase/migrations/0001_init.sql` i `0002_safety.sql`
   (najpierw na projekcie testowym!). Włącz rozszerzenia: `postgis`, `pg_cron`.
3. *Authentication* → *Providers* → **Phone** włączony. SMS: Twilio albo polskie SMSAPI przez *Send SMS Hook*.
4. *Authentication* → *Attack Protection* → **CAPTCHA: Cloudflare Turnstile** (chroni przed „pompowaniem” SMS-ów).
   Ustaw limit SMS na godzinę.
5. *Authentication* → *URL Configuration* → `https://orbifolk.com`.
6. *Advisors* → *Security Advisor* → zero ostrzeżeń (każda tabela ma RLS).
7. Do Cloudflare Pages dodaj `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`. Klucz `service_role` tylko w sekretach funkcji.

Agent: „Podłącz `src/data/store.tsx` do Supabase: logowanie numerem, ogłoszenia, czaty (realtime), zamówienia.
Dane demo zostaw w trybie podglądu”. To największe zadanie programistyczne; agent zrobi je w kilku PR-ach.

---

## Etap 4. Płatności i Bezpieczna płatność (1–2 tygodnie, prowizje operatora)

**Cel:** BLIK, szybki przelew i karta; pieniądze czekają do odbioru, a my ich nie trzymamy.

Rekomendacja: **Stripe Connect** (BLIK, Przelewy24, karty; konta Express dla sprzedających, KYC robi Stripe).

- Sprzedający zakłada konto Express (ekran „Odbieranie płatności”).
- Płatność jako **destination charge** z `on_behalf_of` (kwota od razu przekazana na saldo sprzedającego w Stripe,
  0 zł prowizji platformy) i **ręczne wypłaty** na koncie sprzedającego (manual payouts): pieniądze leżą na jego saldzie
  w Stripe, nie na naszym. Wypłatę na jego bank zlecamy po kodzie odbioru
  albo 48 h po wydaniu (Edge Function `payouts` + `pg_cron` z `0002_safety.sql`). Zwrot przy sporze: refund z jego salda.
- **Kaucja**: autoryzacja karty bez pobrania (manual capture). Uwaga: karta trzyma blokadę do 7 dni; przy dłuższym
  wynajmie pobieramy kaucję i zwracamy po oddaniu. BLIK nie obsługuje blokad, więc kaucja tylko kartą.
- Plany (99/499/10 zł) to zwykłe płatności dla naszej spółki (Stripe Checkout / Payment Links).
- Alternatywa krajowa: PayU Marketplace albo Przelewy24 Marketplace (zapytaj o escrow/split payment).

Prawnik musi potwierdzić model (kto jest dostawcą usługi płatniczej, regulamin Stripe dla platform).

Agent: „Napisz Edge Functions: `create-payment`, `stripe-webhook` (zmienia `orders.status = 'paid'`), `payouts`, `refunds`.
Testy na kluczach testowych Stripe”.

---

## Etap 5. Planer AI (1 wieczór, kilka groszy za plan)

1. console.anthropic.com → klucz API → *Limits* ustaw miesięczny limit wydatków.
2. `supabase secrets set ANTHROPIC_API_KEY=…` i `supabase functions deploy plan`.
3. Funkcja używa modelu `claude-opus-5-5`, odpowiedzi w schemacie JSON i automatycznego modelu zapasowego
   (`fallbacks: "default"`, nagłówek beta `server-side-fallback-2026-07-01`). Model widzi tylko tekst celu.
4. Dodaj limit: darmowe konto 10 planów miesięcznie (`hit_limit` z `0002_safety.sql`).

---

## Etap 6. Aplikacje w sklepach (gdy będzie ruch)

- Android: Google Play (25 USD jednorazowo) jako TWA albo Capacitor (`npm run cap:android`).
- iOS: Apple Developer (99 USD/rok), `npm run cap:ios` na Macu. Plany kupowane na stronie (bez 30% dla Apple).
- Rozszerzenie: Chrome Web Store (5 USD) i Edge (`npm run build:extension`), Safari na Macu.

---

## Etap 7. Marketing i reklamy w aplikacji

1. Filmy z `docs/MARKETING.md` (Higgsfield), zawsze z linkiem UTM.
2. **Polecenia**: 100 wysłanych zaproszeń = miesiąc planu Rocznego (już w aplikacji). Pilnuj nadużyć w tabeli `invites`.
3. **Reklamy lokalne** (tylko plan darmowy, jedna chmurka na głównej, z „Dlaczego to widzę?”): sprzedajesz firmom
   z okolicy pakiety, np. 49 zł/tydzień w jednym mieście. Tabela `ads` w `0002_safety.sql`.
   Opcjonalnie Google AdSense na stronie WWW, gdy lokalnych reklam brakuje (wymaga zgody na cookies).
4. **SEO**: publiczne strony ogłoszeń i miast („Pożycz przyczepkę w Katowicach”) renderowane po stronie serwera
   (Cloudflare Pages Functions) + `sitemap.xml`. Aplikacja SPA sama w sobie nie jest dobrze indeksowana.

---

## Obsługa agentem na co dzień (Claude Code)

Agent pracuje w tym repozytorium (claude.ai/code albo terminal). Dobre nawyki:

| Co | Jak zlecić | Jak często |
|---|---|---|
| Nowa funkcja albo poprawka | opisz po ludzku, co ma działać; agent robi gałąź, testy i PR | na bieżąco |
| Pilnowanie PR i CI | „obserwuj PR i naprawiaj CI” | przy każdym PR |
| Przegląd bezpieczeństwa | `/security-review` przed każdym wdrożeniem | każde wdrożenie |
| Aktualizacje zależności | Routine: „sprawdź `npm audit` i nieaktualne paczki, przygotuj PR” | co tydzień |
| Raport biznesowy | Routine: „podsumuj rejestracje, ogłoszenia, płatności, spory z ostatnich 7 dni” | co poniedziałek |
| Kolejka DSA i spory | Routine: „przygotuj listę zgłoszeń i sporów starszych niż 24 h z propozycją decyzji” | codziennie; **decyzję podejmuje człowiek** |
| DAC7 | Routine 1 grudnia: „przygotuj raport DAC7 i listę brakujących danych” | raz w roku |

Routines (zaplanowane zadania) ustawiasz w Claude Code: poproś „ustaw cotygodniowe zadanie: …”.
Do obsługi usług przez agenta można podłączyć connectory / serwery MCP (np. Supabase, Stripe, Cloudflare),
ale z kluczami **tylko do odczytu** albo kontem testowym; zmiany na produkcji zatwierdzasz Ty.

Czego agent **nie** robi sam: decyzji moderacyjnych i w sporach (DSA wymaga uzasadnienia przez człowieka),
wypłat i zwrotów na produkcji, zmian regulaminu bez prawnika, wysyłki reklam bez zgody.
