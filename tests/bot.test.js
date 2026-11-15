import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  botSupports, createWorld, initialEnemies, initialState, setEnemies, step, STATUS,
} from '../src/bot/sim.js';
import { solve, ACTIONS, HOLD_FRAMES } from '../src/bot/solver.js';

const load = (key) => JSON.parse(readFileSync(new URL(`../public/assets/tilemaps/${key}.json`, import.meta.url)));

// A tiny hand-built level: 0 empty, 1 grass, 2 stone, 3 spike.
function strip(groundColumns, { width = 30, spikes = [], enemies = [] } = {}) {
  const tiles = Array.from({ length: 8 }, () => Array(width).fill(0));
  for (const x of groundColumns) {
    tiles[5][x] = 1;
    tiles[6][x] = 2;
  }
  for (const x of spikes) tiles[4][x] = 3;
  return { tiles, width, height: 8, spawn: { x: 1, y: 4 }, goal: { x: width - 2, y: 3 }, enemies, stars: [] };
}
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const solveLevel = (level, options) => {
  const world = createWorld(level);
  setEnemies(world, initialEnemies(level));
  return { world, plan: solve(world, initialState(level), options) };
};

describe('simulator', () => {
  it('lands on the ground and stays there', () => {
    const level = strip(range(0, 29));
    const world = createWorld(level);
    const s = initialState(level);
    for (let i = 0; i < 30; i++) step(world, s, 0, false);
    expect(s.grounded).toBe(true);
    expect(s.y).toBe(5 * 16 - 8);
  });

  it('jumps about 89px high when the button is held, less when released early', () => {
    const level = strip(range(0, 29));
    const apex = (holdFrames) => {
      const world = createWorld(level);
      const s = initialState(level);
      for (let i = 0; i < 30; i++) step(world, s, 0, false);
      const floor = s.y;
      let top = floor;
      for (let i = 0; i < 60; i++) {
        step(world, s, 0, i < holdFrames);
        top = Math.min(top, s.y);
      }
      return floor - top;
    };
    expect(apex(60)).toBeGreaterThan(80);
    expect(apex(60)).toBeLessThan(95);
    expect(apex(4)).toBeLessThan(apex(60) * 0.6);
  });

  it('dies in a pit and on spikes', () => {
    const pit = strip(range(0, 3));
    const world = createWorld(pit);
    const s = initialState(pit);
    for (let i = 0; i < 200 && s.status === STATUS.ALIVE; i++) step(world, s, 1, false);
    expect(s.status).toBe(STATUS.DEAD);

    const spiked = strip(range(0, 29), { spikes: [4] });
    const world2 = createWorld(spiked);
    const s2 = initialState(spiked);
    for (let i = 0; i < 200 && s2.status === STATUS.ALIVE; i++) step(world2, s2, 1, false);
    expect(s2.status).toBe(STATUS.DEAD);
  });
});

describe('solver', () => {
  it('crosses a jumpable gap', () => {
    const { plan } = solveLevel(strip([...range(0, 10), ...range(15, 29)]));
    expect(plan).not.toBeNull();
    expect(plan.actions.some((a) => ACTIONS[a][1])).toBe(true);
  });

  it('reports no route when the gap is wider than any jump', () => {
    const { plan } = solveLevel(strip([...range(0, 6), ...range(22, 29)]), { maxExpanded: 20000 });
    expect(plan).toBeNull();
  });

  it('gets past spikes and a patrolling enemy', () => {
    const level = strip(range(0, 29), { spikes: [8, 9], enemies: [{ x: 16, y: 4, patrol: 4 }] });
    expect(solveLevel(level).plan).not.toBeNull();
  });

  it('returns a plan that really wins when replayed step by step', () => {
    const level = load('level1');
    const { world, plan } = solveLevel(level);
    const s = initialState(level);
    for (const action of plan.actions) {
      const [dir, jump] = ACTIONS[action];
      for (let i = 0; i < HOLD_FRAMES && s.status === STATUS.ALIVE; i++) step(world, s, dir, jump);
    }
    expect(s.status).toBe(STATUS.WON);
  });

  it.each(['level1', 'level2', 'level3'])('beats %s', (key) => {
    const level = load(key);
    expect(botSupports(level)).toBe(true);
    expect(solveLevel(level).plan).not.toBeNull();
  });

  it('declines levels with mechanics it does not model', () => {
    expect(botSupports(load('level4'))).toBe(false);
    expect(botSupports(load('level6'))).toBe(false);
    expect(botSupports(load('level9'))).toBe(false);
  });
});
