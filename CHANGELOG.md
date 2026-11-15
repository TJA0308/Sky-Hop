# Changelog

Changes are grouped by shipped behavior. Commit references identify deployments;
they do not imply a tagged release.

## 1.1.0 — The bot, and a finale that uses everything — 2026-11-15

### Added

- A bot that plays levels 1–3 without help. `src/bot/sim.js` is a headless
  copy of the game's rules, `src/bot/solver.js` runs A* search over it, and
  `BotController` replays the plan in the real game, replanning when the hero
  or an enemy drifts from what the simulation predicted. Choose
  **Watch the Bot** from the pause menu. Bot runs never change the save.
- `npm run solve-levels`, chained into `npm run build`: the build fails if the
  bot cannot beat a level it supports.
- Squash and stretch, a trailing scarf, and a tilted glide pose for the hero.
  The visible sprite is now separate from the collision box, so none of this
  affects physics.
- Crumbling stone in level 7; wind, crumbling stone, an updraft and the glide
  feather in level 10, whose final gap is longer.
- Gameplay GIF and screenshots in the README.

## Wind, crumbling stone and gliding — 2026-11-14

### Added

- Wind zones: headwinds and tailwinds that change an airborne hero's speed,
  and updrafts that lift. Level 6 (Wind Crossing) now uses them.
- Crumbling platforms that shake, fall and regrow. Level 8's last island is
  replaced by a run of them.
- Glide feather: hold jump while falling to drift for up to 0.8s per airtime.
  Level 9's final gap is widened so it needs the feather from the checkpoint.
- Storm sky for Storm Pass (dark clouds, rain, distant lightning) and an
  aurora over Twilight Peaks.
- The level validator understands glide range, headwinds and crumbling
  platforms, so these levels are still checked at build time.

## Visual and game-feel pass — 2026-11-14

### Added

- Four-layer parallax sky (far clouds, two island layers, a cloud bank) shared
  by gameplay and menus, with per-zone tints, a moon at twilight, and drifting
  motes or fireflies.
- Generated background music: one soft four-bar loop per zone, following the
  existing sound setting.
- Landing, jump and running dust; a brief freeze and shake on stomps; a rising
  chime for stars collected in a streak; bobbing stars.
- Level-clear screen where rating stars pop in one by one and the score counts up.

### Changed

- Gameplay camera is zoomed 2x with look-ahead and a deadzone, so the hero and
  islands fill the screen. Screen-space UI moved to its own unzoomed camera.
- Islands are autotiled with rounded grass caps and edges, and craggy rock
  hangs beneath them. Level data and collision are unchanged.
- The pause button now sits in the HUD bar.

### Fixed

- Particle bursts now fire once from the emitter's own position instead of
  passing the world position a second time.

## Repository maintenance — 2026-09-22

- Updated site metadata to match the full blue-sky-to-sunset visual progression.
- Recorded the completed campaign and green automated release gates accurately.
- Upgraded Vite and Vitest and refreshed transitive packages; `npm audit` now
  reports zero production or development vulnerabilities.
- Standardized the supported local runtime on Node.js 22.12 or newer in Node 22.

## Interactive README — 2026-09-22

### Added

- Clickable animated pixel-art hero built from Sky Hop's visual language.
- Three-zone journey artwork and GitHub-native expandable sections.
- Faster paths to play, learn the controls, inspect the build, and run locally.
- A lightweight social-preview composition ready for repository presentation.

The artwork is illustrative and labeled as such; it is not presented as captured
gameplay. Authentic screenshots and a gameplay recording remain future media work.

## Sky and gameplay polish — 2026-09-22

Shipped in [`9259b44`](https://github.com/TJA0308/Sky-Hop/commit/9259b4456f6583d03920db5129058853f78b7e53).

### Added

- Four procedural sky palettes, drifting clouds and distant floating islands.
- Confirmed Restart Progress from the title screen and world map.
- Checkpoints in Levels 4 and 9 and clearer double-jump instructions.
- Tappable pause, retry, completion, map and information-panel actions.
- Pull-request checks, entity-placement validation, regressions and MIT license.

### Fixed

- Level 2's embedded collectible and Level 10's checkpoint respawn.
- Ground-enemy gravity and patrol placement.
- Score inflation through repeated level restarts.
- HUD initialization and ability state after restart.
- Gameplay continuing after completion and duplicate overlay-key actions.
- World-map preview overlap and competing fullscreen handlers.
- Three Level 9 gaps that exceeded the validator's safety margin.

### Verification

39 tests passed; lint, production build and all ten level validations passed.
The deployment succeeded. Complete browser/touch and all-star playthroughs remain
open acceptance work; see the [release checklist](docs/release-checklist.md).
