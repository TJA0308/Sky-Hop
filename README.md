# Sky Hop

[![Play Sky Hop](https://img.shields.io/badge/Play-Sky_Hop-328fc7?style=for-the-badge)](https://tja0308.github.io/Sky-Hop/)
[![Build and deploy](https://github.com/TJA0308/Sky-Hop/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/TJA0308/Sky-Hop/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**A tiny adventure above the clouds.** Jump across ten floating-island levels,
ride drifting platforms, dodge enemies, and climb from blue skies to a sunset summit.

[Play in your browser](https://tja0308.github.io/Sky-Hop/) ·
[Development story](docs/development.md) ·
[Changelog](CHANGELOG.md) ·
[Report a bug](https://github.com/TJA0308/Sky-Hop/issues/new?template=bug_report.yml)

## The game

- **Ten levels, three zones:** Sky Meadow, Storm Pass, and Twilight Peaks.
- **Four sky palettes:** daytime blue, high-altitude clouds, lavender twilight, and a peach-lit finale.
- **Platforming mechanics:** variable-height jumps, double-jump pickups, moving platforms, checkpoints, and two enemy types.
- **Replayable progression:** unlock levels, earn up to three stars, and improve your best scores.
- **Browser-local saves:** continue where you left off or confirm **Restart Progress** to start fresh.
- **Procedural art and sound:** sprites, scenery, and effects are generated in code with Phaser 3 and Web Audio.

The game is built with JavaScript, Phaser 3, and Vite. No account or backend is required.

## How to play

Reach the flag to unlock the next level. Collect 50%, 80%, or 100% of a level's
stars for a one-, two-, or three-star rating. Completing with fewer still unlocks
the next level.

| Input | Action |
| --- | --- |
| ← / → or A / D | Move |
| Space, W, or ↑ | Jump; hold for more height |
| Release and press jump again | Double jump after collecting a sparkle |
| Esc / P or the Pause button | Pause |
| R during gameplay | Restart this level with a fresh score and three lives |
| Enter | Confirm menu selection or continue |
| F | Toggle fullscreen |
| R on the world map | Open Restart Progress |

On touch devices, use the movement and jump buttons. Menu actions, pause,
retry, and completion actions are tappable. Select a map node, then tap its
preview to play.

### Saves and starting over

Progress belongs to the current browser and site address. Local development
and the live game have separate saves; clearing browser storage removes them.

Choose **Restart Progress** from the title screen or map, then activate
**Restart Progress → Confirm Restart Progress** in Settings. This clears
unlocks, ratings, and best scores while keeping sound preferences.
**Back / Cancel** or **Esc** preserves your save.

## Run locally

Use **Node.js 22** (the CI version) and npm.

```bash
git clone https://github.com/TJA0308/Sky-Hop.git
cd Sky-Hop
npm ci
npm run dev
```

Open the address printed by Vite, usually `http://localhost:5173`.
On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Generate and validate maps, then start Vite |
| `npm run build` | Generate and validate maps, then build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check JavaScript style and common errors |
| `npm test` | Run regression tests |
| `npm run validate-levels` | Check the existing generated maps |

## Quality and project status

The game is deployed, with automated checks for saves, scene behavior,
jump calculations, entity placement, and all ten generated maps. Pull requests
run lint, build, tests, and a generated-map consistency check.

**Still to verify:** complete browser and touch playthroughs, every all-star
route, and moving-platform timing. Geometry checks approximate movement;
they do not prove that every route feels fair. Screenshots and a gameplay
video will follow actual visual verification.

## Inside the project

```text
src/
  scenes/       Boot, menus, world map, gameplay, and HUD
  entities/     Player, enemies, platforms, power-ups, and touch input
  utils/        Physics constants, sky textures, saves, and sound
scripts/
  generate-levels.mjs    Source of truth for level geometry
  validate-levels.mjs    Geometry and placement checks
public/assets/tilemaps/  Generated maps loaded by the game
tests/                  Regression tests
docs/                   Development notes and the level audit
```

Edit levels in `scripts/generate-levels.mjs`, then run `npm run build`.
Direct JSON edits are overwritten by the generator.

## Development and contribution

Sky Hop is a prompt-engineered project: natural-language direction, generated
implementation, code review, and regression testing shaped the result.
The [development case study](docs/development.md) documents a real iteration
and the defects that verification uncovered.

- [Contributing](CONTRIBUTING.md): setup, change guidelines, and verification.
- [Level audit](docs/level-audit.md): original findings and the implemented fixes.
- [Changelog](CHANGELOG.md): shipped improvements.
- [Release checklist](docs/release-checklist.md): remaining acceptance checks.

## Deployment

Pushes to `main` or `master` run the checks and publish `dist/` to
`gh-pages`. For a fork, enable GitHub Pages with **Deploy from a branch →
gh-pages → / (root)** and update the links above. Vite uses relative asset paths
so the build can run under a repository URL.

## License

[MIT](LICENSE). Phaser, Vite, and other dependencies retain their own licenses.
