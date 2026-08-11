import Phaser from 'phaser';
import { LEVELS } from '../utils/constants.js';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  init(data) {
    this.levelIndex = data.levelIndex ?? 0;
    this.score = data.score ?? 0;
    this.lives = data.lives ?? 3;
    this.starsCollected = 0;
    this.starsTotal = 0;
    this.levelName = '';
    this.overlay = null;
  }

  create() {
    const w = this.scale.width;

    this.hudBg = this.add.rectangle(w / 2, 14, w, 28, 0x1a0a2e, 0.7).setScrollFactor(0).setDepth(100);

    this.levelText = this.add
      .text(8, 8, '', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#ffaa88',
      })
      .setScrollFactor(0)
      .setDepth(101);

    this.livesText = this.add
      .text(w - 8, 8, '', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#ff6644',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(101);

    this.scoreText = this.add
      .text(w / 2, 8, '', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#ffcc44',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(101);

    this.starText = this.add
      .text(w / 2, 18, '', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#ffffaa',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(101);

    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('updateHUD', this.onUpdateHUD, this);
    gameScene.events.on('levelComplete', this.onLevelComplete, this);
    gameScene.events.on('gameOver', this.onGameOver, this);

    this.events.on('shutdown', () => {
      gameScene.events.off('updateHUD', this.onUpdateHUD, this);
      gameScene.events.off('levelComplete', this.onLevelComplete, this);
      gameScene.events.off('gameOver', this.onGameOver, this);
    });
  }

  onUpdateHUD(data) {
    this.lives = data.lives;
    this.score = data.score;
    this.starsCollected = data.starsCollected;
    this.starsTotal = data.starsTotal;
    this.levelName = data.levelName;
    if (data.levelIndex !== undefined) this.levelIndex = data.levelIndex;
    this.refreshHUD();
  }

  refreshHUD() {
    this.levelText.setText(this.levelName);
    this.livesText.setText(`♥ ${this.lives}`);
    this.scoreText.setText(`${this.score}`);
    this.starText.setText(`★ ${this.starsCollected}/${this.starsTotal}`);
  }

  onLevelComplete(data) {
    this.showOverlay(() => {
      const w = this.scale.width;
      const h = this.scale.height;

      this.add
        .text(w / 2, h / 2 - 50, 'LEVEL CLEAR!', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '16px',
          color: '#ffcc44',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 - 10, `Stars: ${data.starsCollected}/${data.starsTotal}`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#ffffaa',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 + 20, `Score: ${data.score}`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      const isLastLevel = data.levelIndex >= LEVELS.length - 1;
      const prompt = isLastLevel ? 'Press ENTER — Victory!' : 'Press ENTER — Next Level';

      const continueText = this.add
        .text(w / 2, h / 2 + 60, prompt, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#ffaa88',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.tweens.add({ targets: continueText, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

      const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      this.input.keyboard.once('keydown-ENTER', () => this.advanceLevel(data, isLastLevel));
      this.input.keyboard.once('keydown-SPACE', () => this.advanceLevel(data, isLastLevel));
    });
  }

  advanceLevel(data, isLastLevel) {
    this.clearOverlay();
    if (isLastLevel) {
      this.showVictory(data.score);
    } else {
      this.scene.stop('GameScene');
      this.scene.start('GameScene', {
        levelIndex: data.levelIndex + 1,
        score: data.score,
        lives: data.lives,
      });
    }
  }

  showVictory(score) {
    this.showOverlay(() => {
      const w = this.scale.width;
      const h = this.scale.height;

      this.add
        .text(w / 2, h / 2 - 40, 'VICTORY!', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '20px',
          color: '#ffcc44',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 + 10, `Final Score: ${score}`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '10px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 + 50, 'Press ENTER for Menu', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#ffaa88',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.input.keyboard.once('keydown-ENTER', () => {
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      });
      this.input.keyboard.once('keydown-SPACE', () => {
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      });
    });
  }

  onGameOver(data) {
    this.showOverlay(() => {
      const w = this.scale.width;
      const h = this.scale.height;

      this.add
        .text(w / 2, h / 2 - 30, 'GAME OVER', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '18px',
          color: '#ff4444',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 + 10, `Score: ${data.score}`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 + 50, 'ENTER — Menu   R — Retry', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '7px',
          color: '#ffaa88',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.input.keyboard.once('keydown-ENTER', () => {
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      });

      this.input.keyboard.once('keydown-R', () => {
        this.clearOverlay();
        this.scene.stop('GameScene');
        this.scene.start('GameScene', { levelIndex: this.levelIndex, score: 0, lives: 3 });
      });
    });
  }

  showOverlay(buildContent) {
    this.clearOverlay();
    const w = this.scale.width;
    const h = this.scale.height;
    this.overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x1a0a2e, 0.75).setScrollFactor(0).setDepth(200);
    buildContent();
  }

  clearOverlay() {
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
    this.children.list
      .filter((c) => c.depth >= 200)
      .forEach((c) => c.destroy());
  }
}
