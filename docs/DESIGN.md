# Miliorbit: wygląd

Dwa motywy, przełączane w **Ja → Wygląd** (zapisane na koncie). Kolory są tokenami w `src/index.css`;
komponenty używają tylko tokenów (`bg-primary`, `bg-primary-soft`, `hero`, `tile-1…5`), więc nowy motyw to nowy blok zmiennych.

## Układ (od wersji 0.8, wzorowany na WhatsAppie / Material 3)

- **Dolne menu:** płaski biały pasek na całą szerokość z cienką linią u góry, 64 px + margines paska gestów.
  5 zakładek w zasięgu kciuka: **Okolica** (domyślna, główny pulpit), **Szukaj**, **Dodaj**, **Czaty**, **Ja**.
  Aktywna zakładka: „pigułka” 56×32 px w kolorze `primary-soft` pod ikoną, ikona wypełniona, podpis pogrubiony.
  **Dodaj** ma zawsze pigułkę w kolorze marki (najważniejsza czynność). Licznik nieprzeczytanych na Czatach.
  Pasek niczego nie zasłania (treść ma dolny margines), zakładki przełączają się od razu, bez animacji.
- **Górny pasek:** na zakładkach tytuł 22 px po lewej i ikony po prawej (na Okolicy: znak + „Miliorbit” w kolorze marki,
  SOS, dzwonek); na podstronach strzałka wstecz (48×48 px) i tytuł 18 px obok niej, biały pasek z linią.
- **Pole „Co dziś załatwiamy?”** jak „Zapytaj Meta AI albo szukaj” w WhatsAppie: szara pigułka 48 px, obok okrągły
  przycisk mikrofonu w kolorze marki. Pod nim podpowiedzi AI (kafelki 48 px).
- **Filtry** (tablica okolicy, podkategorie): pigułki `fill`, aktywna `primary-soft` z tekstem w kolorze marki.
- **Marginesy ekranu:** Android 15+ i iPhone rysują aplikację pod paskami systemu. Wszystko, co klikalne, zaczyna się
  poniżej paska stanu (`--sat`) i powyżej paska gestów (`--sab`); pod paskiem stanu jest tło, nie treść.
- **Proporcje:** przyciski główne 48 px, pola 48 px z cienką ramką, wiersze list 52 px, karty z promieniem 20 px,
  odstępy boczne 16 px. Dotykowe pola nigdy mniejsze niż 44 px.
- **Czcionka:** systemowa, jak w WhatsAppie: Roboto na Androidzie, SF Pro na iPhonie, Noto Sans Devanagari dla hindi.
  Nie pobieramy żadnych fontów (szybszy start).

## Kolory

| Token | Miliorbit (domyślny, od 0.8) | Niebieski (zapamiętany z v5) |
|---|---|---|
| tło | `#f4f5f7` | `#f3f6fb` |
| karty i paski | białe | białe |
| tekst / drugi plan | `#111b21` / `#5f6b76` | `#141b2d` / `#64708a` |
| marka: przyciski, aktywna zakładka, tytuł | indygo `#3a43e0` | niebieski `#2e5bff` |
| pigułka aktywna (`primary-soft`) | `#e4e6ff` | `#e3ecff` |
| kwadraty ikon | indygo, zielony `#16a34a`, czerwony `#ef4423`, pomarańczowy `#ff8a1f`, fiolet `#8b3fd9`; białe ikony | pastelowe z ciemną ikoną |
| akcent (Polecane, zaproszenia) | pomarańcz `#ff6b2c` | żółty `#ffd66b` |
| SOS i błędy | czerwony `#d0311b` | `#c4231f` |
| znak | indygo kwadrat, biała orbita, pomarańczowa kropka | żółty kwadrat, ciemna orbita, niebieska kropka |

Zasady wspólne: jeden jasny motyw (ciemny w planie), kontrast tekstu co najmniej 4.5:1 na białym, poziome rzędy
przewijane palcem, myszką i strzałkami, ruch ograniczony przy `prefers-reduced-motion`.

Inspiracje: WhatsApp (Material 3: pigułki, płaski pasek, czcionka systemu), wcześniej DocSpot (v5) i „Elegostra” (v6).
