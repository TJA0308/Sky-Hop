/**
 * A headless copy of Sky Hop's rules: no Phaser, no rendering, just numbers.
 * The solver calls `step` hundreds of thousands of times to try out inputs,
 * which is only possible because this is plain arithmetic.
 *
 * It mirrors Player.js (run, jump, coyote time, jump buffering, jump cut),
 * Puffling.js (patrols, stomps) and GameScene.js (spikes, pits, the flag).
 * It is deliberately a close approximation, not a frame-perfect clone: the
 * in-game controller checks reality against the plan and replans on drift.
 */
import {
  TILE_SIZE,
  TILE,
  GRAVITY,
  PLAYER_SPEED,
  JUMP_VELOCITY,
  JUMP_CUT_MULTIPLIER,
  COYOTE_TIME,
  JUMP_BUFFER,
  STOMP_BOUNCE,
} from '../utils/constants.js';

export const DT = 1 / 60;
const FRAME_MS = 1000 / 60;
const MAX_FALL = 600;
// The bot's inputs reach the real game a frame late, so it plans with only
// half of the real coyote time and never relies on a last-instant jump.
const SAFE_COYOTE = COYOTE_TIME / 2;
// Safety margins, in pixels. The simulated hero needs this much more ground
// under its feet than the real one, and treats spikes and enemies as this
// much bigger, so a plan still works if reality is a few pixels off.
const EDGE_MARGIN = 3;
const HAZARD_MARGIN = 3;

// Hero collision box relative to the sprite centre (see Player.js setSize/setOffset).
const HALF_W = 5;
const TOP = 6;
const BOTTOM = 8;

// Puffling box relative to its sprite centre, and its walking speed.
const ENEMY_HALF_W = 6;
const ENEMY_TOP = 4;
const ENEMY_BOTTOM = 6;
const ENEMY_SPEED = 40;

export const STATUS = { ALIVE: 0, WON: 1, DEAD: 2 };

/** The bot only understands levels built from the mechanics modelled here. */
export function botSupports(level) {
  return (
    (level.movingPlatforms || []).length === 0 &&
    (level.powerUps || []).length === 0 &&
    (level.crumbling || []).length === 0 &&
    (level.wind || []).length === 0 &&
    level.enemies.every((e) => e.type !== 'wisp')
  );
}

export function createWorld(level) {
  const { tiles, width, height } = level;
  const solid = (tx, ty) => {
    const t = tiles[ty]?.[tx];
    return t === TILE.GRASS || t === TILE.STONE;
  };
  const spikes = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tiles[y][x] === TILE.SPIKE) spikes.push({ x: x * TILE_SIZE + 8, y: y * TILE_SIZE + 8 });
    }
  }
  const goalX = level.goal.x * TILE_SIZE + 8;
  const goalY = level.goal.y * TILE_SIZE;
  return {
    solid,
    spikes,
    goal: { left: goalX - 8, right: goalX + 8, top: goalY - 16, bottom: goalY + 16, x: goalX },
    killY: height * TILE_SIZE + 32,
    enemyPaths: [],
  };
}

/** Starting positions for a level's Pufflings, as the game spawns them. */
export function initialEnemies(level) {
  return level.enemies
    .filter((e) => e.type !== 'wisp')
    .map((e) => ({
      x: e.x * TILE_SIZE + 8,
      y: (e.y + 1) * TILE_SIZE - ENEMY_BOTTOM,
      dir: -1,
      left: e.x * TILE_SIZE,
      right: (e.x + e.patrol) * TILE_SIZE,
    }));
}

export function initialState(level) {
  return {
    x: level.spawn.x * TILE_SIZE + 8,
    y: level.spawn.y * TILE_SIZE + 8,
    vy: 0,
    grounded: false,
    coyote: 0,
    buffer: 0,
    held: false,
    dead: 0,
    frame: 0,
    status: STATUS.ALIVE,
  };
}

/**
 * Enemy patrols depend only on time, so each one's path is computed once per
 * plan and then looked up by frame number.
 */
export function setEnemies(world, enemies) {
  world.enemyPaths = enemies.map((e) => ({ ...e, xs: [e.x], dirs: [e.dir] }));
}

/** Where enemy `index` will be `frame` frames after the plan started. */
export function enemyX(world, index, frame) {
  const path = world.enemyPaths[index];
  while (path.xs.length <= frame) {
    let x = path.xs[path.xs.length - 1];
    let dir = path.dirs[path.dirs.length - 1];
    const footY = path.y + ENEMY_BOTTOM + 3;
    if (!world.solid(Math.floor((x + dir * 10) / TILE_SIZE), Math.floor(footY / TILE_SIZE))) dir *= -1;
    if (x <= path.left) dir = 1;
    else if (x >= path.right) dir = -1;
    x += ENEMY_SPEED * dir * DT;
    path.xs.push(x);
    path.dirs.push(dir);
  }
  return path.xs[frame];
}

function overlapsSolid(world, x, y, halfW = HALF_W) {
  const x0 = Math.floor((x - halfW) / TILE_SIZE);
  const x1 = Math.floor((x + halfW - 0.001) / TILE_SIZE);
  const y0 = Math.floor((y - TOP) / TILE_SIZE);
  const y1 = Math.floor((y + BOTTOM - 0.001) / TILE_SIZE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (world.solid(tx, ty)) return { tx, ty };
    }
  }
  return null;
}

/**
 * Advances `s` by one frame, in place. `dir` is -1, 0 or 1; `jump` is whether
 * the jump button is held this frame.
 */
export function step(world, s, dir, jump) {
  // --- Player.js: timers, jump, variable jump height ---
  s.coyote = s.grounded ? SAFE_COYOTE : Math.max(0, Math.min(s.coyote, SAFE_COYOTE) - FRAME_MS);
  s.buffer = jump && !s.held ? JUMP_BUFFER : Math.max(0, s.buffer - FRAME_MS);
  if (s.buffer > 0 && s.coyote > 0) {
    s.vy = JUMP_VELOCITY;
    s.coyote = 0;
    s.buffer = 0;
  }
  if (s.held && !jump && s.vy < 0) s.vy *= JUMP_CUT_MULTIPLIER;
  s.held = jump;

  // --- Physics: gravity, then move and collide one axis at a time ---
  s.vy = Math.min(s.vy + GRAVITY * DT, MAX_FALL);

  if (dir !== 0) {
    s.x += dir * PLAYER_SPEED * DT;
    const hit = overlapsSolid(world, s.x, s.y);
    if (hit) s.x = dir > 0 ? hit.tx * TILE_SIZE - HALF_W : (hit.tx + 1) * TILE_SIZE + HALF_W;
  }

  s.y += s.vy * DT;
  s.grounded = false;
  // Landing uses a narrower box (see EDGE_MARGIN); bumping a ceiling does not.
  const hit = overlapsSolid(world, s.x, s.y, s.vy > 0 ? HALF_W - EDGE_MARGIN : HALF_W);
  if (hit) {
    if (s.vy > 0) {
      s.y = hit.ty * TILE_SIZE - BOTTOM;
      s.grounded = true;
    } else {
      s.y = (hit.ty + 1) * TILE_SIZE + TOP;
    }
    s.vy = 0;
  }
  s.frame++;

  // --- GameScene.js: pits, spikes, enemies, the flag ---
  if (s.y > world.killY) {
    s.status = STATUS.DEAD;
    return s;
  }
  for (const spike of world.spikes) {
    if (Math.abs(s.x - spike.x) < 10 + HAZARD_MARGIN && Math.abs(s.y - spike.y) < 10 + HAZARD_MARGIN) {
      s.status = STATUS.DEAD;
      return s;
    }
  }
  for (let i = 0; i < world.enemyPaths.length; i++) {
    if (s.dead & (1 << i)) continue;
    const ex = enemyX(world, i, s.frame);
    const ey = world.enemyPaths[i].y;
    const touching =
      s.x + HALF_W > ex - ENEMY_HALF_W - HAZARD_MARGIN &&
      s.x - HALF_W < ex + ENEMY_HALF_W + HAZARD_MARGIN &&
      s.y + BOTTOM > ey - ENEMY_TOP &&
      s.y - TOP < ey + ENEMY_BOTTOM;
    if (!touching) continue;
    if (s.vy > 0 && s.y <= ey - 2) {
      s.dead |= 1 << i;
      s.vy = STOMP_BOUNCE;
    } else {
      s.status = STATUS.DEAD;
      return s;
    }
  }
  const g = world.goal;
  if (s.x + HALF_W > g.left && s.x - HALF_W < g.right && s.y + BOTTOM > g.top && s.y - TOP < g.bottom) {
    s.status = STATUS.WON;
  }
  return s;
}
