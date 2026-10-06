# WhatsThat

Mikro-wynajem, pożyczanie, wymiana i sprzedaż rzeczy. **Najpierw znajomym, potem w okolicy.**

- **Krąg 1, znajomi** (kontakty z telefonu): bez opłat.
- **Krąg 2, znajomi znajomych**: widzisz, przez kogo się znacie; 5% opłaty.
- **Krąg 3, market**: promień km, miasto, województwo albo cały kraj; 10% opłaty, kaucja i ochrona.

Koncept, konkurencja, cennik, kierunki zarobku, plan startu i marketing: **[docs/BIZNES.md](docs/BIZNES.md)**.

## Uruchomienie

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # testy opłat, odległości i kręgów
npm run build          # dist/ — web/PWA i webDir dla Capacitora
npm run build:preview  # dist-preview/index.html — cała aplikacja w jednym pliku
```

Prototyp działa bez backendu: dane demo są w `src/data/seed.ts`, a zmiany zapisują się w pamięci przeglądarki.
Przycisk „Przywróć dane demo” w zakładce **Ja** czyści wszystko.

## Android i iOS

```bash
npx cap add android    # raz; wymaga Android Studio
npx cap add ios        # raz; wymaga macOS i Xcode
npm run cap:android
npm run cap:ios
```

## Struktura

| Ścieżka | Co tam jest |
|---|---|
| `src/lib/fees.ts` | cennik i wycena: opłata serwisowa, ochrona, kaucja, koszt płatności |
| `src/lib/circles.ts` | kręgi zaufania z grafu znajomości, wskaźnik zaufania |
| `src/lib/geo.ts` | odległości (haversine), filtr: promień, miasto, województwo, kraj |
| `src/data/store.tsx` | stan aplikacji (ogłoszenia, rezerwacje, czaty) |
| `src/screens/` | Odkrywaj, Ogłoszenie, Dodaj, Czaty, Krąg, Ja, Protokół zdjęć |
| `supabase/migrations/0001_init.sql` | schemat produkcyjny: PostGIS, `circle_of`, `listings_nearby`, RLS, widok DAC7 |
| `capacitor.config.ts` | konfiguracja aplikacji mobilnych |
