# Regioorbit: wygląd

Kolory są tokenami w `src/index.css`; komponenty używają tylko tokenów (`bg-primary`, `bg-primary-soft`, `text-primary-strong`,
`tile-1…5`, `bg-peach`, `bg-sun`, `bg-mint`, `bg-sky`), więc zmiana palety to zmiana jednego bloku zmiennych.
Drugi motyw (Niebieski) zostaje do wyboru w **Ja → Wygląd**.

## Paleta (identyfikacja Regioorbit, od wersji 0.9)

| Rola | Kolor | Gdzie |
|---|---|---|
| Tło (kremowo-beżowe) | `#F7F3EC` | tło całej aplikacji i strony |
| Akcent główny (ciepły pomarańcz / brzoskwinia) | `#E88958` | przycisk „+”, główne przyciski, znak, licznik |
| Słoneczny żółty (ciepło) | `#F5D061` | kafel „Pożycz narzędzie”, akcent, kropka znaku |
| Przyjazna zieleń (społeczność, wzrost) | `#95C17E` | kafel „Wydarzenie”, przełączniki, znak |
| Jasny błękit (zaufanie) | `#D3E6F3` | kafel „Tablica okolicy”, mapa |
| Karty | `#FFFFFF` | wpisy, listy, formularze |
| Tekst / drugi plan | `#2D2620` / `#6E645A` | ciepła czerń i szarość |

**Czytelność:** biały tekst na `#E88958` ma kontrast tylko 2,6:1 (wymagane 4,5:1, WCAG AA i Europejski akt o dostępności),
dlatego na pomarańczowych przyciskach jest ciemny tekst `#2D1608` (6,6:1). Tekst w kolorze marki na jasnym tle ma ciemniejszy
odcień `#A84F25` (5:1). Ikony na pastelowych kaflach mają ciemniejsze odcienie tej samej barwy (min. 3:1).
Znak i napis „Regioorbit” zostają w czystych kolorach (logo jest zwolnione z wymogu kontrastu).

## Czcionka

**Nunito** (zaokrąglona, przyjazna, jak w identyfikacji), dołączona do aplikacji (bez Google Fonts, działa offline).
Dla hindi system dobiera Noto Sans Devanagari.

## Układ (wzór: wizualizacja Regioorbit)

- **Górny pasek Okolicy:** ☰ menu po lewej, znak i „Regioorbit”, po prawej SOS i dzwonek z licznikiem.
- **Okrągłe skróty** pod paskiem: znajomi z nowościami (kolorowy pierścień = nowe), Mapa, Zaproś.
- **Pole „Co dziś załatwiamy?”** z mikrofonem (AI i głos).
- **Cztery kolorowe kafle 2×2** z przyciskiem w kształcie pigułki: Poproś o pomoc (brzoskwinia), Pożycz narzędzie
  (żółty), Wydarzenie (zieleń), Tablica okolicy (błękit).
- **Wpisy z okolicy** jak posty: awatar, kto i kiedy, tytuł, kilka słów, zdjęcie po prawej.
- **Dolny pasek:** zaokrąglony u góry, 4 zakładki z ikoną i podpisem + **duże pomarańczowe „+” na środku**, podniesione
  nad pasek. Pasek zawsze nad systemowymi przyciskami telefonu (`--sab`), góra ekranu poniżej paska stanu (`--sat`).
- **Menu ☰:** kalendarz, moje ogłoszenia, zamówienia, znajomi, mapa, paliwa, kod QR, ustawienia, SOS.
- **Proporcje:** przyciski 44 px, pola 44 px, karty z promieniem 18–20 px, odstępy boczne 16 px; na telefonach węższych
  niż 390 px cały interfejs zmniejsza się proporcjonalnie.

Mapa wszystkich ekranów: [MAPA.md](MAPA.md).
