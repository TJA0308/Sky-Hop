// Procedural backgrounds stay crisp at the game's native pixel resolution.
export function generateSkyTextures(scene) {
  const w = 640;
  const h = 360;
  const palettes = [
    ['bg-sky', [42, 112, 184], [171, 226, 245]],
    ['bg-sky-high', [51, 73, 141], [179, 205, 237]],
    ['bg-sky-twilight', [38, 39, 91], [163, 145, 207]],
    ['bg-sky-summit', [55, 57, 119], [244, 186, 153]],
  ];
  for (const [key, top, bottom] of palettes) {
    const g = scene.make.graphics({ add: false });
    for (let y = 0; y < h; y += 2) {
      const t = y / h;
      const rgb = top.map((c, i) => Math.round(c + (bottom[i] - c) * t));
      g.fillStyle((rgb[0] << 16) | (rgb[1] << 8) | rgb[2]);
      g.fillRect(0, y, w, 2);
    }
    g.fillStyle(0xffffff, 0.07);
    g.fillCircle(500, 80, 54);
    g.fillStyle(0xfff5dc, 0.85);
    g.fillCircle(500, 80, 22);
    if (key.includes('twilight') || key.includes('summit')) {
      for (let i = 0; i < 32; i++) {
        g.fillStyle(0xffffff, 0.25 + (i % 3) * 0.15);
        g.fillRect((i * 137 + 21) % w, (i * 47 + 12) % 145, 2, 2);
      }
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  const clouds = scene.make.graphics({ add: false });
  for (const [x, y, s] of [[80, 85, 1], [270, 145, 0.8], [435, 45, 0.65], [565, 205, 1]]) {
    clouds.fillStyle(0xd8edff, 0.65);
    clouds.fillEllipse(x, y + 9, 118 * s, 25 * s);
    clouds.fillStyle(0xffffff, 0.85);
    clouds.fillEllipse(x - 24 * s, y, 55 * s, 28 * s);
    clouds.fillEllipse(x + 5 * s, y - 12 * s, 60 * s, 45 * s);
    clouds.fillEllipse(x + 34 * s, y, 45 * s, 26 * s);
  }
  clouds.generateTexture('bg-clouds-far', w, h);
  clouds.destroy();

  const islands = scene.make.graphics({ add: false });
  for (const [x, y, s] of [[75, 255, 0.75], [325, 200, 0.55], [525, 285, 1]]) {
    islands.fillStyle(0x637da8, 0.65);
    islands.fillTriangle(x - 45 * s, y, x + 45 * s, y, x - 5 * s, y + 50 * s);
    islands.fillStyle(0x9fc8ce, 0.85);
    islands.fillEllipse(x, y, 96 * s, 15 * s);
    islands.fillStyle(0xd5f5ff, 0.4);
    islands.fillRect(x + 15 * s, y + 4, 4 * s, 65 * s);
  }
  islands.generateTexture('bg-islands', w, h);
  islands.destroy();

  const mist = scene.make.graphics({ add: false });
  for (let i = 0; i < 9; i++) {
    mist.fillStyle(0xf0faff, 0.18);
    mist.fillEllipse(i * 80, 345 + (i % 2) * 12, 160, 65);
  }
  mist.generateTexture('bg-mist', w, h);
  mist.destroy();
}

export function skyTexture(levelIndex) {
  if (levelIndex === 9) return 'bg-sky-summit';
  if (levelIndex >= 6) return 'bg-sky-twilight';
  if (levelIndex >= 3) return 'bg-sky-high';
  return 'bg-sky';
}
