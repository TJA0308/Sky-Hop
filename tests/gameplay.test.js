import { EventEmitter } from 'node:events';
import { describe, it, expect, vi } from 'vitest';
vi.mock('phaser', () => ({ default: { Scene: class {}, Physics: { Arcade: { Sprite: class {} } } } }));
import GameScene from '../src/scenes/GameScene.js';
import UIScene from '../src/scenes/UIScene.js';

describe('attempt lifecycle', () => {
  it('restarting discards earned points and restores lives', () => {
    const game = new GameScene();
    game.init({ levelIndex: 4, score: 0, lives: 1 });
    game.score = 900;
    game.hidePauseMenu = vi.fn();
    game.physics = { resume: vi.fn() };
    game.scene = { restart: vi.fn() };
    game.restartLevel();
    expect(game.scene.restart).toHaveBeenCalledWith({ levelIndex: 4, score: 0, lives: 3, fromMap: true });
  });
  it('ignores collectible overlaps after the finish', () => {
    const game = new GameScene();
    game.levelComplete = true;
    const star = { active: true, destroy: vi.fn() };
    game.collectStar({ isDead: false }, star);
    expect(star.destroy).not.toHaveBeenCalled();
  });
  it('HUD snapshots include the current attempt ability state', () => {
    const game = new GameScene();
    game.init({ levelIndex: 4 });
    game.player = { hasDoubleJump: false };
    game.levelData = { name: 'Double Jump', stars: [1, 2] };
    expect(game.getHUDState()).toMatchObject({ hasDoubleJump: false, score: 0, starsTotal: 2 });
  });
});

describe('overlay transitions', () => {
  it('consumes paired keys once and removes the unused listener', () => {
    const ui = new UIScene();
    ui.input = { keyboard: new EventEmitter() };
    const action = vi.fn();
    const click = ui.bindOverlayAction(['ENTER', 'SPACE'], action);
    ui.input.keyboard.emit('keydown-ENTER', { repeat: true });
    expect(action).not.toHaveBeenCalled();
    ui.input.keyboard.emit('keydown-ENTER', {});
    ui.input.keyboard.emit('keydown-SPACE', {});
    click();
    expect(action).toHaveBeenCalledTimes(1);
    expect(ui.input.keyboard.listenerCount('keydown-SPACE')).toBe(0);
  });
});
