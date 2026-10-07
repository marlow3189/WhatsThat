# Plan: od prototypu do działającej aplikacji

Cel: aplikacja na telefon (Android, potem iPhone) i w przeglądarce, połączona z prawdziwą bazą danych, którą testujesz
u siebie i ze znajomymi, a potem wypuszczasz publicznie. Testowanie krok po kroku: [START.md](START.md).
Bezpieczeństwo i formalności przed startem publicznym: [WDROZENIE.md](WDROZENIE.md), [BEZPIECZENSTWO.md](BEZPIECZENSTWO.md).

## Jak to jest zbudowane (całość)

```
 Telefon: APK / później iPhone ──┐
                                 ├──► Supabase (UE, Frankfurt)
 Przeglądarka: miliorbit…/app/ ──┘      ├─ Auth: konta (na testach anonimowe, potem numer + SMS)
                                        ├─ Postgres + RLS: profile, ogłoszenia, czaty, zamówienia, SOS (migracje 0001–0004)
                                        ├─ Storage: zdjęcia ogłoszeń i protokołów
                                        ├─ Realtime: czaty, statusy SOS, „Kupione”
                                        └─ Edge Functions: planer AI, ostrzeżenia, paliwa, płatności, push
                                                └─► Stripe (płatności), SMS, Firebase/APNs (push), Anthropic, IMGW
 GitHub: kod → CI (testy) → Cloudflare Pages (strona i /app/) + GitHub Actions (APK)
```

**Tryby aplikacji:** *demo* (dane przykładowe na urządzeniu, tak jest teraz) i *live* (baza). Live włącza się sam, gdy
w budowaniu są zmienne `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`. Prototyp w Claude zawsze zostaje w demo.
Tryb widać w **Ja** na dole i w **Panel operatora → Baza danych** (przycisk „Sprawdź połączenie z bazą”).

## Zasady pracy

1. Jedna faza naraz. Faza jest skończona, gdy przejdzie jej test „Gotowe, gdy” na Twoim telefonie.
2. Ty robisz konta, klucze i kliknięcia w panelach (kroki **Ty**). Agent pisze kod, migracje i testy (kroki **Agent**).
3. Po każdej zmianie: zielony ✓ w GitHubie, nowa wersja na stronie testowej (1–2 min) i nowe APK (ok. 5 min).
4. Błędy zgłaszasz według wzoru z [START.md](START.md); agent poprawia je w tej samej fazie.
5. Koszt do fazy 6: **0 zł** (Supabase Free, Cloudflare Free, GitHub Actions za darmo dla publicznego repozytorium).
   Uwaga: darmowy projekt Supabase usypia się po tygodniu bez ruchu; budzisz go przyciskiem *Restore* w panelu.

---

## Faza 0. Testowanie (dziś)

| Kto | Co |
|---|---|
| Agent | ✅ projekt Androida, ikony, APK budowane w GitHubie, strona + `/app/`, numer wersji w aplikacji |
| Ty | zainstaluj APK (START.md, sposób 2), załóż stronę testową na Cloudflare Pages (sposób 3), przeklikaj i zgłoś uwagi |

**Gotowe, gdy:** masz Miliorbit na telefonie z Androidem i pod adresem `…pages.dev/app/` na iPhonie i komputerze.

---

## Faza 1. Baza danych i konta testowe (Ty: ok. 30 min, Agent: 1–2 dni)

**Ty, Supabase (supabase.com):**
1. **Start your project** → zaloguj się przez GitHub → **New project**: nazwa `miliorbit-test`, *Database Password*:
   **Generate a password** i zapisz w menedżerze haseł, *Region*: **Central EU (Frankfurt)**, plan **Free** → **Create**.
2. Lewe menu **Database → Extensions**: wyszukaj i włącz **postgis** oraz **pg_cron**.
3. Lewe menu **SQL Editor** → **New query** → wklej i **Run** (tworzy tajny klucz do anonimowych kluczy, sam go nie znasz):
   ```sql
   select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'anon_key_secret');
   ```
4. Dalej w **SQL Editor**, po kolei, każdy plik jako osobne zapytanie: otwórz plik na GitHubie
   (`supabase/migrations/0001_init.sql`), przycisk **Copy raw file** (ikona kopiowania nad treścią), wklej, **Run**.
   Potem `0002_safety.sql`, `0003_local.sql`, `0004_identity_sos.sql`. Ma być „Success. No rows returned”.
   Błąd? Skopiuj jego treść agentowi.
5. **Authentication → Sign In / Providers** (albo *Providers*) → **Allow anonymous sign-ins**: włącz. Na czas testów
   konto zakłada się bez SMS (numer wpisuje się bez kodu). Prawdziwy SMS włączamy w fazie 7.
6. **Project Settings → API Keys** (albo *API*): skopiuj **Project URL** i klucz publiczny: **Publishable key**
   (`sb_publishable_…`) albo w zakładce *Legacy API keys* **anon public**. Klucza **secret** / **service_role** nie kopiuj nigdzie.

**Ty, Cloudflare Pages:** projekt → **Settings → Variables and Secrets** (*Environment variables*) → **Add** dla
*Production* i *Preview*: `VITE_SUPABASE_URL` = Project URL, `VITE_SUPABASE_ANON_KEY` = klucz publiczny →
**Save** → **Deployments → Retry deployment**.

**Ty, GitHub (żeby APK też łączyło się z bazą):** repozytorium → **Settings → Secrets and variables → Actions** →
zakładka **Variables** → **New repository variable**: te same dwie nazwy i wartości.

**Sprawdź:** strona testowa → **Ja → Panel operatora → Baza danych** → tryb **na żywo** → **Sprawdź połączenie z bazą**
→ „Połączono z …”. Jeśli pisze o braku tabel, wróć do kroku 4.

**Agent (polecenie do skopiowania):**
> „Zrób fazę 1 z docs/PLAN.md: warstwa danych z trybem demo/live, logowanie anonimowe Supabase, rejestracja zapisuje
> profil (imię, płeć, kraj, okolica, zainteresowania), anonimowy klucz z bazy, skrypt `supabase/seed_test.sql` z przykładowymi
> ogłoszeniami w mojej okolicy. Tryb demo ma działać jak dziś.”

**Gotowe, gdy:** rejestrujesz się na telefonie, a w Supabase → **Table Editor → profiles** jest Twój wiersz z kluczem
`anonym…`, płcią i okolicą; na dole zakładki **Ja** jest napis `live`.

---

## Faza 2. Ogłoszenia i zdjęcia (Agent: 2–3 dni)

**Agent:** dodawanie, edycja, wstrzymanie i usuwanie ogłoszeń w bazie; zdjęcia w Supabase Storage (zmniejszane
w telefonie, bucket z regułami dostępu); lista w okolicy (`listings_nearby`), wyszukiwanie, kręgi widoczności,
incognito, limit 2 ogłoszeń w planie darmowym (pilnuje baza), „Kupione”.
**Ty:** w Supabase **Storage** nic nie klikasz (agent da SQL); testujesz na dwóch telefonach.
**Gotowe, gdy:** Ty i druga osoba na dwóch telefonach widzicie nawzajem swoje ogłoszenia ze zdjęciami, a ukryte przed kimś
ogłoszenie tej osobie się nie pokazuje.

## Faza 3. Znajomi i kontakty (Agent: 2 dni)

**Agent:** zaproszenia linkiem `miliorbit.com/z/…` i kodem QR (zaproszony od razu jest znajomym), dopasowanie kontaktów
w APK (wtyczka Contacts + `match_contacts`, tylko skróty numerów), krąg znajomi / znajomi znajomych, orbita na mapie
(`orbit_people`), pseudonim i anonimowy klucz dla obcych, zaufane osoby i zastrzeżenie konta.
**Gotowe, gdy:** zaproszony znajomy pojawia się w **Znajomi**, jego nowe ogłoszenie w **Nowe u znajomych**, a znajomy
znajomego widzi Cię jako `Osoba #…` / klucz, nie z imienia.

## Faza 4. Czaty i powiadomienia (Agent: 2–3 dni, Ty: 20 min)

**Ty:** konto **Firebase** (console.firebase.google.com) → projekt → dodaj aplikację Android `com.miliorbit.app` →
pobierz `google-services.json` i wyślij agentowi przez GitHub (plik nie jest tajny) albo wgraj do `android/app/`.
**Agent:** czaty w czasie rzeczywistym (Realtime), licznik nieprzeczytanych, powiadomienia w aplikacji, push na Androida
(Firebase) z funkcji serwerowej, cisza nocna.
**Gotowe, gdy:** wiadomość dochodzi na drugi telefon w 2 sekundy, a przy zamkniętej aplikacji przychodzi powiadomienie.

## Faza 5. Tablica okolicy i SOS na żywo (Agent: 2 dni)

**Agent:** pytania z odpowiedziami, „Będę”, prośby o pomoc w bazie; SOS przez `send_sos`, statusy na żywo (Realtime),
push o wysokim priorytecie dla alarmu, „Odprowadź mnie” z położeniem na żywo, sprzątanie położenia po 24 h (pg_cron).
**Gotowe, gdy:** alarm z telefonu A pojawia się na telefonie B jako pełny ekran, B stuka „Jadę”, a A widzi „Jedzie · 6 min”.

## Faza 6. Zamówienia i płatności testowe (Ty: 1 h, Agent: 3–5 dni)

**Ty:** konto **Stripe** w **trybie testowym** (bez firmy da się testować): **Developers → API keys** → klucz
`sk_test_…` zapisz jako sekret w Supabase (**Edge Functions → Secrets**), **nie** w czacie.
**Agent:** funkcje `create-payment`, `stripe-webhook`, `payouts`, `refunds`; BLIK i karta testowa, kod odbioru zwalnia
wypłatę, 48 h automatycznie, spory, kaucja jako blokada na karcie.
**Gotowe, gdy:** zakup kartą testową `4242 4242 4242 4242` zmienia zamówienie na „Opłacone”, kod odbioru oznacza „Odebrane”,
a w Stripe widać wypłatę testową.

## Faza 7. Prawdziwe logowanie, iPhone, sklepy, domena (Ty: kilka wieczorów)

- **SMS:** konto SMSAPI (polskie, ok. 0,11–0,17 zł/SMS) albo Twilio; agent podłącza je w Supabase (*Send SMS hook*),
  wyłączasz logowanie anonimowe. Od teraz konto = numer telefonu.
- **iPhone:** konto Apple Developer (firma, D-U-N-S) → agent dodaje projekt iOS i budowanie w GitHub Actions na macOS
  → **TestFlight** (instalacja na iPhone'ach testerów z linku).
- **Google Play:** konto (25 USD, najlepiej firmowe) → test wewnętrzny (do 100 osób, od razu), potem zamknięty.
  Agent przygotowuje paczkę AAB podpisaną tajnym kluczem z sekretów GitHuba.
- **Domena:** miliorbit.com w Cloudflare (WDROZENIE.md, etap 2), linki do aplikacji (etap 9).
**Gotowe, gdy:** znajomi instalują z Google Play (test) i TestFlight, logują się numerem z SMS.

## Faza 8. Bezpieczeństwo i start publiczny

Po kolei według [BEZPIECZENSTWO.md](BEZPIECZENSTWO.md) i [WDROZENIE.md](WDROZENIE.md) etapy 4–5: WAF i boty, Turnstile przy
SMS, 2FA na wszystkich kontach, Security Advisor w Supabase bez ostrzeżeń, kopie bazy (plan Pro), `/security-review`,
polityka prywatności i regulamin od prawnika, piksele po zgodzie, firma i DAC7.
**Gotowe, gdy:** wszystkie pola ☐ w BEZPIECZENSTWO.md są ✅, a aplikacja jest opublikowana w obu sklepach.

---

## Kalendarz orientacyjny

| Tydzień | Fazy | Co masz na koniec |
|---|---|---|
| 1 | 0, 1 | aplikacja na telefonie, konta w bazie |
| 2 | 2, 3 | ogłoszenia ze zdjęciami między znajomymi |
| 3 | 4, 5 | czaty, powiadomienia, tablica okolicy, SOS na żywo |
| 4–5 | 6 | zamówienia i płatności testowe |
| 5–7 | 7, 8 | SMS, iPhone (TestFlight), Google Play (test), domena, bezpieczeństwo |

Czas zależy głównie od tego, jak szybko załatwisz konta (Apple i D-U-N-S trwają najdłużej) i jak szybko testujesz.
