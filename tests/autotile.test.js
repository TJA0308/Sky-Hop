import { describe, it, expect } from 'vitest';
import { frameFor, undersideRuns, SOLID_FRAMES, FRAME } from '../src/utils/autotile.js';

// 0 empty, 1 grass, 2 stone, 3 spike. A 3-wide island with a spike on top,
// floating one column in from the left edge.
const island = [
  [0, 0, 3, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 2, 2, 2, 0],
  [0, 0, 0, 0, 0],
];

describe('frameFor', () => {
  it('returns -1 for empty cells and the spike frame for spikes', () => {
    expect(frameFor(island, 0, 0)).toBe(-1);
    expect(frameFor(island, 2, 0)).toBe(FRAME.SPIKE);
  });

  it('caps the ends of a grass run and leaves the middle plain', () => {
    expect([1, 2, 3].map((x) => frameFor(island, x, 1))).toEqual([4, 0, 5]);
  });

  it('uses underside frames for stone with open air below', () => {
    expect([1, 2, 3].map((x) => frameFor(island, x, 2))).toEqual([11, 10, 12]);
  });

  it('uses the single-tile frames for a lone column', () => {
    const pillar = [[0, 1, 0], [0, 2, 0], [0, 2, 0], [0, 0, 0]];
    expect([0, 1, 2].map((y) => frameFor(pillar, 1, y))).toEqual([6, 9, 13]);
  });

  it('treats the map side edges as solid so ground continues off-level', () => {
    const ground = [[1, 1], [2, 2]];
    expect(frameFor(ground, 0, 0)).toBe(0);
    expect(frameFor(ground, 1, 0)).toBe(0);
    expect(frameFor(ground, 0, 1)).toBe(10);
  });

  it('only ever returns solid frames for solid tiles', () => {
    for (let y = 1; y <= 2; y++) {
      for (let x = 1; x <= 3; x++) {
        expect(SOLID_FRAMES).toContain(frameFor(island, x, y));
      }
    }
    expect(SOLID_FRAMES).not.toContain(FRAME.SPIKE);
  });
});

describe('undersideRuns', () => {
  it('finds one run per island underside', () => {
    expect(undersideRuns(island)).toEqual([{ xStart: 1, xEnd: 3, y: 2 }]);
  });

  it('splits runs at gaps and counts the bottom map row', () => {
    const two = [[1, 0, 1, 1]];
    expect(undersideRuns(two)).toEqual([
      { xStart: 0, xEnd: 0, y: 0 },
      { xStart: 2, xEnd: 3, y: 0 },
    ]);
  });
});
