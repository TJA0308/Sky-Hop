import Phaser from 'phaser';
import { LEVELS, MAX_LIVES } from '../utils/constants.js';
import { recordLevelComplete, getTotalProgress } from '../utils/SaveManager.js';

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
    this.hasDoubleJump = false;
  }

  create() {
    const w = this.scale.width;

    this.hudBg = this.add.graphics().setScrollFactor(0).setDepth(100);
    this.hudBg.fillStyle(0x1a0a2e, 0.75);
    this.hudBg.fillRoundedRect(4, 2, w - 8, 26, 6);
    this.hudBg.lineStyle(1, 0xffcc44, 0.4);
    this.hudBg.strokeRoundedRect(4, 2, w - 8, 26, 6);

    this.levelText = this.add
      .text(8, 8, '', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#ffaa88',
      })
      .setScrollFactor(0)
      .setDepth(101);

    this.heartIcons = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const heart = this.add
        .image(w - 10 - i * 15, 11, 'heart')
        .setOrigin(1, 0.5)
        .setScrollFactor(0)
        .setDepth(101);
      this.heartIcons.push(heart);
    }

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

    this.doubleJumpBadge = this.add
      .text(w - 8, 18, '', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#cc88ff',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(101)
      .setVisible(false);

    const gameScene = this.scene.get('GameScene');
    gameScene.events.on('updateHUD', this.onUpdateHUD, this);
    gameScene.events.on('levelComplete', this.onLevelComplete, this);
    gameScene.events.on('gameOver', this.onGameOver, this);
    gameScene.events.on('powerUpCollected', this.onPowerUpCollected, this);

    this.events.on('shutdown', () => {
      gameScene.events.off('updateHUD', this.onUpdateHUD, this);
      gameScene.events.off('levelComplete', this.onLevelComplete, this);
      gameScene.events.off('gameOver', this.onGameOver, this);
      gameScene.events.off('powerUpCollected', this.onPowerUpCollected, this);
    });
  }

  onPowerUpCollected(data) {
    if (data.type === 'doubleJump') {
      this.hasDoubleJump = true;
      this.doubleJumpBadge.setText('✦ 2x JUMP');
      this.doubleJumpBadge.setVisible(true);
      this.doubleJumpBadge.setScale(1);
      this.tweens.add({
        targets: this.doubleJumpBadge,
        scale: 1.2,
        duration: 150,
        yoyo: true,
      });
    }
  }

  onUpdateHUD(data) {
    const scoreChanged = data.score !== this.score;
    const starsChanged = data.starsCollected !== this.starsCollected;
    const livesLost = data.lives < this.lives;

    this.lives = data.lives;
    this.score = data.score;
    this.starsCollected = data.starsCollected;
    this.starsTotal = data.starsTotal;
    this.levelName = data.levelName;
    if (data.levelIndex !== undefined) this.levelIndex = data.levelIndex;

    this.refreshHUD();
    if (scoreChanged) this.pop(this.scoreText);
    if (starsChanged) this.pop(this.starText);
    if (livesLost) this.shakeHearts();
  }

  pop(target) {
    this.tweens.add({ targets: target, scale: { from: 1.4, to: 1 }, duration: 220, ease: 'Back.easeOut' });
  }

  shakeHearts() {
    this.heartIcons.forEach((h) => {
      this.tweens.add({ targets: h, x: h.x - 3, duration: 60, yoyo: true, repeat: 2 });
    });
  }

  refreshHUD() {
    this.levelText.setText(this.levelName);
    this.heartIcons.forEach((h, i) => h.setVisible(i < this.lives));
    this.scoreText.setText(`${this.score}`);
    this.starText.setText(`★ ${this.starsCollected}/${this.starsTotal}`);
    if (this.doubleJumpBadge) {
      this.doubleJumpBadge.setVisible(this.hasDoubleJump);
    }
  }

  starRatingDisplay(stars) {
    if (stars === 0) return '☆☆☆';
    let s = '';
    for (let i = 0; i < 3; i++) {
      s += i < stars ? '★' : '☆';
    }
    return s;
  }

  onLevelComplete(data) {
    const earnedStars = recordLevelComplete(
      data.levelIndex,
      data.score,
      data.starsCollected,
      data.starsTotal
    );

    this.showOverlay(() => {
      const w = this.scale.width;
      const h = this.scale.height;

      this.add
        .text(w / 2, h / 2 - 70, 'LEVEL CLEAR!', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '16px',
          color: '#ffcc44',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 - 30, this.starRatingDisplay(earnedStars), {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '20px',
          color: '#ffffaa',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 + 10, `Stars: ${data.starsCollected}/${data.starsTotal}`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#ffffaa',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 + 28, '★=50%  ★★=80%  ★★★=100%', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '5px',
          color: '#ccaaee',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 + 48, `Score: ${data.score}`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      const isLastLevel = data.levelIndex >= LEVELS.length - 1;
      const prompt = isLastLevel ? 'ENTER — Victory!' : 'ENTER — World Map';

      const continueText = this.add
        .text(w / 2, h / 2 + 78, prompt, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#ffaa88',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.tweens.add({ targets: continueText, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

      this.input.keyboard.once('keydown-ENTER', () => this.advanceLevel(data, isLastLevel));
      this.input.keyboard.once('keydown-SPACE', () => this.advanceLevel(data, isLastLevel));
    });
  }

  advanceLevel(data, isLastLevel) {
    this.clearOverlay();
    if (isLastLevel) {
      this.showVictory(data.score);
    } else {
      this.goToMap();
    }
  }

  goToMap() {
    this.cameras.main.fadeOut(300, 26, 10, 46);
    this.time.delayedCall(300, () => {
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('WorldMapScene');
    });
  }

  showVictory(score) {
    const progress = getTotalProgress();

    this.showOverlay(() => {
      const w = this.scale.width;
      const h = this.scale.height;

      this.add
        .text(w / 2, h / 2 - 80, 'VICTORY!', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '20px',
          color: '#ffcc44',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 - 45, 'Sunset Summit Conquered!', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '7px',
          color: '#ffaa88',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 - 15, `Final Score: ${score}`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '9px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 + 15, `★ ${progress.totalStars}/${progress.maxStars} stars`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '7px',
          color: '#ffffaa',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 + 35, `${progress.levelsCompleted}/${progress.totalLevels} levels complete`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '6px',
          color: '#ccaaee',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.add
        .text(w / 2, h / 2 + 65, 'ENTER — World Map', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#ffaa88',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.input.keyboard.once('keydown-ENTER', () => this.goToMap());
      this.input.keyboard.once('keydown-SPACE', () => this.goToMap());
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
        .text(w / 2, h / 2 + 50, 'ENTER — Map   R / SPACE — Retry', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '7px',
          color: '#ffaa88',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

      this.input.keyboard.once('keydown-ENTER', () => this.goToMap());

      const retry = () => {
        this.clearOverlay();
        const idx = data.levelIndex ?? this.levelIndex;
        this.scene.stop('GameScene');
        this.scene.stop('UIScene');
        this.scene.start('GameScene', {
          levelIndex: idx,
          score: 0,
          lives: MAX_LIVES,
          fromMap: true,
        });
        this.scene.launch('UIScene', { levelIndex: idx, score: 0, lives: MAX_LIVES });
      };
      this.input.keyboard.once('keydown-R', retry);
      this.input.keyboard.once('keydown-SPACE', retry);
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
