import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Puffling from '../entities/Puffling.js';
import Wisp from '../entities/Wisp.js';
import MovingPlatform from '../entities/MovingPlatform.js';
import PowerUp from '../entities/PowerUp.js';
import TouchControls from '../entities/TouchControls.js';
import Sfx from '../utils/sfx.js';
import { skyTexture } from '../utils/sky.js';
import { hasVisitedLevel } from '../utils/SaveManager.js';
import {
  TILE_SIZE,
  TILE,
  MAX_LIVES,
  STAR_SCORE,
  LEVELS,
} from '../utils/constants.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.levelIndex = data.levelIndex ?? 0;
    this.score = data.score ?? 0;
    this.startingScore = this.score;
    this.lives = data.lives ?? MAX_LIVES;
    this.starsCollected = 0;
    this.isPaused = false;
    this.levelComplete = false;
    this.checkpoint = null;
    this.fromMap = data.fromMap ?? true;
  }

  create() {
    this.cameras.main.fadeIn(400, 26, 10, 46);
    this.sfx = new Sfx(this);
    const levelKey = LEVELS[this.levelIndex];
    this.levelData = this.cache.json.get(levelKey);

    this.setupParallax();
    this.buildLevel();
    this.spawnEntities();
    this.setupCollisions();
    this.setupCamera();
    this.setupInput();
    this.setupPauseMenu();
    this.setupTouchControls();

    this.physics.resume();
    this.updateHUD();

    this.showLevelIntro();
  }

  showLevelIntro() {
    const w = this.scale.width;
    const h = this.scale.height;
    const hint = this.levelData.hint || '';
    const firstVisit = !hasVisitedLevel(this.levelIndex);

    const banner = this.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(50);
    const bg = this.add.rectangle(0, 0, w, 60, 0x1a0a2e, 0.85);
    const title = this.add
      .text(0, -8, this.levelData.name, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#ffcc44',
      })
      .setOrigin(0.5);
    banner.add([bg, title]);

    if (firstVisit && hint) {
      const hintText = this.add
        .text(0, 14, hint, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '6px',
          color: '#ffaa88',
        })
        .setOrigin(0.5);
      banner.add(hintText);
    }

    banner.setAlpha(0);
    this.tweens.add({
      targets: banner,
      alpha: 1,
      duration: 300,
      hold: firstVisit && hint ? 1200 : 800,
      yoyo: true,
      onComplete: () => banner.destroy(),
    });
  }

  setupParallax() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.bgSky = this.add.image(0, 0, skyTexture(this.levelIndex)).setOrigin(0).setDisplaySize(w, h).setScrollFactor(0).setDepth(-10);
    this.bgClouds = this.add.tileSprite(0, 0, w, h, 'bg-clouds-far').setOrigin(0).setScrollFactor(0).setDepth(-9).setAlpha(0.7);
    this.bgIslands = this.add.tileSprite(0, 0, w, h, 'bg-islands').setOrigin(0).setScrollFactor(0).setDepth(-8).setAlpha(0.5);
    this.bgMist = this.add.tileSprite(0, 0, w, h, 'bg-mist').setOrigin(0).setScrollFactor(0).setDepth(-7).setAlpha(0.6);
  }

  buildLevel() {
    const { width, height, tiles } = this.levelData;

    this.physics.world.setBounds(0, 0, width * TILE_SIZE, height * TILE_SIZE);

    const map = this.make.tilemap({
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      width,
      height,
    });

    const tileset = map.addTilesetImage('tiles', 'tileset', TILE_SIZE, TILE_SIZE, 0, 0, 0);
    this.groundLayer = map.createBlankLayer('ground', tileset, 0, 0);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tiles[y][x];
        if (tile > 0) {
          this.groundLayer.putTileAt(tile - 1, x, y);
        }
      }
    }

    this.groundLayer.setCollision([TILE.GRASS - 1, TILE.STONE - 1]);
    this.groundLayer.setDepth(0);

    this.spikeTiles = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y][x] === TILE.SPIKE) {
          this.spikeTiles.push({ x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 });
        }
      }
    }
  }

  spawnEntities() {
    const d = this.levelData;

    this.player = new Player(this, d.spawn.x * TILE_SIZE + TILE_SIZE / 2, d.spawn.y * TILE_SIZE + TILE_SIZE / 2);

    this.movingPlatforms = this.add.group();
    (d.movingPlatforms || []).forEach((mp) => {
      const platform = new MovingPlatform(this, mp.x, mp.y, mp.distance, mp.axis, mp.speed);
      this.movingPlatforms.add(platform);
    });

    this.enemies = this.add.group();
    d.enemies.forEach((e) => {
      const ex = e.x * TILE_SIZE + TILE_SIZE / 2;
      const ey = e.y * TILE_SIZE + TILE_SIZE / 2;
      if (e.type === 'wisp') {
        const wisp = new Wisp(this, ex, ey, e.patrol || 3);
        this.enemies.add(wisp);
      } else {
        const puff = new Puffling(this, ex, ey, e.x * TILE_SIZE, (e.x + e.patrol) * TILE_SIZE);
        this.enemies.add(puff);
      }
    });

    this.powerUps = this.add.group();
    (d.powerUps || []).forEach((pu) => {
      const powerUp = new PowerUp(this, pu.x, pu.y, pu.type);
      this.powerUps.add(powerUp);
    });

    this.stars = this.add.group();
    d.stars.forEach((s) => {
      const star = this.physics.add.sprite(
        s[0] * TILE_SIZE + TILE_SIZE / 2,
        s[1] * TILE_SIZE + TILE_SIZE / 2,
        'star',
        0
      );
      star.setSize(12, 12);
      star.body.setAllowGravity(false);
      star.play('star-spin');
      star.setDepth(3);
      this.stars.add(star);
    });

    this.goalFlag = this.physics.add.sprite(
      d.goal.x * TILE_SIZE + TILE_SIZE / 2,
      d.goal.y * TILE_SIZE,
      'goal-flag'
    );
    this.goalFlag.body.setAllowGravity(false);
    this.goalFlag.setSize(16, 32);
    this.goalFlag.setOffset(4, 0);
    this.goalFlag.setDepth(2);

    if (d.checkpoint) {
      this.checkpointFlag = this.add.sprite(
        d.checkpoint.x * TILE_SIZE + TILE_SIZE / 2,
        d.checkpoint.y * TILE_SIZE,
        'checkpoint-flag'
      );
      this.checkpointFlag.setDepth(2);
    }
  }

  setupCollisions() {
    this.physics.add.collider(this.player, this.groundLayer);
    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.enemies, this.movingPlatforms);

    this.movingPlatforms.children.iterate((platform) => {
      this.physics.add.collider(this.player, platform);
    });

    this.physics.add.overlap(this.player, this.enemies, this.handleEnemyOverlap, null, this);
    this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
    this.physics.add.overlap(this.player, this.goalFlag, this.reachGoal, null, this);
    this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, null, this);
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, this.levelData.width * TILE_SIZE, this.levelData.height * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  setupInput() {
    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.pauseKeyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
  }

  setupPauseMenu() {
    this.pauseOverlay = null;
    this.pauseContainer = null;
  }

  setupTouchControls() {
    this.touchControls = null;
    if (this.sys.game.device.input.touch) {
      this.touchControls = new TouchControls(this);
    }
    this.add.text(this.scale.width - 12, 40, 'II PAUSE', {
      fontFamily: '"Press Start 2P", monospace', fontSize: '7px',
      color: '#ffffff', backgroundColor: '#183454', padding: { x: 10, y: 10 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(80)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.togglePause());
  }

  burst(x, y, color, count = 10) {
    const emitter = this.add.particles(x, y, 'spark', {
      tint: color,
      speed: { min: 60, max: 160 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 350,
      quantity: count,
    });
    emitter.setDepth(20);
    emitter.explode(count, x, y);
    this.time.delayedCall(450, () => emitter.destroy());
  }

  togglePause() {
    if (this.levelComplete || this.player.isDead) return;

    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      this.showPauseMenu();
    } else {
      this.physics.resume();
      this.hidePauseMenu();
    }
  }

  showPauseMenu() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.pauseOverlay = this.add.rectangle(w / 2, h / 2, w, h, 0x1a0a2e, 0.8).setScrollFactor(0).setDepth(90);
    this.pauseContainer = this.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(91);

    const title = this.add
      .text(0, -60, 'PAUSED', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: '#ffcc44',
      })
      .setOrigin(0.5);

    const items = [
      { label: 'Resume (Esc/P)', action: () => this.togglePause() },
      { label: 'Restart Level', action: () => this.restartLevel() },
      { label: 'Quit to Map', action: () => this.quitToMap() },
    ];

    this.pauseContainer.add(title);
    items.forEach((item, i) => {
      const txt = this.add
        .text(0, -10 + i * 28, item.label, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: false });
      txt.on('pointerover', () => txt.setColor('#ffaa88'));
      txt.on('pointerout', () => txt.setColor('#ffffff'));
      txt.on('pointerdown', item.action);
      this.pauseContainer.add(txt);
    });

    const controls = this.add
      .text(0, 80, '← → Move   SPACE Jump   F Fullscreen', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '5px',
        color: '#ccaaee',
      })
      .setOrigin(0.5);
    this.pauseContainer.add(controls);
  }

  hidePauseMenu() {
    if (this.pauseOverlay) this.pauseOverlay.destroy();
    if (this.pauseContainer) this.pauseContainer.destroy();
    this.pauseOverlay = null;
    this.pauseContainer = null;
  }

  restartLevel() {
    this.hidePauseMenu();
    this.isPaused = false;
    this.physics.resume();
    this.scene.restart({ levelIndex: this.levelIndex, score: this.startingScore, lives: MAX_LIVES, fromMap: this.fromMap });
  }

  quitToMap() {
    this.hidePauseMenu();
    this.isPaused = false;
    this.physics.resume();
    this.cameras.main.fadeOut(300, 26, 10, 46);
    this.time.delayedCall(300, () => {
      this.scene.stop('UIScene');
      this.scene.start('WorldMapScene');
    });
  }

  handleEnemyOverlap(player, enemy) {
    if (enemy.isSquished || player.isDead || this.levelComplete || this.isPaused) return;

    const playerBottom = player.y + player.body.height / 2;
    const enemyTop = enemy.y - enemy.body.height / 2;

    if (player.body.velocity.y > 0 && playerBottom <= enemyTop + 10) {
      enemy.squish();
      player.stompBounce();
      this.score += 50;
      this.showScorePopup(player.x, player.y - 20, '+50');
      this.burst(enemy.x, enemy.y, 0xffaa88, 8);
      this.updateHUD();
    } else {
      this.takeDamage();
    }
  }

  collectStar(player, star) {
    if (!star.active || this.isPaused || this.levelComplete || player.isDead) return;
    const sx = star.x;
    const sy = star.y;
    star.destroy();
    this.starsCollected++;
    this.score += STAR_SCORE;
    this.showScorePopup(sx, sy - 10, `+${STAR_SCORE}`);
    this.burst(sx, sy, 0xffcc44, 10);
    this.sfx.play('coin');
    this.updateHUD();
  }

  collectPowerUp(player, powerUp) {
    if (!powerUp.active || powerUp.collected || this.isPaused || this.levelComplete || player.isDead) return;
    if (powerUp.type === 'doubleJump') {
      player.grantDoubleJump();
      this.sfx.play('powerup');
      this.burst(powerUp.x, powerUp.y, 0xff88ff, 10);
      this.events.emit('powerUpCollected', { type: 'doubleJump' });
    }
    powerUp.collect();
  }

  showScorePopup(x, y, text) {
    const popup = this.add
      .text(x, y, text, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#ffcc44',
        stroke: '#1a0a2e',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.tweens.add({
      targets: popup,
      y: y - 24,
      alpha: 0,
      duration: 700,
      onComplete: () => popup.destroy(),
    });
  }

  showToast(message) {
    const w = this.scale.width;
    const toast = this.add
      .text(w / 2, 50, message, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#ffcc44',
        stroke: '#1a0a2e',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(95);
    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: 40,
      duration: 1200,
      delay: 400,
      onComplete: () => toast.destroy(),
    });
  }

  reachGoal() {
    if (this.levelComplete || this.player.isDead || this.isPaused) return;
    this.levelComplete = true;
    this.player.setVelocity(0, 0);
    this.physics.pause();
    this.burst(this.player.x, this.player.y, 0xffffaa, 16);
    this.sfx.play('win');

    this.events.emit('levelComplete', {
      levelIndex: this.levelIndex,
      score: this.score,
      starsCollected: this.starsCollected,
      starsTotal: this.levelData.stars.length,
      lives: this.lives,
    });
  }

  loseLife() {
    if (this.player.isDead || this.levelComplete) return;
    this.lives--;
    this.updateHUD();

    if (this.lives <= 0) {
      this.player.die();
      this.time.delayedCall(800, () => {
        this.events.emit('gameOver', { score: this.score, levelIndex: this.levelIndex });
      });
    } else {
      this.respawnPlayer();
    }
  }

  takeDamage() {
    if (this.levelComplete || this.player.isDead || this.player.invuln) return false;
    if (this.player.hurt()) {
      this.cameras.main.shake(150, 0.006);
      this.loseLife();
      return true;
    }
    return false;
  }

  respawnPlayer() {
    const spawn = this.checkpoint || this.levelData.spawn;
    this.player.respawn(
      spawn.x * TILE_SIZE + TILE_SIZE / 2,
      spawn.y * TILE_SIZE + TILE_SIZE / 2
    );
  }

  getHUDState() {
    return {
      lives: this.lives,
      score: this.score,
      starsCollected: this.starsCollected,
      starsTotal: this.levelData.stars.length,
      levelName: this.levelData.name,
      levelIndex: this.levelIndex,
      hasDoubleJump: this.player.hasDoubleJump,
    };
  }

  updateHUD() {
    this.events.emit('updateHUD', this.getHUDState());
  }

  update(time, delta) {
    if (this.levelComplete) return;

    if (
      Phaser.Input.Keyboard.JustDown(this.pauseKey) ||
      Phaser.Input.Keyboard.JustDown(this.pauseKeyP)
    ) {
      this.togglePause();
      return;
    }

    if (this.isPaused) return;

    if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      if (!this.player.isDead) this.restartLevel();
      return;
    }

    const scrollX = this.cameras.main.scrollX;
    this.bgClouds.tilePositionX = scrollX * 0.2 + time * 0.003;
    this.bgIslands.tilePositionX = scrollX * 0.4;
    this.bgMist.tilePositionX = scrollX * 0.6;

    if (this.player.y > this.levelData.height * TILE_SIZE + 32) {
      this.takeDamage();
    }

    if (!this.player.invuln && !this.player.isDead) {
      for (const spike of this.spikeTiles) {
        const dx = Math.abs(this.player.x - spike.x);
        const dy = Math.abs(this.player.y - spike.y);
        if (dx < 10 && dy < 10) {
          this.takeDamage();
          break;
        }
      }
    }

    if (this.levelData.checkpoint && !this.checkpoint) {
      const cp = this.levelData.checkpoint;
      const cpx = cp.x * TILE_SIZE + TILE_SIZE / 2;
      const cpy = cp.y * TILE_SIZE;
      if (Math.abs(this.player.x - cpx) < 20 && Math.abs(this.player.y - cpy) < 40) {
        this.checkpoint = cp;
        this.sfx.play('coin');
        this.showToast('Checkpoint!');
      }
    }
  }
}
