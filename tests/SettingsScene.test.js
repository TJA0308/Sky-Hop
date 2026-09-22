import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => ({ default: { Scene: class {} } }));

import SettingsScene from '../src/scenes/SettingsScene.js';
import { getSave, recordLevelComplete } from '../src/utils/SaveManager.js';

let scene;
beforeEach(() => {
  localStorage.clear();
  recordLevelComplete(0, 300, 10, 10);
  scene = new SettingsScene();
  scene.init({ returnScene: 'MenuScene', focusReset: true });
  scene.refreshMenuHighlight = vi.fn();
  scene.sfx = { play: vi.fn() };
  scene.scene = { start: vi.fn() };
  scene.resetMessage = { setText: vi.fn() };
});

describe('restart progress confirmation', () => {
  it('requires confirmation, then returns to a fresh world map', () => {
    scene.handleReset();
    expect(scene.confirmReset).toBe(true);
    expect(getSave().unlockedLevel).toBe(1);
    expect(scene.scene.start).not.toHaveBeenCalled();
    scene.handleReset();
    expect(getSave().unlockedLevel).toBe(0);
    expect(scene.scene.start).toHaveBeenCalledWith('WorldMapScene');
  });

  it('cancels without clearing progress', () => {
    scene.handleReset();
    scene.goBack();
    expect(scene.confirmReset).toBe(false);
    expect(getSave().unlockedLevel).toBe(1);
    expect(scene.scene.start).toHaveBeenCalledWith('MenuScene');
  });

  it('stays on settings and explains a failed save', () => {
    scene.handleReset();
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage denied');
    });
    try {
      scene.handleReset();
      expect(scene.scene.start).not.toHaveBeenCalled();
      expect(scene.resetMessage.setText).toHaveBeenCalledWith(expect.stringContaining('Could not clear'));
      expect(scene.confirmReset).toBe(false);
      expect(getSave().unlockedLevel).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });
});
