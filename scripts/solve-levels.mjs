/**
 * Proves levels are beatable by actually beating them: runs the bot's solver
 * against every level it supports and fails the build if any has no route.
 *
 * This is stronger than validate-levels.mjs, which only estimates whether each
 * gap is jumpable. Levels using mechanics the simulator doesn't model yet
 * (moving platforms, Wisps, wind, crumbling stone, power-ups) are skipped.
 *
 * Run: node scripts/solve-levels.mjs  (also chained into `build`)
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { LEVELS } from '../src/utils/constants.js';
import { botSupports, createWorld, initialEnemies, initialState, setEnemies } from '../src/bot/sim.js';
import { solve } from '../src/bot/solver.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tilemapDir = join(__dirname, '..', 'public', 'assets', 'tilemaps');

let failed = false;
console.log('Solving levels with the bot...');
for (const key of LEVELS) {
  const level = JSON.parse(readFileSync(join(tilemapDir, `${key}.json`), 'utf-8'));
  if (!botSupports(level)) {
    console.log(`  - ${level.name}: skipped (uses mechanics the bot does not model yet)`);
    continue;
  }
  const world = createWorld(level);
  setEnemies(world, initialEnemies(level));
  const started = performance.now();
  const plan = solve(world, initialState(level));
  const ms = (performance.now() - started).toFixed(0);
  if (plan) {
    console.log(`  ✓ ${level.name}: beaten in ${(plan.frames / 60).toFixed(1)}s of play (${plan.expanded} states searched, ${ms}ms)`);
  } else {
    failed = true;
    console.error(`  ✖ FAIL ${level.name}: the bot found no route to the flag`);
  }
}

if (failed) {
  console.error('\nLevel solving FAILED.');
  process.exit(1);
}
console.log('\nEvery supported level is beatable.');
