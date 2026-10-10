# Regioorbit: bezpieczeństwo

Cel: aplikacja z pieniędzmi i numerami telefonów musi wytrzymać typowe ataki. Poniżej warstwy ochrony,
co już jest w kodzie (✅) i co trzeba włączyć przy wdrożeniu (☐). Szczegóły kroków: [WDROZENIE.md](WDROZENIE.md).

## 1. Ludzie i oszustwa (najczęstsze w ogłoszeniach)

| Zagrożenie | Ochrona |
|---|---|
| „Kurier OLX”: link do fałszywej płatności | ✅ ostrzeżenie przy linkach w czacie, ✅ płatność tylko w aplikacji, ☐ blokada skróconych linków po stronie serwera |
| Sprzedający bierze pieniądze i nie wydaje | ✅ Bezpieczna płatność: pieniądze czekają u operatora do kodu odbioru, ✅ zgłoszenie problemu wstrzymuje wypłatę, ✅ zwrot w sporze |
| Wynajmujący nie oddaje / psuje | ✅ kaucja jako blokada na karcie, ✅ zdjęcia z datą przy wydaniu i zwrocie, ✅ 48 h na zgłoszenie szkody, ☐ opcjonalne ubezpieczenie wynajmu (partner) |
| Właściciel nie oddaje kaucji | ✅ kaucję zwalnia system po potwierdzeniu zwrotu; spór przechodzi do mediacji |
| Przejęte konto (kradzież telefonu, SIM swap) | ✅ zastrzeżenie numeru jednym przyciskiem, ✅ odblokowanie przez 2 zaufane osoby, ✅ ostrzeżenie dla znajomych, ☐ passkey po pierwszym logowaniu |
| Fałszywe konta | ✅ numer telefonu + SMS, ✅ odświeżenie konta płatne raz w roku, ☐ Turnstile przy rejestracji, ☐ limit kont na urządzenie |
| Wyłudzanie nagród za polecenia | ✅ każdy numer liczy się raz, ☐ nagroda dopiero gdy część zaproszonych otworzy link (tabela `invites`) |

## 2. Aplikacja i serwer

| Warstwa | Co | Stan |
|---|---|---|
| Transport | HTTPS wszędzie, HSTS z preload | ✅ `site/_headers`, ☐ zgłoszenie na hstspreload.org |
| Przeglądarka | CSP (tylko nasze skrypty + piksele po zgodzie), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy; strona główna bez skryptów inline | ✅ `site/_headers` |
| XSS | React escapuje treść; brak `dangerouslySetInnerHTML`; linki z czatu jako tekst | ✅ |
| Dane | Row Level Security na każdej tabeli; tylko funkcje serwerowe zmieniają statusy płatności i sporów | ✅ migracje, ☐ Security Advisor bez ostrzeżeń |
| Sekrety | klucze tylko w sekretach Supabase/Cloudflare; `.env` w `.gitignore`; GitHub secret scanning | ✅ / ☐ włączyć push protection |
| Nadużycia | limity zapytań (`hit_limit`): SMS, wiadomości, ogłoszenia, zgłoszenia | ✅ funkcja w `0002_safety.sql`, ☐ podpiąć w Edge Functions |
| Boty i DDoS | Cloudflare WAF, Bot Fight Mode, Turnstile (wymaga serwerów nazw Cloudflare, wariant A z etapu 2) | ☐ |
| Linki do aplikacji | `/.well-known/assetlinks.json` i `apple-app-site-association` z `Content-Type: application/json`, bez przekierowań; tylko ścieżki `/l/`, `/u/`, `/z/`, `/sos`, `/zastrzez` | ✅ pliki, ☐ odciski certyfikatu i Team ID |
| Płatności | dane kart nigdy nie dotykają naszych serwerów (Stripe Elements / BLIK u operatora), weryfikacja podpisu webhooka | ☐ przy etapie 4 |
| Zależności | `npm audit` w CI, cotygodniowy PR z aktualizacjami | ✅ CI, ☐ Routine |
| Kod | przegląd bezpieczeństwa (`/security-review`) przed wdrożeniem | ☐ nawyk |
| Kopie | codzienne kopie bazy (Supabase Pro), test odtworzenia raz na kwartał | ☐ |
| Dziennik | `audit_log`: logowania, zastrzeżenia, decyzje moderatorów | ✅ tabela, ☐ zapisy z funkcji |
| Administratorzy | 2FA na Cloudflare, Supabase, Stripe, GitHub, Google; osobne konto admina | ☐ |

## 3. Prywatność

- Książka adresowa nie trafia na serwer: telefon wysyła tylko skróty SHA-256 numerów (bez imion), funkcja
  `match_contacts` (`0004_identity_sos.sql`) porównuje je z kontami, niczego nie zapisuje i ma limit 5 dopasowań na dobę
  i 3000 numerów naraz. Uczciwie: skrót numeru da się odgadnąć próbując wszystkich numerów, dlatego limit i brak zapisu
  są obowiązkowe (to minimalizacja danych, nie pełna anonimizacja).
- **Anonimowy klucz** (np. `anonymplm4829175530`): „anonym” + kraj + płeć + 10 cyfr z HMAC-SHA-256 numeru z sekretem
  w Supabase Vault. Cyfry nie są numerem i bez sekretu nie da się go odtworzyć; klucz liczy tylko serwer (wyzwalacz
  `profiles_identity`). Wersja z pełnym numerem w kluczu ujawniałaby numer każdemu, kto zobaczy awatar, dlatego jej nie ma.
- **Płeć** (m, w, x = nie podaję) ustawiana raz; zmianę blokuje baza, poprawia tylko pomoc (sprostowanie, art. 16 RODO).
- Piksele marketingowe tylko po zgodzie, bez danych osobowych w zdarzeniach, reklamy bez profilowania.
- Dane w UE (Frankfurt). Usunięcie konta w ustawieniach; dane DAC7 przechowujemy tyle, ile wymaga prawo.

## 3a. Prywatność na mapie orbity

- Znajomych widzisz z imienia; znajomych znajomych i sąsiadów pod pseudonimem albo „Osoba #n” z kierunkowym i dwiema
  pierwszymi cyframi numeru. Firmy z nazwy.
- Położenie osób prywatnych serwer zaokrągla do ok. 300 m (`orbit_people` w `0003_local.sql`); dokładny adres tylko w czacie.
- Adres do wysyłek podajesz dopiero przy pierwszej wysyłce; sprzedawca widzi go po opłaceniu takiego zamówienia.
- Ceny paliw od stacji przyjmujemy tylko z kluczem (przechowujemy skrót SHA-256), z limitem 60 zapytań na godzinę
  i kontrolą zakresu cen; zgłoszenia kierowców z limitem 20 dziennie na osobę.

## 4. Bezpieczeństwo w okolicy (alerty sąsiedzkie i SOS)

- **SOS**: najpierw przycisk 112; alarm wymaga przytrzymania 2 s i ma 3 s na anulowanie (mniej fałszywych alarmów).
  Trafia do maks. 5 wybranych osób i do sąsiadów, którzy sami zgodzili się pomagać (do 1 km, maks. 30 osób). Konto
  zastrzeżone wysyła tylko do bliskich. Limit 3 alarmów na godzinę (`send_sos`). Dokładne położenie usuwamy po 24 h,
  wpis o alarmie po 30 dniach. Bez internetu: SMS z linkiem do mapy.
- **Zdarzenia SOS nigdy nie trafiają do pikseli reklamowych** (to dane o zdrowiu i bezpieczeństwie).
- **„Odprowadź mnie”**: lokalizacja na żywo tylko dla wybranych osób, maks. 3 godziny, wyłącza się sama; w aplikacji
  zawsze widać pasek, że trwa udostępnianie.
- **Tablica okolicy**: odpowiedzi na pytania z limitem 30 na godzinę; numery telefonów prosimy podawać w czacie.

- Zaginione zwierzę, zbiórka, znaleziona rzecz: **zawsze za darmo**, nie liczą się do limitu, powiadomienie dla okolicy.
- Nie podajemy dokładnego adresu domu: na mapie punkt jest przybliżony, adres dopiero w czacie.
- Aplikacja nie zastępuje 112. Przy zagrożeniu życia: 112.

## 5. Gdy coś się stanie

1. Zablokuj (Cloudflare: *Under Attack Mode*; Supabase: wyłącz rejestrację; Stripe: wstrzymaj wypłaty).
2. Zmień klucze (rotacja w Supabase i Stripe), wyloguj sesje.
3. Sprawdź `audit_log`, logi Cloudflare i Supabase.
4. Naruszenie danych osobowych: zgłoszenie do UODO w ciągu 72 h, informacja dla osób, których dotyczy.
