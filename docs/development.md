# Building Sky Hop through prompt-driven iteration

Sky Hop is a small Phaser 3 platformer shaped through natural-language requests,
generated implementation, code review and regression checks. Its source remains
ordinary JavaScript: levels are deterministic data, art is drawn at boot, and
the finished game runs as a static site without a backend.

## An actual iteration

The review request asked to evaluate every level against the code, add a way to
restart saved progress, and assess GitHub readiness. That review found that a
passing jump-distance check did not imply a correct level: one collectible was
inside stone, a checkpoint respawn was inside grass, ground enemies had no
gravity, and restarting could duplicate collected points.

The subsequent visual direction was: “more sky-like and not just a plain orange
environment.” The implementation uses blue daytime skies, cool high-altitude
clouds, lavender twilight and a peach-lit summit. Procedural cloud layers, distant
floating islands and slow cloud drift create depth without downloaded artwork.
Dark menu surfaces preserve text contrast over the brighter backgrounds.

The engineering response was to fix the underlying mechanics, adjust generated
map data, and add regressions for the observed defects. This illustrates the
project's most useful lesson: evaluate generated features as interacting systems,
including failure and restart paths, rather than accepting them from appearance
or a successful build alone. Earlier prompts and development decisions are not
reconstructed here; this account describes the retained review/fix iteration.

## Architecture

- `BootScene`: procedural textures, animations and map loading.
- `MenuScene`, `WorldMapScene`, `SettingsScene`: entry, selection and saved progress.
- `GameScene`: level construction, collisions, checkpoints and attempt lifecycle.
- `UIScene`: HUD snapshots, completion/game-over actions and campaign summary.
- Entities: player input, moving platforms, ground enemies, Wisps and power-ups.
- `scripts/generate-levels.mjs`: authored map geometry and safe Puffling placement.
- `scripts/validate-levels.mjs`: jump-margin, platform-overlap and placement checks.
- `SaveManager`: browser-local unlocks, ratings, scores and preferences.

The generator places each Puffling on the nearest clear grass surface and bounds
its patrol to that surface. Runtime gravity and edge detection then keep its
movement grounded. Wisps retain their explicitly authored airborne paths.

## Verification and remaining acceptance work

Automated regressions cover all ten maps, the original embedded star/checkpoint,
restart scoring, completion collection guards, HUD ability snapshots, paired
overlay input, saves and reset confirmation. Lint and a production build are
required before deployment. Geometry validation is approximate and does not
simulate platform phases, enemy encounters or every collectible route.

Before marking a final release:

- Play Levels 1–10 from a new save, then verify reload/resume and Restart Progress.
- Complete every all-star route and record tricky jump inputs, especially Level 9.
- Die after each checkpoint and power-up; retry with keyboard and touch.
- Check moving-platform boarding and dismounting in both directions.
- Verify map readability, fullscreen, overlays and phone landscape layout.
- Capture actual gameplay screenshots and a short demo video after visual review.

Browser access was unavailable during this iteration; no screenshot or video is
presented as verification. A timer, more levels or extra mechanics can wait until
these acceptance checks establish the quality of the current campaign.
