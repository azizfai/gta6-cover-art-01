# Vice City Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/azizfai/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/azizfai/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your own photo into a GTA-style multi-panel cover — a Vice City sunset poster with bold caption lettering — and export it as a PNG to share. Built for the [gta6-cover-art-01 bounty](https://make.fun/bounty/gta6-cover-art-01) on make.fun (entries close 21 Nov 2026, 17:30 WIB).

Referral: p5tm223q

## What it does

- **Any photo:** upload up to 3 photos from your machine (or use the two included sample photos). Photos are read locally and never uploaded anywhere.
- **Multi-panel posters:** three layouts — Hero + 2 side panels, a four-panel grid, or a single full-bleed photo — plus a "one photo across all panels" mode that slices one photo across the poster.
- **Crop and position:** drag each photo inside its panel in the live preview, or use the per-panel zoom slider.
- **Caption:** big title + tagline, editable text, title size and position (in the sunset band, or over the top photo).
- **Colour grades:** Vice Sunset, Neon Nights, Palm Noir and Golden Hour — each tints the photos and repaints the caption band.
- **Own drawn art:** the retro slit sun, palm silhouettes, skyline, halftone dots, film grain and vignette are all drawn by the app's code — no borrowed artwork, no Rockstar logo, art or fonts.
- **Fast export:** one click exports a PNG in 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## Run it

The app is static files under `app/` with no build step and no network requests — serve it with any static server:

```sh
node serve.ts
# open http://localhost:8080
```

Screenshot scenes for the entry: `?shot=editor` shows the studio with a sample photo loaded, `?shot=cover&size=1920x1080` shows a cover alone (also `layout`, `grade`, `title`, `tagline`, `photo`, `photo2`, `single` query knobs).

## Files

- `app/index.html`, `app/style.css` — the studio page and its styling.
- `app/src/main.js` — editor wiring: photos, layouts, grades, drag-to-position, export.
- `app/src/cover.js` — the cover renderer: panels, grades, caption lettering.
- `app/src/art.js` — drawn art: retro sun, palms, skyline, halftone, grain, vignette.
- `app/src/grades.js` — the four colour-grade presets.
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots.
- `app/samples/` — two sample photos made for make.fun with an image model, free to use.
- `main.ts` — hands the entry in: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.
- `screenshots/` — the entry's four screenshots, taken from this app.

## License

MIT — see [LICENSE](LICENSE).
