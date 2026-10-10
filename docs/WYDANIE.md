# Regioorbit: wydanie krok po kroku (instrukcja montażu)

**Co robimy:** stawiamy Regioorbit w internecie w dwóch etapach.

| Etap | Co powstaje | Kto używa | Koszt |
|---|---|---|---|
| **1. Wersja testowa (pre-prod)** | strona `regioorbit.vercel.app`, aplikacja w przeglądarce (PWA), aplikacja na Androida (plik APK), **jedna wspólna baza testowa** | Ty i 5–20 zaproszonych osób | 0 zł |
| **2. Start (prod)** | domena `regioorbit.com`, baza produkcyjna, **Google Play**, **App Store**, PWA | wszyscy | ok. 25 USD (Google, raz) + 99 USD/rok (Apple) + 25 USD/mies. (baza) + domena; szczegóły w etapie 2 |

**Po co dwa etapy:** w etapie 1 sprawdzacie aplikację na prawdziwych telefonach, z prawdziwymi ludźmi, tanio i bez
recenzji sklepów. Do etapu 2 przechodzisz dopiero wtedy, gdy wersja testowa działa bez poważnych błędów.

**Jak czytać tę instrukcję.** Każda część ma ten sam układ:

- 🧰 **Części**: co musisz mieć, zanim zaczniesz, i do czego się zalogować.
- 🔧 **Montaż**: kroki po kolei. Rób dokładnie w tej kolejności. Jeden krok = jedno miejsce na ekranie.
- ✅ **Sprawdź**: po czym poznasz, że działa. Nie idź dalej, dopóki „Sprawdź” się nie zgadza.
- 📦 **Gotowe**: co masz po tej części.

**Zasady (zawsze):**

1. **Ty** zakładasz konta, płacisz, klikasz w panelach i trzymasz hasła. **Agent** (Claude Code) pisze kod, konfigurację i
   poprawki.
2. **Hasła i klucze tajne** (hasło bazy, klucz `secret` / `service_role`, klucze Apple i Google, plik `.jks`) wpisujesz
   tylko w panelach (Supabase, Vercel, GitHub → *Secrets*). Nigdy w czacie, w kodzie ani na zrzucie ekranu.
   Zapisuj je w menedżerze haseł (np. Bitwarden, 1Password).
3. Nazwy przycisków w panelach czasem się zmieniają. Gdy czegoś nie widzisz, szukaj podobnej nazwy albo zapytaj agenta:
   „gdzie teraz w Vercel jest …?”.
4. Coś jest czerwone albo nie zgadza się „Sprawdź”: zrób zrzut ekranu (bez haseł) i wyślij agentowi z opisem
   „Część 1B, krok 6: widzę …”.

> Link do podglądu w Claude (artefakt) to tylko **pokaz** z przykładowymi danymi na jednym telefonie. Prawdziwe testy
> między ludźmi robisz na wersji z etapu 1.

---

# ETAP 1. Wersja testowa (pre-prod)

**Co budujemy:** bazę testową w Supabase, stronę testową w Vercel i aplikację na Androida połączoną z tą bazą.
iPhone'y i komputery używają tej samej aplikacji z przeglądarki (PWA, ikona na ekranie jak zwykła aplikacja).

**Po co:** kilka osób w prawdziwym życiu zakłada konta, dodaje prośby o pomoc i ogłoszenia, a inni widzą je u siebie.
Wszystko pod Twoją kontrolą: Ty decydujesz, kto dostaje link, i możesz w każdej chwili wszystko wyłączyć.

```
 Android (APK z GitHuba) ───┐
 iPhone (Safari → ikona)  ──┼──► regioorbit.vercel.app/app/ ──► Supabase „regioorbit-test” (Frankfurt)
 Komputer (przeglądarka)  ──┘        (strona i aplikacja)          konta, profile, ogłoszenia, kalendarz
```

**Czas:** ok. 1,5 godziny pracy + 1–2 tygodnie testów.

---

## Część 1A. Baza testowa (Supabase), 25 minut

🧰 **Części**

| Co | Skąd |
|---|---|
| Konto GitHub `marlow3189` | masz |
| Konto Supabase (darmowe) | zakładasz w kroku 1 przez „Continue with GitHub” |
| Menedżer haseł | zapiszesz w nim hasło bazy i dwa adresy |
| 6 plików migracji (śrubki od agenta) | GitHub → repozytorium → folder `supabase/migrations`: `0001_init.sql` … `0006_calendar.sql` |

**Zaloguj się** (otwórz w kartach przeglądarki): `github.com`, `supabase.com`.

🔧 **Montaż**

1. **supabase.com** → **Start your project** → **Continue with GitHub** → zezwól.
2. **New project**:
   - *Organization*: Twoja (Supabase utworzy ją przy pierwszym logowaniu),
   - *Project name*: `regioorbit-test`,
   - *Database Password*: **Generate a password** → skopiuj do menedżera haseł,
   - *Region*: **Central EU (Frankfurt)**,
   - plan: **Free** → **Create new project**. Czekasz 1–2 minuty, aż zniknie napis o przygotowywaniu.
3. Lewe menu → **Database** → **Extensions** → w wyszukiwarce wpisz `postgis` → przełącznik **włącz** → **Enable**.
   To samo dla `pg_cron`.
4. Lewe menu → **SQL Editor** → **New query** → wklej poniższą linijkę → **Run** (zielony przycisk). Ma być „Success”.
   ```sql
   select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'anon_key_secret');
   ```
   (To tajny klucz do anonimowych kluczy użytkowników. Nikt go nie musi znać.)
5. **Migracje, 6 razy to samo, po kolei od 0001 do 0006:**
   1. W drugiej karcie: GitHub → repozytorium → `supabase/migrations` → kliknij plik (najpierw `0001_init.sql`).
   2. Nad treścią pliku ikona **Copy raw file** (dwa kwadraty).
   3. Supabase → **SQL Editor** → **New query** → wklej → **Run** → ma być „Success. No rows returned”.
   4. Następny plik: `0002_safety.sql`, `0003_local.sql`, `0004_identity_sos.sql`, `0005_institutions.sql`,
      `0006_calendar.sql`.

   Czerwony błąd? Nie uruchamiaj kolejnych. Skopiuj treść błędu agentowi z numerem pliku.
6. Lewe menu → **Authentication** → **Sign In / Providers** → **Allow anonymous sign-ins**: **włącz** → **Save**.
   (Na testach konto zakłada się bez SMS-a: wpisujesz numer, a kod to dowolne 6 cyfr. SMS włączymy w etapie 2.)
7. Lewe menu → **Project Settings** (koło zębate) → **API Keys** (albo **Data API**). Skopiuj do menedżera haseł:
   - **Project URL**, np. `https://abcdefgh.supabase.co`,
   - **Publishable key** (zaczyna się od `sb_publishable_…`; w starszym panelu *anon public*).

   Klucza **secret** / **service_role** nie kopiuj nigdzie.

✅ **Sprawdź**

- **Table Editor** (lewe menu) pokazuje tabele, m.in. `profiles`, `listings`, `calendar_entries`.
- W menedżerze haseł masz: hasło bazy, Project URL, Publishable key.

📦 **Gotowe:** pusta baza testowa z zasadami dostępu (każdy widzi tylko to, co mu wolno). Teraz podłączamy do niej stronę.

---

## Część 1B. Strona testowa (Vercel), 15 minut

🧰 **Części**

| Co | Skąd |
|---|---|
| Project URL i Publishable key | menedżer haseł (część 1A, krok 7) |
| Konto Vercel, plan **Hobby** (darmowy) | zakładasz w kroku 1 przez GitHub |
| Plik `vercel.json` (od agenta) | już jest w repozytorium: mówi Vercelowi, jak zbudować stronę i jakie dać zabezpieczenia |

**Zaloguj się:** `vercel.com` (przez GitHub).

🔧 **Montaż**

1. **vercel.com** → **Sign Up** → *Hobby* → imię → **Continue with GitHub** → zezwól.
2. **Add New…** → **Project** → *Import Git Repository*. Nie widzisz `WhatsThat`? → **Adjust GitHub App Permissions**
   → *Only select repositories* → wybierz `marlow3189/WhatsThat` → **Save** → wróć do Vercela.
3. Przy `WhatsThat` → **Import**.
4. Ekran *Configure Project*:
   - *Project Name*: `regioorbit`,
   - *Framework Preset*: **Other** (resztę bierze z `vercel.json`, nic nie zmieniaj w *Build and Output Settings*),
   - *Root Directory*: zostaw `./`.
5. Rozwiń **Environment Variables** i dodaj dwie (Key → Value → **Add**):
   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL z części 1A |
   | `VITE_SUPABASE_ANON_KEY` | Publishable key z części 1A |
6. **Deploy**. Czekasz ok. 2 minuty, aż pojawi się „Congratulations”.
7. **Continue to Dashboard**. W polu *Domains* jest adres strony, np. `regioorbit.vercel.app`
   (jeśli zajęty, Vercel doda końcówkę, np. `regioorbit-abc.vercel.app`). Zapisz go: to **adres testowy**.
8. **Settings** → **Environment Variables** → dodaj jeszcze dwie:
   | Key | Value |
   |---|---|
   | `VITE_SITE_URL` | `https://` + adres testowy, np. `https://regioorbit.vercel.app` |
   | `SITE_ANDROID_URL` | `https://github.com/marlow3189/WhatsThat/releases/download/android-test/regioorbit-test.apk` |

   (Pierwsza: linki z aplikacji, np. zaproszenia, prowadzą na stronę testową. Druga: przycisk „Pobierz na Androida” daje
   plik APK, dopóki nie ma aplikacji w Google Play.)
9. **Deployments** → przy najnowszym wdrożeniu **⋯** → **Redeploy** → **Redeploy**. Zmienne działają dopiero po
   ponownym zbudowaniu.
10. **Settings** → **Environments** → **Production** → *Branch Tracking*: ma być `claude/p2p-rental-marketplace-bimvf6`
    (gałąź, na której pracuje agent). Jeśli jest `main`, zmień i **Save**. Wtedy każda zmiana agenta sama trafia na stronę
    po ok. 2 minutach.

✅ **Sprawdź** (na telefonie, nie tylko na komputerze)

- `https://<adres testowy>` → strona główna Regioorbit z przyciskami do pobrania.
- `https://<adres testowy>/app/` → aplikacja. Przejdź rejestrację (numer dowolny, kod dowolne 6 cyfr).
- Zakładka **Ja** → na samym dole napis `Regioorbit 0.9 · … · live`. Jest `demo`? Zmienne z kroku 5 mają literówkę albo nie
  było **Redeploy** (krok 9).
- Supabase → **Table Editor** → `profiles`: jest Twój wiersz.

> Podawaj testerom tylko krótki adres (`regioorbit.vercel.app`). Długie adresy konkretnych wdrożeń
> (`regioorbit-git-…vercel.app`) Vercel chroni logowaniem.

📦 **Gotowe:** strona i aplikacja w przeglądarce, połączone z bazą testową. Teraz to samo dla aplikacji na Androida.

---

## Część 1C. Android: APK połączone z bazą, 10 minut + 5 minut czekania

🧰 **Części**

| Co | Skąd |
|---|---|
| Project URL, Publishable key, adres testowy | menedżer haseł |
| Telefon z Androidem | Twój |
| Przepływ „Android APK” (od agenta) | GitHub → **Actions**; buduje APK w chmurze, nie potrzebujesz Android Studio |

**Zaloguj się:** `github.com`.

🔧 **Montaż**

1. GitHub → repozytorium `WhatsThat` → **Settings** (zakładka u góry) → lewe menu **Secrets and variables** → **Actions**
   → zakładka **Variables** (nie *Secrets*) → **New repository variable**. Dodaj trzy, każdą osobno (**Add variable**):
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Publishable key |
   | `VITE_SITE_URL` | `https://` + adres testowy |

   (To *Variables*, bo klucz `publishable` jest jawny z założenia. Dane chronią zasady w bazie.)
2. **Actions** → po lewej **Android APK** → po prawej **Run workflow** → *Use workflow from*:
   `claude/p2p-rental-marketplace-bimvf6` → **Run workflow**.
3. Czekasz ok. 5 minut na zielony ✓ przy przebiegu.
4. Na telefonie: otwórz `https://github.com/marlow3189/WhatsThat/releases/tag/android-test` → **Assets** →
   `regioorbit-test.apk` → pobierz.
5. **Stara aplikacja „Miliorbit”**: jeśli ją masz, odinstaluj (przytrzymaj ikonę → **Odinstaluj**). Nowa ma inną nazwę
   pakietu i obie by się myliły.
6. Otwórz pobrany plik → Android zapyta o zgodę na instalację z przeglądarki → **Ustawienia** → **Zezwalaj z tego źródła**
   → wróć → **Zainstaluj**.
   Samsung z włączoną **Automatyczną blokadą** (Auto Blocker) nie pozwoli zainstalować pliku. Wtedy: wyłącz ją na czas
   instalacji (**Ustawienia → Bezpieczeństwo i prywatność → Automatyczna blokada**) albo używaj wersji z przeglądarki
   (część 1D).

✅ **Sprawdź**

- Ikona **Regioorbit** (trzy kolorowe orbity) na telefonie, aplikacja startuje na kremowym tle.
- Po rejestracji: **Ja** → na dole `live`.
- W Supabase → `profiles` przybył drugi wiersz (telefon to osobne konto testowe niż przeglądarka).

📦 **Gotowe:** aplikacja na Androida korzysta z tej samej bazy co strona. Każda kolejna zmiana agenta = nowy plik pod tym
samym linkiem (krok 4); instalujesz go na starą wersję, dane zostają.

---

## Część 1D. iPhone i komputer: aplikacja z przeglądarki (PWA), 3 minuty na osobę

🧰 **Części:** adres testowy, iPhone z Safari albo komputer z Chrome/Edge. Konta nie trzeba.

🔧 **Montaż**

- **iPhone:** Safari → `https://<adres testowy>/app/` → przycisk **Udostępnij** (kwadrat ze strzałką) → przewiń →
  **Do ekranu początkowego** → **Dodaj**. Otwieraj z ikony, nie z Safari.
- **Android bez APK** (np. Samsung z blokadą): Chrome → ten sam adres → menu **⋮** → **Zainstaluj aplikację** (albo
  **Dodaj do ekranu głównego**).
- **Komputer:** Chrome albo Edge → ten sam adres → w pasku adresu ikona **Zainstaluj** (monitor ze strzałką) → **Zainstaluj**.

✅ **Sprawdź:** aplikacja otwiera się z ikony na pełnym ekranie (bez paska adresu), na dole **Ja** jest `live`.

📦 **Gotowe:** każdy tester ma Regioorbit na swoim telefonie lub komputerze, wszyscy w jednej bazie.

---

## Część 1E. Test na żywo z ludźmi, 1–2 tygodnie

🧰 **Części:** 3–20 osób (różne telefony: Android, iPhone, mały i duży ekran), grupa na WhatsAppie albo Messengerze
do zgłaszania uwag, ta lista scenariuszy.

🔧 **Montaż**

1. **Wiadomość do testerów** (skopiuj i podmień adres):
   > Cześć! Testujemy Regioorbit: aplikację „wszystko w okolicy, najpierw znajomi”.
   > Android: pobierz https://github.com/marlow3189/WhatsThat/releases/download/android-test/regioorbit-test.apk i zainstaluj.
   > iPhone albo komputer: otwórz https://regioorbit.vercel.app/app/ i dodaj do ekranu początkowego.
   > Przy rejestracji podaj swój numer, kod to dowolne 6 cyfr. Województwo: dolnośląskie (wszyscy to samo!),
   > nie klikaj „Użyj mojej lokalizacji”. Błędy: Ja → Diagnostyka → Kopiuj i wklej tutaj ze zrzutem ekranu.
2. **Wspólna okolica.** Tablica okolicy pokazuje wpisy z ok. 20 km, a **Szukaj** domyślnie z 25 km. Testerzy mieszkający
   dalej od siebie wybierają **to samo województwo** i **nie** używają lokalizacji GPS (wtedy wszyscy są „w tym samym
   miejscu”). Jeśli mieszkacie blisko siebie, lokalizacja może być prawdziwa.
3. **Scenariusze.** Odhaczajcie w grupie:
   | # | Kto | Co robi | Co ma się stać |
   |---|---|---|---|
   | 1 | każdy | rejestracja: numer, kod, imię, województwo | ekran **Okolica**, na dole **Ja** napis `live` |
   | 2 | A | Okolica → kafel **Poproś o pomoc** → **Dodaj wpis** → tytuł, opis → **Dalej** → **Opublikuj** | wpis u A od razu |
   | 3 | B | po minucie wychodzi z aplikacji i wraca (albo czeka minutę) | B widzi wpis A na **Okolicy** (Tablica okolicy) |
   | 4 | A | **+** → **Sprzedaż** → kategoria → tytuł, cena → **Dalej** → **Kto zobaczy?**: **Wszyscy** → **Opublikuj** | B znajduje ogłoszenie w **Szukaj** |
   | 5 | B | kafel **Wydarzenie** → **Utwórz** → tytuł, data → **Dalej** → **Opublikuj** | A widzi wydarzenie na **Okolicy** |
   | 6 | każdy | menu **☰** → **Kalendarz** → dodaj termin z przypomnieniem | termin jest w kalendarzu i na karcie „Dziś/Jutro” |
   | 7 | każdy | **Ja → Język**: angielski, niemiecki, ukraiński | wszystko przetłumaczone, nic nie wychodzi poza ekran |
   | 8 | każdy | przejdź każdą zakładkę na swoim telefonie | przyciski nie chowają się pod paskiem systemu |
   | 9 | każdy | coś nie działa → **Ja → Diagnostyka → Kopiuj** | tekst z wersją i błędami do wklejenia w grupie |
4. **Co jeszcze NIE działa między osobami** (nie zgłaszajcie jako błąd, to kolejne kroki w [PLAN.md](PLAN.md)):
   czaty, płatności, alarm SOS do innych, powiadomienia push, zdjęcia (zostają na telefonie autora), znajomi z kontaktów.
   Przykładowe osoby i ogłoszenia (Kasia, Marek…) to dane pokazowe.
5. **Limit:** jedno konto może dodać 2 ogłoszenia w miesiącu (plan darmowy, pilnuje baza). Prośby o pomoc, pytania i
   wydarzenia są bez limitu. Potrzebujesz więcej: **Ja → Wyloguj** i zarejestruj się jeszcze raz (nowe konto testowe).
6. **Zbieranie uwag.** Raz na 2–3 dni wklej agentowi zebrane zgłoszenia według wzoru:
   „Zakładka / ekran / co zrobiłem / co się stało / co powinno / telefon i system / tekst z Diagnostyki”.
   Agent poprawia, GitHub buduje nowe APK, Vercel nową stronę. Testerzy: Android pobiera APK z tego samego linku,
   PWA aktualizuje się sama po zamknięciu i ponownym otwarciu.

✅ **Sprawdź (bramka do etapu 2):**

- [ ] co najmniej 5 osób używało aplikacji przez tydzień, na Androidzie i iPhonie,
- [ ] scenariusze 1–9 przechodzą u wszystkich,
- [ ] brak błędów, które blokują rejestrację, dodawanie albo oglądanie wpisów,
- [ ] wiesz, co ma być w wersji na start (np. czaty i logowanie SMS) i agent to zrobił (część 2A).

📦 **Podsumowanie etapu 1.** Gotowe: baza testowa, strona testowa, aplikacja na Androida i wersja z przeglądarki dla
iPhone'a i komputera, sprawdzone przez prawdziwych ludzi. Przechodzimy do etapu 2, bo wersja testowa ma ograniczenia:
darmowy Vercel (Hobby) jest tylko do użytku niekomercyjnego, darmowa baza nie ma kopii zapasowych i usypia się po tygodniu
bez ruchu, APK spoza sklepu straszy ostrzeżeniami (a Samsung go blokuje), iPhone ma tylko wersję z przeglądarki, a adres
nie jest Twoją marką.

---

# ETAP 2. Start (prod): domena, baza produkcyjna, Google Play, App Store, PWA

**Co budujemy:** `regioorbit.com` z aplikacją w przeglądarce, osobną bazę produkcyjną z logowaniem SMS, aplikację w
Google Play i w App Store.

**Po co:** ludzie instalują aplikację ze sklepu, który znają, dostają aktualizacje automatycznie, a ich dane są w bazie
z kopiami zapasowymi. Baza testowa zostaje do dalszych testów, więc nowe funkcje nadal sprawdzasz bez ryzyka.

```
 Google Play ─┐
 App Store   ─┼─► regioorbit.com/app/ ─► Supabase „regioorbit-prod” (Pro, kopie zapasowe, SMS)
 PWA          ┘      (gałąź main)
 Testy dalej: regioorbit-test.vercel.app (gałąź agenta) ─► Supabase „regioorbit-test”
```

🧰 **Części na cały etap 2 (zbierz przed startem):**

| Co | Koszt | Czas oczekiwania |
|---|---|---|
| Domena `regioorbit.com` (np. Hostinger, gdzie masz `miliorbit.com`) | ok. 50–100 zł/rok | od razu |
| Vercel **Pro** (strona komercyjna) albo Cloudflare Pages (darmowy, opis w [WDROZENIE.md](WDROZENIE.md), etapy 2–3) | 20 USD/mies. albo 0 zł | od razu |
| Supabase **Pro** dla bazy produkcyjnej | 25 USD/mies. | od razu |
| Konto SMS (Twilio) do kodów logowania | ok. 0,05 USD za SMS | 1 dzień |
| Konto **Google Play Console** | 25 USD jednorazowo | 1–3 dni (weryfikacja tożsamości) |
| **Apple Developer Program** | 99 USD/rok | 1–2 dni (firma: także numer D-U-N-S, do 2 tygodni) |
| Dokument tożsamości, karta płatnicza, telefon do weryfikacji dwuetapowej | | |
| Firma albo decyzja „konto osobiste” (sprzedawca widoczny w sklepach) | | [WDROZENIE.md](WDROZENIE.md), etap 0 |

Konta Google i Apple załóż **od razu na początku etapu 2**: ich weryfikacja trwa dniami, a w tym czasie zrobisz części 2A–2C.

---

## Część 2A. Zlecenia dla agenta przed sklepami (agent: kilka dni, Ty: sprawdzasz)

🧰 **Części:** lista uwag z etapu 1, decyzja, co ma być na start.

🔧 **Montaż**

1. Napisz agentowi: **„Przygotuj Regioorbit do sklepów: część 2A z WYDANIE.md”**. Agent zrobi:
   - **usuwanie konta razem z danymi w bazie** (w aplikacji i na stronie `regioorbit.com/usun-konto`): wymóg Apple
     i Google, bez tego sklepy odrzucą aplikację,
   - **logowanie kodem SMS** (w testach był kod dowolny),
   - **zdjęcia w bazie** (widoczne dla innych), **czaty** i **powiadomienia**, jeśli mają być na start,
   - **konto demonstracyjne dla recenzentów** Apple i Google (numer + stały kod),
   - **zrzuty ekranu do sklepów** (telefon 6,9 cala dla Apple i zwykłe dla Google) oraz **opisy** po polsku i angielsku,
   - aktualną **politykę prywatności** pod `regioorbit.com/prywatnosc`.
2. Sprawdzasz każdą rzecz na wersji testowej (Vercel + APK), tak jak w części 1E.

✅ **Sprawdź:** w aplikacji testowej **Ja → Usuń konto** usuwa Twój wiersz z Supabase → `profiles`; logowanie SMS
przychodzi na Twój numer (po części 2C).

📦 **Gotowe:** aplikacja spełnia wymagania sklepów.

---

## Część 2B. Domena regioorbit.com, 15 minut + do 24 godzin czekania

🧰 **Części:** konto Hostinger (masz), karta płatnicza. **Zaloguj się:** `hpanel.hostinger.com`, `vercel.com`.

🔧 **Montaż**

1. Hostinger → **Domeny** → **Kup domenę** → wpisz `regioorbit.com` → jest wolna → **Dodaj do koszyka** → zapłać
   (zaznacz ochronę prywatności WHOIS, jest zwykle w cenie).
   Zajęta? Nie kupuj innej na własną rękę: napisz agentowi, jaką bierzesz, zmieni adres w całej aplikacji.
2. Vercel → projekt `regioorbit` → **Settings** → **Billing** (albo baner *Upgrade*) → **Pro**. (Hobby nie pozwala na
   użytek komercyjny. Wolisz za darmo: Cloudflare Pages, [WDROZENIE.md](WDROZENIE.md), etapy 2–3; pliki są gotowe.)
3. Vercel → **Settings** → **Domains** → **Add Domain** → `regioorbit.com` → zaznacz propozycję dodania też
   `www.regioorbit.com` z przekierowaniem → **Add**.
4. Vercel pokaże rekordy DNS do ustawienia (typ, nazwa, wartość). Zostaw tę kartę otwartą.
5. Hostinger → **Domeny** → `regioorbit.com` → **DNS / Serwery nazw** → **Rekordy DNS**. Dla każdego rekordu z Vercela:
   **Dodaj rekord** → wpisz dokładnie *Typ*, *Nazwa* (`@` oznacza samą domenę), *Wartość* → **Dodaj**. Jeśli istnieje
   stary rekord `A` dla `@` albo `CNAME` dla `www` (np. strona parkingowa Hostingera), **usuń** go.
6. Czekasz. Vercel przy domenie pokaże **Valid Configuration** (zwykle po 10–60 minutach, czasem do 24 godzin).
   Certyfikat HTTPS Vercel ustawi sam.

✅ **Sprawdź:** `https://regioorbit.com` otwiera stronę Regioorbit z kłódką w pasku adresu, `https://www.regioorbit.com`
przekierowuje na `https://regioorbit.com`.

📦 **Gotowe:** Twoja domena prowadzi na stronę. Na razie jeszcze z bazą testową: to zmieniamy w części 2C.

---

## Część 2C. Baza produkcyjna i gałąź `main`, 40 minut

🧰 **Części:** konto Supabase, konto Twilio (twilio.com: **Account SID**, **Auth Token**, **Messaging Service SID**,
to sekrety), adres `https://regioorbit.com`. **Zaloguj się:** `supabase.com`, `vercel.com`, `github.com`, `twilio.com`.

🔧 **Montaż**

1. Supabase → **New project**: `regioorbit-prod`, nowe hasło (menedżer haseł), **Central EU (Frankfurt)**, plan **Pro**.
2. Powtórz część 1A, kroki **3, 4 i 5** (rozszerzenia, tajny klucz, migracje 0001–0006) w nowym projekcie.
3. **Authentication → Sign In / Providers**:
   - **Allow anonymous sign-ins**: **wyłącz**,
   - **Phone** → **Enable Phone provider** → *SMS provider*: **Twilio** → wpisz *Account SID*, *Auth Token*,
     *Message Service SID* → **Save**.
4. **Authentication → URL Configuration** → *Site URL*: `https://regioorbit.com` → **Save**.
5. **Project Settings → API Keys**: skopiuj Project URL i Publishable key **nowego** projektu (podpisz w menedżerze
   haseł: „PROD”).
6. **Gałąź `main` = wersja dla ludzi.** GitHub → **Pull requests** → **New pull request** → *base*: `main`,
   *compare*: `claude/p2p-rental-marketplace-bimvf6` → **Create pull request** → zielony ✓ → **Merge pull request**.
   Od teraz: agent pracuje na swojej gałęzi, a do ludzi trafia to, co Ty scalisz do `main`.
7. Vercel → **Settings** → **Environments** → **Production** → *Branch Tracking*: `main` → **Save**.
   Od tej chwili adres `regioorbit.vercel.app` pokazuje wersję produkcyjną. Testy przenosimy pod osobny adres (krok 8).
8. **Osobny adres testowy:** Vercel → **Settings** → **Domains** → **Add Domain** → `regioorbit-test.vercel.app`
   (zajęty: dopisz końcówkę, np. `regioorbit-test-mk.vercel.app`) → *Environment*: **Preview**, *Git Branch*:
   `claude/p2p-rental-marketplace-bimvf6` → **Save**. Potem **Settings** → **Deployment Protection** →
   *Vercel Authentication*: **Disabled** → **Save** (inaczej testerzy musieliby mieć konto w Vercel).
   To jest nowy **adres testowy**: wpisz go w GitHub → **Variables** → `VITE_SITE_URL` i wyślij testerom (wersję
   z przeglądarki instalują jeszcze raz z nowego adresu).
9. Vercel → **Settings** → **Environment Variables**. Ustaw osobne wartości dla środowisk (przy edycji zmiennej
   odznaczasz/zaznaczasz *Production* i *Preview*):
   | Key | Production | Preview (testy) |
   |---|---|---|
   | `VITE_SUPABASE_URL` | Project URL **PROD** | Project URL test |
   | `VITE_SUPABASE_ANON_KEY` | Publishable key **PROD** | Publishable key test |
   | `VITE_SITE_URL` | `https://regioorbit.com` | adres testowy |
   | `VITE_AUTH` | `sms` | (puste) |
   | `SITE_ANDROID_URL` | usuń, gdy aplikacja jest w Google Play | link do APK |
10. Vercel → **Deployments** → najnowsze z gałęzi `main` → **⋯** → **Redeploy**; to samo dla najnowszego z gałęzi agenta.
11. GitHub → **Settings → Secrets and variables → Actions → Variables** → dodaj (dla sklepów; APK testowe dalej używa
    bazy testowej):
    | Name | Value |
    |---|---|
    | `PROD_SUPABASE_URL` | Project URL PROD |
    | `PROD_SUPABASE_ANON_KEY` | Publishable key PROD |
    | `PROD_SITE_URL` | `https://regioorbit.com` |
    | `PROD_AUTH` | `sms` |

✅ **Sprawdź**

- `https://regioorbit.com/app/` → rejestracja z prawdziwym SMS-em → **Ja** → `live`.
- Supabase **regioorbit-prod** → `profiles`: Twój wiersz. W **regioorbit-test** go nie ma.
- Supabase prod → **Database → Backups**: widać codzienne kopie.

📦 **Gotowe:** strona produkcyjna z własną bazą i logowaniem SMS. PWA na produkcji już działa (część 2F tylko sprawdza).
Teraz sklepy.

---

## Część 2D. Google Play (Android), 2 godziny pracy + 14 dni testu zamkniętego

🧰 **Części**

| Co | Skąd |
|---|---|
| Konto Google Play Console (zweryfikowane) | play.google.com/console/signup, 25 USD; Google poprosi też o potwierdzenie, że masz telefon z Androidem (aplikacja Play Console) |
| Komputer z Javą (do klucza wysyłki) | Android Studio ma Javę; albo poproś agenta o inny sposób |
| Przepływ „Google Play” (od agenta) | GitHub → **Actions** |
| 12 testerów z kontem Google | znajomi z etapu 1 (wymóg dla kont osobistych) |

**Zaloguj się:** `play.google.com/console`, `console.cloud.google.com`, `github.com`.

🔧 **Montaż**

1. **Aplikacja w konsoli:** Play Console → **Utwórz aplikację** → nazwa `Regioorbit`, język domyślny polski,
   **Aplikacja**, **Bezpłatna** → zaznacz oświadczenia → **Utwórz aplikację**.
2. **Klucz do wysyłki** (raz na zawsze). Na komputerze, w terminalu:
   ```
   keytool -genkeypair -v -keystore regioorbit-upload.jks -alias upload -keyalg RSA -keysize 4096 -validity 10000
   ```
   Podaj hasło (menedżer haseł), imię i nazwisko, resztę możesz pominąć **Enter**, na końcu `tak`/`yes`.
   Plik `regioorbit-upload.jks` trzymaj poza repozytorium + kopia w bezpiecznym miejscu (np. zaszyfrowany dysk).
3. **Plik zakodowany do GitHuba:** Windows (PowerShell): `[Convert]::ToBase64String([IO.File]::ReadAllBytes("regioorbit-upload.jks")) | Set-Clipboard`;
   Mac: `base64 -i regioorbit-upload.jks | pbcopy`; Linux: `base64 -w0 regioorbit-upload.jks`. Wynik masz w schowku.
4. GitHub → **Settings → Secrets and variables → Actions** → zakładka **Secrets** → **New repository secret**, cztery razy:
   | Name | Secret |
   |---|---|
   | `ANDROID_UPLOAD_KEYSTORE_BASE64` | zawartość schowka z kroku 3 |
   | `ANDROID_UPLOAD_KEYSTORE_PASSWORD` | hasło pliku z kroku 2 |
   | `ANDROID_UPLOAD_KEY_ALIAS` | `upload` |
   | `ANDROID_UPLOAD_KEY_PASSWORD` | hasło klucza (to samo, jeśli nie podawałeś osobnego) |
5. **Pierwsza paczka (ręcznie, wymóg Google):** GitHub → **Actions** → **Google Play** → **Run workflow** →
   *Use workflow from*: `main` → zaznacz **Tylko zbuduj plik .aab** → **Run workflow** → po ok. 6 minutach otwórz
   przebieg → **Artifacts** → `regioorbit-play-…` → pobierz i rozpakuj (w środku `app-release.aab`).
6. Play Console → **Testowanie** → **Testy wewnętrzne** → **Utwórz nową wersję** → zostaw **Podpisywanie aplikacji
   przez Google Play** → wgraj `app-release.aab` → **Dalej** → **Zapisz** → **Opublikuj wersję** (wewnętrzną).
7. **Automatyczna wysyłka na przyszłość (konto usługi):**
   1. console.cloud.google.com → u góry wybór projektu → **Nowy projekt** `regioorbit-play` → **Utwórz**.
   2. Menu → **Interfejsy API i usługi** → **Biblioteka** → `Google Play Android Developer API` → **Włącz**.
   3. Menu → **Administracja** (IAM) → **Konta usługi** → **Utwórz konto usługi** → nazwa `github-play` → **Gotowe**.
   4. Kliknij to konto → **Klucze** → **Dodaj klucz** → **Utwórz nowy klucz** → **JSON** → plik się pobierze.
   5. Play Console → **Użytkownicy i uprawnienia** → **Zaproś nowych użytkowników** → adres konta usługi
      (`github-play@…iam.gserviceaccount.com`) → uprawnienia do aplikacji Regioorbit: **Wydawanie wersji** → **Zaproś**.
   6. GitHub → **Secrets** → `PLAY_SERVICE_ACCOUNT_JSON` = cała treść pliku JSON (otwórz w Notatniku, skopiuj).
      Potem plik JSON usuń z komputera.
8. **Testerzy wewnętrzni:** Play Console → **Testy wewnętrzne** → **Testerzy** → **Utwórz listę** → e-maile (Gmail)
   → **Zapisz** → skopiuj **link do dołączenia** i wyślij testerom.
9. **Test zamknięty (warunek konta osobistego):** **Testowanie** → **Test zamknięty** → **Utwórz ścieżkę** albo użyj
   *Alpha* → testerzy: co najmniej **12 osób**, które klikną link i zainstalują aplikację → wersja: GitHub → **Actions →
   Google Play → Run workflow** → *track*: `alpha` → **Run**. Testerzy muszą mieć aplikację przez **14 dni z rzędu**.
   (Konto firmowe z numerem D-U-N-S nie ma tego wymogu.)
10. **Wizytówka sklepu:** **Rozwój** → **Wizytówka sklepu**: nazwa, krótki opis (do 80 znaków), pełny opis, ikona
    512×512, grafika 1024×500, min. 2 zrzuty ekranu telefonu (wszystko od agenta, część 2A) → **Zapisz**.
11. **Zawartość aplikacji** (**Zasady → Zawartość aplikacji**), każdy punkt po kolei: polityka prywatności
    (`https://regioorbit.com/prywatnosc`), dostęp do aplikacji (konto demonstracyjne z części 2A), reklamy, ocena treści
    (kwestionariusz), grupa docelowa (18+), bezpieczeństwo danych (lokalizacja przybliżona, numer telefonu, treści
    użytkownika; agent da ściągawkę), usuwanie konta (`https://regioorbit.com/usun-konto`).
12. **Linki do aplikacji:** **Testowanie i wydania → Integralność aplikacji → Podpisywanie aplikacji** → skopiuj
    *Odcisk certyfikatu SHA-256* → wyślij agentowi (to nie jest sekret). Agent dopisze go do strony, wtedy linki
    `regioorbit.com/l/…` otwierają aplikację.
13. **Produkcja:** po 14 dniach **Panel** → **Złóż wniosek o dostęp do wersji produkcyjnej** → odpowiedz na pytania
    o test → po akceptacji: GitHub → **Actions → Google Play → Run workflow** → *track*: `production` → **Run**.
    Przegląd Google trwa zwykle od kilku godzin do kilku dni.

✅ **Sprawdź:** tester z linku instaluje Regioorbit ze Sklepu Play; po **Run workflow** dostaje aktualizację; na końcu
aplikację można znaleźć w Sklepie Play po nazwie.

📦 **Gotowe:** Android ze sklepu, z automatycznymi aktualizacjami. Agent wpisze link do Google Play na stronę
(`site/stores.json`), a w Vercel usuń `SITE_ANDROID_URL` dla *Production* (część 2C, krok 9).

> Od 2027 roku Google wymaga, żeby także pliki APK instalowane spoza sklepu pochodziły od zweryfikowanego dewelopera.
> Konto z tej części to załatwia.

---

## Część 2E. App Store (iPhone), 2 godziny pracy + 1–3 dni przeglądu

🧰 **Części**

| Co | Skąd |
|---|---|
| Apple ID z weryfikacją dwuetapową | appleid.apple.com |
| Apple Developer Program (zatwierdzony) | developer.apple.com/programs/enroll, 99 USD/rok |
| Projekt iPhone'a i przepływ „iOS” (od agenta) | folder `ios/` i GitHub → **Actions → iOS**. Mac nie jest potrzebny: GitHub buduje na swoim Macu |
| Zrzuty i opisy | od agenta (część 2A) |

**Zaloguj się:** `developer.apple.com/account`, `appstoreconnect.apple.com`, `github.com`.

🔧 **Montaż**

1. **Identyfikator aplikacji:** developer.apple.com/account → **Certificates, IDs & Profiles** → **Identifiers** → **+**
   → **App IDs** → **Continue** → **App** → **Continue** → *Description*: `Regioorbit`, *Bundle ID*: **Explicit**,
   `com.regioorbit.app` → **Continue** → **Register**.
2. **Team ID:** developer.apple.com/account → **Membership details** → *Team ID* (10 znaków) → menedżer haseł.
3. **Aplikacja w App Store Connect:** appstoreconnect.apple.com → **Apps** → **+** → **New App**: *Platforms* **iOS**,
   *Name* `Regioorbit` (zajęta: `Regioorbit – okolica`), *Primary Language* **Polish**, *Bundle ID*
   `com.regioorbit.app`, *SKU* `regioorbit-ios`, *User Access* **Full Access** → **Create**.
4. **Klucz API dla GitHuba:** App Store Connect → **Users and Access** → **Integrations** → **App Store Connect API**
   (za pierwszym razem **Request Access**, zatwierdza właściciel konta) → **Team Keys** → **+** → *Name* `GitHub Actions`,
   *Access* **Admin** → **Generate** → **Download** (plik `AuthKey_XXXX.p8`, **da się pobrać tylko raz**).
   Na tej samej stronie skopiuj **Issuer ID** (nad tabelą) i **Key ID** (w wierszu klucza).
5. GitHub → **Settings → Secrets and variables → Actions → Secrets** → cztery nowe:
   | Name | Secret |
   |---|---|
   | `APPLE_TEAM_ID` | Team ID z kroku 2 |
   | `APPSTORE_API_KEY_ID` | Key ID |
   | `APPSTORE_API_ISSUER_ID` | Issuer ID |
   | `APPSTORE_API_KEY_P8` | cała treść pliku `.p8` (otwórz w Notatniku, razem z liniami `BEGIN` i `END`) |

   Plik `.p8` przenieś do menedżera haseł (jako załącznik) i usuń z folderu Pobrane.
6. **Wysyłka do TestFlight:** GitHub → **Actions** → **iOS** → **Run workflow** → *Use workflow from*: `main` → zaznacz
   **Wyślij do TestFlight** → **Run workflow**. Trwa 20–30 minut. Czerwony krok? Skopiuj agentowi ostatnie linie
   z czerwonego kroku: ta część pierwszy raz działa na Twoim koncie Apple i może wymagać poprawki.
7. **TestFlight (testy na iPhone'ach):** App Store Connect → **Regioorbit** → **TestFlight**. Wersja pojawi się po
   5–30 minutach (*Processing*).
   - **Internal Testing** → **+** → grupa `Zespół` → dodaj siebie (osoby z dostępem do App Store Connect) → od razu.
   - **External Testing** → **+** → grupa `Znajomi` → **Testers** → **+** → e-maile albo **Enable Public Link** →
     **Builds** → **+** wybierz wersję → wypełnij *Test Information* (opis, e-mail do uwag, konto demonstracyjne)
     → **Submit for Review** (pierwszy raz ok. 1 dnia).
   - Tester: instaluje aplikację **TestFlight** z App Store → otwiera zaproszenie → **Install**.
8. **Strona w App Store:** **Regioorbit** → **App Store** → wersja **1.0 Prepare for Submission**:
   - *Screenshots* **iPhone 6.9"** (1290 × 2796 px, 3–10 sztuk, od agenta),
   - *Promotional Text*, *Description*, *Keywords*, *Support URL* `https://regioorbit.com`,
   - *Build* → **+** → wybierz wersję z TestFlight,
   - *App Review Information*: imię, telefon, e-mail, **Sign-in required** → konto demonstracyjne, *Notes*: krótko,
     jak działa aplikacja (agent da tekst po angielsku).
9. Lewe menu, każda pozycja po kolei:
   - **App Information**: *Category* `Lifestyle` (druga `Social Networking`), *Age Rating* (kwestionariusz),
   - **App Privacy**: *Privacy Policy URL* `https://regioorbit.com/prywatnosc` + **Data Types** (agent da ściągawkę,
     te same dane co w Google),
   - **Pricing and Availability**: **Free**, kraje (na start Polska + UE),
   - **Business** (umowy) i **status przedsiębiorcy (DSA)** dla Unii Europejskiej: wypełnij zgodnie z prawdą
     (firma albo osoba prywatna).
10. **Add for Review** → **Submit to App Review**. Przegląd trwa zwykle 1–3 dni. Odrzucenie? Wklej agentowi treść
    wiadomości od Apple.
11. **Linki do aplikacji na iPhonie:** wyślij agentowi Team ID (to nie jest sekret). Agent uzupełni
    `apple-app-site-association` i ustawienia projektu, żeby `regioorbit.com/l/…` otwierał aplikację.

✅ **Sprawdź:** iPhone testera instaluje Regioorbit przez TestFlight, potem z App Store po wpisaniu nazwy.

📦 **Gotowe:** iPhone ze sklepu. Agent wpisze link do App Store na stronę (`site/stores.json`).

> **Znane różnice na iPhonie** (wersja 1.0): mikrofon w polu wyszukiwania pojawi się w kolejnej wersji (na Androidzie już
> jest); czytanie na głos działa.

---

## Część 2F. PWA (aplikacja z przeglądarki) na produkcji, 10 minut

🧰 **Części:** iPhone, telefon z Androidem, komputer.

🔧 **Montaż:** to ta sama aplikacja co w części 1D, tylko pod `https://regioorbit.com/app/`. Zainstaluj ją na trzech
urządzeniach dokładnie jak w części 1D.

✅ **Sprawdź**

- `https://regioorbit.com/pobierz` na Androidzie prowadzi do Google Play, na iPhonie do App Store, na komputerze
  pokazuje kod QR.
- Zainstalowana PWA otwiera się bez paska adresu, a po wyłączeniu internetu nadal pokazuje ostatnio otwarte ekrany.

📦 **Gotowe:** trzy drogi do Regioorbit: Google Play, App Store i przeglądarka.

---

## Część 2G. Dzień startu (lista kontrolna)

- [ ] `main` ma zielony ✓, Vercel *Production* pokazuje najnowszy commit z `main`.
- [ ] Aplikacja ze Sklepu Play i z App Store zainstalowana na 3 telefonach, rejestracja SMS działa, **Ja** → `live`.
- [ ] Supabase prod: **Backups** włączone, **Settings → Billing → Usage**: alert wydatków ustawiony.
- [ ] Limity wydatków: Anthropic (jeśli AI), Twilio (np. 20 USD miesięcznie na start).
- [ ] Zgłoszenia błędów: adres `hello@regioorbit.com` działa (Hostinger → **E-maile**), w aplikacji **Ja → Diagnostyka**.
- [ ] Regulamin i polityka prywatności aktualne ([WDROZENIE.md](WDROZENIE.md), etap 0).
- [ ] Ogłoszenie startu ([MARKETING.md](MARKETING.md)).

📦 **Podsumowanie etapu 2.** Gotowe: domena `regioorbit.com`, baza produkcyjna z kopiami i SMS-em, aplikacja w Google
Play i w App Store, PWA. Dalej pracujesz w pętli: agent robi zmianę na swojej gałęzi → sprawdzasz na wersji testowej
(`regioorbit-test.vercel.app`, APK testowe) → scalasz do `main` (strona aktualizuje się sama) → **Actions → Google Play** i
**Actions → iOS** wysyłają nowe wersje do sklepów.

---

## Co gdzie jest (ściągawka)

| Rzecz | Adres |
|---|---|
| Kod, przepływy, APK | `github.com/marlow3189/WhatsThat` → **Actions**, **Releases** |
| APK testowe (zawsze najnowsze) | `github.com/marlow3189/WhatsThat/releases/tag/android-test` |
| Strona testowa | etap 1: `regioorbit.vercel.app`; od części 2C: `regioorbit-test.vercel.app` (dokładne adresy: Vercel → projekt → *Domains*) |
| Strona produkcyjna | `regioorbit.com` |
| Bazy | supabase.com → `regioorbit-test`, `regioorbit-prod` |
| Google Play | play.google.com/console |
| App Store | appstoreconnect.apple.com |

## Gdy coś nie działa

| Objaw | Przyczyna | Co zrobić |
|---|---|---|
| Na dole **Ja** jest `demo`, a nie `live` | brak zmiennych albo strona/APK zbudowane przed ich dodaniem | sprawdź nazwy zmiennych (1B krok 5, 1C krok 1), potem **Redeploy** w Vercel albo **Run workflow** dla APK |
| Vercel: czerwone *Error* przy wdrożeniu | błąd budowania | wdrożenie → **Build Logs** → skopiuj ostatnie 30 linii agentowi |
| „Nie udało się zapisać w bazie: …” | limit 2 ogłoszeń w miesiącu albo brakuje migracji | dla testów: **Ja → Wyloguj** i nowe konto; inny tekst błędu: wyślij agentowi |
| Testerzy nie widzą swoich wpisów | mieszkają dalej niż ok. 20 km albo ogłoszenie było tylko dla znajomych | to samo województwo bez GPS (1E krok 2), przy ogłoszeniu **Kto zobaczy? → Wszyscy** |
| Baza testowa nie odpowiada po przerwie | darmowy projekt Supabase usypia się po tygodniu bez ruchu | Supabase → projekt → **Restore project** |
| APK się nie instaluje | stara aplikacja Miliorbit albo Automatyczna blokada Samsunga | 1C kroki 5–6 albo wersja z przeglądarki (1D) |
| Biały ekran albo „Aplikacja się nie uruchomiła” | błąd przy starcie | przycisk **Uruchom ponownie**; tekst z ekranu albo **Ja → Diagnostyka → Kopiuj** wyślij agentowi |
| Przepływ **iOS** albo **Google Play** czerwony | brak albo literówka w sekrecie | czerwony krok mówi, którego sekretu brakuje; popraw w GitHub → **Secrets** i **Run workflow** jeszcze raz (nowy przebieg, nie *Re-run* starego) |

Szczegóły techniczne i dalsze kroki rozwoju: [PLAN.md](PLAN.md). Testy na telefonie i emulatorze: [START.md](START.md).
Formalności, ochrona, płatności: [WDROZENIE.md](WDROZENIE.md).
