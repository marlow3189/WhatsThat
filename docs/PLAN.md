# Master plan Regioorbit (wersja 0.8, październik 2026)

Plan krok po kroku, od aplikacji testowej do startu w sklepach. Każdy krok ma: **kto** (Ty albo agent), **co dokładnie
kliknąć**, **ile to trwa** i **„Gotowe, gdy”**, czyli test, po którym wiadomo, że można iść dalej.
Testowanie na telefonie i emulatorze: [START.md](START.md). Mapa ekranów: [MAPA.md](MAPA.md). Formalności i bezpieczeństwo przed startem:
[WDROZENIE.md](WDROZENIE.md), [BEZPIECZENSTWO.md](BEZPIECZENSTWO.md).

## Gdzie jesteśmy

| Obszar | Stan | Co to znaczy dla Ciebie |
|---|---|---|
| Aplikacja Android (APK) | ✅ budowana w GitHubie po każdej zmianie, testowana na emulatorach Android 14 i 16 | instalujesz plik z Releases (START.md, 2d) |
| Wygląd | ✅ menu jak w WhatsAppie: 5 zakładek (Okolica, Szukaj, Dodaj, Czaty, Ja), czcionka systemu | zgłaszaj, co Ci nie pasuje |
| Rejestracja | ✅ 4 ekrany: numer + zgoda, kod, profil (imię, płeć raz, region), znajomi | |
| Języki | ✅ 10: polski, angielski, niemiecki, ukraiński, czeski, słowacki, węgierski, włoski, hiszpański, **hindi** | |
| Regiony | ✅ 12 krajów (województwa, Bundesländer, kraje, vármegye, obwody, stany Indii i USA…) | |
| Baza danych | 🟡 kod gotowy (logowanie, profil, ogłoszenia z okolicy), czeka na Twój projekt Supabase | **krok 1** |
| AI (planer) i głos | 🟡 kod gotowy: mikrofon, czytanie na głos, planer AI przez Supabase | **krok 2** |
| Gmina i instytucje | 🟡 baza i zasady gotowe (tylko zweryfikowane konta publikują), karta na ekranie Okolica | **krok 5** |
| Kalendarz prywatny | ✅ własne terminy, „Będę”, odbiory i zwroty, wywóz śmieci, przypomnienie; w bazie po kroku 1 | |
| Zgłaszanie błędów | ✅ zamiast białego ekranu komunikat z opisem; **Ja → Diagnostyka → Kopiuj** | wklej opis agentowi |
| Google Play | 🟡 przepływ „Google Play” w GitHubie gotowy, czeka na konto i klucze | **krok 3** |
| Czaty, push, SOS na żywo, płatności, iPhone | ⬜ kolejne kroki | kroki 6–9 |

```
 Telefon (APK, później iPhone) ──┐
                                 ├──► Supabase (UE, Frankfurt)
 Przeglądarka: regioorbit…/app/ ──┘      ├─ Auth: konta (na testach anonimowe, potem numer + SMS)
                                        ├─ Postgres + RLS: profile, ogłoszenia, czaty, SOS, instytucje, kalendarz (0001–0006)
                                        ├─ Storage: zdjęcia │ Realtime: czaty, SOS │ Edge Functions: AI, push, płatności
                                        └─► Anthropic (planer AI), Firebase (push), Stripe (płatności), SMS
 GitHub: kod → testy → APK (gałąź domyślna = „test”, gałąź dev = „DEV”) → Google Play (test wewnętrzny)
```

**Tryby aplikacji:** *demo* (dane przykładowe tylko na telefonie) i *na żywo* (baza). Na żywo włącza się samo, gdy
w GitHubie są zmienne `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` (krok 1). Tryb widać na dole zakładki **Ja**:
`Regioorbit 0.8 · abc1234 · demo` albo `· live`. W trybie na żywo przykładowe ogłoszenia zostają (żeby ekrany nie były
puste), a Twoje i cudze ogłoszenia z okolicy dochodzą z bazy.

## Zasady pracy

1. Jeden krok naraz. Krok jest skończony, gdy przejdzie jego „Gotowe, gdy” **na Twoim telefonie**.
2. **Ty**: konta, klucze, kliknięcia w panelach. **Agent**: kod, migracje, testy, instrukcje.
3. **Sekrety** (hasła, klucze `secret` / `service_role`, klucz Anthropic, klucze do Google Play) wpisujesz tylko w panelach
   (Supabase, GitHub Secrets). Nigdy w czacie, w kodzie ani na zrzucie ekranu.
4. Po każdej zmianie w GitHubie: zielony ✓ (testy), nowe APK w ok. 3 min, zrzuty z emulatorów w ok. 10 min.
5. Nie uruchamiaj ponownie starych przebiegów w GitHub Actions (przycisk *Re-run*): budują starą wersję.

---

## Krok 0. Ścieżka deweloperska w GitHubie (Ty: 5 min, raz)

Po co: osobne miejsce na nowe, niesprawdzone rzeczy. Na telefonie masz wtedy **dwie aplikacje obok siebie**:
„Regioorbit” (stabilna, do pokazywania) i „Regioorbit DEV” (najnowsza, do sprawdzania).

| Gałąź | Do czego | Gdzie APK |
|---|---|---|
| `claude/p2p-rental-marketplace-bimvf6` (domyślna) | wersja testowa, którą pokazujesz innym | Releases → **Regioorbit Android (test)** → `regioorbit-test.apk` |
| `dev` | nowe funkcje, zanim trafią do testowej | Releases → **Regioorbit Android (DEV)** → `regioorbit-dev.apk` |

**Ty:**
1. GitHub → repozytorium → przycisk z nazwą gałęzi (nad listą plików) → wpisz `dev` → **Create branch dev from
   claude/p2p-rental-marketplace-bimvf6**.
2. Napisz agentowi: „Pracuj na gałęzi dev”. Agent pracuje tylko na gałęzi, którą mu wskażesz.
3. Gdy wersja DEV jest dobra: GitHub → **Pull requests → New** → *base*: gałąź domyślna, *compare*: `dev` → **Create** →
   **Merge**. Testowa aplikacja dostaje zmiany.

**Gotowe, gdy:** w Releases są dwa wydania (test i DEV), a na telefonie dwie ikony.
Instalacja na telefonie i sposoby bez instalacji (emulator): [START.md](START.md), część 2.

---

## Krok 1. Baza danych (Ty: ok. 30 min, raz)

**1.1. Projekt Supabase** (supabase.com):
1. **Start your project** → zaloguj się przez GitHub → **New project**: nazwa `regioorbit-test`, *Database Password*:
   **Generate a password** (zapisz w menedżerze haseł), *Region*: **Central EU (Frankfurt)**, plan **Free** → **Create**.
2. **Database → Extensions**: włącz **postgis** i **pg_cron**.
3. **SQL Editor → New query** → wklej i **Run** (tajny klucz do anonimowych kluczy; nikt go nie zna):
   ```sql
   select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'anon_key_secret');
   ```
4. Migracje, każda jako osobne zapytanie, po kolei: `0001_init.sql`, `0002_safety.sql`, `0003_local.sql`,
   `0004_identity_sos.sql`, `0005_institutions.sql`, `0006_calendar.sql`. Jak: otwórz plik w GitHubie (folder `supabase/migrations`) →
   ikona **Copy raw file** → wklej w **SQL Editor** → **Run** → ma być „Success”. Błąd? Skopiuj treść błędu agentowi.
5. **Authentication → Sign In / Providers** → **Allow anonymous sign-ins**: włącz (na testach bez SMS).
6. **Project Settings → API Keys**: skopiuj **Project URL** i **Publishable key** (`sb_publishable_…`; w starszym panelu
   *anon public*). Klucza **secret** / **service_role** nie kopiuj nigdzie.

**1.2. GitHub (APK łączy się z bazą):** repozytorium → **Settings → Secrets and variables → Actions → Variables** →
**New repository variable**: `VITE_SUPABASE_URL` = Project URL, potem `VITE_SUPABASE_ANON_KEY` = Publishable key.
To są *Variables*, nie *Secrets* (klucz publiczny jest jawny z założenia, chroni nas RLS w bazie).

**1.3. Nowe APK:** **Actions → Android APK → Run workflow** (albo dowolna zmiana na gałęzi), po ok. 3 min pobierz APK.

**Gotowe, gdy:**
- na dole **Ja** jest `live`, a **Ja → Panel operatora → Baza danych → Sprawdź połączenie** pisze „Połączono z …”;
- w Supabase **Table Editor → profiles** jest Twój wiersz (imię, płeć, region, klucz `anonym…`);
- dodajesz ogłoszenie na telefonie A, a po minucie widzi je telefon B (druga osoba w promieniu 50 km);
  w **Table Editor → listings** jest wiersz. Limit planu darmowego (2 ogłoszenia w miesiącu) pilnuje baza: trzecie
  pokaże komunikat „Nie udało się zapisać w bazie…”.

---

## Krok 2. AI i głos (Ty: 15 min)

**2.1. Klucz Anthropic:** console.anthropic.com → **API Keys → Create Key** → skopiuj (pokazuje się raz).
Ustaw limit wydatków: **Settings → Limits** (np. 20 USD miesięcznie).
**2.2. Sekret w Supabase:** **Edge Functions → Secrets → Add new secret**: nazwa `ANTHROPIC_API_KEY`, wartość: klucz.
**2.3. Funkcja `plan`:** **Edge Functions → Deploy a new function → Via Editor** → nazwa `plan` → wklej treść
`supabase/functions/plan/index.ts` z GitHuba → **Deploy**. Zostaw włączone *Verify JWT* (tylko zalogowani).

**Jak działa w aplikacji:**
- **Okolica → pole „Co dziś załatwiamy?”** albo **Szukaj**: wpisz cel, np. „remont łazienki”. Znane cele (podjazd,
  przeprowadzka, ogród, opał) aplikacja rozpisuje sama, bez internetu; inne idą do AI (po 0,7 s od wpisania).
- **Mikrofon** (niebieskie kółko obok pola): mówisz, aplikacja wpisuje. Na Androidzie otwiera się systemowe okno
  rozpoznawania mowy Google (aplikacja nie nagrywa dźwięku sama).
- **Głośnik**: w planie AI przycisk **Przeczytaj** czyta kroki i najlepsze oferty na głos (głos systemu telefonu).

**Gotowe, gdy:** na telefonie w trybie `live` mówisz „chcę wymienić płot” i widzisz plan z krokami, a **Przeczytaj**
czyta go na głos. Koszt: ok. 1–3 grosze za zapytanie (podgląd w console.anthropic.com → **Usage**).

---

## Krok 3. Google Play: test wewnętrzny (Ty: ok. 1 h, raz; potem 1 kliknięcie)

Po co: testerzy instalują ze Sklepu Play, także na Samsungach z „Automatyczną blokadą”, a aplikacja sama się aktualizuje.

1. play.google.com/console → **Utwórz aplikację**: nazwa „Regioorbit”, język polski, aplikacja, bezpłatna → zaakceptuj.
2. **Klucz do wysyłki (upload key)**, na komputerze z Javą (Android Studio ją ma), w terminalu:
   ```
   keytool -genkeypair -v -keystore regioorbit-upload.jks -alias upload -keyalg RSA -keysize 4096 -validity 10000
   ```
   Hasła zapisz w menedżerze haseł, plik `.jks` trzymaj poza repozytorium (i kopię w bezpiecznym miejscu).
3. **Sekrety w GitHubie** (Settings → Secrets and variables → Actions → **Secrets**):
   `ANDROID_UPLOAD_KEYSTORE_BASE64` (plik `.jks` zakodowany: `base64 -w0 regioorbit-upload.jks` na Linuksie,
   `base64 -i regioorbit-upload.jks` na Macu), `ANDROID_UPLOAD_KEYSTORE_PASSWORD`, `ANDROID_UPLOAD_KEY_ALIAS` (`upload`),
   `ANDROID_UPLOAD_KEY_PASSWORD`.
4. **Pierwsza paczka ręcznie** (wymóg Google): GitHub → **Actions → Google Play → Run workflow** → zaznacz
   **Tylko zbuduj plik .aab** → **Run** → po ok. 5 min w przebiegu **Artifacts → regioorbit-play-…** (rozpakuj zip).
   Play Console: **Testowanie → Test wewnętrzny → Utwórz wersję** → wgraj `app-release.aab` → zapisz.
   Zostaw włączone **Podpisywanie aplikacji przez Google Play**.
5. **Konto usługi:** console.cloud.google.com → projekt → **IAM i administracja → Konta usługi → Utwórz** → **Klucze →
   Dodaj klucz → JSON**. W Play Console: **Użytkownicy i uprawnienia → Zaproś** adres konta usługi z prawem do wydań.
   Treść pliku JSON wklej jako sekret `PLAY_SERVICE_ACCOUNT_JSON`.
6. **Kolejne wydania:** GitHub → **Actions → Google Play → Run workflow** → *track*: `internal` → **Run**.
7. **Testerzy:** Play Console → **Test wewnętrzny → Testerzy** → lista e-maili → link „Dołącz do testu” wyślij znajomym.
8. **Linki do aplikacji:** Play Console → **Integralność aplikacji → Podpisywanie** → odcisk SHA-256 klucza podpisywania
   podaj agentowi (dopisze go do `site/.well-known/assetlinks.json`).

**Gotowe, gdy:** tester z linku instaluje „Regioorbit” ze Sklepu Play, a nowa wersja przychodzi po **Run workflow**.

---

## Krok 4. Przegląd wyglądu i języków (Ty: 1 wieczór)

Przejdź aplikację w 2–3 językach (zmiana: **Ja → Język**) i zgłoś agentowi według wzoru z START.md:
zakładka, ekran, co jest źle, zrzut. Sprawdź jedną ręką: czy wszystko ważne jest w zasięgu kciuka.
Agent poprawia na gałęzi `dev`, Ty sprawdzasz w „Regioorbit DEV”.

**Gotowe, gdy:** nie masz uwag do rejestracji, Okolicy, Dodaj i Czatów w żadnym z używanych języków.

---

## Krok 5. Gmina i instytucje (Agent: 2–3 dni, Ty: weryfikacja każdego wniosku)

**Zasada:** nikt nie może podszyć się pod gminę. Komunikat „urzędowy” publikuje tylko członek instytucji, którą Ty
(operator) sprawdziłeś ręcznie. Pilnuje tego baza (migracja `0005_institutions.sql`), nie tylko aplikacja.

**Jak sprawdzasz wniosek** (Ja → „Jesteś z urzędu…?” → wniosek trafia do tabeli `org_applications`):
1. E-mail jest w domenie urzędu ze strony BIP (np. `@tarczyn.pl`), a nie np. z Gmaila.
2. Dzwonisz na numer sekretariatu ze strony BIP (nie na numer z wniosku) i pytasz, czy ta osoba składała wniosek.
3. Osoba przysyła upoważnienie podpisane przez wójta, burmistrza albo prezesa spółdzielni.
4. Zatwierdzenie: Supabase → **SQL Editor** (podmień wartości w nawiasach ostrych):
   ```sql
   with o as (
     insert into organizations (kind, name, region, official_code, center, radius_km, status, verified_at)
     values ('municipality', '<Gmina Tarczyn>', '<mazowieckie>', '<kod TERYT>', 'SRID=4326;POINT(<dł.> <szer.>)', 12, 'verified', now())
     returning id)
   insert into org_members (org_id, user_id, role)
   select o.id, a.user_id, 'owner' from o, org_applications a where a.id = '<id wniosku>';
   update org_applications set status = 'approved', decided_at = now() where id = '<id wniosku>';
   ```

**Agent:** panel instytucji w aplikacji (komunikat, awaria, wydarzenie; harmonogram śmieci z pliku CSV gminy),
wybór rejonu wywozu przez mieszkańca, przypomnienie dzień wcześniej o 19:00, znaczek „Zweryfikowana instytucja”.
**Gotowe, gdy:** pracownik testowej gminy publikuje komunikat, a mieszkaniec w zasięgu widzi go na ekranie Okolica
z zielonym znaczkiem; zwykłe konto nie ma jak opublikować komunikatu (baza odrzuca).

---

## Krok 6. Czaty i powiadomienia (Ty: 20 min, Agent: 2–3 dni)

**Ty:** console.firebase.google.com → projekt → dodaj aplikację Android `com.regioorbit.app` (i drugą:
`com.regioorbit.app.dev`) → pobierz `google-services.json` → wyślij agentowi (plik nie jest tajny).
**Agent:** czaty na żywo (Realtime), licznik nieprzeczytanych, push z serwera, cisza nocna.
**Gotowe, gdy:** wiadomość dochodzi na drugi telefon w 2 s, a przy zamkniętej aplikacji przychodzi powiadomienie.

## Krok 7. SOS i tablica okolicy na żywo (Agent: 2 dni)

**Agent:** `send_sos`, statusy na żywo, push wysokiego priorytetu, „Odprowadź mnie”, pytania i „Będę” w bazie.
**Gotowe, gdy:** alarm z telefonu A pojawia się na B jako pełny ekran, B stuka „Jadę”, A widzi „Jedzie · 6 min”.

## Krok 8. Płatności testowe (Ty: 1 h, Agent: 3–5 dni)

**Ty:** konto Stripe w trybie testowym → klucz `sk_test_…` jako sekret w Supabase (**Edge Functions → Secrets**).
**Agent:** płatność, kod odbioru, wypłata po 48 h, spory, kaucja jako blokada na karcie.
**Gotowe, gdy:** zakup kartą testową `4242 4242 4242 4242` zmienia zamówienie na „Opłacone”, a kod odbioru na „Odebrane”.

## Krok 9. Firma, SMS, iPhone, domena, start (Ty: kilka wieczorów)

- **Firma:** po założeniu zmień w Play Console dane konta na firmowe; uzupełnij dane w regulaminie (WDROZENIE.md).
- **SMS:** konto SMSAPI albo Twilio → agent podłącza je w Supabase → w GitHubie zmienna `VITE_AUTH` = `sms` →
  wyłączasz logowanie anonimowe. Od teraz konto = numer telefonu z kodem.
- **iPhone:** gdy Apple zatwierdzi konto (Apple Developer, firma z numerem D-U-N-S): agent dodaje projekt iOS
  i budowanie na macOS w GitHub Actions → TestFlight.
- **Domena:** regioorbit.com (WDROZENIE.md, etap 2) i linki do aplikacji (etap 9).
- **Bezpieczeństwo:** wszystkie pola w BEZPIECZENSTWO.md na ✅, polityka prywatności i regulamin od prawnika.

**Gotowe, gdy:** aplikacja jest w Google Play i App Store, a logowanie numerem z SMS działa.

---

## Kalendarz orientacyjny

| Tydzień | Kroki | Co masz na koniec |
|---|---|---|
| 1 | 0, 1, 2 | dwie aplikacje na telefonie, konta i ogłoszenia w bazie, AI z głosem |
| 2 | 3, 4 | test w Google Play dla znajomych, poprawiony wygląd |
| 3 | 5, 6 | gmina z komunikatami, czaty i powiadomienia |
| 4 | 7, 8 | SOS na żywo, płatności testowe |
| 5–7 | 9 | SMS, iPhone (gdy Apple zatwierdzi), domena, start |

Najdłużej trwają rzeczy poza kodem: weryfikacja kont (Google, Apple, D-U-N-S) i testy z ludźmi.
