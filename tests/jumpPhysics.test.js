import { describe, it, expect } from 'vitest';
import { maxSingleJumpRangePx, maxDoubleJumpRangePx, maxGlideRangePx, windAdjustedRangePx } from '../scripts/lib/jumpPhysics.mjs';

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

describe('glide and wind ranges', () => {
  it('a full glide adds 0.8s of travel at run speed (128px)', () => {
    expect(maxGlideRangePx(0) - maxSingleJumpRangePx(0)).toBeCloseTo(128, 5);
    expect(maxGlideRangePx(-200)).toBeNull();
  });

  it("Level 9's final 12-tile gap needs the glide", () => {
    const gapPx = 12 * 16;
    const dropPx = 3 * 16;
    expect(maxSingleJumpRangePx(dropPx) * 0.9).toBeLessThan(gapPx);
    expect(maxGlideRangePx(dropPx) * 0.9).toBeGreaterThan(gapPx);
  });

  it('a headwind shortens a jump in proportion and a gale stops it', () => {
    expect(windAdjustedRangePx(160, -40)).toBeCloseTo(120, 5);
    expect(windAdjustedRangePx(160, 0)).toBe(160);
    expect(windAdjustedRangePx(160, -400)).toBe(0);
  });
});
