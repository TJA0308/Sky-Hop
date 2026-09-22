# Contributing to Sky Hop

Small, focused improvements are welcome. For a large mechanic or a new level,
open an issue describing the player experience and scope before implementing it.

## Setup

Use Node.js 22 (also recorded in `.nvmrc`), then run `npm ci` and `npm run dev`.
The development server regenerates and validates maps before launching.

## Making a change

- Edit level geometry in `scripts/generate-levels.mjs`, not only in generated JSON.
- Run `npm run build` and commit the resulting map changes with the generator.
- Keep physics tuning in `src/utils/constants.js`; the jump checks share these values.
- Keep artwork procedural unless an external asset has a clear license and attribution.
- Preserve keyboard and touch interaction for new player-facing actions.
- Add a regression for a fixed gameplay or save bug. Explain what it catches.
- Keep credentials, machine-specific settings, `node_modules/`, and `dist/` out of commits.

## Before opening a pull request

```bash
npm run lint
npm run build
npm test
```

Play the affected levels, including death, restart, pause and return-to-map paths.
For changes involving saves, check both fresh and existing progress. For visual
changes, attach an actual screenshot or recording and identify the browser and
viewport. State clearly when a manual check was not performed.

Describe the problem, the new behavior, and verification in the PR. AI-assisted
changes are welcome; explain how you checked the generated result and avoid
inventing test evidence or development history.

## Reporting bugs

Use the bug-report form with the level, browser/device, inputs, expected result,
and actual result. Mention whether the problem occurs on the live site or locally.
Do not include private browser data or credentials.
