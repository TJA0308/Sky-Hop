# Sky Hop

[![Play Now](https://img.shields.io/badge/Play-Now-ff6644?style=for-the-badge)](https://tja0308.github.io/Sky-Hop/)

A browser pixel-platformer built with **Phaser 3** and **Vite**. Cross **10 floating-island levels** through blue skies, high clouds, lavender twilight and a sunset summit. Stomp Pufflings and Wisps, ride moving platforms, and collect double-jump power-ups.

## Play Now

**[▶ Play Sky Hop](https://tja0308.github.io/Sky-Hop/)** — no install required, runs in any modern browser.

> If the link 404s, GitHub Pages hasn't been enabled yet: **Settings → Pages → source: `gh-pages` branch** (the branch is created automatically by the deploy workflow after the first push to `main`).

## Quick start (local)

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build for production

```bash
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

- **10 levels** across 3 zones, with four procedural sky palettes and drifting clouds
- **World map** with unlock progression and star ratings (0–3 ★)
- **Save progress** via localStorage (unlocks, stars, best scores)
- **Restart Progress** on the title screen and world map, with confirmation
- **New mechanics**: moving platforms, double-jump power-ups, Wisp enemies
- **Pause menu**, settings (mute), level intro hints, credits / how-to-play
- **Auto-deploy** to GitHub Pages on push to `main`/`master`

On touch devices, use the on-screen movement/jump buttons and **Pause**.
Completion, retry, settings and map actions are clickable/tappable. Tap the
selected level's preview to play. Restarting a level resets its score and restores
three lives; it does not clear saved campaign progress.

## Quality checks

```bash
npm run lint
npm run build
npm test
```

The build regenerates all maps and validates geometry, entity clearance and
ground-enemy patrols. Tests cover save/reset behavior, level regressions, jump
math and scene transitions. Pull requests run these checks before deployment.
Automated checks are not a substitute for a complete browser playthrough.

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

## Saved progress and starting over

Play opens the world map with your highest unlocked level selected. You can
replay any unlocked level. Saves belong to the current browser and site address;
local development and GitHub Pages have separate saves.

To start over, choose **Restart Progress** on the title screen or world map
(keyboard shortcut: **R** on the map). In Settings, select **Restart Progress**,
then **Confirm Restart Progress**. This clears all level unlocks, star ratings,
and best scores, keeps your sound setting, and returns to the map with only
Level 1 unlocked. **Back / Cancel** or **Esc** leaves progress unchanged.
During gameplay, **R** still restarts only the current level.

## Evaluation and release preparation

See [the level audit and GitHub release checklist](docs/level-audit.md) for the
review of all ten levels, known issues, verification limits, and the remaining
work before a polished release.

See [the development case study](docs/development.md) for the prompt-driven
iteration, architecture and remaining playtest checklist.

## Regenerate level maps

```bash
node scripts/generate-levels.mjs
```

## Levels

| # | Name | Zone | Focus |
|---|------|------|--------------|
| 1 | First Steps | Sky Meadow | Basics, enemies and introductory spikes |
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
