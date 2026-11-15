/**
 * Finds a sequence of button presses that reaches the flag, using A* search
 * over the simulator in sim.js.
 *
 * A* explores the most promising state first. "Promising" is the time spent
 * so far plus an optimistic guess of the time still needed (the distance left
 * divided by run speed). The hero can never travel faster than run speed, so
 * the guess never overestimates; it is then weighted to favour progress,
 * trading a perfectly shortest route for a much faster search.
 */
import { step, STATUS, DT } from './sim.js';
import { PLAYER_SPEED } from '../utils/constants.js';

const PLAYER_SPEED_PER_FRAME = PLAYER_SPEED * DT;

// Each choice is held for this many frames, so a level is a few hundred
// decisions instead of a few thousand.
export const HOLD_FRAMES = 4;

// [direction, jump held]
export const ACTIONS = [
  [1, false],
  [1, true],
  [0, false],
  [0, true],
  [-1, false],
  [-1, true],
];

const HEURISTIC_WEIGHT = 2;

/** Min-heap on `f`, so the best open state is always on top. */
class Heap {
  constructor() {
    this.items = [];
  }
  get size() {
    return this.items.length;
  }
  push(node) {
    const a = this.items;
    a.push(node);
    let i = a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (a[parent].f <= a[i].f) break;
      [a[parent], a[i]] = [a[i], a[parent]];
      i = parent;
    }
  }
  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

// Two states this close together are treated as the same, so the search
// doesn't revisit near-identical situations.
function keyOf(s) {
  return `${Math.round(s.x / 3)},${Math.round(s.y / 3)},${Math.round(s.vy / 60)},${s.grounded ? 1 : 0}${s.held ? 1 : 0},${s.dead}`;
}

/**
 * Returns { actions, states, frames, expanded } or null if no route is found
 * within `maxExpanded` states. `actions[i]` is an index into ACTIONS held for
 * HOLD_FRAMES frames; `states[i]` is where the hero should be before it.
 */
export function solve(world, start, { maxExpanded = 150000 } = {}) {
  const goalX = world.goal.x;
  const h = (s) => (Math.abs(goalX - s.x) / PLAYER_SPEED_PER_FRAME) * HEURISTIC_WEIGHT;

  const open = new Heap();
  const seen = new Set([keyOf(start)]);
  open.push({ state: { ...start }, f: h(start), parent: null, action: -1 });
  let expanded = 0;

  while (open.size && expanded < maxExpanded) {
    const node = open.pop();
    expanded++;
    for (let a = 0; a < ACTIONS.length; a++) {
      const [dir, jump] = ACTIONS[a];
      const next = { ...node.state };
      for (let i = 0; i < HOLD_FRAMES && next.status === STATUS.ALIVE; i++) step(world, next, dir, jump);
      if (next.status === STATUS.DEAD) continue;

      const child = { state: next, f: next.frame - start.frame + h(next), parent: node, action: a };
      if (next.status === STATUS.WON) {
        const actions = [];
        const states = [];
        for (let n = child; n.parent; n = n.parent) {
          actions.push(n.action);
          states.push(n.parent.state);
        }
        actions.reverse();
        states.reverse();
        return { actions, states, frames: next.frame - start.frame, expanded };
      }
      const key = keyOf(next);
      if (seen.has(key)) continue;
      seen.add(key);
      open.push(child);
    }
  }
  return null;
}
