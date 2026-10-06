# Obok: koncept, model biznesowy i plan startu

> **Obok** to codzienny, lokalny handel między ludźmi: sprzedaż, odsprzedaż, wyprzedaże garażowe,
> wynajem, usługi, wymiana i oddawanie za darmo. Najpierw wśród znajomych z telefonu, potem
> znajomi znajomych, potem okolica: promień w km, miejscowość, województwo albo cały kraj.
> Konto to numer telefonu. Bez haseł, bez prowizji.

Nazwa robocza w kodzie siedzi w jednym pliku: `src/config.ts`.

---

## 1. Nazwa: werdykt

### Dlaczego nie „WhatsThat” ani nic z „Whats…”
Meta (WhatsApp) systematycznie składa sprzeciwy wobec znaków z przedrostkiem *Whats-*. W rejestrze
sprzeciwów USPTO są m.in. **WHATSAROUND, WHATSGOOD, WHATSPAY, WHATSMINER, WHATSMODE**.
Nasza aplikacja ma czat, kontakty z telefonu i wysyła linki na WhatsAppa, więc argument
„wprowadza w błąd co do powiązania z WhatsApp” byłby u nas wyjątkowo mocny. Do tego „WhatsThat”
to zwykła fraza i nazwa wielu aplikacji (np. do rozpoznawania roślin), więc nie wygramy w wyszukiwarce.

### Rekomendacja: **Obok**
- Mówi dokładnie, o co chodzi: rzeczy, ludzie i usługi *obok* Ciebie. Mikro-regionalność w jednym słowie.
- Pasuje do znajomych („mieszka obok”) i do mapy („obok mnie”).
- Krótka i łatwa do wymówienia po angielsku i niemiecku; dla Ukraińców w Polsce to zrozumiałe, swojskie słowo.
- Znak: dwa koła obok siebie. Bez zieleni i dymka, nic nie przypomina WhatsAppa.

Do sprawdzenia przed rejestracją: domeny `obok.app`, `obok.pl`, `obok.eu`; bazy EUIPO (TMview) i UPRP
w klasach 9, 35, 38, 42. W wyszukiwarce „Obok” to dziś wtyczka do e-booków i amerykańska firma IT,
czyli inne klasy. Uwaga: „Blisko” jest zajęte (aplikacja samorządowa AMM Systems).

| Zapasowe | Za | Przeciw |
|---|---|---|
| **Mamto** („Masz to?” „Mam to.”) | ludzkie, rozmowne, śmieszy | znaczenie zrozumiałe tylko po polsku |
| **Swojsko** | swoi ludzie, swojskie jajka od rolnika | trudne dla obcokrajowców |
| **Tuż** | bardzo krótkie, „tuż obok” | „ż” w domenie i w sklepach z aplikacjami |

## 2. Konkurencja (aktualizacja)

| Kto | Co robi | Czego nie ma, a my mamy |
|---|---|---|
| OLX, Allegro Lokalnie | ogłoszenia ogólne | znajomych, rolnika z płatnością, wynajmu z kalendarzem, ochrony przed oszustwami „na kuriera” |
| Otomoto, mobile.de, Otodom | auta, nieruchomości | codziennych drobnych rzeczy i usług w jednym miejscu |
| Vinted | moda z drugiej ręki | lokalnego odbioru bez wysyłki, innych kategorii |
| FB Marketplace i grupy | społeczność | porządku, bezpieczeństwa, zastrzegania konta |
| **Co Jest Sąsiad** (Google Play) | lokalny portal sąsiedzki: ogłoszenia, czat, SOS | kręgu znajomych z kontaktów, płatności, rolnika, wynajmu |
| **Po sąsiedzku** (App Store) | oddawanie rzeczy za darmo | sprzedaży, wynajmu, usług |
| Hygglo, Pozycz.to | wynajem rzeczy | lokalności i znajomych, Hygglo bierze wysoką prowizję |

**Różnica w jednym zdaniu:** tylko u nas zaczynasz od ludzi, których masz w telefonie, płacisz
w aplikacji bez prowizji i możesz zastrzec konto jednym przyciskiem.

## 3. Tożsamość: „Ty to Ty”, prawie bez logowania

1. **Numer telefonu = konto.** Jeden kod SMS przy pierwszym uruchomieniu, potem urządzenie pozostaje zalogowane.
   W kolejnym kroku klucz dostępu (passkey) zamiast SMS-ów przy zmianie telefonu.
2. **E-mail opcjonalny.** Służy do odzyskania konta i do zastrzeżenia numeru, gdy nie masz telefonu.
3. **Znajomi z kontaktów.** Numery hashowane na telefonie (SHA-256), serwer widzi tylko skróty.
   Znajomość liczy się, gdy *oboje* macie się w kontaktach, więc nikt nie „dopisze się” do Twojego kręgu.
4. **Numer ukryty przed obcymi.** Obcy widzą imię, miejscowość i „zweryfikowany numer”, znajomi widzą, że to Ty.
5. **Język i okolica przy rejestracji:** PL, EN, DE, UK; województwo obowiązkowo, miejscowość albo GPS opcjonalnie.

### Zastrzeżenie numeru (jak zastrzeżenie PESEL)
- **Jeden przycisk w aplikacji** albo strona `obok.app/zastrzez` bez telefonu: kod z e-maila
  albo potwierdzenie od jednej z dwóch zaufanych osób.
- **Działa od razu:** ogłoszenia znikają, z konta nie da się pisać ani przyjmować płatności,
  znajomi dostają ostrzeżenie: „Konto Marka zastrzeżone, jeśli ktoś pisze z niego o pieniądze, nie odpowiadaj”.
- **Odblokowanie:** kod SMS na numer + potwierdzenie od **dwóch zaufanych osób** (wybierasz je w ustawieniach).
  Złodziej telefonu ani osoba, która przejęła kartę SIM, nie odblokuje konta samym SMS-em.
- **Ochrona przed przejęciem karty SIM:** logowanie na nowym urządzeniu wstrzymuje na 24 godziny zmianę konta do wypłat
  i powiadamia zaufane osoby.
- **Ochrona przed oszustwem „na kuriera”:** gdy w czacie pojawia się link, aplikacja ostrzega,
  że płaci się tylko przyciskiem „Zapłać”.

W prototypie działają: zastrzeżenie, odblokowanie przez zaufane osoby, ostrzeżenie znajomych i ostrzeżenie przed linkami
w czacie (Ja → Zastrzeż numer, Zaufane osoby). Schemat bazy ma `restrict_account`, `try_unlock` i `trusted_contacts`.
Blokada 24 h po zalogowaniu na nowym urządzeniu jest opisana do wdrożenia razem z płatnościami.

## 4. Co można wystawić

**Rodzaje:** sprzedaż (nowe, używane, z drugiej ręki, *okazja*), wyprzedaż garażowa (wiele rzeczy, jeden termin
i adres), wynajem, usługa, wymiana, oddam lub pożyczę za darmo.

**Kategorie** (`src/lib/categories.ts`) zebrane z tego, co powtarza się na OLX, Allegro, Otomoto, Otodom i Vinted,
przycięte do spraw lokalnych i codziennych: Od rolnika · Motoryzacja · Nieruchomości (w tym kwatery pracownicze) ·
Usługi · Narzędzia i maszyny (w tym rolnicze) · Dom i ogród · Moda z drugiej ręki · Dziecko · Elektronika ·
Sport i wypoczynek · Imprezy i uroczystości · Zwierzęta · Inne. Każda ma 4–8 podkategorii w 4 językach.

**Nie przytłaczamy:** ekran główny pokazuje tylko „Od znajomych”, wyprzedaże garażowe w okolicy i kilka rzeczy
do 10 km. Kategorie są jedną listą pod „Szukaj”, filtry to trzy rozwijane pola (kto, gdzie, rodzaj).

**Rolnik, krok po kroku:**
1. Wystawia „Jajka, 1,20 zł/szt.” albo „Ziemniaki, 2,50 zł/kg”, podaje zapas i godziny odbioru.
2. Klient wybiera ilość i godzinę odbioru, płaci BLIK-iem.
3. Rolnik dostaje powiadomienie „Płatność od Ani: 13,20 zł” i status **Opłacone**.
4. Pakuje, stuka **Spakowane** i klient dostaje powiadomienie, że może odebrać.
5. Przy odbiorze klient potwierdza **Odebrane**.

## 5. Model biznesowy: łącznik, nie instytucja

| Plan | Cena | Co daje |
|---|---|---|
| **Darmowy** | 0 zł | 3 aktywne ogłoszenia, wszystko poza tym bez ograniczeń: czat, płatności, znajomi |
| **Roczny** | **79 zł / rok** (64,23 zł netto) | bez limitu ogłoszeń, także auta, nieruchomości, kwatery, cały asortyment rolnika |
| Firma (później) | np. 299 zł / rok | faktury, profil firmy, kilka osób na jednym koncie: wypożyczalnie, gospodarstwa, kwatery |

- **0% prowizji od transakcji.** Pieniądze idą od kupującego prosto na konto sprzedającego u operatora płatności.
- **Bonus za polecenia:** 3 zaproszone osoby = 3 miesiące bez limitu.
- Opcjonalnie później: wyróżnienie ogłoszenia, ale tylko jeśli nie zaśmieci wyników.

**Ile to daje.** 10 000 zł miesięcznie = 120 000 zł rocznie ≈ **1 520 osób na planie rocznym**.
Przy założeniu, że płaci 5–8% aktywnych użytkowników (to założenie do sprawdzenia, nie dane), potrzeba
ok. 19–30 tys. aktywnych użytkowników. Jedno województwo może to dać.
Porównanie: model prowizyjny wymagałby ok. 1 100 opłaconych wynajmów miesięcznie, czyli dużo większego ruchu.

**Dlaczego roczna opłata działa:** jedna decyzja raz w roku, nic nie irytuje co miesiąc, tanio w porównaniu
z jednym wyróżnieniem na OLX, a próg 3 ogłoszeń zatrzymuje spam i handlarzy bez opłaty.

## 6. Co znaczy „tylko łącznik” prawnie

| Temat | Jak to rozwiązujemy | Co nadal na nas ciąży |
|---|---|---|
| **Płatności** | Operator z licencją (Stripe Connect z płatnościami prosto na konto sprzedającego albo Przelewy24 dla marketplace'ów). Nie dotykamy pieniędzy, dostajemy tylko potwierdzenie z webhooka, które pokazujemy jako „Opłacone”. | Operator zrobi lekką weryfikację sprzedających (KYC). To jego obowiązek, my podpinamy formularz. |
| **Kaucja** | Między ludźmi: gotówka albo BLIK przy wydaniu. Aplikacja tylko ją zapisuje, a zdjęcia z datą są wspólnym dowodem. | Nic, poza jasnym regulaminem. |
| **Ubezpieczenie** | Nie sprzedajemy. Najwyżej link do partnera (afiliacja). | Nic. |
| **DSA** (akt o usługach cyfrowych) | Regulamin, punkt kontaktowy, zgłaszanie nielegalnych treści i ich usuwanie. | Mikro i małe firmy są zwolnione z części obowiązków platform handlowych, ale nie z podstawowych. |
| **DAC7** | Raport roczny do KAS o sprzedających. | **Bycie łącznikiem nie zwalnia**, jeśli znamy kwoty (a znamy z płatności w aplikacji). Dotyczy sprzedaży towarów (poza osobami z < 30 transakcji i < 2 000 EUR), **najmu nieruchomości (kwatery!)**, najmu środków transportu i usług osobistych. Schemat ma widok `dac7_sellers`. |
| **Omnibus / konsument** | Oznaczenie „Firma” przy sprzedających firmowych. | Przy firmach kupujący ma prawo odstąpienia, między osobami prywatnymi nie. |
| **Rolnik** | Sprzedaż w ramach rolniczego handlu detalicznego to sprawa rolnika. | Informacja w FAQ: mięso, nabiał i przetwory wymagają rejestracji w sanepidzie/inspekcji weterynaryjnej; zwolnienie podatkowe RHD do ustawowego limitu. |
| **RODO** | Kontakty tylko jako skróty, numer ukryty przed obcymi, dane na serwerach w UE. | Rejestr czynności, umowy powierzenia (Supabase, SMS, operator płatności). |

Do potwierdzenia z prawnikiem i doradcą podatkowym przed startem: DSA, DAC7 i regulamin.

## 7. iPhone, Android i strona

**Etap 1: aplikacja ze strony (PWA)**, od pierwszego dnia:
- iPhone: Safari → Udostępnij → „Do ekranu początkowego”. Powiadomienia push działają dla tak zainstalowanych
  aplikacji od iOS 16.4. W UE Apple w 2024 r. wycofało się z wyłączenia tej funkcji.
- Android: Chrome → „Zainstaluj aplikację”. Dodatkowo ta sama aplikacja w Google Play jako
  Trusted Web Activity: tanio, bez przepisywania.
- Link z WhatsAppa czy SMS-a otwiera ogłoszenie od razu, bez instalacji. To klucz do dystrybucji przez grupy.
- Plan roczny kupuje się na stronie, więc nie płacimy Apple ani Google 15–30%.

**Etap 2: App Store**, gdy będzie ruch: kod jest gotowy w Capacitorze (`npm run cap:ios`).
Kupno planu dalej przez stronę (w UE i USA Apple dopuszcza dziś linki do płatności zewnętrznych,
na warunkach, które trzeba sprawdzić w chwili publikacji).

## 8. Wysyłanie linków tam, gdzie są ludzie

Każde ogłoszenie ma przycisk **Wyślij**: WhatsApp, Messenger, SMS, e-mail, kopiuj link.
Po opublikowaniu aplikacja od razu proponuje wysłanie linku na swoje grupy.
Zaproszenia znajomych idą tymi samymi kanałami. WhatsApp i Messenger są dla nas kanałami dystrybucji, nie konkurencją.

Potrzebne w produkcji: publiczne strony ogłoszeń renderowane na serwerze z podglądem (Open Graph:
zdjęcie, tytuł, cena), żeby link na WhatsAppie wyglądał dobrze.

## 9. Plan startu

1. **Walidacja (2–4 tygodnie):** strona z listą oczekujących, 20 rozmów z mieszkańcami jednej gminy,
   5 rozmów z rolnikami sprzedającymi z podwórka, 3 z właścicielami kwater pracowniczych.
2. **Start w jednym powiecie** (np. piaseczyński): rolnicy, wyprzedaże garażowe, narzędzia, kwatery.
   300 ogłoszeń przed reklamą.
3. **Płatności i push** (miesiące 2–4): operator płatności, powiadomienia, strony ogłoszeń z podglądem.
4. **Kolejne powiaty**, potem DE/AT i społeczność ukraińska w PL (język już jest).

Marketing i harmonogram filmów: [MARKETING.md](MARKETING.md).

## 10. Następne kroki w kodzie

1. Supabase: logowanie numerem (SMS), tabele i RLS z `supabase/migrations/0001_init.sql`.
2. Kontakty: `@capacitor-community/contacts` w aplikacji natywnej, w PWA zaproszenia linkiem.
3. Web Push + FCM/APNs, wysyłka z tabeli `notifications` przez Edge Function.
4. Operator płatności: konto sprzedającego, BLIK, webhook → `orders.status = 'paid'`.
5. Strona `/zastrzez` (Edge Function) i publiczne strony ogłoszeń.
6. Panel moderacji i zgłoszeń (DSA).
