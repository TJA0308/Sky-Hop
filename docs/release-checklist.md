# Release acceptance checklist

Automated checks and a successful deployment do not replace a playthrough.
Mark a box only after completing the check; record the commit, device/browser,
and evidence alongside the result.

## Automated gates

- [ ] `npm ci` succeeds on the supported Node.js version.
- [ ] Lint, production build, and regression tests pass.
- [ ] All ten levels validate without warnings.
- [ ] Regenerating maps introduces no uncommitted drift.
- [ ] GitHub deployment succeeds for the intended commit.

## Campaign playtest

| Level | Reach flag | All stars | Death / retry | Checkpoint (if present) |
| --- | --- | --- | --- | --- |
| 1 · First Steps | Pending | Pending | Pending | — |
| 2 · Gap Runner | Pending | Pending | Pending | — |
| 3 · Spike Trail | Pending | Pending | Pending | Pending |
| 4 · Drift Platforms | Pending | Pending | Pending | Pending |
| 5 · Double Jump | Pending | Pending | Pending | — |
| 6 · Wind Crossing | Pending | Pending | Pending | Pending |
| 7 · Wisp Hollow | Pending | Pending | Pending | — |
| 8 · Sky Fortress | Pending | Pending | Pending | Pending |
| 9 · Final Approach | Pending | Pending | Pending | Pending |
| 10 · Sunset Summit | Pending | Pending | Pending | Pending |

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
- [ ] Review README links, controls, known limitations and changelog.
- [ ] Check existing tags, choose a release version, and write accurate release notes.
- [ ] Verify the live site serves the intended build and its assets load.

Screenshots, recordings and manual results have not been supplied yet. The
original code/data review is preserved in [the level audit](level-audit.md).
