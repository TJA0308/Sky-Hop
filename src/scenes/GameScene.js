import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Puffling from '../entities/Puffling.js';
import Wisp from '../entities/Wisp.js';
import MovingPlatform from '../entities/MovingPlatform.js';
import PowerUp from '../entities/PowerUp.js';
import CrumblingPlatform from '../entities/CrumblingPlatform.js';
import TouchControls from '../entities/TouchControls.js';
import Sfx from '../utils/sfx.js';
import { addSkyLayers, zoneIndex } from '../utils/sky.js';
import { playZoneMusic } from '../utils/music.js';
import { frameFor, undersideRuns, SOLID_FRAMES } from '../utils/autotile.js';
import { hasVisitedLevel } from '../utils/SaveManager.js';
import {
  TILE_SIZE,
  TILE,
  MAX_LIVES,
  STAR_SCORE,
  LEVELS,
  CAMERA_ZOOM,
  CAMERA_LOOKAHEAD,
  CAMERA_BOTTOM_PAD,
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

    this.setupCameras();
    this.setupParallax();
    playZoneMusic(this, zoneIndex(this.levelIndex));
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

    const banner = this.add.container(w / 2, h / 2 - 40).setScrollFactor(0).setDepth(50);
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

    this.asUI(banner);
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

  /**
   * Two cameras: the main one is zoomed in on the world, and an unzoomed one
   * draws screen-space UI (banner, pause menu, touch buttons). Everything is
   * hidden from the UI camera as it is added; `asUI` flips an object over.
   */
  setupCameras() {
    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height).setName('ui');
    const hideFromUI = (obj) => this.uiCam.ignore(obj);
    this.events.on('addedtoscene', hideFromUI);
    this.events.once('shutdown', () => this.events.off('addedtoscene', hideFromUI));
    this.lookX = 0;
    this.combo = 0;
    this.lastStarAt = -Infinity;
    this.hitStopping = false;
  }

  /** Marks an object (and a container's children) as screen-space UI. */
  asUI(obj) {
    const mainId = this.cameras.main.id;
    const mark = (o) => {
      o.cameraFilter = mainId;
      o.list?.forEach(mark);
    };
    mark(obj);
    return obj;
  }

  setupParallax() {
    addSkyLayers(this, this.levelIndex, CAMERA_ZOOM);

    // Weather pinned to the view: rain in Storm Pass, drifting motes by day,
    // fireflies from twilight on.
    const w = this.scale.width;
    const h = this.scale.height;
    const zone = zoneIndex(this.levelIndex);
    const view = {
      x: { min: w * (0.5 - 0.5 / CAMERA_ZOOM), max: w * (0.5 + 0.6 / CAMERA_ZOOM) },
      y: { min: h * (0.5 - 0.5 / CAMERA_ZOOM), max: h * (0.5 + 0.5 / CAMERA_ZOOM) },
    };
    if (zone === 1) {
      this.add
        .particles(0, 0, 'streak', {
          x: view.x,
          y: { min: view.y.min - 20, max: view.y.min },
          speedX: -70,
          speedY: 330,
          rotate: 102,
          scaleX: { min: 0.5, max: 1 },
          alpha: { start: 0.45, end: 0.15 },
          tint: 0xcfe0ff,
          lifespan: 800,
          frequency: 28,
        })
        .setScrollFactor(0)
        .setDepth(7);
      return;
    }
    const dusk = zone >= 2;
    this.add
      .particles(0, 0, 'spark', {
        x: view.x,
        y: view.y,
        speedX: { min: -9, max: -3 },
        speedY: { min: -4, max: 4 },
        scale: { min: 0.25, max: 0.5 },
        alpha: { start: dusk ? 0.9 : 0.5, end: 0 },
        tint: dusk ? 0xfff2a0 : 0xffffff,
        lifespan: 5000,
        frequency: dusk ? 350 : 550,
      })
      .setScrollFactor(0)
      .setDepth(-5);
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
        const frame = frameFor(tiles, x, y);
        if (frame >= 0) {
          this.groundLayer.putTileAt(frame, x, y);
        }
      }
    }

    this.groundLayer.setCollision(SOLID_FRAMES);
    this.groundLayer.setDepth(0);
    this.drawUndersides();

    this.spikeTiles = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y][x] === TILE.SPIKE) {
          this.spikeTiles.push({ x: x * TILE_SIZE + TILE_SIZE / 2, y: y * TILE_SIZE + TILE_SIZE / 2 });
        }
      }
    }
  }

  /**
   * Hangs rock beneath every island, in stepped 2px rows. Wide islands are
   * split into several lobes so they read as craggy rather than one wedge.
   */
  drawUndersides() {
    const g = this.add.graphics().setDepth(-1);
    const lobe = (x0, width, top, seed) => {
      const depth = Phaser.Math.Clamp(Math.round(width * 0.34), 8, 34);
      const rows = Math.floor(depth / 2);
      const lean = 0.38 + (seed % 3) * 0.12;
      for (let r = 0; r < rows; r++) {
        const t = (r + 1) / rows;
        const jitter = ((seed * 5 + r * 3) % 3) - 1;
        const left = Math.round(width * lean * Math.pow(t, 1.25)) + 2 + jitter;
        const right = Math.round(width * (1 - lean) * Math.pow(t, 1.5)) + 2 - jitter;
        const rowWidth = width - left - right;
        if (rowWidth <= 0) break;
        g.fillStyle(r < 2 ? 0x5a3428 : 0x4e2c22);
        g.fillRect(x0 + left, top + r * 2, rowWidth, 2);
        g.fillStyle(0x6a4030);
        g.fillRect(x0 + left, top + r * 2, Math.min(2, rowWidth), 2);
      }
    };
    for (const run of undersideRuns(this.levelData.tiles)) {
      const top = (run.y + 1) * TILE_SIZE;
      let x = run.xStart;
      while (x <= run.xEnd) {
        const remaining = run.xEnd - x + 1;
        const want = 4 + ((x * 7 + run.y * 3) % 4);
        const tilesWide = remaining - want < 3 ? remaining : want;
        lobe(x * TILE_SIZE, tilesWide * TILE_SIZE, top, x + run.y);
        x += tilesWide;
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

    this.crumbling = (d.crumbling || []).map((c) => new CrumblingPlatform(this, c.x, c.y, c.width));
    this.setupWind(d.wind || []);

    this.powerUps = this.add.group();
    (d.powerUps || []).forEach((pu) => {
      const powerUp = new PowerUp(this, pu.x, pu.y, pu.type);
      this.powerUps.add(powerUp);
    });

    this.stars = this.add.group();
    d.stars.forEach((s, i) => {
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
      this.tweens.add({
        targets: star,
        y: star.y - 3,
        duration: 900,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: (i % 5) * 140,
      });
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

  /**
   * Wind zones push an airborne hero: `fx` is a sideways speed in px/s and
   * `fy` a vertical acceleration (negative lifts). Streaks show the direction.
   */
  setupWind(zones) {
    this.windZones = zones.map((z) => ({
      rect: new Phaser.Geom.Rectangle(z.x * TILE_SIZE, z.y * TILE_SIZE, z.w * TILE_SIZE, z.h * TILE_SIZE),
      x: z.fx || 0,
      y: z.fy || 0,
    }));
    for (const zone of this.windZones) {
      const updraft = zone.y !== 0;
      this.add
        .particles(0, 0, 'streak', {
          x: { min: zone.rect.left, max: zone.rect.right },
          y: { min: zone.rect.top, max: zone.rect.bottom },
          speedX: updraft ? 0 : zone.x * 2.2,
          speedY: updraft ? -90 : 0,
          rotate: updraft ? 90 : 0,
          alpha: { start: 0.55, end: 0 },
          scaleX: { min: 0.6, max: 1.4 },
          lifespan: 650,
          frequency: Math.max(40, 2600 / (zone.rect.width * zone.rect.height / 256)),
        })
        .setDepth(6);
    }
  }

  /** Combined wind at a world position, or null when the air is still. */
  windAt(x, y) {
    let wx = 0;
    let wy = 0;
    for (const zone of this.windZones) {
      if (zone.rect.contains(x, y)) {
        wx += zone.x;
        wy += zone.y;
      }
    }
    return wx || wy ? { x: wx, y: wy } : null;
  }

  glideTrail(x, y) {
    if (this.time.now - (this.lastGlideTrail ?? 0) < 70) return;
    this.lastGlideTrail = this.time.now;
    const dot = this.add.image(x, y, 'spark').setTint(0x9fe8ff).setAlpha(0.8).setScale(0.6).setDepth(9);
    this.tweens.add({ targets: dot, alpha: 0, y: y - 6, duration: 320, onComplete: () => dot.destroy() });
  }

  setupCollisions() {
    this.physics.add.collider(this.player, this.groundLayer);
    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.enemies, this.movingPlatforms);

    this.movingPlatforms.children.iterate((platform) => {
      this.physics.add.collider(this.player, platform);
    });

    this.crumbling.forEach((platform) => {
      this.physics.add.collider(this.player, platform, () => {
        if (this.player.body.touching.down && platform.body.touching.up) platform.stepOn();
      });
    });

    this.physics.add.overlap(this.player, this.enemies, this.handleEnemyOverlap, null, this);
    this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
    this.physics.add.overlap(this.player, this.goalFlag, this.reachGoal, null, this);
    this.physics.add.overlap(this.player, this.powerUps, this.collectPowerUp, null, this);
  }

  setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.levelData.width * TILE_SIZE, this.levelData.height * TILE_SIZE + CAMERA_BOTTOM_PAD);
    cam.startFollow(this.player, true, 0.12, 0.12);
    // Small hops don't move the view; the camera only pans once the hero
    // leaves this box, which keeps the zoomed-in view calm.
    cam.setDeadzone(12, 40);
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
      this.asUI(this.touchControls.container);
      ['leftBtn', 'rightBtn', 'jumpBtn'].forEach((k) => this.asUI(this.touchControls[k].zone));
    }
  }

  burst(x, y, color, count = 10) {
    const emitter = this.add.particles(x, y, 'spark', {
      tint: color,
      speed: { min: 40, max: 110 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 350,
      emitting: false,
    });
    emitter.setDepth(20);
    emitter.explode(count);
    this.time.delayedCall(450, () => emitter.destroy());
  }

  /** Small puff at the hero's feet for jumps, landings and running. */
  dust(x, y, count = 4) {
    const emitter = this.add.particles(x, y, 'spark', {
      tint: 0xf4efe0,
      speedX: { min: -34, max: 34 },
      speedY: { min: -26, max: -4 },
      gravityY: 70,
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 280,
      emitting: false,
    });
    emitter.setDepth(9);
    emitter.explode(count);
    this.time.delayedCall(360, () => emitter.destroy());
  }

  /** Freezes the action for a few frames so a stomp lands with weight. */
  hitStop(ms) {
    if (this.hitStopping) return;
    this.hitStopping = true;
    this.physics.pause();
    this.time.delayedCall(ms, () => {
      this.hitStopping = false;
      if (!this.isPaused && !this.levelComplete) this.physics.resume();
    });
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

    this.pauseOverlay = this.asUI(this.add.rectangle(w / 2, h / 2, w, h, 0x1a0a2e, 0.8).setScrollFactor(0).setDepth(90));
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
    this.asUI(this.pauseContainer);
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
      this.cameras.main.shake(90, 0.004);
      this.hitStop(60);
      this.updateHUD();
    } else {
      this.takeDamage();
    }
  }

  collectStar(player, star) {
    if (!star.active || this.isPaused || this.levelComplete || player.isDead) return;
    const sx = star.x;
    const sy = star.y;
    this.tweens.killTweensOf(star);
    star.destroy();
    this.starsCollected++;
    this.score += STAR_SCORE;
    this.showScorePopup(sx, sy - 10, `+${STAR_SCORE}`);
    this.burst(sx, sy, 0xffcc44, 10);
    // Stars grabbed in quick succession climb a scale.
    const now = this.time.now;
    this.combo = now - this.lastStarAt < 1500 ? Math.min(this.combo + 1, 7) : 0;
    this.lastStarAt = now;
    this.sfx.play('coin', 2 ** ((this.combo * 2) / 12));
    this.updateHUD();
  }

  collectPowerUp(player, powerUp) {
    if (!powerUp.active || powerUp.collected || this.isPaused || this.levelComplete || player.isDead) return;
    if (powerUp.type === 'doubleJump') {
      player.grantDoubleJump();
      this.sfx.play('powerup');
      this.burst(powerUp.x, powerUp.y, 0xff88ff, 10);
      this.events.emit('powerUpCollected', { type: 'doubleJump' });
    } else if (powerUp.type === 'glide') {
      player.grantGlide();
      this.sfx.play('powerup');
      this.burst(powerUp.x, powerUp.y, 0x9fe8ff, 10);
      this.showToast('Hold jump to glide!');
      this.events.emit('powerUpCollected', { type: 'glide' });
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
    this.asUI(toast);
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
      hasGlide: this.player.hasGlide ?? false,
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

    // Look ahead in the direction the hero is running.
    const moving = Math.abs(this.player.body.velocity.x) > 20;
    const targetLook = moving ? this.player.facing * CAMERA_LOOKAHEAD : 0;
    this.lookX += (targetLook - this.lookX) * Math.min(1, delta * 0.004);
    this.cameras.main.setFollowOffset(-this.lookX, 0);

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
        this.burst(cpx, cpy, 0x7fdcbc, 12);
        this.showToast('Checkpoint!');
      }
    }
  }
}
