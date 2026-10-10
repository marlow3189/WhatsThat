# Mapa aplikacji Regioorbit (wersja 0.9)

Jedna zasada: **pięć zakładek na dole, każda odpowiada na jedno pytanie**. Wszystko inne jest o jedno stuknięcie
dalej z tych pięciu miejsc. Kciuk sięga dolnego menu, a najczęstsze rzeczy (Dodaj, SOS, kalendarz) są zawsze na wierzchu.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ OKOLICA (start)        „Co dzieje się obok mnie i co mam dziś do zrobienia?”  │
│  ├─ nagłówek: ☰ menu · Regioorbit · SOS · Powiadomienia                       │
│  ├─ okrągłe skróty: znajomi z nowościami, Mapa, Zaproś                        │
│  ├─ pole „Co dziś załatwiamy?” + mikrofon  → Szukaj z planerem AI             │
│  ├─ 4 kolorowe kafle: Poproś o pomoc · Pożycz narzędzie · Wydarzenie · Tablica│
│  ├─ ostrzeżenia (IMGW, NINA…) z „Jestem bezpieczny/a”                         │
│  ├─ Kalendarz: dziś i jutro                                                   │
│  ├─ Gmina: komunikaty zweryfikowanych instytucji i wywóz śmieci               │
│  ├─ Alerty z okolicy (zaginione zwierzęta, zbiórki)                           │
│  ├─ Tablica okolicy: Pomoc · Pytania · Wydarzenia · Praca                     │
│  ├─ „Zaplanuj z AI”: 5 gotowych celów (podjazd, jajka, ogród, opał, przeprowadzka)│
│  ├─ Twoja orbita (mapa ludzi wokół), Na co dzień (paliwo, opał, ulubieni)     │
│  └─ Nowe od znajomych, Sąsiedzi, Twoje ogłoszenia, Twoje zainteresowania      │
├──────────────────────────────────────────────────────────────────────────────┤
│ SZUKAJ                 „Kto obok ma to, czego potrzebuję?”                     │
│  ├─ pole + mikrofon, krąg (znajomi / ich znajomi / wszyscy), zasięg, rodzaj   │
│  ├─ kategorie → podkategorie → wyniki (lista albo mapa)                       │
│  └─ plan AI: kroki z ofertami, „Przeczytaj” na głos, trasa przez punkty       │
├──────────────────────────────────────────────────────────────────────────────┤
│ DODAJ (+)              „Chcę coś dać, sprzedać, wynająć albo zapytać”          │
│  ├─ Sąsiedzi za darmo: Poproś o pomoc · Zapytaj · Wydarzenie · Zaginione     │
│  └─ Ogłoszenie: rodzaj → kategoria → opis i cena → kto zobaczy → Opublikuj    │
├──────────────────────────────────────────────────────────────────────────────┤
│ CZATY                  „Z kim jestem umówiony?”                                │
│  └─ rozmowy przy ogłoszeniach i zamówieniach, zdjęcia, ostrzeżenie o linkach  │
├──────────────────────────────────────────────────────────────────────────────┤
│ JA                     „Moje konto i ustawienia”                               │
│  ├─ profil i anonimowy klucz, SOS (bliscy, sąsiedzi pomocnicy)                │
│  ├─ Kalendarz, Moje ogłoszenia, Zamówienia, Mój stragan, Płatności            │
│  ├─ Znajomi i zaproszenia, Kod QR, Paliwa, Konto instytucji (gmina)          │
│  ├─ Język, Wygląd, Region, Zainteresowania, Powiadomienia, Prywatność        │
│  └─ Diagnostyka (do zgłaszania błędów), Regulamin, Wyloguj                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Ekrany poza zakładkami (otwierane z nich)

| Ekran | Skąd | Adres |
|---|---|---|
| SOS | czerwony przycisk na Okolicy, Ja | `#/sos` |
| Kalendarz (prywatny) | menu ☰, karta „Dziś”, Ja | `#/kalendarz` |
| Powiadomienia | dzwonek na Okolicy | `#/powiadomienia` |
| Ogłoszenie | każdy kafelek | `#/l/:id` |
| Profil osoby | z ogłoszenia, orbity | `#/u/:id` |
| Zamówienie | z ogłoszenia, Ja → Zamówienia, kalendarza | `#/zamowienie/:id` |
| Czat | z ogłoszenia, zamówienia | `#/czat/:id` |
| Paliwa | Na co dzień, Ja | `#/paliwa` |

## Menu ☰ (lewy górny róg Okolicy)

Kalendarz, Moje ogłoszenia, Zamówienia, Znajomi, Mapa, Paliwa, Kod QR, Ustawienia i SOS. To te same miejsca co w **Ja**,
tylko bliżej kciuka.

## Cztery kolorowe kafle na Okolicy

| Kafel | Kolor | Co robi |
|---|---|---|
| Poproś o pomoc | brzoskwinia | otwiera Dodaj → „Poproś o pomoc” (za darmo, widzą sąsiedzi) |
| Pożycz narzędzie | żółty | otwiera Szukaj w kategorii Narzędzia (znajomi najpierw) |
| Wydarzenie | zieleń | otwiera Dodaj → „Wydarzenie” |
| Tablica okolicy | błękit | przewija do wpisów z okolicy niżej na ekranie |

Niżej zostaje rząd **„Zaplanuj z AI”**: gotowe cele („Wybrukować podjazd”, „Jajka od znajomych”…), które otwierają
Szukaj z planem krok po kroku.

## Zasady układu

1. **Najważniejsze na górze, codzienne niżej:** pilne (ostrzeżenia, SOS) → moje (kalendarz) → okolica (gmina,
   alerty, tablica) → oferty (orbita, znajomi, sąsiedzi) → moje ogłoszenia.
2. **Jeden kciuk:** dolne menu, główne przyciski kroków przyklejone nad menu, przycisk „Dodaj” zawsze kolorowy.
3. **Znajomi najpierw:** w każdym wyniku najpierw znajomi, potem ich znajomi, potem reszta okolicy.
4. **Prywatność widoczna:** kalendarz tylko dla Ciebie, obcy widzą Twój anonimowy klucz, nie numer.
