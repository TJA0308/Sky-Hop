/**
 * Validates the generated level tilemaps for two bug classes we've hit for
 * real in this project:
 *
 *   1. Moving platforms whose patrol range overlaps a stationary island's
 *      solid tiles (the Level 6 bug — platforms clipped through islands).
 *   2. Gaps between islands wider than the player can actually jump, given
 *      the real physics constants (the Level 7 issue — several gaps were
 *      wider than physically crossable without a double jump).
 *
 * Known limitation: y-axis (vertical) moving platforms aren't modeled as
 * reachability stepping stones, only x-axis ones are — a vertical platform
 * sitting inside a wide gap can make it crossable in practice even though
 * this validator sees one long unassisted jump. That's why Level 9 prints a
 * WARN around x:60-70 despite having a vertical platform right there; WARNs
 * are for human review, not a build-blocking FAIL, precisely for cases like
 * this.
 *
 * Run: node scripts/validate-levels.mjs  (also chained into `dev`/`build`)
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TILE_SIZE, TILE, LEVELS } from '../src/utils/constants.js';
import { maxSingleJumpRangePx, maxDoubleJumpRangePx } from './lib/jumpPhysics.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tilemapDir = join(__dirname, '..', 'public', 'assets', 'tilemaps');

const SAFETY_MARGIN = 0.9; // see plan notes: intentional, tunable simplification
const WARN_BAND = 0.05; // results within 5% of the threshold WARN instead of FAIL

let hasFailures = false;
let hasWarnings = false;

function isSolid(tile) {
  return tile === TILE.GRASS || tile === TILE.STONE;
}

/** For each column, the y (tile row) of its topmost solid tile, or null if the column is a pit. */
function surfaceHeightMap(tiles, width, height) {
  const top = new Array(width).fill(null);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (isSolid(tiles[y][x])) {
        top[x] = y;
        break;
      }
    }
  }
  return top;
}

/** Maximal runs of contiguous solid columns, e.g. { xStart, xEnd, y }. */
function extractSegments(top) {
  const segments = [];
  let run = null;
  for (let x = 0; x < top.length; x++) {
    const y = top[x];
    if (y === null) {
      if (run) {
        segments.push(run);
        run = null;
      }
      continue;
    }
    if (run && run.y === y && x === run.xEnd + 1) {
      run.xEnd = x;
    } else {
      if (run) segments.push(run);
      run = { xStart: x, xEnd: x, y };
    }
  }
  if (run) segments.push(run);
  return segments;
}

function checkPlatformOverlap(level) {
  const issues = [];
  const { tiles, width, height, movingPlatforms = [] } = level;

  movingPlatforms.forEach((mp, i) => {
    const axis = mp.axis || 'x';
    if (axis !== 'x') return; // y-axis platforms don't share column ranges with islands the same way

    const xStart = mp.x;
    const xEnd = mp.x + mp.distance;
    const y = mp.y;

    for (let x = Math.floor(xStart); x <= Math.ceil(xEnd); x++) {
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (isSolid(tiles[y][x])) {
        issues.push(
          `movingPlatforms[${i}] (x:${mp.x}→${xEnd}, y:${y}) overlaps solid tile at (${x}, ${y})`
        );
      }
    }
  });

  return issues;
}

function checkGapReachability(level) {
  const results = [];
  const { tiles, width, height, movingPlatforms = [], powerUps = [] } = level;

  const top = surfaceHeightMap(tiles, width, height);
  const groundSegments = extractSegments(top);

  const platformSegments = movingPlatforms
    .filter((mp) => (mp.axis || 'x') === 'x')
    .map((mp) => ({ xStart: mp.x, xEnd: mp.x + mp.distance, y: mp.y, isPlatform: true }));

  const segments = [...groundSegments, ...platformSegments].sort((a, b) => a.xStart - b.xStart);

  const firstDoubleJumpX = powerUps.find((p) => p.type === 'doubleJump')?.x ?? null;

  for (let i = 0; i < segments.length - 1; i++) {
    const cur = segments[i];
    const next = segments[i + 1];
    if (next.xStart <= cur.xEnd + 1) continue; // adjacent/overlapping columns, no real gap

    // cur.xEnd/next.xStart are solid tile INDICES, not pixel edges: the real
    // empty span is the columns strictly between them (next.xStart - cur.xEnd - 1).
    const gapTiles = next.xStart - cur.xEnd - 1;
    const gapPx = gapTiles * TILE_SIZE;
    const deltaYpx = (next.y - cur.y) * TILE_SIZE;

    const hasDoubleJump = firstDoubleJumpX !== null && firstDoubleJumpX <= cur.xEnd;
    const maxRangePx = hasDoubleJump ? maxDoubleJumpRangePx(deltaYpx) : maxSingleJumpRangePx(deltaYpx);

    if (maxRangePx === null) {
      results.push({
        level: level.name,
        status: 'FAIL',
        message: `gap at x:${cur.xEnd}→${next.xStart} (${gapTiles} tiles, Δy:${next.y - cur.y} tiles) is too high to reach${hasDoubleJump ? ' even with double jump' : ''}`,
      });
      continue;
    }

    const allowedPx = maxRangePx * SAFETY_MARGIN;
    if (gapPx > allowedPx) {
      const overBy = gapPx / allowedPx - 1;
      results.push({
        level: level.name,
        status: overBy <= WARN_BAND ? 'WARN' : 'FAIL',
        message: `gap at x:${cur.xEnd}→${next.xStart} (${gapTiles} tiles) needs ${gapPx.toFixed(0)}px, max reach (with ${(SAFETY_MARGIN * 100).toFixed(0)}% margin) is ${allowedPx.toFixed(0)}px${hasDoubleJump ? ' [double jump]' : ''}`,
      });
    }
  }

  return results;
}

function validateLevel(levelKey) {
  const level = JSON.parse(readFileSync(join(tilemapDir, `${levelKey}.json`), 'utf-8'));
  const overlapIssues = checkPlatformOverlap(level);
  const gapResults = checkGapReachability(level);

  overlapIssues.forEach((msg) => {
    hasFailures = true;
    console.error(`  ✖ FAIL [${level.name}] ${msg}`);
  });

  gapResults.forEach((r) => {
    if (r.status === 'FAIL') {
      hasFailures = true;
      console.error(`  ✖ FAIL [${r.level}] ${r.message}`);
    } else {
      hasWarnings = true;
      console.warn(`  ⚠ WARN [${r.level}] ${r.message}`);
    }
  });

  if (overlapIssues.length === 0 && gapResults.length === 0) {
    console.log(`  ✓ ${level.name}`);
  }
}

console.log('Validating level tilemaps...');
LEVELS.forEach(validateLevel);

if (hasFailures) {
  console.error('\nLevel validation FAILED.');
  process.exit(1);
}
console.log(hasWarnings ? '\nLevel validation passed with warnings.' : '\nAll levels passed validation.');
