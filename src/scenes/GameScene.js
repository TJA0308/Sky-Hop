import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Puffling from '../entities/Puffling.js';
import Sfx from '../utils/sfx.js';
import {
  TILE_SIZE,
  TILE,
  MAX_LIVES,
  STAR_SCORE,
  GAME_HEIGHT,
  LEVELS,
} from '../utils/constants.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.levelIndex = data.levelIndex ?? 0;
    this.score = data.score ?? 0;
    this.lives = data.lives ?? MAX_LIVES;
    this.starsCollected = 0;
    this.isPaused = false;
    this.levelComplete = false;
    this.checkpoint = null;
  }

  create() {
    this.sfx = new Sfx(this);
    const levelKey = LEVELS[this.levelIndex];
    this.levelData = this.cache.json.get(levelKey);

    this.setupParallax();
    this.buildLevel();
    this.spawnEntities();
    this.setupCollisions();
    this.setupCamera();
    this.setupInput();

    this.events.emit('updateHUD', {
      lives: this.lives,
      score: this.score,
      starsCollected: this.starsCollected,
      starsTotal: this.levelData.stars.length,
      levelName: this.levelData.name,
      levelIndex: this.levelIndex,
    });
  }

  setupParallax() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.bgSky = this.add.tileSprite(0, 0, w, h, 'bg-sky').setOrigin(0).setScrollFactor(0).setDepth(-10);
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

    this.enemies = this.add.group();
    d.enemies.forEach((e) => {
      const puff = new Puffling(
        this,
        e.x * TILE_SIZE + TILE_SIZE / 2,
        e.y * TILE_SIZE + TILE_SIZE / 2,
        e.x * TILE_SIZE,
        (e.x + e.patrol) * TILE_SIZE
      );
      this.enemies.add(puff);
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

    this.physics.add.overlap(this.player, this.enemies, this.handleEnemyOverlap, null, this);
    this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
    this.physics.add.overlap(this.player, this.goalFlag, this.reachGoal, null, this);
  }

  setupCamera() {
    this.cameras.main.setBounds(0, 0, this.levelData.width * TILE_SIZE, this.levelData.height * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  setupInput() {
    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  handleEnemyOverlap(player, enemy) {
    if (enemy.isSquished || player.isDead || this.levelComplete) return;

    const playerBottom = player.y + player.body.height / 2;
    const enemyTop = enemy.y - enemy.body.height / 2;

    if (player.body.velocity.y > 0 && playerBottom <= enemyTop + 8) {
      enemy.squish();
      player.stompBounce();
      this.score += 50;
      this.updateHUD();
    } else if (player.hurt()) {
      this.loseLife();
    }
  }

  collectStar(player, star) {
    if (!star.active) return;
    star.destroy();
    this.starsCollected++;
    this.score += STAR_SCORE;
    this.sfx.play('coin');
    this.updateHUD();
  }

  reachGoal() {
    if (this.levelComplete || this.player.isDead) return;
    this.levelComplete = true;
    this.player.setVelocity(0, 0);
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
    this.lives--;
    this.updateHUD();

    if (this.lives <= 0) {
      this.player.die();
      this.time.delayedCall(800, () => {
        this.events.emit('gameOver', { score: this.score });
      });
    } else {
      this.respawnPlayer();
    }
  }

  respawnPlayer() {
    const spawn = this.checkpoint || this.levelData.spawn;
    this.player.respawn(
      spawn.x * TILE_SIZE + TILE_SIZE / 2,
      spawn.y * TILE_SIZE + TILE_SIZE / 2
    );
  }

  updateHUD() {
    this.events.emit('updateHUD', {
      lives: this.lives,
      score: this.score,
      starsCollected: this.starsCollected,
      starsTotal: this.levelData.stars.length,
      levelName: this.levelData.name,
      levelIndex: this.levelIndex,
    });
  }

  update(time, delta) {
    if (this.levelComplete) return;

    if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart({ levelIndex: this.levelIndex, score: this.score, lives: this.lives });
      return;
    }

    // Parallax scroll
    const scrollX = this.cameras.main.scrollX;
    this.bgClouds.tilePositionX = scrollX * 0.2;
    this.bgIslands.tilePositionX = scrollX * 0.4;
    this.bgMist.tilePositionX = scrollX * 0.6;

    // Pit death
    if (this.player.y > this.levelData.height * TILE_SIZE + 32 && !this.player.isDead) {
      this.lives--;
      this.updateHUD();
      if (this.lives <= 0) {
        this.player.die();
        this.time.delayedCall(800, () => {
          this.events.emit('gameOver', { score: this.score });
        });
      } else {
        this.respawnPlayer();
      }
    }

    // Spike overlap
    if (!this.player.invuln && !this.player.isDead) {
      for (const spike of this.spikeTiles) {
        const dx = Math.abs(this.player.x - spike.x);
        const dy = Math.abs(this.player.y - spike.y);
        if (dx < 10 && dy < 10) {
          if (this.player.hurt()) {
            this.loseLife();
          }
          break;
        }
      }
    }

    // Checkpoint
    if (this.levelData.checkpoint && !this.checkpoint) {
      const cp = this.levelData.checkpoint;
      const cpx = cp.x * TILE_SIZE + TILE_SIZE / 2;
      const cpy = cp.y * TILE_SIZE;
      if (Math.abs(this.player.x - cpx) < 20 && Math.abs(this.player.y - cpy) < 40) {
        this.checkpoint = cp;
        this.sfx.play('coin');
      }
    }
  }
}
