import Phaser from 'phaser';

// Procedural parallax backgrounds. Every layer is authored at BG_W x BG_H and
// tiles horizontally, so the gameplay camera (zoomed in) and the menus (not
// zoomed) can share the same textures at the same pixel density as the world.
export const BG_W = 320;
export const BG_H = 180;

const ZONES = [
  { key: 'bg-sky', top: [42, 112, 184], bottom: [171, 226, 245], cloudTint: 0xffffff, islandTint: 0xffffff, orb: 'sun', stars: false },
  { key: 'bg-sky-high', top: [34, 42, 76], bottom: [118, 134, 166], cloudTint: 0x8794b4, islandTint: 0x93a0c4, orb: 'none', stars: false, storm: true },
  { key: 'bg-sky-twilight', top: [38, 39, 91], bottom: [163, 145, 207], cloudTint: 0xcbb9ee, islandTint: 0xb5a4dc, orb: 'moon', stars: true, aurora: true },
  { key: 'bg-sky-summit', top: [55, 57, 119], bottom: [244, 186, 153], cloudTint: 0xffd0ba, islandTint: 0xdca4b4, orb: 'sun', stars: true },
];

/** 0 Sky Meadow, 1 Storm Pass, 2 Twilight Peaks, 3 Sunset Summit (finale). */
export function zoneIndex(levelIndex) {
  if (levelIndex === 9) return 3;
  if (levelIndex >= 6) return 2;
  if (levelIndex >= 3) return 1;
  return 0;
}

export function skyTexture(levelIndex) {
  return ZONES[zoneIndex(levelIndex)].key;
}

/** Draws `fn(offsetX)` three times so shapes crossing an edge wrap seamlessly. */
function wrapDraw(fn) {
  fn(0);
  fn(-BG_W);
  fn(BG_W);
}

function drawCloud(g, x, y, s, alpha) {
  g.fillStyle(0xd6e8fb, alpha * 0.8);
  g.fillEllipse(x, y + 5 * s, 62 * s, 12 * s);
  g.fillStyle(0xffffff, alpha);
  g.fillEllipse(x - 14 * s, y, 28 * s, 14 * s);
  g.fillEllipse(x + 2 * s, y - 6 * s, 30 * s, 22 * s);
  g.fillEllipse(x + 18 * s, y, 24 * s, 13 * s);
}

/**
 * A floating island in stepped 2px rows: flat cap on top, body tapering to an
 * off-centre point. `jitter` is a tiny deterministic hash so edges look carved.
 */
function drawIsland(g, cx, y, halfW, depth, colors) {
  const rows = Math.floor(depth / 2);
  for (let r = 0; r < rows; r++) {
    const t = r / rows;
    const jitter = ((cx * 7 + r * 13) % 3) - 1;
    const left = Math.round(halfW * (1 - Math.pow(t, 1.3)) * 0.95) + jitter;
    const right = Math.round(halfW * (1 - Math.pow(t, 1.6))) - jitter;
    if (left + right <= 0) break;
    g.fillStyle(colors.body, colors.alpha);
    g.fillRect(cx - left, y + 3 + r * 2, left + right, 2);
    g.fillStyle(colors.shade, colors.alpha);
    g.fillRect(cx + right - Math.max(2, Math.round(right * 0.35)), y + 3 + r * 2, Math.max(2, Math.round(right * 0.35)), 2);
  }
  g.fillStyle(colors.cap, colors.alpha);
  g.fillRect(cx - halfW + 1, y, halfW * 2 - 2, 1);
  g.fillRect(cx - halfW, y + 1, halfW * 2, 3);
  if (colors.fall) {
    g.fillStyle(0xe8fbff, 0.55);
    g.fillRect(cx + Math.round(halfW * 0.3), y + 4, 2, depth + 14);
    g.fillStyle(0xe8fbff, 0.3);
    g.fillRect(cx + Math.round(halfW * 0.3) - 1, y + depth + 14, 4, 6);
  }
}

export function generateSkyTextures(scene) {
  for (const zone of ZONES) {
    const g = scene.make.graphics({ add: false });
    const band = 4;
    for (let y = 0; y < BG_H; y += band) {
      const t = y / BG_H;
      const rgb = zone.top.map((c, i) => Math.round(c + (zone.bottom[i] - c) * t));
      g.fillStyle((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]);
      g.fillRect(0, y, BG_W, band);
    }
    if (zone.stars) {
      for (let i = 0; i < 40; i++) {
        g.fillStyle(0xffffff, 0.25 + (i % 3) * 0.2);
        g.fillRect((i * 137 + 21) % BG_W, (i * 47 + 12) % 80, 1, 1);
      }
    }
    const ox = 250;
    const oy = zone.key === 'bg-sky-summit' ? 96 : 40;
    if (zone.orb === 'none') {
      g.generateTexture(zone.key, BG_W, BG_H);
      g.destroy();
      continue;
    }
    g.fillStyle(0xffffff, 0.06);
    g.fillCircle(ox, oy, 30);
    g.fillStyle(0xffffff, 0.08);
    g.fillCircle(ox, oy, 20);
    g.fillStyle(zone.orb === 'moon' ? 0xeef0ff : 0xfff5dc, 0.92);
    g.fillCircle(ox, oy, 11);
    if (zone.orb === 'moon') {
      g.fillStyle(0xc9cdf0, 0.9);
      g.fillCircle(ox - 4, oy - 3, 2);
      g.fillCircle(ox + 3, oy + 2, 3);
      g.fillCircle(ox - 2, oy + 5, 1);
    }
    g.generateTexture(zone.key, BG_W, BG_H);
    g.destroy();
  }

  // Aurora: two ribbons of thin columns, brightest along the lower edge. Wave
  // counts are whole numbers so the texture tiles seamlessly.
  const aurora = scene.make.graphics({ add: false });
  const wave = (x, n) => Math.sin((x / BG_W) * Math.PI * 2 * n);
  for (const [color, baseY, phase] of [[0x7dffb0, 26, 0], [0xb48cff, 44, 90]]) {
    for (let x = 0; x < BG_W; x += 2) {
      const px = x + phase;
      const top = Math.round(baseY + 12 * wave(px, 2) + 6 * wave(px, 5));
      const height = Math.round(30 + 10 * wave(px, 3));
      const rows = 6;
      for (let r = 0; r < rows; r++) {
        aurora.fillStyle(color, 0.04 + 0.07 * r);
        aurora.fillRect(x, top + Math.round((height * r) / rows), 2, Math.ceil(height / rows));
      }
      aurora.fillStyle(0xffffff, 0.18);
      aurora.fillRect(x, top + height, 2, 1);
    }
  }
  aurora.generateTexture('bg-aurora', BG_W, BG_H);
  aurora.destroy();

  const far = scene.make.graphics({ add: false });
  for (const [x, y, s] of [[40, 30, 0.7], [135, 58, 0.5], [215, 22, 0.6], [290, 70, 0.75]]) {
    wrapDraw((o) => drawCloud(far, x + o, y, s, 0.6));
  }
  far.generateTexture('bg-clouds-far', BG_W, BG_H);
  far.destroy();

  const farIslands = scene.make.graphics({ add: false });
  const hazy = { body: 0x8fb2d6, shade: 0x7fa2c8, cap: 0xa9cfdf, alpha: 0.75 };
  for (const [x, y, hw, d] of [[50, 96, 16, 18], [150, 74, 11, 14], [245, 108, 20, 22]]) {
    wrapDraw((o) => drawIsland(farIslands, x + o, y, hw, d, hazy));
  }
  farIslands.generateTexture('bg-islands-far', BG_W, BG_H);
  farIslands.destroy();

  const islands = scene.make.graphics({ add: false });
  const near = { body: 0x5d7fae, shade: 0x4c6c9a, cap: 0x8fd0c4, alpha: 0.92 };
  wrapDraw((o) => drawIsland(islands, 85 + o, 118, 30, 34, { ...near, fall: true }));
  wrapDraw((o) => drawIsland(islands, 205 + o, 92, 19, 24, near));
  wrapDraw((o) => drawIsland(islands, 300 + o, 134, 24, 28, near));
  islands.generateTexture('bg-islands', BG_W, BG_H);
  islands.destroy();

  const bank = scene.make.graphics({ add: false });
  for (let i = 0; i < 8; i++) {
    const x = i * 40 + 12;
    const y = 172 + (i % 3) * 4;
    const s = 0.8 + (i % 2) * 0.35;
    wrapDraw((o) => drawCloud(bank, x + o, y, s, 0.85));
  }
  wrapDraw((o) => drawCloud(bank, 120 + o, 128, 0.9, 0.7));
  bank.fillStyle(0xffffff, 0.85);
  bank.fillRect(0, 176, BG_W, 4);
  bank.generateTexture('bg-clouds-near', BG_W, BG_H);
  bank.destroy();
}

/**
 * Adds the full parallax stack to a scene and keeps it moving. `zoom` is the
 * zoom of the scene's main camera: layers are pinned to the camera centre and
 * sized so they exactly fill the view at any zoom.
 */
export function addSkyLayers(scene, levelIndex = 0, zoom = 1) {
  const zone = ZONES[zoneIndex(levelIndex)];
  const cx = scene.scale.width / 2;
  const cy = scene.scale.height / 2;
  const viewW = scene.scale.width / zoom;
  const viewH = scene.scale.height / zoom;
  const scale = viewW / BG_W;

  scene.add.image(cx, cy, zone.key).setDisplaySize(viewW, viewH).setScrollFactor(0).setDepth(-20);

  const layer = (key, depth, alpha, tint, factor, drift) => {
    const sprite = scene.add
      .tileSprite(cx, cy, BG_W, BG_H, key)
      .setScale(scale)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(alpha);
    if (tint !== 0xffffff) sprite.setTint(tint);
    return { sprite, factor, drift };
  };

  const layers = [
    layer('bg-clouds-far', -19, 0.75, zone.cloudTint, 0.04, 0.004),
    layer('bg-islands-far', -18, 0.8, zone.islandTint, 0.1, 0),
    layer('bg-islands', -17, 0.9, zone.islandTint, 0.22, 0),
    layer('bg-clouds-near', -16, 0.9, zone.cloudTint, 0.4, 0.01),
  ];

  let aurora = null;
  if (zone.aurora) {
    aurora = layer('bg-aurora', -19.5, 0.6, 0xffffff, 0.02, 0.006);
    layers.push(aurora);
  }

  if (zone.storm) {
    // Distant lightning: a soft double flicker behind the clouds every so often.
    const flash = scene.add.rectangle(cx, cy, viewW, viewH, 0xdfe8ff, 1).setScrollFactor(0).setDepth(-19.4).setAlpha(0);
    const strike = () => {
      scene.tweens.add({ targets: flash, alpha: { from: 0.28, to: 0 }, duration: 140, repeat: 1, repeatDelay: 90 });
      scene.time.delayedCall(Phaser.Math.Between(5000, 11000), strike);
    };
    scene.time.delayedCall(Phaser.Math.Between(2500, 6000), strike);
  }

  const update = (time) => {
    const scrollX = scene.cameras.main.scrollX;
    if (aurora) aurora.sprite.setAlpha(0.5 + 0.15 * Math.sin(time * 0.0006));
    for (const { sprite, factor, drift } of layers) {
      // Snap to half texels so the nearest-neighbour layers never shimmer.
      sprite.tilePositionX = Math.round((scrollX * factor + time * drift) * 2) / 2;
    }
  };
  scene.events.on('update', update);
  scene.events.once('shutdown', () => scene.events.off('update', update));
  update(0);

  return layers.map((l) => l.sprite);
}
