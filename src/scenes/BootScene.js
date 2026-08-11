import Phaser from 'phaser';

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
  star: 0xffcc00,
  starLight: 0xffffaa,
  spike: 0xcccccc,
  spikeDark: 0x888888,
  flag: 0xff4466,
  flagPole: 0xdddddd,
  white: 0xffffff,
  black: 0x111111,
};

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.json('level1', 'assets/tilemaps/level1.json');
    this.load.json('level2', 'assets/tilemaps/level2.json');
  }

  create() {
    this.generateTileset();
    this.generatePlayerSheet();
    this.generatePufflingSheet();
    this.generateStarSheet();
    this.generateFlag();
    this.generateParallax();
    this.createAnimations();
    this.scene.start('MenuScene');
  }

  generateTileset() {
    const ts = 16;
    const cols = 4;
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Tile 0: empty (transparent)
    // Tile 1: grass platform
    g.fillStyle(PALETTE.grassDark);
    g.fillRect(0, ts, ts, ts);
    g.fillStyle(PALETTE.grass);
    g.fillRect(0, 0, ts, 4);
    g.fillRect(0, 4, ts, ts - 4);
    for (let x = 2; x < ts; x += 4) {
      g.fillStyle(PALETTE.grassDark);
      g.fillRect(x, 1, 2, 2);
    }

    // Tile 2: stone
    g.fillStyle(PALETTE.stoneDark);
    g.fillRect(ts, 0, ts, ts);
    g.fillStyle(PALETTE.stone);
    g.fillRect(ts + 1, 1, 6, 6);
    g.fillRect(ts + 9, 1, 6, 6);
    g.fillRect(ts + 1, 9, 6, 6);
    g.fillRect(ts + 9, 9, 6, 6);

    // Tile 3: spike
    g.fillStyle(PALETTE.spikeDark);
    g.fillRect(ts * 2, ts - 4, ts, 4);
    for (let x = 0; x < ts; x += 4) {
      g.fillStyle(PALETTE.spike);
      g.fillTriangle(ts * 2 + x, ts - 4, ts * 2 + x + 2, ts - 12, ts * 2 + x + 4, ts - 4);
    }

    // Tile 4: checkpoint flag tile (small)
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
      // Body
      g.fillStyle(PALETTE.playerDark);
      g.fillRect(ox + 4, oy + 6, 8, 7);
      g.fillStyle(PALETTE.player);
      g.fillRect(ox + 5, oy + 7, 6, 5);
      // Head
      g.fillStyle(PALETTE.playerLight);
      g.fillRect(ox + 4, oy + 2, 8, 5);
      g.fillStyle(PALETTE.black);
      g.fillRect(ox + 6, oy + 4, 2, 2);
      g.fillRect(ox + 9, oy + 4, 2, 2);
      // Legs
      g.fillStyle(PALETTE.playerDark);
      g.fillRect(ox + 5 + legOffset, oy + 13, 2, 3);
      g.fillRect(ox + 9 - legOffset, oy + 13, 2, 3);
      // Backpack
      g.fillStyle(PALETTE.skyWarm);
      g.fillRect(ox + 3, oy + 7, 2, 4);
    };

    // idle (frame 0)
    drawPlayer(0, 0, 0);
    // run frames 1-3
    drawPlayer(fw, 0, 1);
    drawPlayer(fw * 2, 0, 0);
    drawPlayer(fw * 3, 0, -1);
    // jump (frame 4)
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
    // fall/hurt (frame 5)
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

  generatePufflingSheet() {
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
  }

  generateStarSheet() {
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
  }

  generateFlag() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(PALETTE.flagPole);
    g.fillRect(2, 0, 3, 32);
    g.fillStyle(PALETTE.flag);
    g.fillRect(5, 2, 18, 12);
    g.fillStyle(PALETTE.star);
    g.fillRect(10, 5, 4, 4);
    g.fillStyle(PALETTE.white);
    g.fillRect(5, 2, 18, 2);
    g.generateTexture('goal-flag', 24, 32);
    g.destroy();

    const cg = this.make.graphics({ x: 0, y: 0, add: false });
    cg.fillStyle(PALETTE.flagPole);
    cg.fillRect(2, 0, 3, 32);
    cg.fillStyle(PALETTE.grass);
    cg.fillRect(5, 2, 16, 10);
    cg.fillStyle(PALETTE.starLight);
    cg.fillRect(10, 4, 4, 4);
    cg.generateTexture('checkpoint-flag', 22, 32);
    cg.destroy();
  }

  generateParallax() {
    const w = 320;
    const h = 180;

    const bg = this.make.graphics({ x: 0, y: 0, add: false });
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const r = Phaser.Math.Linear(0x1a, 0xc4, t * 0.5 + 0.3);
      const gv = Phaser.Math.Linear(0x0a, 0x5c, t * 0.5 + 0.2);
      const b = Phaser.Math.Linear(0x2e, 0x26, t);
      bg.fillStyle(Phaser.Display.Color.GetColor(r, gv, b));
      bg.fillRect(0, y, w, 1);
    }
    bg.generateTexture('bg-sky', w, h);
    bg.destroy();

    const clouds = this.make.graphics({ x: 0, y: 0, add: false });
    clouds.fillStyle(PALETTE.cloudFar, 0.6);
    clouds.fillEllipse(60, 80, 80, 30);
    clouds.fillEllipse(200, 60, 100, 35);
    clouds.fillEllipse(280, 100, 60, 25);
    clouds.generateTexture('bg-clouds-far', w, h);
    clouds.destroy();

    const islands = this.make.graphics({ x: 0, y: 0, add: false });
    islands.fillStyle(PALETTE.stoneDark, 0.7);
    islands.fillEllipse(40, 150, 60, 20);
    islands.fillStyle(PALETTE.grassDark, 0.5);
    islands.fillEllipse(40, 145, 50, 8);
    islands.fillStyle(PALETTE.stoneDark, 0.7);
    islands.fillEllipse(180, 160, 80, 25);
    islands.fillStyle(PALETTE.grassDark, 0.5);
    islands.fillEllipse(180, 153, 65, 10);
    islands.fillStyle(PALETTE.stoneDark, 0.6);
    islands.fillEllipse(270, 140, 50, 18);
    islands.generateTexture('bg-islands', w, h);
    islands.destroy();

    const mist = this.make.graphics({ x: 0, y: 0, add: false });
    mist.fillStyle(PALETTE.mist, 0.15);
    mist.fillRect(0, h - 40, w, 40);
    mist.fillStyle(PALETTE.mist, 0.1);
    mist.fillEllipse(100, h - 20, 120, 30);
    mist.fillEllipse(250, h - 15, 100, 25);
    mist.generateTexture('bg-mist', w, h);
    mist.destroy();
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
      key: 'star-spin',
      frames: this.anims.generateFrameNumbers('star', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
  }
}
