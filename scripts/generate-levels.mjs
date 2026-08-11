/**
 * Generates level1.json through level10.json tilemaps.
 * Run: node scripts/generate-levels.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'assets', 'tilemaps');
mkdirSync(outDir, { recursive: true });

const TILE = { EMPTY: 0, GRASS: 1, STONE: 2, SPIKE: 3 };

function blank(w, h) {
  return Array.from({ length: h }, () => Array(w).fill(TILE.EMPTY));
}

function fillGround(tiles, y, xStart, xEnd, type = TILE.GRASS) {
  for (let x = xStart; x <= xEnd; x++) {
    tiles[y][x] = type;
    if (y + 1 < tiles.length) tiles[y + 1][x] = TILE.STONE;
  }
}

function addSpikes(tiles, y, xStart, xEnd) {
  for (let x = xStart; x <= xEnd; x++) {
    tiles[y][x] = TILE.SPIKE;
  }
}

function baseLevel(data) {
  return {
    movingPlatforms: [],
    powerUps: [],
    hint: '',
    ...data,
    enemies: (data.enemies || []).map((e) => ({
      type: 'puffling',
      ...e,
    })),
  };
}

// ── Level 1: First Steps ──
function buildLevel1() {
  const W = 80;
  const H = 15;
  const tiles = blank(W, H);
  const groundY = 12;

  fillGround(tiles, groundY, 0, 24);
  fillGround(tiles, groundY, 28, 48);
  fillGround(tiles, groundY, 52, 79);
  fillGround(tiles, groundY - 2, 8, 14);
  fillGround(tiles, groundY - 1, 18, 22);
  fillGround(tiles, groundY, 49, 51);
  addSpikes(tiles, groundY, 49, 51);

  return baseLevel({
    name: 'First Steps',
    zone: 1,
    width: W,
    height: H,
    tiles,
    spawn: { x: 2, y: 11 },
    goal: { x: 77, y: 10 },
    checkpoint: null,
    hint: 'Run and jump to the flag!',
    stars: [
      [3, 11], [6, 11], [10, 9], [14, 9], [20, 10],
      [30, 11], [34, 11], [38, 11], [42, 11],
      [55, 11], [60, 11], [65, 11], [70, 11], [74, 11], [77, 10],
    ],
    enemies: [
      { x: 12, y: 11, patrol: 4 },
      { x: 32, y: 11, patrol: 5 },
      { x: 40, y: 11, patrol: 4 },
      { x: 62, y: 11, patrol: 6 },
    ],
  });
}

// ── Level 2: Gap Runner ──
function buildLevel2() {
  const W = 100;
  const H = 15;
  const tiles = blank(W, H);
  const groundY = 12;

  fillGround(tiles, groundY, 0, 18);
  fillGround(tiles, groundY, 23, 38);
  fillGround(tiles, groundY - 2, 43, 52);
  fillGround(tiles, groundY, 58, 68);
  fillGround(tiles, groundY - 1, 72, 82);
  fillGround(tiles, groundY, 86, 99);
  fillGround(tiles, groundY - 3, 10, 16);
  fillGround(tiles, groundY - 1, 28, 34);
  fillGround(tiles, groundY - 2, 62, 66);
  addSpikes(tiles, groundY, 30, 32);
  addSpikes(tiles, groundY, 75, 77);

  return baseLevel({
    name: 'Gap Runner',
    zone: 1,
    width: W,
    height: H,
    tiles,
    spawn: { x: 2, y: 11 },
    goal: { x: 97, y: 10 },
    checkpoint: null,
    hint: 'Time your jumps across wide gaps.',
    stars: [
      [2, 11], [5, 11], [8, 11], [12, 8], [15, 8],
      [26, 11], [30, 11], [35, 11],
      [46, 9], [50, 9], [48, 7],
      [60, 11], [64, 9], [66, 9],
      [74, 10], [80, 10], [84, 11], [88, 11],
      [92, 11], [95, 11], [97, 10],
    ],
    enemies: [
      { x: 6, y: 11, patrol: 5 },
      { x: 14, y: 7, patrol: 3 },
      { x: 28, y: 11, patrol: 4 },
      { x: 46, y: 8, patrol: 4 },
      { x: 62, y: 10, patrol: 3 },
      { x: 90, y: 11, patrol: 5 },
    ],
  });
}

// ── Level 3: Spike Trail ──
function buildLevel3() {
  const W = 110;
  const H = 15;
  const tiles = blank(W, H);
  const groundY = 12;

  fillGround(tiles, groundY, 0, 20);
  fillGround(tiles, groundY, 26, 40);
  fillGround(tiles, groundY, 46, 58);
  fillGround(tiles, groundY - 1, 64, 74);
  fillGround(tiles, groundY, 80, 109);
  fillGround(tiles, groundY - 2, 12, 18);
  fillGround(tiles, groundY - 1, 32, 36);

  addSpikes(tiles, groundY, 22, 24);
  addSpikes(tiles, groundY, 42, 44);
  addSpikes(tiles, groundY, 60, 62);
  addSpikes(tiles, groundY, 76, 78);
  addSpikes(tiles, groundY, 88, 92);

  return baseLevel({
    name: 'Spike Trail',
    zone: 1,
    width: W,
    height: H,
    tiles,
    spawn: { x: 2, y: 11 },
    goal: { x: 106, y: 10 },
    checkpoint: { x: 55, y: 10 },
    hint: 'Avoid spikes — reach the checkpoint!',
    stars: [
      [4, 11], [8, 11], [14, 9], [18, 9],
      [28, 11], [34, 10], [38, 11],
      [50, 11], [54, 11], [56, 11],
      [68, 10], [72, 10],
      [84, 11], [90, 11], [96, 11], [100, 11], [104, 10],
    ],
    enemies: [
      { x: 10, y: 11, patrol: 4 },
      { x: 30, y: 10, patrol: 4 },
      { x: 50, y: 11, patrol: 5 },
      { x: 70, y: 10, patrol: 3 },
      { x: 94, y: 11, patrol: 5 },
    ],
  });
}

// ── Level 4: Drift Platforms ──
function buildLevel4() {
  const W = 120;
  const H = 15;
  const tiles = blank(W, H);
  const groundY = 12;

  fillGround(tiles, groundY, 0, 15);
  fillGround(tiles, groundY, 105, 119);
  fillGround(tiles, groundY - 1, 22, 28);
  fillGround(tiles, groundY - 2, 38, 44);
  fillGround(tiles, groundY - 1, 55, 60);
  fillGround(tiles, groundY - 3, 72, 78);
  fillGround(tiles, groundY - 1, 90, 96);

  return baseLevel({
    name: 'Drift Platforms',
    zone: 2,
    width: W,
    height: H,
    tiles,
    spawn: { x: 2, y: 11 },
    goal: { x: 116, y: 10 },
    checkpoint: null,
    hint: 'Ride the drifting islands!',
    movingPlatforms: [
      { x: 18, y: 10, distance: 5, axis: 'x', speed: 45 },
      { x: 32, y: 9, distance: 4, axis: 'x', speed: 50 },
      { x: 48, y: 10, distance: 6, axis: 'x', speed: 40 },
      { x: 64, y: 8, distance: 5, axis: 'x', speed: 55 },
      { x: 80, y: 9, distance: 4, axis: 'x', speed: 45 },
      { x: 98, y: 10, distance: 5, axis: 'x', speed: 50 },
    ],
    stars: [
      [4, 11], [8, 11], [12, 11],
      [20, 9], [26, 9], [34, 8], [40, 8],
      [50, 9], [56, 9], [66, 7], [70, 7],
      [82, 8], [88, 8], [100, 9], [108, 11], [114, 10],
    ],
    enemies: [
      { x: 10, y: 11, patrol: 3 },
      { x: 52, y: 9, patrol: 4 },
      { x: 84, y: 8, patrol: 3 },
      { x: 108, y: 11, patrol: 4 },
    ],
  });
}

// ── Level 5: Double Jump ──
function buildLevel5() {
  const W = 120;
  const H = 18;
  const tiles = blank(W, H);
  const groundY = 14;

  // Start area — pickup on safe ground before any hard gaps
  fillGround(tiles, groundY, 0, 16);
  // Stepping stones into elevated section (single-jump reachable)
  fillGround(tiles, groundY - 1, 19, 21);
  fillGround(tiles, groundY - 2, 24, 28);
  // Double-jump required beyond this point
  fillGround(tiles, groundY - 4, 38, 42);
  fillGround(tiles, groundY - 6, 52, 56);
  fillGround(tiles, groundY - 4, 66, 70);
  fillGround(tiles, groundY - 2, 80, 84);
  fillGround(tiles, groundY - 5, 92, 96);
  fillGround(tiles, groundY, 108, 119);

  return baseLevel({
    name: 'Double Jump',
    zone: 2,
    width: W,
    height: H,
    tiles,
    spawn: { x: 2, y: 13 },
    goal: { x: 116, y: 12 },
    checkpoint: null,
    hint: 'Grab the sparkle — jump twice!',
    powerUps: [{ x: 8, y: 13, type: 'doubleJump' }],
    stars: [
      [4, 13], [8, 13], [12, 13], [20, 12], [24, 11],
      [30, 9], [37, 9], [42, 7], [52, 7],
      [58, 9], [67, 9], [74, 11], [82, 11],
      [88, 8], [94, 8], [100, 11], [106, 13], [114, 12],
    ],
    enemies: [
      { x: 26, y: 11, patrol: 3 },
      { x: 52, y: 7, patrol: 2 },
      { x: 82, y: 11, patrol: 3 },
      { x: 102, y: 13, patrol: 4 },
    ],
  });
}

// ── Level 6: Wind Crossing ──
function buildLevel6() {
  const W = 130;
  const H = 15;
  const tiles = blank(W, H);
  const groundY = 12;

  // Start runway
  fillGround(tiles, groundY, 0, 18);
  fillGround(tiles, groundY, 118, 129);

  // Staggered route — gaps kept to ~4 tiles max (+1 height) for single jump
  fillGround(tiles, groundY - 1, 22, 26);
  fillGround(tiles, groundY - 1, 31, 35);
  fillGround(tiles, groundY - 2, 40, 46);
  fillGround(tiles, groundY - 2, 51, 57);
  fillGround(tiles, groundY - 1, 62, 68);
  fillGround(tiles, groundY - 2, 73, 79);
  fillGround(tiles, groundY - 1, 84, 90);
  fillGround(tiles, groundY - 2, 95, 101);
  fillGround(tiles, groundY - 1, 106, 112);

  // Steps down to goal platform
  fillGround(tiles, groundY, 114, 117);

  // Spike pits beside the path (punish misjumps, not block the only route)
  addSpikes(tiles, groundY, 27, 30);
  addSpikes(tiles, groundY - 1, 47, 50);
  addSpikes(tiles, groundY, 58, 61);
  addSpikes(tiles, groundY - 1, 80, 83);
  addSpikes(tiles, groundY, 91, 94);
  addSpikes(tiles, groundY - 1, 102, 105);

  return baseLevel({
    name: 'Wind Crossing',
    zone: 2,
    width: W,
    height: H,
    tiles,
    spawn: { x: 2, y: 11 },
    goal: { x: 126, y: 10 },
    checkpoint: { x: 64, y: 10 },
    hint: 'Ride the drifters — time your jumps!',
    movingPlatforms: [
      { x: 20, y: 11, distance: 3, axis: 'x', speed: 45 },
      { x: 48, y: 10, distance: 4, axis: 'x', speed: 50 },
      { x: 76, y: 10, distance: 4, axis: 'x', speed: 48 },
    ],
    stars: [
      [4, 11], [8, 11], [14, 11],
      [24, 10], [33, 10], [42, 9], [45, 9],
      [53, 9], [56, 9], [64, 10], [67, 10],
      [75, 9], [78, 9], [86, 10], [89, 10],
      [97, 9], [100, 9], [108, 10], [112, 10],
      [122, 11], [126, 10],
    ],
    enemies: [
      { x: 8, y: 11, patrol: 4 },
      { x: 33, y: 10, patrol: 3 },
      { x: 53, y: 9, patrol: 3 },
      { x: 75, y: 9, patrol: 3 },
      { x: 86, y: 10, patrol: 3 },
      { x: 108, y: 10, patrol: 3 },
      { x: 122, y: 11, patrol: 4 },
    ],
  });
}

// ── Level 7: Wisp Hollow ──
function buildLevel7() {
  const W = 130;
  const H = 16;
  const tiles = blank(W, H);
  const groundY = 13;

  fillGround(tiles, groundY, 0, 16);
  fillGround(tiles, groundY, 118, 129);
  fillGround(tiles, groundY - 1, 24, 32);
  fillGround(tiles, groundY - 2, 42, 50);
  fillGround(tiles, groundY - 1, 60, 68);
  fillGround(tiles, groundY - 2, 78, 86);
  fillGround(tiles, groundY - 1, 96, 104);

  return baseLevel({
    name: 'Wisp Hollow',
    zone: 3,
    width: W,
    height: H,
    tiles,
    spawn: { x: 2, y: 12 },
    goal: { x: 126, y: 11 },
    checkpoint: null,
    hint: 'Stomp Wisps from above only!',
    stars: [
      [4, 12], [8, 12], [12, 12],
      [28, 10], [32, 10], [36, 10],
      [46, 9], [50, 9],
      [64, 10], [68, 10],
      [82, 9], [86, 9],
      [100, 10], [104, 10],
      [112, 12], [118, 12], [124, 11],
    ],
    enemies: [
      { x: 20, y: 8, patrol: 2, type: 'wisp' },
      { x: 38, y: 7, patrol: 3, type: 'wisp' },
      { x: 55, y: 8, patrol: 2, type: 'wisp' },
      { x: 72, y: 7, patrol: 3, type: 'wisp' },
      { x: 90, y: 8, patrol: 2, type: 'wisp' },
      { x: 110, y: 9, patrol: 2, type: 'wisp' },
    ],
  });
}

// ── Level 8: Sky Fortress ──
function buildLevel8() {
  const W = 140;
  const H = 16;
  const tiles = blank(W, H);
  const groundY = 13;

  fillGround(tiles, groundY, 0, 14);
  fillGround(tiles, groundY, 128, 139);
  fillGround(tiles, groundY - 1, 20, 28);
  fillGround(tiles, groundY - 2, 36, 44);
  fillGround(tiles, groundY - 1, 52, 60);
  fillGround(tiles, groundY - 3, 68, 76);
  fillGround(tiles, groundY - 1, 84, 92);
  fillGround(tiles, groundY - 2, 100, 108);
  fillGround(tiles, groundY - 1, 116, 124);

  addSpikes(tiles, groundY, 48, 50);
  addSpikes(tiles, groundY - 1, 80, 82);

  return baseLevel({
    name: 'Sky Fortress',
    zone: 3,
    width: W,
    height: H,
    tiles,
    spawn: { x: 2, y: 12 },
    goal: { x: 136, y: 11 },
    checkpoint: { x: 70, y: 9 },
    hint: 'Pufflings and Wisps together.',
    movingPlatforms: [
      { x: 14, y: 10, distance: 3, axis: 'x', speed: 40 },
      { x: 64, y: 8, distance: 4, axis: 'y', speed: 35 },
    ],
    stars: [
      [4, 12], [8, 12], [12, 12],
      [24, 10], [28, 10], [40, 9], [44, 9],
      [56, 10], [60, 10], [72, 8], [76, 8],
      [88, 10], [92, 10], [104, 9], [108, 9],
      [118, 10], [122, 10], [130, 12], [134, 11],
    ],
    enemies: [
      { x: 10, y: 12, patrol: 3 },
      { x: 32, y: 10, patrol: 4, type: 'puffling' },
      { x: 42, y: 8, patrol: 2, type: 'wisp' },
      { x: 56, y: 10, patrol: 3, type: 'puffling' },
      { x: 70, y: 7, patrol: 2, type: 'wisp' },
      { x: 88, y: 10, patrol: 3, type: 'puffling' },
      { x: 102, y: 8, patrol: 2, type: 'wisp' },
      { x: 120, y: 10, patrol: 4, type: 'puffling' },
    ],
  });
}

// ── Level 9: Final Approach ──
function buildLevel9() {
  const W = 150;
  const H = 18;
  const tiles = blank(W, H);
  const groundY = 14;

  fillGround(tiles, groundY, 0, 12);
  fillGround(tiles, groundY, 138, 149);
  fillGround(tiles, groundY - 2, 18, 22);
  fillGround(tiles, groundY - 4, 30, 34);
  fillGround(tiles, groundY - 2, 44, 48);
  fillGround(tiles, groundY - 5, 56, 60);
  fillGround(tiles, groundY - 3, 70, 74);
  fillGround(tiles, groundY - 2, 84, 88);
  fillGround(tiles, groundY - 4, 98, 102);
  fillGround(tiles, groundY - 2, 112, 116);
  fillGround(tiles, groundY - 3, 124, 128);

  addSpikes(tiles, groundY, 26, 28);
  addSpikes(tiles, groundY - 2, 52, 54);
  addSpikes(tiles, groundY - 2, 92, 94);
  addSpikes(tiles, groundY, 120, 122);

  return baseLevel({
    name: 'Final Approach',
    zone: 3,
    width: W,
    height: H,
    tiles,
    spawn: { x: 2, y: 13 },
    goal: { x: 146, y: 12 },
    checkpoint: null,
    hint: 'Platforms, Wisps, and spikes — all skills!',
    powerUps: [],
    movingPlatforms: [
      { x: 36, y: 11, distance: 4, axis: 'x', speed: 50 },
      { x: 62, y: 10, distance: 3, axis: 'y', speed: 40 },
      { x: 104, y: 11, distance: 5, axis: 'x', speed: 45 },
    ],
    stars: [
      [4, 13], [8, 13], [14, 11], [20, 11],
      [32, 9], [38, 7], [46, 11], [50, 11],
      [58, 8], [64, 8], [72, 10], [76, 10],
      [86, 11], [90, 11], [100, 9], [106, 9],
      [114, 11], [118, 11], [126, 10], [130, 10],
      [136, 13], [142, 12],
    ],
    enemies: [
      { x: 16, y: 13, patrol: 3 },
      { x: 34, y: 9, patrol: 2, type: 'wisp' },
      { x: 48, y: 11, patrol: 3, type: 'puffling' },
      { x: 58, y: 8, patrol: 2, type: 'wisp' },
      { x: 78, y: 10, patrol: 3, type: 'puffling' },
      { x: 96, y: 9, patrol: 2, type: 'wisp' },
      { x: 110, y: 11, patrol: 3, type: 'puffling' },
      { x: 128, y: 10, patrol: 2, type: 'wisp' },
    ],
  });
}

// ── Level 10: Sunset Summit ──
function buildLevel10() {
  const W = 160;
  const H = 18;
  const tiles = blank(W, H);
  const groundY = 14;

  fillGround(tiles, groundY, 0, 16);
  fillGround(tiles, groundY, 148, 159);
  fillGround(tiles, groundY - 1, 18, 20);
  fillGround(tiles, groundY - 1, 22, 28);
  fillGround(tiles, groundY - 2, 36, 42);
  fillGround(tiles, groundY - 3, 50, 56);
  fillGround(tiles, groundY - 2, 64, 70);
  fillGround(tiles, groundY - 4, 78, 84);
  fillGround(tiles, groundY - 2, 92, 98);
  fillGround(tiles, groundY - 3, 106, 112);
  fillGround(tiles, groundY - 2, 120, 126);
  fillGround(tiles, groundY - 1, 134, 140);

  addSpikes(tiles, groundY, 30, 32);
  addSpikes(tiles, groundY - 2, 58, 60);
  addSpikes(tiles, groundY - 2, 88, 90);
  addSpikes(tiles, groundY, 116, 118);
  addSpikes(tiles, groundY - 1, 130, 132);

  return baseLevel({
    name: 'Sunset Summit',
    zone: 3,
    width: W,
    height: H,
    tiles,
    spawn: { x: 2, y: 13 },
    goal: { x: 156, y: 12 },
    checkpoint: { x: 80, y: 10 },
    hint: 'Find the sparkle before the final climb!',
    powerUps: [{ x: 66, y: 11, type: 'doubleJump' }],
    movingPlatforms: [
      { x: 16, y: 11, distance: 4, axis: 'x', speed: 45 },
      { x: 44, y: 10, distance: 3, axis: 'y', speed: 38 },
      { x: 72, y: 9, distance: 5, axis: 'x', speed: 50 },
      { x: 100, y: 10, distance: 4, axis: 'x', speed: 42 },
      { x: 128, y: 11, distance: 3, axis: 'y', speed: 40 },
    ],
    stars: [
      [4, 13], [8, 13], [12, 13],
      [24, 11], [28, 11], [38, 10], [42, 10],
      [52, 9], [56, 9], [66, 10], [70, 10],
      [80, 8], [84, 8], [94, 10], [98, 10],
      [108, 9], [112, 9], [122, 10], [126, 10],
      [136, 11], [140, 11], [146, 13], [152, 12], [156, 12],
    ],
    enemies: [
      { x: 10, y: 13, patrol: 3, type: 'puffling' },
      { x: 26, y: 10, patrol: 2, type: 'wisp' },
      { x: 40, y: 10, patrol: 3, type: 'puffling' },
      { x: 54, y: 8, patrol: 2, type: 'wisp' },
      { x: 68, y: 10, patrol: 3, type: 'puffling' },
      { x: 82, y: 7, patrol: 2, type: 'wisp' },
      { x: 96, y: 10, patrol: 3, type: 'puffling' },
      { x: 110, y: 8, patrol: 2, type: 'wisp' },
      { x: 124, y: 10, patrol: 3, type: 'puffling' },
      { x: 142, y: 11, patrol: 3, type: 'wisp' },
    ],
  });
}

const builders = [
  buildLevel1, buildLevel2, buildLevel3, buildLevel4, buildLevel5,
  buildLevel6, buildLevel7, buildLevel8, buildLevel9, buildLevel10,
];

builders.forEach((fn, i) => {
  const file = join(outDir, `level${i + 1}.json`);
  writeFileSync(file, JSON.stringify(fn()));
  console.log(`Wrote ${file}`);
});

console.log('All 10 level tilemaps written to public/assets/tilemaps/');
