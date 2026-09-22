# Changelog

Changes are grouped by shipped behavior. Commit references identify deployments;
they do not imply a tagged release.

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
