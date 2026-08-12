/**
 * Pure projectile-motion math for the level validator, using the *actual*
 * runtime physics constants (see src/utils/constants.js) so the check never
 * drifts from what the game engine really does.
 *
 * Model: the player leaves a platform edge already at full run speed
 * (PLAYER_SPEED) with an initial vertical launch velocity (JUMP_VELOCITY),
 * falls under GRAVITY, and we solve for how far horizontally they travel by
 * the time they reach a given vertical offset `deltaY` (px, positive = the
 * target is BELOW the launch point, negative = ABOVE).
 *
 * This intentionally does not model acceleration ramp-up, coyote time, or
 * jump buffering — it's a guard-rail against grossly-impossible level
 * geometry, not a frame-accurate simulation. Callers should apply a safety
 * margin before treating a level design as "safe".
 */
import { GRAVITY, JUMP_VELOCITY, PLAYER_SPEED } from '../../src/utils/constants.js';

const DOUBLE_JUMP_MULTIPLIER = 0.9; // matches Player.js grantDoubleJump/stompBounce scaling

/**
 * Time (seconds) for a projectile launched with velocity `v0` (negative =
 * up) under `GRAVITY` to reach vertical offset `deltaY` (px, positive =
 * down) from the launch point. Returns null if that height is never reached
 * (target is above the jump's apex).
 */
function timeToReach(v0, deltaY) {
  const disc = v0 * v0 + 2 * GRAVITY * deltaY;
  if (disc < 0) return null;
  return (-v0 + Math.sqrt(disc)) / GRAVITY;
}

/** Max horizontal distance (px) coverable by a single jump to reach `deltaY`, or null if unreachable. */
export function maxSingleJumpRangePx(deltaY) {
  const t = timeToReach(JUMP_VELOCITY, deltaY);
  return t === null ? null : PLAYER_SPEED * t;
}

/**
 * Max horizontal distance (px) coverable by a single jump followed by a
 * double-jump timed at the first jump's apex (the most generous, best-case
 * timing — matches how Player.js allows the second jump at any point while
 * airborne), to reach `deltaY`. Returns null if unreachable even so.
 */
export function maxDoubleJumpRangePx(deltaY) {
  const t1 = -JUMP_VELOCITY / GRAVITY; // time to first apex
  const apexHeight = (JUMP_VELOCITY * JUMP_VELOCITY) / (2 * GRAVITY); // px risen above launch
  const secondV0 = JUMP_VELOCITY * DOUBLE_JUMP_MULTIPLIER;
  // deltaY relative to the *second* jump's launch point (which is apexHeight above the original launch)
  const t2 = timeToReach(secondV0, deltaY + apexHeight);
  if (t2 === null) return null;
  return PLAYER_SPEED * (t1 + t2);
}
