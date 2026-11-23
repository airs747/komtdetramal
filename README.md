# Komt de tram al?

Meldpunt voor storingen op de Amstelveenlijn (lijn 6 en 25), een initiatief van CDA Amstelveen.

## Hoe het werkt

* Reizigers melden via een Google Formulier. De antwoorden komen in een privé Google Sheet.
* Een apart, gepubliceerd Google Sheet haalt met `IMPORTRANGE` en `QUERY` alleen de goedgekeurde meldingen op, zonder contactgegevens. Dat tabblad is gepubliceerd als csv.
* Deze site (Astro) leest die csv live uit in de browser. Tijdens het bouwen wordt hij ook opgehaald, als reserve voor het geval het live ophalen mislukt.
* Meldingen zonder tekst (van voor het nieuwe formulier) tellen mee in de cijfers en de grafiek, maar staan niet in de lijst.

De links naar de csv en het formulier staan in `src/lib/config.ts`.

## Lokaal draaien

```
npm install
npm run dev
```

## Publiceren via Cloudflare Pages

1. Cloudflare dashboard › Workers & Pages › Create › Pages › Connect to Git, kies `airs747/komtdetramal`.
2. Framework preset: Astro. Build command: `npm run build`. Output directory: `dist`.
3. Daarna onder Custom domains `komtdetramal.nl` en `www.komtdetramal.nl` toevoegen.

Elke push naar `main` zet de site automatisch opnieuw online.
