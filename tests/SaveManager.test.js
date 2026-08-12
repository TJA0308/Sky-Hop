import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSave,
  isLevelUnlocked,
  calcStars,
  recordLevelComplete,
  resetSave,
  getTotalProgress,
} from '../src/utils/SaveManager.js';
import { LEVELS } from '../src/utils/constants.js';

beforeEach(() => {
  localStorage.clear();
});

describe('calcStars', () => {
  it('gives 1 star when there are no stars to collect at all', () => {
    expect(calcStars(0, 0)).toBe(1);
  });

  it('is 0 below the 50% threshold', () => {
    expect(calcStars(0, 10)).toBe(0);
    expect(calcStars(4, 10)).toBe(0);
  });

  it('is 1 star from 50% up to (but not including) 80%', () => {
    expect(calcStars(5, 10)).toBe(1);
    expect(calcStars(7, 10)).toBe(1);
  });

  it('is 2 stars from 80% up to (but not including) 100%', () => {
    expect(calcStars(8, 10)).toBe(2);
    expect(calcStars(9, 10)).toBe(2);
  });

  it('is 3 stars at 100%', () => {
    expect(calcStars(10, 10)).toBe(3);
  });
});

describe('getSave defaults', () => {
  it('returns sane defaults when localStorage is empty', () => {
    const save = getSave();
    expect(save.unlockedLevel).toBe(0);
    expect(save.levels).toEqual({});
    expect(save.settings.muted).toBe(false);
    expect(save.totalScore).toBe(0);
  });

  it('only level 0 is unlocked by default', () => {
    expect(isLevelUnlocked(0)).toBe(true);
    expect(isLevelUnlocked(1)).toBe(false);
  });
});

describe('recordLevelComplete', () => {
  it('unlocks the next level and records stars/score', () => {
    const stars = recordLevelComplete(0, 300, 10, 10);
    expect(stars).toBe(3);
    expect(isLevelUnlocked(1)).toBe(true);
    expect(isLevelUnlocked(2)).toBe(false);

    const save = getSave();
    expect(save.levels['0'].stars).toBe(3);
    expect(save.levels['0'].bestScore).toBe(300);
    expect(save.levels['0'].completed).toBe(true);
    expect(save.totalScore).toBe(300);
  });

  it('never downgrades stars or best score on a worse replay', () => {
    recordLevelComplete(0, 300, 10, 10); // 3 stars
    recordLevelComplete(0, 50, 2, 10); // worse run: 0 stars, lower score

    const save = getSave();
    expect(save.levels['0'].stars).toBe(3); // still 3, not overwritten with 0
    expect(save.levels['0'].bestScore).toBe(300); // still 300, not overwritten with 50
  });

  it('does not unlock past the last level', () => {
    const lastIndex = LEVELS.length - 1;
    recordLevelComplete(lastIndex, 100, 5, 5);
    const save = getSave();
    expect(save.unlockedLevel).toBe(lastIndex);
  });

  it('rolls up totalStars/levelsCompleted across levels', () => {
    recordLevelComplete(0, 100, 10, 10); // 3 stars
    recordLevelComplete(1, 100, 5, 10); // 1 star

    const progress = getTotalProgress();
    expect(progress.totalStars).toBe(4);
    expect(progress.levelsCompleted).toBe(2);
    expect(progress.totalLevels).toBe(LEVELS.length);
  });
});

describe('resetSave', () => {
  it('clears progress back to defaults', () => {
    recordLevelComplete(0, 300, 10, 10);
    resetSave();
    const save = getSave();
    expect(save.unlockedLevel).toBe(0);
    expect(save.levels).toEqual({});
  });
});
