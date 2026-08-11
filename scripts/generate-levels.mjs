/**
 * Generates level1.json and level2.json tilemaps.
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

// ── Level 1: Sky Meadow ──
function buildLevel1() {
  const W = 80;
  const H = 15;
  const tiles = blank(W, H);
  const groundY = 12;

  // Main path
  fillGround(tiles, groundY, 0, 24);
  fillGround(tiles, groundY, 28, 48);
  fillGround(tiles, groundY, 52, 79);

  // Small raised section
  fillGround(tiles, groundY - 2, 8, 14);
  fillGround(tiles, groundY - 1, 18, 22);

  // Spike section (teaches hazard)
  fillGround(tiles, groundY, 49, 51);
  addSpikes(tiles, groundY, 49, 51);

  const stars = [
    [3, 11], [6, 11], [10, 9], [14, 9], [20, 10],
    [30, 11], [34, 11], [38, 11], [42, 11],
    [55, 11], [60, 11], [65, 11], [70, 11], [74, 11], [77, 10],
  ];

  const enemies = [
    { x: 12, y: 11, patrol: 4 },
    { x: 32, y: 11, patrol: 5 },
    { x: 40, y: 11, patrol: 4 },
    { x: 62, y: 11, patrol: 6 },
  ];

  return {
    name: 'Sky Meadow',
    width: W,
    height: H,
    tiles,
    spawn: { x: 2, y: 11 },
    goal: { x: 77, y: 10 },
    checkpoint: null,
    stars,
    enemies,
  };
}

// ── Level 2: Storm Pass ──
function buildLevel2() {
  const W = 100;
  const H = 15;
  const tiles = blank(W, H);
  const groundY = 12;

  // Staggered islands
  fillGround(tiles, groundY, 0, 18);
  fillGround(tiles, groundY, 24, 38);
  fillGround(tiles, groundY - 2, 44, 52);
  fillGround(tiles, groundY, 58, 68);
  fillGround(tiles, groundY - 1, 72, 82);
  fillGround(tiles, groundY, 86, 99);

  // Higher platforms
  fillGround(tiles, groundY - 3, 10, 16);
  fillGround(tiles, groundY - 1, 28, 34);
  fillGround(tiles, groundY - 2, 62, 66);

  // Spike patches
  addSpikes(tiles, groundY, 30, 32);
  addSpikes(tiles, groundY, 75, 77);
  addSpikes(tiles, groundY - 1, 78, 80);

  const stars = [
    [2, 11], [5, 11], [8, 11], [12, 8], [15, 8],
    [26, 11], [30, 11], [35, 11],
    [46, 9], [50, 9], [48, 7],
    [60, 11], [64, 9], [66, 9],
    [74, 10], [80, 10], [84, 11], [88, 11],
    [92, 11], [95, 11], [97, 10],
  ];

  const enemies = [
    { x: 6, y: 11, patrol: 5 },
    { x: 14, y: 7, patrol: 3 },
    { x: 28, y: 11, patrol: 4 },
    { x: 46, y: 8, patrol: 4 },
    { x: 48, y: 8, patrol: 3 },
    { x: 62, y: 10, patrol: 3 },
    { x: 74, y: 10, patrol: 4 },
    { x: 90, y: 11, patrol: 5 },
  ];

  return {
    name: 'Storm Pass',
    width: W,
    height: H,
    tiles,
    spawn: { x: 2, y: 11 },
    goal: { x: 97, y: 10 },
    checkpoint: { x: 50, y: 9 },
    stars,
    enemies,
  };
}

writeFileSync(join(outDir, 'level1.json'), JSON.stringify(buildLevel1()));
writeFileSync(join(outDir, 'level2.json'), JSON.stringify(buildLevel2()));
console.log('Level tilemaps written to public/assets/tilemaps/');
