# Regioorbit: marketing i harmonogram filmów (pod Higgsfield)

Cel: rozpocząć w jednym powiecie i rosnąć przez polecenia. Płatne reklamy dopiero wtedy,
gdy w okolicy jest co najmniej 300 ogłoszeń.

## 0. Jak podpiąć Higgsfield

Higgsfield ma **oficjalny serwer MCP** (od 30 kwietnia 2026): `https://mcp.higgsfield.ai/mcp`, logowanie przez
przeglądarkę (OAuth), bez klucza API. Daje dostęp do ponad 30 modeli obrazu i wideo (m.in. Kling, Veo, Minimax Hailuo, Soul).
Z tej sesji nie mogę się z nim połączyć: connectory wczytują się na starcie sesji, a sieć tego środowiska blokuje
zewnętrzne adresy.

Jak podpiąć:
1. Wejdź na **claude.ai/customize/connectors** → „Dodaj własny connector” → adres `https://mcp.higgsfield.ai/mcp`
   → zaloguj się do Higgsfield.
2. Otwórz **nową sesję** i napisz np. „Wygeneruj film F2 z docs/MARKETING.md”. Opisy scen poniżej są gotowe do użycia.
3. W Claude Code w terminalu to samo jednym poleceniem: `claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp`.

Bez connectora: skopiuj pole **Prompt** do Higgsfield, ustaw format 9:16 i długość podaną przy filmie.

Zasady dla wszystkich filmów:
- Format pionowy **9:16**, 8–15 s, pierwsze 2 sekundy to haczyk, napisy zawsze na ekranie (większość ogląda bez dźwięku).
- Bez prawdziwych logo cudzych marek i bez wizerunku prawdziwych osób.
- Oznaczaj filmy jako wygenerowane przez AI (TikTok i Meta tego wymagają, a w UE wymaga tego też AI Act).
- Na końcu: znak Regioorbit (planeta z kropką na orbicie) + „regioorbit.com” + „Pierwszy rok za darmo”.

## 1. Filary treści

| Filar | Obietnica | Dla kogo |
|---|---|---|
| **Piwnica = pieniądze** | „Zarobiłem 600 zł na rzeczach, których nie używam” | każdy z garażem, piwnicą, szafą |
| **Od rolnika bez pośrednika** | „Zapłaciłem BLIK-iem, jajka czekały spakowane” | mieszkańcy przedmieść, rolnicy |
| **Pożycz od sąsiada** | „Przyczepka od sąsiada zamiast wypożyczalni” | rodziny, działkowcy, majsterkowicze |
| **Bez oszustów** | „Zastrzegasz numer jednym przyciskiem, znajomi dostają ostrzeżenie” | wszyscy, których zniechęciły oszustwa „na kuriera” |
| **Sezon** | to, czego ludzie szukają w danym miesiącu | jak w kalendarzu niżej |

## 2. Filmy gotowe do wygenerowania

Każdy film: **Prompt** (do Higgsfield), **Napis** (na ekranie), **Lektor** (opcjonalnie), **Koniec** (CTA).

### F1. Piwnica = pieniądze (12 s)
- **Prompt:** Vertical 9:16, handheld smartphone look, warm evening light. A man in his 30s opens a cluttered basement in a Polish apartment block, pulls out a camping tent, a power drill and a child's bike, photographs each with his phone. Quick cut: his phone screen shows three notifications sliding in. Final shot: he smiles at the phone on the staircase. Natural, documentary style, no text in the image.
- **Napis:** „Moja piwnica zarobiła 600 zł w miesiąc” → „Namiot 25 zł/dzień · Wiertarka 20 zł/dzień”
- **Lektor:** „Nie sprzedałem nic. Po prostu pożyczam sąsiadom za drobne.”
- **Koniec:** „Pierwszy rok za darmo. Regioorbit.”

### F2. Jajka czekały spakowane (10 s)
- **Prompt:** Vertical 9:16, early autumn morning on a small Polish farm, an older farmer in a flannel shirt packs a carton of eggs and a bag of potatoes into a paper bag, writes a first name on it with a marker. Cut to a woman arriving by car, the farmer hands her the bag at the gate, both nod. Soft golden light, realistic, no logos.
- **Napis:** „Zapłaciłam BLIK-iem w aplikacji” → „Pan Józef dostał powiadomienie i spakował”
- **Koniec:** „Od rolnika, bez pośrednika. Regioorbit.”

### F3. Rolnik: jak wystawić (15 s, dla sprzedających)
- **Prompt:** Vertical 9:16, close-up of a farmer's weathered hands holding a smartphone in a barn, taking a photo of a crate of apples, then typing with one thumb. Cut to the farmer loading crates on a small trailer. Calm, honest, documentary feel.
- **Napis:** „Zdjęcie, cena za kg, godziny odbioru. Gotowe.” → „Klient płaci z góry, Ty tylko pakujesz” → „0% prowizji”
- **Koniec:** „Regioorbit. Dla tych, co sprzedają z podwórka.”

### F4. Przyczepka od sąsiada (10 s)
- **Prompt:** Vertical 9:16, suburban Polish street, Saturday morning. A neighbor hitches a small car trailer to another man's hatchback, they shake hands. Cut to the trailer full of garden waste. Bright daylight, friendly mood.
- **Napis:** „Wypożyczalnia: 150 zł” → „Sąsiad z Regioorbit: 20 zł za dzień i pomógł podpiąć”
- **Koniec:** „Pożycz od kogoś obok.”

### F5. Zastrzeż numer (12 s, filar „Bez oszustów”)
- **Prompt:** Vertical 9:16, a young woman on a tram realizes her phone is missing, panic. Cut: she borrows a friend's phone, opens a website, taps a single red button. Cut: three different people in different places glance at a phone notification and nod. Cinematic but realistic, muted colors.
- **Napis:** „Zgubiłaś telefon?” → „Jedno kliknięcie: konto zastrzeżone, znajomi ostrzeżeni” → „Odblokujesz tylko z dwiema zaufanymi osobami”
- **Koniec:** „Bezpieczniej, bo wśród swoich. Regioorbit.”

### F6. Wyprzedaż garażowa (10 s)
- **Prompt:** Vertical 9:16, sunny Saturday, a family sets out books, toys and bikes on tables in front of a garage in a Polish suburb, neighbors walk up holding phones, a kid sells a scooter. Warm, lively, handheld.
- **Napis:** „Sobota 9–14, ul. Lipowa” → „Sąsiedzi dostali powiadomienie”
- **Koniec:** „Zrób wyprzedaż garażową w Regioorbit.”

### F7. Komunia bez kombinowania (12 s, kwiecień–maj)
- **Prompt:** Vertical 9:16, a garden party for a First Communion in Poland, white tablecloths on folding tables, a party tent, kids in white robes running. Cut to a man unloading folding chairs from a neighbor's van the day before. Bright spring light.
- **Napis:** „Namiot, stoły, 40 krzeseł” → „Wszystko od ludzi z okolicy, za ułamek ceny”
- **Koniec:** „Imprezy i uroczystości w Regioorbit.”

### F8. Kwatery dla ekipy (10 s, B2B)
- **Prompt:** Vertical 9:16, a construction foreman in a hi-vis vest looks at his phone next to a van, cut to a tidy shared house with simple single beds and a shared kitchen, workers arriving in the evening. Realistic, practical tone.
- **Napis:** „Kwatery dla 12 osób, 10 km od budowy” → „Wyszukane w promieniu, zarezerwowane w 2 minuty”
- **Koniec:** „Nieruchomości i kwatery w Regioorbit.”

### F9. Vinted, ale lokalnie (8 s)
- **Prompt:** Vertical 9:16, a young woman hands a folded winter jacket to another woman outside an apartment building entrance, quick smile, no packaging, no courier. Urban Polish autumn.
- **Napis:** „Bez paczkomatu, bez czekania” → „Kurtka zmieniła właściciela w 15 minut”
- **Koniec:** „Moda z drugiej ręki, obok Ciebie.”

### F10. Usługi od sąsiadów (10 s)
- **Prompt:** Vertical 9:16, montage: a woman cleaning a bright kitchen, a teenager mowing a lawn, a retired man fixing a bike for a kid. Each scene 2 seconds, friendly natural light.
- **Napis:** „Sprzątanie · koszenie · złota rączka” → „Od ludzi, których znają Twoi znajomi”
- **Koniec:** „Usługi w Regioorbit.”

### F11. Twoja orbita rośnie (8 s, polecenia)
- **Prompt:** Vertical 9:16, a woman needs a drill, scrolls her phone and sighs; she sends an invite to neighbours in a building group chat; cut to the next day, a neighbour knocks and hands her a drill. Cozy evening light, realistic, no logos.
- **Napis:** „Zaproś sąsiadów” → „Następnym razem znajdziesz obok”
- **Koniec:** „Regioorbit. Lepiej ze swoimi.”

### F12. Ukraińska wersja (10 s)
- **Prompt:** jak F2 albo F10, z bohaterką mówiącą po ukraińsku.
- **Napis (UK):** „Купуй і продавай поруч. Від друзів і сусідів.” → „Без комісії”
- **Koniec:** „Regioorbit — українською теж.”

### Polecenia i pomiar
- **Bez nagród pieniężnych.** W aplikacji „Siła Twojej orbity”: pasek 0–100, poziom („Rośnie”, „Dobrze”…),
  ile kroków planu załatwisz u swoich („3 z 5”) i czego w okolicy brakuje („nikt nie oferuje: Elektronika”).
  Psychologia zamiast nagrody: korzyść dla siebie (szybciej i bliżej), widoczny postęp, konkretna luka do zapełnienia.
  Komunikat w filmach: „Zaproś sąsiadów, następnym razem znajdziesz obok”.
- **Kod QR** (Ja → Kod QR aplikacji) prowadzi na `regioorbit.com/pobierz`: Android → Google Play, iPhone → App Store,
  komputer → przeglądarka. Plakaty z QR: drzwi piekarni, warzywniaka, składu opału, tablica ogłoszeń w bloku,
  stacja paliw („Sprawdź ceny paliw obok”).
- Każdy link z kampanii ma UTM (`?utm_source=tiktok&utm_campaign=piasek`); piksele GA4, Meta i TikTok liczą
  rejestracje i zakupy po zgodzie użytkownika. Konfiguracja: [WDROZENIE.md](WDROZENIE.md), etap 5.
- Kampanie płatne optymalizuj pod zdarzenie **CompleteRegistration** (Meta, TikTok) albo `sign_up` (Google).

### F13. „Piasek” (10 s, planer AI, główny film marki)
- **Prompt:** Vertical 9:16, a man in work gloves looks at a muddy driveway, types on his phone. Cut to a bright, friendly phone UI (no real brand logos) showing three steps with small avatars: sand, a plate compactor, a paver. Cut to a neighbour rolling a compactor over the fence and a small tipper truck dumping sand. Warm afternoon light, realistic, light and colourful, no logos.
- **Napis:** „Chcę wybrukować podjazd” → „Piasek: skład 2 km” → „Zagęszczarka: Marek” → „Brukarz: znajomy Marka”
- **Koniec:** „Twoja orbita. Regioorbit.”

### F14. Kosiarka sąsiada (8 s)
- **Prompt:** Vertical 9:16, overgrown lawn, a woman sighs, scrolls her phone, cut to the neighbour two houses away handing her a petrol lawn mower over the gate, both smile. Summer evening, realistic.
- **Napis:** „Kosiarka? 400 m od Ciebie” → „20 zł za dzień”
- **Koniec:** „Pożycz od kogoś obok. Regioorbit.”

## 3. Kalendarz (październik 2026 – wrzesień 2027)

| Miesiąc | Motyw | Filmy | Akcja offline |
|---|---|---|---|
| Październik | wykopki, jabłka, przetwory, przeprowadzki studentów | F2, F3, F1 | plakaty QR w 30 klatkach, 10 rolników na start |
| Listopad | drewno opałowe, opony zimowe, wymiana garderoby | F3, F9, F5 | stoisko na targu w sobotę |
| Grudzień | choinki od rolnika, sprzęt na sylwestra, prezenty z drugiej ręki | F2, F9, F11 | konkurs „najlepszy prezent z drugiej ręki” |
| Styczeń | narty i sanki, wyprzedaże po świętach | F1, F6 | |
| Luty | ferie, sprzęt zimowy, korepetycje przed egzaminami | F10, F1 | |
| Marzec | ogród, rowery, wiosenne porządki | F4, F10 | plakaty QR, druga runda |
| Kwiecień | Wielkanoc (jaja, święconka), wyprzedaże garażowe | F2, F6, F7 | „Weekend wyprzedaży garażowych” w gminie |
| Maj | komunie, wesela, sadzonki | F7, F3 | współpraca z parafią / domem kultury |
| Czerwiec | truskawki, camping, wesela | F2, F4 | |
| Lipiec | kajaki, SUP, przyczepki, boxy dachowe, kwatery dla sezonowych | F4, F8 | |
| Sierpień | wakacje, kwatery, sprzęt turystyczny | F8, F1 | |
| Wrzesień | szkoła: podręczniki, ubrania, rowery dziecięce | F9, F6, F11 | wymiana podręczników w szkołach |

Rytm: **3 filmy tygodniowo** (TikTok, Reels, Shorts), ten sam film na trzy platformy.

## 4. Offline i grupy lokalne

**Plakat QR na klatkę schodową** (A5, czarno-biały, tanio):
> **Masz wiertarkę? Sąsiad z 3. piętra też.**
> Pożycz, kup albo oddaj komuś z bloku.
> [kod QR] regioorbit.com · pierwszy rok za darmo

Warianty: „Jajka od rolnika 5 km stąd, płacisz BLIK-iem” · „Zgubiłeś telefon? Zastrzeż konto jednym kliknięciem”.

**Grupy na Facebooku** („Oddam/sprzedam [miejscowość]”, „Ogłoszenia [gmina]”): wrzucamy prawdziwe ogłoszenia
z linkiem do Regioorbit, nie reklamę. Najlepiej robią to sami użytkownicy przyciskiem **Wyślij** po opublikowaniu.

**Rolnicy:** 10 gospodarstw w powiecie, rozmowa na miejscu, pomoc we wstawieniu pierwszych ogłoszeń,
plan roczny gratis na pierwszy rok w zamian za plakat przy bramie.

## 5. Co mierzyć

| Kanał | Wskaźnik | Cel na start |
|---|---|---|
| Plakaty QR | wejścia z kodu na plakat | ≥ 5 w miesiąc |
| Filmy | koszt pozyskania instalacji (gdy płatne) | ≤ 4 zł |
| Polecenia | współczynnik K (ile nowych osób przyprowadza jedna) | ≥ 0,3 |
| Rolnicy | zamówienia opłacone w aplikacji / gospodarstwo / tydzień | ≥ 5 |
| Całość | płacący plan roczny / aktywni | 5–8% |
