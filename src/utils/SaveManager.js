import { LEVELS } from './constants.js';

const SAVE_KEY = 'skyhop-save';

const DEFAULT_SAVE = {
  unlockedLevel: 0,
  levels: {},
  settings: { muted: false },
  totalScore: 0,
};

function normalizeSave(data) {
  const save = { ...DEFAULT_SAVE, ...data, levels: { ...data.levels }, settings: { ...DEFAULT_SAVE.settings, ...data.settings } };
  if (!save.settings || typeof save.settings !== 'object') {
    save.settings = { ...DEFAULT_SAVE.settings };
  }
  if (typeof save.settings.muted !== 'boolean') {
    save.settings.muted = false;
  }
  if (typeof save.unlockedLevel !== 'number') {
    save.unlockedLevel = 0;
  }
  return save;
}

function loadRaw() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_SAVE, levels: {}, settings: { ...DEFAULT_SAVE.settings } };
    return normalizeSave(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SAVE, levels: {}, settings: { ...DEFAULT_SAVE.settings } };
  }
}

function saveRaw(data) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota / private-mode errors
  }
}

export function getSave() {
  return loadRaw();
}

export function isLevelUnlocked(index) {
  return index <= loadRaw().unlockedLevel;
}

export function getLevelProgress(index) {
  const save = loadRaw();
  return save.levels[String(index)] || { stars: 0, bestScore: 0, completed: false };
}

export function getSettings() {
  return loadRaw().settings;
}

export function setMuted(muted) {
  const save = loadRaw();
  save.settings.muted = muted;
  saveRaw(save);
}

export function isMuted() {
  return loadRaw().settings.muted;
}

export function hasVisitedLevel(index) {
  const prog = getLevelProgress(index);
  return prog.completed;
}

/** @returns {0|1|2|3} star count from collected/total */
export function calcStars(collected, total) {
  if (total <= 0) return 1;
  const pct = collected / total;
  if (pct >= 1) return 3;
  if (pct >= 0.8) return 2;
  if (pct >= 0.5) return 1;
  return 0;
}

export function recordLevelComplete(levelIndex, score, starsCollected, starsTotal) {
  const save = loadRaw();
  const key = String(levelIndex);
  const stars = calcStars(starsCollected, starsTotal);
  const prev = save.levels[key] || { stars: 0, bestScore: 0, completed: false };

  save.levels[key] = {
    stars: Math.max(prev.stars, stars),
    bestScore: Math.max(prev.bestScore, score),
    completed: true,
  };

  const maxIndex = LEVELS.length - 1;
  if (levelIndex + 1 > save.unlockedLevel && levelIndex < maxIndex) {
    save.unlockedLevel = levelIndex + 1;
  }
  if (levelIndex === maxIndex) {
    save.unlockedLevel = Math.max(save.unlockedLevel, maxIndex);
  }

  save.totalScore = Object.values(save.levels).reduce((sum, l) => sum + (l.bestScore || 0), 0);
  saveRaw(save);
  return stars;
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
}

// Restart the campaign without changing sound preferences or unrelated storage.
// Return failure so the UI never claims that progress was cleared when it wasn't.
export function restartProgress() {
  const settings = { ...getSettings() };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      ...DEFAULT_SAVE, levels: {}, settings,
    }));
    return true;
  } catch {
    return false;
  }
}

export function getTotalProgress() {
  const save = loadRaw();
  let totalStars = 0;
  let levelsCompleted = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    const prog = save.levels[String(i)];
    if (prog) {
      totalStars += prog.stars || 0;
      if (prog.completed) levelsCompleted++;
    }
  }
  return {
    totalStars,
    maxStars: LEVELS.length * 3,
    levelsCompleted,
    totalLevels: LEVELS.length,
  };
}
