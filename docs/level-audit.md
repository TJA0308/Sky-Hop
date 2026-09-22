# Sky Hop: level audit and release plan

## Implementation update

The review below records the **pre-fix baseline**. The follow-up implements:
Level 2 collectible clearance, Level 10 checkpoint clearance, ground-enemy
gravity and safe patrol placement, clean-attempt restart scoring, initial/restart
HUD synchronization, frozen completion physics, paired-key cleanup, tappable
overlays/pause/info panels, a separated map preview, and a single fullscreen
keyboard handler. Levels 4 and 9 gain checkpoints; Level 9's three flagged
gaps are shorter and now pass the same safety margin. Double-jump hints explicitly
explain the input and Level 7's pickup dependency.

All ten generated levels pass the expanded validator without warnings. There
are 39 passing automated tests. Four new procedural sky palettes, layered clouds
and distant floating islands replace the orange-only scenery. PR checks, an MIT
LICENSE and a development case study are included. Browser visual checks, full
campaign/all-star playthroughs, screenshots and video are still outstanding;
the browser connection was unavailable. No final-release tag is claimed.

## Original audit

This is a source/data review of all ten generated maps and their shared runtime,
plus automated checks. It is **not an end-to-end playthrough**. The in-app browser
was unavailable in this session, so visual layout, actual jump timing, mobile
controls, and completion of every level still require browser verification.

## Assessment

The architecture is appropriate for a small, prompt-engineered platformer:
shared player physics, data-driven maps, separate scenes and entities, procedural
art/audio, local saves, and a reproducible build. There is no need to rewrite it.
The main weakness is verification: the current geometry checks and unit tests
cover only part of what makes the levels work in the engine. Treat this as a
playable prototype pending gameplay and progression fixes, rather than a fully
verified release.

`scripts/generate-levels.mjs` is the map source of truth. Both development and
production builds regenerate the JSON files. Make future geometry fixes in the
generator, then regenerate; editing only a JSON map will lose the fix.

## Every level

Coordinates below are zero-based tile coordinates. A geometry pass means only
that the existing validator accepts the level, not that all collectibles,
checkpoints, enemies, and dynamic jumps have been verified.

| Level | Geometry check | Does the code fit the design? / next action |
| --- | --- | --- |
| 1: First Steps | Pass | Basic movement, variable jump height and short gaps fit the introduction. It already includes four enemies and spikes at x49–51; the README's later “Spikes” introduction is misleading. A Puffling at (12,11) starts inside stone beneath a raised platform. Correct enemy placement/physics and consider a gentler tutorial. |
| 2: Gap Runner | Pass | Height changes and wider gaps fit the jump model. Star (30,11) is embedded in stone beneath the raised platform at x28–34, so the three-star route is compromised. Move the collectible into reachable air. Audit Puffling placements under raised platforms as well. |
| 3: Spike Trail | Pass | Spike damage and checkpoint activation support the design. Checkpoint (55,10) is outside solid terrain. Validate death and respawn there and distinguish pit spikes from the grounded spike strip at x88–92. |
| 4: Drift Platforms | Pass | Six horizontal platforms have runtime support. This is a substantial precision jump increase, with no checkpoint. The checker treats a platform's entire patrol as an available surface; test boarding, waiting, riding and dismounting in both directions. Some Pufflings spawn over gaps and currently float. |
| 5: Double Jump | Pass, assumes pickup | Pickup (8,13) precedes the wide elevated gaps and is on the safe starting island. The ability survives life loss but resets when the scene restarts, consistent with the pickup respawning. Explicitly teach releasing and pressing jump again. Verify the HUD clears its double-jump badge on restart. |
| 6: Wind Crossing | Pass | Short static gaps, three horizontal movers and checkpoint (64,10) fit a single-jump route. Movers are optional on much of this route, making this potentially easier than Levels 4–5. There is no wind-force mechanic; the name is thematic. Balance using playtesting. |
| 7: Wisp Hollow | Pass, assumes pickup | Wisp motion and the shared stomp handler exist. Pickup (14,12) supports wide gaps, especially the final 13-tile gap. The hint mentions only Wisps, so add explicit pickup guidance before that dependency surprises players. No checkpoint increases replay cost. |
| 8: Sky Fortress | Pass | Mixed enemies, horizontal/vertical platforms and checkpoint (70,9) are represented. Vertical-platform timing is not modeled by the validator. Test the elevator near x64 and enemy contact during landing. Shared Puffling issues affect this level too. |
| 9: Final Approach | Three warnings | Jumps x48→56, x60→70 and x128→138 exceed the validator's 90% safety margin. This does not prove impossibility: x60→70 has a vertical mover at x62 that the checker omits. There is no double-jump pickup or checkpoint. Verify the complete route and the star at (38,7) over the moving section before accepting the difficulty. |
| 10: Sunset Summit | Pass, assumes pickup after x66 | The finale combines supported mechanics, but checkpoint (80,10) occupies the grass tile at (80,10). Respawn uses tile center, placing the player's body inside the island. Move the respawn into clear space above it, then test life loss after collecting the double jump. Five movers and ten enemies warrant a full finale playthrough. |

There are 15, 21, 17, 16, 18, 21, 17, 19, 22 and 24 collectibles respectively.
The current rating thresholds are 50%, 80%, and 100%; completion below 50% earns
zero rating stars, despite the README's “1–3” wording.

## Shared runtime findings, in priority order

1. **Ground enemies do not fall.** `src/main.js` sets world gravity to zero;
   Player supplies its own gravity but Puffling never does. Pufflings can float
   across pits or remain at authored heights instead of landing on surfaces.
   Fix gravity together with spawn/patrol placement and edge behavior; merely
   adding gravity would make several enemies fall out of their intended areas.
2. **Restart can inflate scores.** `GameScene.restartLevel()` and the R handler
   preserve `this.score`, while scene creation restores all collectibles and
   enemies. Repeated collection/restart can inflate a saved best score. Define
   per-attempt scoring and reset to the attempt's starting score on restart.
3. **HUD initialization and restart need synchronization.** GameScene emits its
   initial HUD event before UIScene is launched from the map. UIScene subscribes
   but does not initially request a snapshot. GameScene-only restarts also leave
   the existing UI's double-jump badge/state alive. Initialize from a snapshot
   and reset ability display whenever a new attempt begins.
4. **Completion and overlay transitions need a single owner.** Reaching the goal
   sets `levelComplete` but does not stop Player.preUpdate or physics; collectible
   callbacks also lack a completion guard. UIScene registers separate one-shot
   Enter and Space callbacks, but clearing overlays does not remove unused
   callbacks. Freeze gameplay at completion and clean up paired transition
   listeners, particularly between the final clear and victory screens.
5. **World-map layout conflicts at the fixed 640×360 size.** The preview spans
   y262–314, overlapping first-zone nodes at y260/280 and their labels. Re-layout
   the map/preview and verify every node is readable and clickable.
6. **Touch support is incomplete.** Movement has touch buttons, but clear,
   victory and game-over continuation rely on keyboard handlers. Add clickable
   or tappable actions and a pause button before advertising full mobile play.
7. **Fullscreen has two F handlers.** A window handler and SettingsScene both
   toggle fullscreen. Give one handler ownership to avoid competing requests.

## What the validator misses

- Solid overlap for stars, player spawn, checkpoint respawn and enemy bodies.
- Dynamic timing and finite platform size; horizontal patrols are treated as
  continuous ground, and vertical movers are excluded as stepping stones.
- Whether the assumed double-jump pickup is actually reachable and collected.
- Spikes, enemies, collectible routes, camera/UI obstruction and player skill.
- Full engine behavior: body geometry, jump release, coyote time, platform
  velocity and collision order. The double-jump calculation is an apex-timed
  approximation, not an exhaustive search of possible input timings.

Extend validation with fixtures for these cases. A good first addition is
entity/respawn clearance checking that catches the confirmed Level 2 and Level
10 placements. Keep geometric checks distinct from recorded browser playtests.

## Restart Progress delivered in this change

- Visible entry on title and world map; R opens it from the map.
- Settings shows what will be erased and requires a second activation.
- Back / Cancel and Esc preserve the save; moving selection disarms confirmation.
- Held Enter/Space cannot confirm through keyboard auto-repeat.
- Successful reset clears scores, stars and unlocks, retains sound preferences
  and unrelated localStorage, and returns to a fresh Level 1-only map.
- A storage write failure is shown instead of falsely claiming success.

Automated regressions cover reset scope, preserved settings, storage failure,
confirmation, cancel, and return to the map. Scene tests exercise behavior with
a mocked Phaser base class; they do not replace rendered browser interaction.

## Finalizing the GitHub project

1. **Close gameplay blockers.** Fix the Level 2 star, Level 10 checkpoint,
   Puffling behavior, restart scoring, HUD lifecycle and final-screen transitions.
   Re-layout the map and finish touch navigation. Resolve or explicitly justify
   each Level 9 warning with a real playthrough.
2. **Record acceptance evidence.** For each level record fresh-entry completion,
   all-star route, death/respawn, restart, and return-to-map results. Exercise
   pickups and moving platforms where present. Run a new-save campaign and a
   reload/resume/reset campaign. Check keyboard and touch at desktop and phone
   sizes; retain a short demo video and screenshots.
3. **Gate contributions.** The existing deployment workflow runs lint, tests
   and build on main/master pushes. Add a separate read-only `pull_request`
   workflow running `npm ci`, lint, tests and build so defects are caught before
   merge. Keep deployment permissions out of PR checks. Check regenerated maps
   for drift and add meaningful regressions for the defects above.
4. **Finish repository presentation.** Add an actual LICENSE file matching the
   intended MIT license (the README currently only says MIT). Add a screenshot,
   controls/touch limitations, known issues and a concise architecture overview.
   Remove redundant explicit generation commands in setup instructions because
   dev/build already generate maps. Verify the advertised Pages URL and current
   deployment status before claiming a live release.
5. **Explain the prompt-engineering work honestly.** Add a short development
   case study: initial brief, constraints, selected real prompts, iteration,
   generated-code defects, human decisions, and validation evidence. The useful
   story is how you evaluated and improved generated work. Do not invent prompts
   or claim autonomous correctness. Use actual retained history and redact any
   private material before publishing it.
6. **Release a verified snapshot.** After checks and playtests pass, merge the
   reviewed changes, verify the Pages deployment, then tag the intended release
   and write release notes listing features and known limitations. Check existing
   tags before choosing a version; package.json already declares 1.0.0.

This review does not change remote GitHub settings, publish a release, or verify
the current live deployment. The gameplay findings above remain open; only the
requested restart-progress feature and its documentation/tests were implemented.
