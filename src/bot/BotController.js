/**
 * Plays the real game with the solver's plan. Player.js reads `input` in place
 * of the keyboard while a controller is attached to the scene.
 *
 * The plan comes from a simulator that only approximates Phaser, so before
 * each decision the controller compares where the hero actually is with where
 * the plan expected. If they have drifted apart it simply plans again from
 * the real position, which keeps small differences from snowballing.
 */
import { createWorld, setEnemies, enemyX, STATUS } from './sim.js';
import { solve, ACTIONS, HOLD_FRAMES } from './solver.js';

const DRIFT_X = 3;
const DRIFT_Y = 6;
const ENEMY_DRIFT = 3;

export default class BotController {
  constructor(scene) {
    this.scene = scene;
    this.world = createWorld(scene.levelData);
    this.plan = null;
    this.index = 0;
    this.framesLeft = 0;
    this.replans = 0;
    this.gaveUp = false;
    this.enemyRefs = [];
    this.failures = 0;
    this.lives = scene.lives;

    let pressed = false;
    this.input = {
      left: false,
      right: false,
      jump: false,
      press() {
        pressed = true;
      },
      consumeJumpPress() {
        const was = pressed;
        pressed = false;
        return was;
      },
    };
  }

  /** The live game state, in the simulator's terms. */
  readState() {
    const p = this.scene.player;
    return {
      x: p.x,
      y: p.y,
      vy: p.body.velocity.y,
      grounded: p.body.blocked.down || p.body.touching.down,
      coyote: p.coyoteTimer,
      buffer: p.jumpBufferTimer,
      held: this.input.jump,
      dead: 0,
      frame: 0,
      status: STATUS.ALIVE,
    };
  }

  /** True if any enemy is not where (or what) the plan assumed by now. */
  enemiesDrifted(expected) {
    const frame = this.index * HOLD_FRAMES;
    return this.enemyRefs.some((enemy, i) => {
      const alive = enemy.active && !enemy.isSquished;
      const plannedAlive = !(expected.dead & (1 << i));
      if (alive !== plannedAlive) return true;
      return alive && Math.abs(enemy.x - enemyX(this.world, i, frame)) > ENEMY_DRIFT;
    });
  }

  replan() {
    this.enemyRefs = this.scene.enemies
      .getChildren()
      .filter((e) => e.active && !e.isSquished && e.patrolLeft !== undefined);
    setEnemies(
      this.world,
      this.enemyRefs.map((e) => ({ x: e.x, y: e.y, dir: e.direction, left: e.patrolLeft, right: e.patrolRight }))
    );
    this.plan = solve(this.world, this.readState(), { maxExpanded: 40000 });
    this.index = 0;
    this.replans++;
    if (this.plan) {
      this.failures = 0;
      return;
    }
    // No route from here. In mid-air that usually means a fall is already
    // lost, so wait for the respawn; only give up when stuck on solid ground.
    this.setAction(2);
    if (this.readState().grounded && ++this.failures >= 3) {
      this.gaveUp = true;
      this.scene.showToast?.('Bot is stumped. Your turn!');
    }
  }

  setAction(actionIndex) {
    const [dir, jump] = ACTIONS[actionIndex];
    if (jump && !this.input.jump) this.input.press();
    this.input.left = dir < 0;
    this.input.right = dir > 0;
    this.input.jump = jump;
  }

  /** Called once per frame from Player.preUpdate, just before inputs are read. */
  update() {
    const scene = this.scene;
    // The game freezes for a few frames on a stomp; the plan must not advance.
    if (this.gaveUp || scene.levelComplete || scene.player.isDead || scene.hitStopping) return;

    // Losing a life means a respawn somewhere else entirely: start over.
    if (scene.lives !== this.lives) {
      this.lives = scene.lives;
      this.plan = null;
    }

    if (this.framesLeft > 0) {
      this.framesLeft--;
      return;
    }

    const expected = this.plan?.states[this.index];
    const p = scene.player;
    const drifted =
      !expected ||
      Math.abs(expected.x - p.x) > DRIFT_X ||
      Math.abs(expected.y - p.y) > DRIFT_Y ||
      this.enemiesDrifted(expected);
    if (drifted) this.replan();
    if (!this.plan) {
      // Searching is the expensive part, so retry a few times a second at most.
      this.framesLeft = 10;
      return;
    }

    this.setAction(this.plan.actions[this.index]);
    this.index++;
    this.framesLeft = HOLD_FRAMES - 1;
  }
}
