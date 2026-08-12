# Sky Hop

[![Play Now](https://img.shields.io/badge/Play-Now-ff6644?style=for-the-badge)](https://tja0308.github.io/Sky-Hop/)

A browser pixel-platformer built with **Phaser 3** and **Vite**. Hop across floating sunset sky-islands across **10 levels**, stomp Pufflings and Wisps, ride moving platforms, grab double-jump power-ups, and reach the Sunset Summit!

## Play Now

**[▶ Play Sky Hop](https://tja0308.github.io/Sky-Hop/)** — no install required, runs in any modern browser.

> If the link 404s, GitHub Pages hasn't been enabled yet: **Settings → Pages → source: `gh-pages` branch** (the branch is created automatically by the deploy workflow after the first push to `main`).

## Quick start (local)

```bash
npm install
node scripts/generate-levels.mjs
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build for production

```bash
node scripts/generate-levels.mjs
npm run build
```

Static files are output to `dist/`. Preview locally with:

```bash
npm run preview
```

## Controls

| Key | Action |
|-----|--------|
| ← → or A D | Move |
| Space / W / ↑ | Jump (hold for higher jump) |
| Enter | Start / confirm |
| Esc / P | Pause menu |
| R | Restart level |
| ↑ ↓ | Menu / world map navigation |

## Features

- **10 levels** across 3 sunset zones with a difficulty curve
- **World map** with unlock progression and star ratings (1–3 ★)
- **Save progress** via localStorage (unlocks, stars, best scores)
- **New mechanics**: moving platforms, double-jump power-ups, Wisp enemies
- **Pause menu**, settings (mute), level intro hints, credits / how-to-play
- **Auto-deploy** to GitHub Pages on push to `main`/`master`

## Deploy

GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and publishes `dist/` to the `gh-pages` branch automatically.

1. Push to `main` or `master`
2. Enable GitHub Pages: repo **Settings → Pages →** source: **`gh-pages`** branch
3. Your game will be live at `https://<username>.github.io/<repo>/`

## Project structure

```
├── index.html
├── package.json
├── vite.config.js
├── .github/workflows/deploy.yml
├── public/assets/tilemaps/   # Level JSON data (10 levels)
├── scripts/generate-levels.mjs
└── src/
    ├── main.js
    ├── scenes/               # Boot, Menu, WorldMap, Game, UI, Settings
    ├── entities/             # Player, Puffling, Wisp, MovingPlatform, PowerUp
    └── utils/                # Constants, SaveManager, SFX
```

Pixel art sprites and tilesets are generated programmatically at boot time — no external art tools required.

## Regenerate level maps

```bash
node scripts/generate-levels.mjs
```

## Levels

| # | Name | Zone | New mechanic |
|---|------|------|--------------|
| 1 | First Steps | Sky Meadow | Basics |
| 2 | Gap Runner | Sky Meadow | Wide gaps |
| 3 | Spike Trail | Sky Meadow | Spikes + checkpoint |
| 4 | Drift Platforms | Storm Pass | Moving platforms |
| 5 | Double Jump | Storm Pass | Power-up |
| 6 | Wind Crossing | Storm Pass | Combo challenge |
| 7 | Wisp Hollow | Twilight Peaks | Wisp enemy |
| 8 | Sky Fortress | Twilight Peaks | Mixed enemies |
| 9 | Final Approach | Twilight Peaks | All mechanics |
| 10 | Sunset Summit | Twilight Peaks | Finale |

## License

MIT — demo project, free to use and modify.
