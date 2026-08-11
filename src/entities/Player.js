import Phaser from 'phaser';
import {
  GRAVITY,
  PLAYER_SPEED,
  JUMP_VELOCITY,
  JUMP_CUT_MULTIPLIER,
  COYOTE_TIME,
  JUMP_BUFFER,
  STOMP_BOUNCE,
  INVULN_TIME,
} from '../utils/constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setSize(10, 14);
    this.setOffset(3, 2);
    this.setDepth(10);

    this.body.setGravityY(GRAVITY);
    this.body.setMaxVelocity(PLAYER_SPEED, 600);

    this.facing = 1;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.isDead = false;
    this.invuln = false;

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.play('player-idle');
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.isDead) return;

    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) {
      this.coyoteTimer = COYOTE_TIME;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.W) ||
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE);

    const jumpHeld =
      this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;

    if (jumpPressed) {
      this.jumpBufferTimer = JUMP_BUFFER;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    }

    if (left) {
      this.setVelocityX(-PLAYER_SPEED);
      this.facing = -1;
      this.setFlipX(true);
    } else if (right) {
      this.setVelocityX(PLAYER_SPEED);
      this.facing = 1;
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.setVelocityY(JUMP_VELOCITY);
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.scene.sfx?.play('jump');
    }

    if (!jumpHeld && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * JUMP_CUT_MULTIPLIER);
    }

    if (!onGround) {
      if (this.body.velocity.y < 0) {
        this.play('player-jump', true);
      } else {
        this.play('player-fall', true);
      }
    } else if (left || right) {
      this.play('player-run', true);
    } else {
      this.play('player-idle', true);
    }
  }

  stompBounce() {
    this.setVelocityY(STOMP_BOUNCE);
  }

  hurt() {
    if (this.invuln || this.isDead) return false;
    this.invuln = true;
    this.scene.sfx?.play('hurt');
    this.setTint(0xff4444);
    this.scene.time.delayedCall(INVULN_TIME, () => {
      this.clearTint();
      this.invuln = false;
    });
    return true;
  }

  die() {
    this.isDead = true;
    this.setVelocity(0, -200);
    this.setTint(0xff0000);
  }

  respawn(x, y) {
    this.isDead = false;
    this.invuln = false;
    this.clearTint();
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.setAlpha(1);
    this.play('player-idle');
  }
}
