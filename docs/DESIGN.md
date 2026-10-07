# Miliorbit: wygląd

Dwa motywy, przełączane w **Ja → Ustawienia → Wygląd** (zapisane na koncie). Kolory są tokenami w `src/index.css`;
komponenty używają tylko tokenów (`bg-primary`, `hero`, `tile-1…5`), więc nowy motyw to nowy blok zmiennych.

| Token | Kolorowy (domyślny, od v6) | Niebieski (v5, zapamiętany) |
|---|---|---|
| tło | `#f1f2f4` neutralna szarość | `#f3f6fb` chłodny błękit |
| karty | białe, promień 20–28 px | białe, promień 20–28 px |
| tekst | `#121316` | `#141b2d` |
| przyciski i aktywna zakładka | czarne `#121316` | niebieskie `#2e5bff` |
| karta-bohater (Twoja orbita, polecenia) | pomarańczowy gradient `#e4400c → #ff7a32`, biały tekst tylko duży i pogrubiony | niebieski `#2e5bff` |
| kwadraty ikon | nasycone: niebieski `#3a43e0`, zielony `#1aa34a`, czerwony `#ef4423`, pomarańczowy `#ff8a1f`, czarny; białe ikony | pastelowe z ciemną ikoną |
| akcent (Polecane, zaproszenia) | pomarańcz `#ff6b2c`, ciemny tekst (kontrast 6:1) | żółty `#ffd66b`, ciemny tekst |
| znak | czarny kwadrat, biała orbita, pomarańczowa kropka | żółty kwadrat, ciemna orbita, niebieska kropka |

Inspiracje: v5 — styl aplikacji medycznych (DocSpot, Phenomenon Product); v6 — dashboard finansowy „Elegostra”
(neutralne tło, czarne przyciski, kolorowe kwadraty ikon, pomarańczowa karta z wnioskami).

Zasady wspólne: font Manrope, jeden jasny motyw (bez ciemnego), duże dotykowe pola (min. 44 px), poziome rzędy
przewijane palcem, myszką i strzałkami, kontrast tekstu co najmniej 4.5:1 na białym, ruch ograniczony przy
`prefers-reduced-motion`.
