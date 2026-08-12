import { describe, it, expect } from 'vitest';
import { maxSingleJumpRangePx, maxDoubleJumpRangePx } from '../scripts/lib/jumpPhysics.mjs';

describe('jumpPhysics', () => {
  it('matches the hand-derived flat-ground single-jump range (~142px / ~8.9 tiles)', () => {
    const range = maxSingleJumpRangePx(0);
    expect(range).not.toBeNull();
    expect(range).toBeCloseTo(142.22, 1);
  });

  it('matches the hand-derived flat-ground double-jump range (~231px / ~14.4 tiles)', () => {
    const range = maxDoubleJumpRangePx(0);
    expect(range).not.toBeNull();
    expect(range).toBeCloseTo(230.78, 1);
  });

  it('single jump cannot reach above its own apex height (~89px)', () => {
    expect(maxSingleJumpRangePx(-100)).toBeNull(); // higher than apex — unreachable
    expect(maxSingleJumpRangePx(-80)).not.toBeNull(); // within apex — reachable
  });

  it('a double jump reaches meaningfully higher than a single jump', () => {
    expect(maxSingleJumpRangePx(-100)).toBeNull();
    expect(maxDoubleJumpRangePx(-100)).not.toBeNull();
  });

  it('range grows the further the target is below the launch point', () => {
    const flat = maxSingleJumpRangePx(0);
    const drop = maxSingleJumpRangePx(64); // landing 4 tiles lower
    expect(drop).toBeGreaterThan(flat);
  });

  it("Level 7's widest gap (13 tiles / 208px) is reachable with a double jump, raw", () => {
    const range = maxDoubleJumpRangePx(0);
    expect(range).toBeGreaterThan(13 * 16);
  });
});
