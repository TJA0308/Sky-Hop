# Release acceptance checklist

Automated checks and a successful deployment do not replace a playthrough.
The automated gates and basic campaign completion were verified on 2026-09-22.
The remaining boxes are narrower acceptance checks that were not explicitly
recorded during the playthrough.

## Automated gates

- [x] `npm ci` succeeds on the supported Node.js version.
- [x] Lint, production build, and regression tests pass.
- [x] All ten levels validate without warnings.
- [x] Regenerating maps introduces no uncommitted drift.
- [x] GitHub deployment succeeds for the intended commit.

## Campaign playtest

| Level | Reach flag | All stars | Death / retry | Checkpoint (if present) |
| --- | --- | --- | --- | --- |
| 1 · First Steps | Verified | Pending | Pending | — |
| 2 · Gap Runner | Verified | Pending | Pending | — |
| 3 · Spike Trail | Verified | Pending | Pending | Pending |
| 4 · Drift Platforms | Verified | Pending | Pending | Pending |
| 5 · Double Jump | Verified | Pending | Pending | — |
| 6 · Wind Crossing | Verified | Pending | Pending | Pending |
| 7 · Wisp Hollow | Verified | Pending | Pending | — |
| 8 · Sky Fortress | Verified | Pending | Pending | Pending |
| 9 · Final Approach | Verified | Pending | Pending | Pending |
| 10 · Sunset Summit | Verified | Pending | Pending | Pending |

## Interaction and persistence

- [ ] Keyboard: move, jump, double jump, pause, restart and fullscreen.
- [ ] Touch: simultaneous movement/jump, pause, retry, map and completion actions.
- [ ] Moving platforms: board, ride and dismount in both directions.
- [ ] Fresh save: only Level 1 unlocked; HUD starts with correct values.
- [ ] Complete a level and reload: unlocks, stars and best score persist.
- [ ] Restart a level: fresh score/lives, correct power-up state.
- [ ] Cancel Restart Progress: progress is preserved.
- [ ] Confirm Restart Progress: only Level 1 unlocked; sound preference preserved.
- [ ] Finale: clear screen, victory screen and map each transition once.
- [ ] Desktop and phone landscape: map, hints, overlays and touch targets remain readable.

## Presentation and release

- [ ] Capture actual screenshots and a short gameplay recording from this build.
- [x] Review README links, controls, known limitations and changelog.
- [ ] Check existing tags, choose a release version, and write accurate release notes.
- [x] Verify the live site serves the intended build and its assets load.

Basic completion of every level has been confirmed. All-star collection,
device-specific coverage, screenshots and recordings remain unrecorded. The
original code/data review is preserved in [the level audit](level-audit.md).
