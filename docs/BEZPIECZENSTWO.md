# Orbifolk: bezpieczeństwo

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
| Transport | HTTPS wszędzie, HSTS z preload | ✅ `public/_headers`, ☐ zgłoszenie na hstspreload.org |
| Przeglądarka | CSP (tylko nasze skrypty + piksele po zgodzie), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy | ✅ `public/_headers` |
| XSS | React escapuje treść; brak `dangerouslySetInnerHTML`; linki z czatu jako tekst | ✅ |
| Dane | Row Level Security na każdej tabeli; tylko funkcje serwerowe zmieniają statusy płatności i sporów | ✅ migracje, ☐ Security Advisor bez ostrzeżeń |
| Sekrety | klucze tylko w sekretach Supabase/Cloudflare; `.env` w `.gitignore`; GitHub secret scanning | ✅ / ☐ włączyć push protection |
| Nadużycia | limity zapytań (`hit_limit`): SMS, wiadomości, ogłoszenia, zgłoszenia | ✅ funkcja w `0002_safety.sql`, ☐ podpiąć w Edge Functions |
| Boty i DDoS | Cloudflare WAF, Bot Fight Mode, Turnstile | ☐ |
| Płatności | dane kart nigdy nie dotykają naszych serwerów (Stripe Elements / BLIK u operatora), weryfikacja podpisu webhooka | ☐ przy etapie 4 |
| Zależności | `npm audit` w CI, cotygodniowy PR z aktualizacjami | ✅ CI, ☐ Routine |
| Kod | przegląd bezpieczeństwa (`/security-review`) przed wdrożeniem | ☐ nawyk |
| Kopie | codzienne kopie bazy (Supabase Pro), test odtworzenia raz na kwartał | ☐ |
| Dziennik | `audit_log`: logowania, zastrzeżenia, decyzje moderatorów | ✅ tabela, ☐ zapisy z funkcji |
| Administratorzy | 2FA na Cloudflare, Supabase, Stripe, GitHub, Google; osobne konto admina | ☐ |

## 3. Prywatność

- Książka adresowa nie trafia na serwer (porównujemy skróty numerów), numer telefonu ukryty przed obcymi.
- Piksele marketingowe tylko po zgodzie, bez danych osobowych w zdarzeniach, reklamy bez profilowania.
- Dane w UE (Frankfurt). Usunięcie konta w ustawieniach; dane DAC7 przechowujemy tyle, ile wymaga prawo.

## 4. Bezpieczeństwo w okolicy (alerty sąsiedzkie)

- Zaginione zwierzę, zbiórka, znaleziona rzecz: **zawsze za darmo**, nie liczą się do limitu, powiadomienie dla okolicy.
- Nie podajemy dokładnego adresu domu: na mapie punkt jest przybliżony, adres dopiero w czacie.
- Aplikacja nie zastępuje 112. Przy zagrożeniu życia: 112.

## 5. Gdy coś się stanie

1. Zablokuj (Cloudflare: *Under Attack Mode*; Supabase: wyłącz rejestrację; Stripe: wstrzymaj wypłaty).
2. Zmień klucze (rotacja w Supabase i Stripe), wyloguj sesje.
3. Sprawdź `audit_log`, logi Cloudflare i Supabase.
4. Naruszenie danych osobowych: zgłoszenie do UODO w ciągu 72 h, informacja dla osób, których dotyczy.
