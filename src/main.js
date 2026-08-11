import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import WorldMapScene from './scenes/WorldMapScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './utils/constants.js';
import { toggleFullscreen } from './utils/fullscreen.js';
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#2d1b4e',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, WorldMapScene, GameScene, UIScene, SettingsScene],
};

const game = new Phaser.Game(config);

window.addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen(game.scale);
  }
});

export default game;
