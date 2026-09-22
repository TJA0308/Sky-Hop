import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { LEVELS } from '../src/utils/constants.js';
import { entityIssues } from '../scripts/lib/entityValidation.mjs';

const load = (key) => JSON.parse(readFileSync(new URL(`../public/assets/tilemaps/${key}.json`, import.meta.url)));
describe('authored level placements', () => {
  it.each(LEVELS)('%s has clear entities and safe ground patrols', (key) => {
    expect(entityIssues(load(key))).toEqual([]);
  });
  it('catches the original embedded Level 2 star', () => {
    const level = load('level2');
    level.stars.push([30, 11]);
    expect(entityIssues(level).some((issue) => issue.includes('star') && issue.includes('embedded'))).toBe(true);
  });
  it('catches the original Level 10 checkpoint', () => {
    const level = load('level10');
    level.checkpoint = { x: 80, y: 10 };
    expect(entityIssues(level)).toContain('checkpoint is embedded in solid terrain at (80,10)');
  });
});
