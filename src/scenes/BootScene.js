import Phaser from 'phaser';
import { LEVELS } from '../utils/constants.js';
import { generateSkyTextures } from '../utils/sky.js';

const PALETTE = {
  skyDeep: 0x1a0a2e,
  skyMid: 0x4a2060,
  skyWarm: 0xc45c26,
  skyGlow: 0xf0a040,
  cloudFar: 0x6a4080,
  cloudMid: 0x8a6090,
  mist: 0xd08060,
  grass: 0x3a9a8a,
  grassDark: 0x2a7a6a,
  stone: 0x8a6050,
  stoneDark: 0x6a4030,
  player: 0xff6644,
  playerDark: 0xcc4422,
  playerLight: 0xffaa88,
  puffling: 0x8866cc,
  pufflingDark: 0x6644aa,
  pufflingLight: 0xaa88ee,
  wisp: 0x44ccff,
  wispDark: 0x2288cc,
  wispLight: 0xaaeeff,
  star: 0xffcc00,
  starLight: 0xffffaa,
  spike: 0xcccccc,
  spikeDark: 0x888888,
  flag: 0xff4466,
  flagPole: 0xdddddd,
  powerup: 0xff88ff,
  powerupLight: 0xffccff,
  white: 0xffffff,
  black: 0x111111,
};

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.loadingBg = this.add.rectangle(w / 2, h / 2, w, h, PALETTE.skyDeep);
    this.loadingText = this.add
      .text(w / 2, h / 2 - 30, 'SKY HOP', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '16px',
        color: '#ffcc44',
      })
      .setOrigin(0.5);
    this.loadingLabel = this.add
      .text(w / 2, h / 2 + 10, 'Loading...', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#ffaa88',
      })
      .setOrigin(0.5);
    this.progressBarBg = this.add.rectangle(w / 2, h / 2 + 40, 200, 12, 0x333333);
    this.progressBar = this.add.rectangle(w / 2 - 98, h / 2 + 40, 4, 8, PALETTE.star).setOrigin(0, 0.5);

    LEVELS.forEach((key) => {
      this.load.json(key, `assets/tilemaps/${key}.json`);
    });

    this.load.on('progress', (value) => {
      this.progressBar.width = 196 * value;
      this.loadingLabel.setText(`Loading levels... ${Math.floor(value * 100)}%`);
    });
  }

  create() {
    const steps = [
      { label: 'Generating tileset...', fn: () => this.generateTileset() },
      { label: 'Generating player...', fn: () => this.generatePlayerSheet() },
      { label: 'Generating enemies...', fn: () => this.generateEnemySheets() },
      { label: 'Generating items...', fn: () => this.generateItemSheets() },
      { label: 'Painting the skies...', fn: () => generateSkyTextures(this) },
      { label: 'Creating animations...', fn: () => this.createAnimations() },
    ];

    let step = 0;
    const runStep = () => {
      if (step >= steps.length) {
        this.cameras.main.fadeOut(400, 26, 10, 46);
        this.time.delayedCall(400, () => {
          this.scene.start('MenuScene');
        });
        return;
      }
      const s = steps[step];
      this.loadingLabel.setText(s.label);
      this.progressBar.width = 196 * ((step + 1) / steps.length);
      s.fn();
      step++;
      this.time.delayedCall(50, runStep);
    };
    runStep();
  }

  generateTileset() {
    const ts = 16;
    const cols = 14;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const C = {
      grassLight: 0x7fdcbc,
      grass: PALETTE.grass,
      grassDark: PALETTE.grassDark,
      dirt: PALETTE.stone,
      dirtDark: PALETTE.stoneDark,
      dirtDeep: 0x4e2c22,
      dirtLight: 0xa87860,
    };

    // One solid tile, drawn row by row so rounded corners stay transparent.
    const paint = (frame, { grass = false, left = false, right = false, bottom = false }) => {
      const ox = frame * ts;
      for (let y = 0; y < ts; y++) {
        let x0 = 0;
        let x1 = ts;
        if (grass && y < 2) {
          if (left) x0 = 2 - y;
          if (right) x1 = ts - (2 - y);
        }
        if (bottom && y >= 12) {
          const cut = [1, 2, 3, 5][y - 12];
          if (left) x0 = cut;
          if (right) x1 = ts - cut;
        }
        const isGrassRow = grass && y < 6;
        g.fillStyle(isGrassRow ? (y < 2 ? C.grassLight : y === 5 ? C.grassDark : C.grass) : C.dirt);
        g.fillRect(ox + x0, y, x1 - x0, 1);
        if (!isGrassRow) {
          if (left) {
            g.fillStyle(C.dirtLight);
            g.fillRect(ox + x0, y, 1, 1);
          }
          if (right) {
            g.fillStyle(C.dirtDark);
            g.fillRect(ox + x1 - 2, y, 2, 1);
          }
          if (bottom && y >= 13) {
            g.fillStyle(C.dirtDeep);
            g.fillRect(ox + x0, y, x1 - x0, 1);
          }
        }
      }
      // Pebbles and strata, kept clear of every corner.
      const top = grass ? 8 : 2;
      g.fillStyle(C.dirtDark);
      g.fillRect(ox + 3, top + 1, 3, 1);
      g.fillRect(ox + 10, top + 4, 2, 1);
      if (!grass) g.fillRect(ox + 6, 10, 3, 1);
      g.fillStyle(C.dirtLight);
      g.fillRect(ox + 11, top, 2, 1);
      if (!grass) g.fillRect(ox + 2, 7, 2, 1);
      if (grass) {
        // Grass blades hanging over the dirt.
        g.fillStyle(C.grassDark);
        for (const bx of [2, 6, 11]) g.fillRect(ox + bx, 6, 2, 2);
        g.fillStyle(C.grass);
        for (const bx of [4, 9, 13]) g.fillRect(ox + bx, 6, 1, 1);
      }
    };

    paint(0, { grass: true });
    paint(1, {});
    paint(4, { grass: true, left: true });
    paint(5, { grass: true, right: true });
    paint(6, { grass: true, left: true, right: true });
    paint(7, { left: true });
    paint(8, { right: true });
    paint(9, { left: true, right: true });
    paint(10, { bottom: true });
    paint(11, { bottom: true, left: true });
    paint(12, { bottom: true, right: true });
    paint(13, { bottom: true, left: true, right: true });

    g.fillStyle(PALETTE.spikeDark);
    g.fillRect(ts * 2, ts - 3, ts, 3);
    for (let x = 0; x < ts; x += 4) {
      g.fillStyle(PALETTE.spike);
      g.fillTriangle(ts * 2 + x, ts - 3, ts * 2 + x + 2, ts - 12, ts * 2 + x + 4, ts - 3);
      g.fillStyle(PALETTE.white);
      g.fillRect(ts * 2 + x + 1, ts - 8, 1, 4);
    }

    g.fillStyle(PALETTE.flagPole);
    g.fillRect(ts * 3 + 4, 2, 2, ts - 2);
    g.fillStyle(PALETTE.star);
    g.fillRect(ts * 3 + 6, 2, 8, 6);

    g.generateTexture('tileset', ts * cols, ts);
    g.destroy();
  }

  generatePlayerSheet() {
    const fw = 16;
    const fh = 16;
    const frames = 6;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    const drawPlayer = (ox, oy, legOffset = 0) => {
      g.fillStyle(PALETTE.playerDark);
      g.fillRect(ox + 4, oy + 6, 8, 7);
      g.fillStyle(PALETTE.player);
      g.fillRect(ox + 5, oy + 7, 6, 5);
      g.fillStyle(PALETTE.playerLight);
      g.fillRect(ox + 4, oy + 2, 8, 5);
      g.fillStyle(PALETTE.black);
      g.fillRect(ox + 6, oy + 4, 2, 2);
      g.fillRect(ox + 9, oy + 4, 2, 2);
      g.fillStyle(PALETTE.playerDark);
      g.fillRect(ox + 5 + legOffset, oy + 13, 2, 3);
      g.fillRect(ox + 9 - legOffset, oy + 13, 2, 3);
      g.fillStyle(PALETTE.skyWarm);
      g.fillRect(ox + 3, oy + 7, 2, 4);
    };

    drawPlayer(0, 0, 0);
    drawPlayer(fw, 0, 1);
    drawPlayer(fw * 2, 0, 0);
    drawPlayer(fw * 3, 0, -1);

    g.fillStyle(PALETTE.playerDark);
    g.fillRect(fw * 4 + 4, 4 + 6, 8, 5);
    g.fillStyle(PALETTE.player);
    g.fillRect(fw * 4 + 5, 4 + 7, 6, 3);
    g.fillStyle(PALETTE.playerLight);
    g.fillRect(fw * 4 + 4, 4 + 2, 8, 5);
    g.fillStyle(PALETTE.black);
    g.fillRect(fw * 4 + 6, 4 + 4, 2, 2);
    g.fillRect(fw * 4 + 9, 4 + 4, 2, 2);
    g.fillStyle(PALETTE.playerDark);
    g.fillRect(fw * 4 + 4, 4 + 11, 3, 2);
    g.fillRect(fw * 4 + 9, 4 + 11, 3, 2);

    g.fillStyle(PALETTE.playerDark);
    g.fillRect(fw * 5 + 3, 2 + 6, 10, 5);
    g.fillStyle(PALETTE.playerLight);
    g.fillRect(fw * 5 + 4, 2 + 2, 8, 5);
    g.fillStyle(PALETTE.black);
    g.fillRect(fw * 5 + 5, 2 + 4, 2, 1);
    g.fillRect(fw * 5 + 9, 2 + 4, 2, 1);

    g.generateTexture('player', fw * frames, fh);
    g.destroy();
    this.addTextureFrames('player', fw, fh, frames);
  }

  generateEnemySheets() {
    const fw = 16;
    const fh = 16;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    const drawPuff = (ox, oy, squish = false) => {
      const h = squish ? 8 : 12;
      const yOff = squish ? 6 : 2;
      g.fillStyle(PALETTE.pufflingDark);
      g.fillEllipse(ox + 8, oy + yOff + h / 2, squish ? 14 : 12, h);
      g.fillStyle(PALETTE.puffling);
      g.fillEllipse(ox + 8, oy + yOff + h / 2 - 1, squish ? 12 : 10, h - 2);
      g.fillStyle(PALETTE.pufflingLight);
      g.fillRect(ox + 5, oy + yOff + 2, 2, 2);
      g.fillRect(ox + 10, oy + yOff + 2, 2, 2);
      if (!squish) {
        g.fillStyle(PALETTE.pufflingDark);
        g.fillRect(ox + 4, oy + yOff + h, 3, 2);
        g.fillRect(ox + 9, oy + yOff + h, 3, 2);
      }
    };

    drawPuff(0, 0, false);
    drawPuff(fw, 0, false);
    g.fillStyle(PALETTE.pufflingLight);
    g.fillRect(fw + 6, 4, 4, 2);
    drawPuff(fw * 2, 0, true);

    g.generateTexture('puffling', fw * 3, fh);
    g.destroy();
    this.addTextureFrames('puffling', fw, fh, 3);

    const wg = this.make.graphics({ x: 0, y: 0, add: false });
    for (let f = 0; f < 2; f++) {
      const ox = f * fw;
      const bob = f === 1 ? 1 : 0;
      wg.fillStyle(PALETTE.wispDark);
      wg.fillEllipse(ox + 8, 8 + bob, 10, 12);
      wg.fillStyle(PALETTE.wisp);
      wg.fillEllipse(ox + 8, 7 + bob, 8, 10);
      wg.fillStyle(PALETTE.wispLight);
      wg.fillRect(ox + 5, 4 + bob, 2, 2);
      wg.fillRect(ox + 10, 4 + bob, 2, 2);
      wg.fillStyle(PALETTE.wispLight, 0.5);
      wg.fillEllipse(ox + 8, 12 + bob, 6, 4);
    }
    wg.generateTexture('wisp', fw * 2, fh);
    wg.destroy();
    this.addTextureFrames('wisp', fw, fh, 2);
  }

  generateItemSheets() {
    const fw = 16;
    const fh = 16;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    for (let f = 0; f < 4; f++) {
      const ox = f * fw;
      const scale = f === 1 || f === 3 ? 1.1 : 0.9;
      const rot = f * 0.3;
      g.fillStyle(PALETTE.star);
      const cx = ox + 8;
      const cy = 8;
      for (let i = 0; i < 4; i++) {
        const a = rot + (i * Math.PI) / 2;
        g.fillTriangle(
          cx,
          cy - 6 * scale,
          cx + Math.cos(a + 0.4) * 6 * scale,
          cy + Math.sin(a + 0.4) * 6 * scale,
          cx + Math.cos(a - 0.4) * 6 * scale,
          cy + Math.sin(a - 0.4) * 6 * scale
        );
      }
      g.fillStyle(PALETTE.starLight);
      g.fillRect(ox + 7, 6, 2, 2);
    }
    g.generateTexture('star', fw * 4, fh);
    g.destroy();
    this.addTextureFrames('star', fw, fh, 4);

    const pg = this.make.graphics({ x: 0, y: 0, add: false });
    pg.fillStyle(PALETTE.powerup);
    pg.fillCircle(8, 8, 7);
    pg.fillStyle(PALETTE.powerupLight);
    pg.fillCircle(8, 8, 4);
    pg.fillStyle(PALETTE.white);
    pg.fillRect(6, 6, 4, 4);
    pg.generateTexture('powerup', 16, 16);
    pg.destroy();

    const mg = this.make.graphics({ x: 0, y: 0, add: false });
    mg.fillStyle(PALETTE.stoneDark);
    mg.fillRect(1, 8, 14, 3);
    mg.fillRect(3, 11, 10, 2);
    mg.fillRect(6, 13, 4, 1);
    mg.fillStyle(PALETTE.stone);
    mg.fillRect(1, 8, 12, 1);
    mg.fillStyle(PALETTE.grass);
    mg.fillRect(0, 5, 16, 3);
    mg.fillStyle(0x7fdcbc);
    mg.fillRect(1, 4, 14, 1);
    mg.fillStyle(PALETTE.grassDark);
    mg.fillRect(3, 8, 2, 1);
    mg.fillRect(10, 8, 2, 1);
    mg.generateTexture('moving-platform', 16, 16);
    mg.destroy();

    // Crumbling platform: pale cracked stone, one repeating 16px tile.
    const kg = this.make.graphics({ x: 0, y: 0, add: false });
    kg.fillStyle(0xb9a48f);
    kg.fillRect(0, 0, 16, 10);
    kg.fillStyle(0xd8c8b2);
    kg.fillRect(0, 0, 16, 2);
    kg.fillStyle(0x8f7a68);
    kg.fillRect(0, 8, 16, 2);
    kg.fillRect(2, 10, 5, 2);
    kg.fillRect(10, 10, 4, 3);
    kg.fillStyle(0x6a5648);
    kg.fillRect(5, 2, 1, 3);
    kg.fillRect(6, 4, 1, 3);
    kg.fillRect(11, 1, 1, 2);
    kg.fillRect(12, 3, 1, 4);
    kg.fillRect(15, 0, 1, 10);
    kg.generateTexture('crumble', 16, 16);
    kg.destroy();

    // Glide feather pickup.
    const qg = this.make.graphics({ x: 0, y: 0, add: false });
    qg.fillStyle(0x9fe8ff);
    qg.fillEllipse(9, 7, 8, 12);
    qg.fillStyle(PALETTE.white);
    qg.fillEllipse(8, 6, 5, 9);
    qg.fillStyle(0x5aa8d8);
    qg.fillRect(4, 12, 2, 3);
    qg.fillRect(5, 10, 2, 2);
    qg.fillRect(7, 5, 1, 6);
    qg.generateTexture('feather', 16, 16);
    qg.destroy();

    // Thin streak for wind and rain particles.
    const wg2 = this.make.graphics({ x: 0, y: 0, add: false });
    wg2.fillStyle(PALETTE.white);
    wg2.fillRect(0, 0, 8, 1);
    wg2.generateTexture('streak', 8, 1);
    wg2.destroy();

    const fg = this.make.graphics({ x: 0, y: 0, add: false });
    fg.fillStyle(PALETTE.flagPole);
    fg.fillRect(2, 0, 3, 32);
    fg.fillStyle(PALETTE.flag);
    fg.fillRect(5, 2, 18, 12);
    fg.fillStyle(PALETTE.star);
    fg.fillRect(10, 5, 4, 4);
    fg.fillStyle(PALETTE.white);
    fg.fillRect(5, 2, 18, 2);
    fg.generateTexture('goal-flag', 24, 32);
    fg.destroy();

    const cg = this.make.graphics({ x: 0, y: 0, add: false });
    cg.fillStyle(PALETTE.flagPole);
    cg.fillRect(2, 0, 3, 32);
    cg.fillStyle(PALETTE.grass);
    cg.fillRect(5, 2, 16, 10);
    cg.fillStyle(PALETTE.starLight);
    cg.fillRect(10, 4, 4, 4);
    cg.generateTexture('checkpoint-flag', 22, 32);
    cg.destroy();

    // Tiny particle texture reused for all burst/juice effects (star collect,
    // enemy stomp, power-up collect, goal reached).
    const spg = this.make.graphics({ x: 0, y: 0, add: false });
    spg.fillStyle(PALETTE.white);
    spg.fillRect(0, 0, 4, 4);
    spg.generateTexture('spark', 4, 4);
    spg.destroy();

    // HUD heart icon (replaces the plain "♥" text lives readout).
    const hg = this.make.graphics({ x: 0, y: 0, add: false });
    hg.fillStyle(PALETTE.flag);
    hg.fillRect(0, 1, 5, 5);
    hg.fillRect(7, 1, 5, 5);
    hg.fillRect(0, 5, 12, 3);
    hg.fillRect(1, 8, 10, 2);
    hg.fillRect(2, 10, 8, 1);
    hg.fillRect(3, 11, 6, 1);
    hg.fillRect(5, 12, 2, 1);
    hg.generateTexture('heart', 12, 13);
    hg.destroy();
  }


  addTextureFrames(key, fw, fh, count) {
    const tex = this.textures.get(key);
    for (let i = 0; i < count; i++) {
      tex.add(i, 0, i * fw, 0, fw, fh);
    }
  }

  createAnimations() {
    this.anims.create({
      key: 'player-idle',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 1,
    });
    this.anims.create({
      key: 'player-run',
      frames: this.anims.generateFrameNumbers('player', { start: 1, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'player-jump',
      frames: [{ key: 'player', frame: 4 }],
      frameRate: 1,
    });
    this.anims.create({
      key: 'player-fall',
      frames: [{ key: 'player', frame: 5 }],
      frameRate: 1,
    });
    this.anims.create({
      key: 'puffling-walk',
      frames: this.anims.generateFrameNumbers('puffling', { start: 0, end: 1 }),
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: 'puffling-squish',
      frames: [{ key: 'puffling', frame: 2 }],
      frameRate: 1,
    });
    this.anims.create({
      key: 'wisp-float',
      frames: this.anims.generateFrameNumbers('wisp', { start: 0, end: 1 }),
      frameRate: 3,
      repeat: -1,
    });
    this.anims.create({
      key: 'star-spin',
      frames: this.anims.generateFrameNumbers('star', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
  }
}
