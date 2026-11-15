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
  GLIDE_TIME,
  GLIDE_FALL_SPEED,
  UPDRAFT_MAX_RISE,
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
    // Horizontal headroom above run speed is for tailwinds only; running is
    // still capped at PLAYER_SPEED where the velocity is set in preUpdate.
    this.body.setMaxVelocity(PLAYER_SPEED * 2, 600);

    this.facing = 1;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.isDead = false;
    this.invuln = false;
    this.hasDoubleJump = false;
    this.doubleJumpUsed = false;
    this.hasGlide = false;
    this.glideLeft = GLIDE_TIME;
    this.isGliding = false;
    this.ridingPlatform = null;
    this.wasJumpHeld = false;
    this.wasOnGround = true;
    this.lastVy = 0;
    this.runDustTimer = 0;

    // The physics sprite itself is hidden. What you see is `visual`, a twin
    // that follows it, so squash and stretch never touch the collision box.
    this.setVisible(false);
    this.visual = scene.add.sprite(x, y + 8, 'player', 0).setOrigin(0.5, 1).setDepth(10);
    this.scarf = scene.add.graphics().setDepth(9);
    this.scarfPoints = [0, 1, 2, 3].map(() => ({ x, y }));
    const sync = () => this.syncVisual();
    scene.events.on('postupdate', sync);
    scene.events.once('shutdown', () => scene.events.off('postupdate', sync));

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
    });

    this.play('player-idle');
  }

  // Appearance calls are forwarded to the visible twin.
  play(key, ignoreIfPlaying) {
    this.visual.play(key, ignoreIfPlaying);
    return this;
  }

  setFlipX(value) {
    this.visual.setFlipX(value);
    return this;
  }

  setTint(color) {
    this.visual.setTint(color);
    return this;
  }

  clearTint() {
    this.visual.clearTint();
    return this;
  }

  setAlpha(value) {
    this.visual.setAlpha(value);
    return this;
  }

  /** Snap to a squashed or stretched shape, then ease back to normal. */
  squash(scaleX, scaleY) {
    this.scene.tweens.killTweensOf(this.visual);
    this.visual.setScale(scaleX, scaleY);
    this.scene.tweens.add({ targets: this.visual, scaleX: 1, scaleY: 1, duration: 160, ease: 'Quad.easeOut' });
  }

  /** Runs after physics each frame: place the twin and trail the scarf. */
  syncVisual() {
    this.visual.setPosition(this.x, this.y + 8);
    this.visual.setAngle(this.isGliding ? this.facing * -12 : 0);

    const rising = this.body.velocity.y < -40;
    const lift = this.isGliding ? -2 : rising ? 2 : 0.5;
    let anchorX = this.x - this.facing * 3;
    let anchorY = this.y - 1;
    this.scarf.clear();
    if (this.isDead) return;
    this.scarfPoints.forEach((point, i) => {
      const targetX = anchorX - this.facing * 2.5;
      const targetY = anchorY + lift;
      // Snap if the hero teleported (respawn), otherwise trail behind.
      const far = Math.abs(targetX - point.x) + Math.abs(targetY - point.y) > 40;
      const ease = far ? 1 : 0.45 - i * 0.07;
      point.x += (targetX - point.x) * ease;
      point.y += (targetY - point.y) * ease;
      this.scarf.fillStyle(i < 2 ? 0xffd34e : 0xe0a030, this.visual.alpha);
      this.scarf.fillRect(Math.round(point.x) - 1, Math.round(point.y) - 1, 3, 2);
      anchorX = point.x;
      anchorY = point.y;
    });
  }

  grantGlide() {
    this.hasGlide = true;
    this.glideLeft = GLIDE_TIME;
  }

  grantDoubleJump() {
    this.hasDoubleJump = true;
    this.doubleJumpUsed = false;
  }

  updateRidingPlatform() {
    this.ridingPlatform = null;
    if (!this.body.touching.down || !this.scene.movingPlatforms) return;

    this.scene.movingPlatforms.children.iterate((platform) => {
      if (!platform.active || this.ridingPlatform) return;
      if (!platform.body.touching.up) return;

      const playerBottom = this.body.bottom;
      const platformTop = platform.body.top;
      if (playerBottom >= platformTop - 4 && playerBottom <= platformTop + 8) {
        this.ridingPlatform = platform;
      }
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.isDead || this.scene.levelComplete || this.scene.isPaused) return;

    this.updateRidingPlatform();

    const onGround = this.body.blocked.down || this.body.touching.down;
    const platformVx = this.ridingPlatform?.body.velocity.x ?? 0;
    if (onGround && !this.wasOnGround && this.lastVy > 140) {
      this.squash(1.3, 0.72);
      this.scene.dust?.(this.x, this.body.bottom, 6);
      this.scene.sfx?.play('land');
    }
    this.wasOnGround = onGround;
    this.lastVy = this.body.velocity.y;

    if (onGround) {
      this.coyoteTimer = COYOTE_TIME;
      this.doubleJumpUsed = false;
      this.glideLeft = GLIDE_TIME;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    // When the bot is driving, its inputs replace the keyboard and touch. It
    // decides here, right before they are read, so there is no frame of lag.
    this.scene.bot?.update();
    const bot = this.scene.bot?.input;
    const touch = this.scene.touchControls;
    const left = bot ? bot.left : this.cursors.left.isDown || this.keys.A.isDown || (touch?.left ?? false);
    const right = bot ? bot.right : this.cursors.right.isDown || this.keys.D.isDown || (touch?.right ?? false);
    const jumpPressed = bot
      ? bot.consumeJumpPress()
      : Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.keys.W) ||
        Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
        (touch?.consumeJumpPress() ?? false);

    const jumpHeld = bot
      ? bot.jump
      : this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown || (touch?.jumpHeld ?? false);

    if (jumpPressed) {
      this.jumpBufferTimer = JUMP_BUFFER;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    }

    // Wind only acts on an airborne hero, so standing still is always safe.
    const wind = onGround ? null : this.scene.windAt?.(this.x, this.y);
    let runVx = platformVx;
    if (left) {
      runVx -= PLAYER_SPEED;
      this.facing = -1;
      this.setFlipX(true);
    } else if (right) {
      runVx += PLAYER_SPEED;
      this.facing = 1;
      this.setFlipX(false);
    }
    runVx = Math.max(-PLAYER_SPEED, Math.min(PLAYER_SPEED, runVx));
    this.setVelocityX(runVx + (wind?.x ?? 0));
    if (wind?.y) {
      this.setVelocityY(Math.max(this.body.velocity.y + (wind.y * delta) / 1000, -UPDRAFT_MAX_RISE));
    }

    if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0) {
        this.setVelocityY(JUMP_VELOCITY);
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.scene.sfx?.play('jump');
        this.squash(0.78, 1.25);
        this.scene.dust?.(this.x, this.body.bottom, 4);
      } else if (this.hasDoubleJump && !this.doubleJumpUsed && !onGround) {
        this.setVelocityY(JUMP_VELOCITY * 0.9);
        this.doubleJumpUsed = true;
        this.jumpBufferTimer = 0;
        this.scene.sfx?.play('jump');
        this.squash(0.8, 1.22);
        this.scene.burst?.(this.x, this.body.bottom, 0xff88ff, 6);
      }
    }

    if (this.wasJumpHeld && !jumpHeld && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * JUMP_CUT_MULTIPLIER);
    }
    this.wasJumpHeld = jumpHeld;

    // Glide: holding jump while falling caps the fall speed for a short time.
    this.isGliding =
      this.hasGlide && !onGround && jumpHeld && this.glideLeft > 0 && this.body.velocity.y > GLIDE_FALL_SPEED;
    if (this.isGliding) {
      this.setVelocityY(GLIDE_FALL_SPEED);
      this.glideLeft -= delta;
      this.scene.glideTrail?.(this.x, this.y - 6);
    }

    if (this.ridingPlatform && this.body.touching.down && this.body.velocity.y >= 0) {
      const platformVy = this.ridingPlatform.body.velocity.y;
      if (platformVy !== 0) {
        this.setVelocityY(platformVy);
      }
    }

    if (!onGround) {
      if (this.body.velocity.y < 0) {
        this.play('player-jump', true);
      } else {
        this.play('player-fall', true);
      }
    } else if (left || right) {
      this.play('player-run', true);
      this.runDustTimer -= delta;
      if (this.runDustTimer <= 0) {
        this.runDustTimer = 240;
        this.scene.dust?.(this.x - this.facing * 4, this.body.bottom, 1);
      }
    } else {
      this.play('player-idle', true);
    }
  }

  stompBounce() {
    this.squash(0.82, 1.2);
    this.setVelocityY(STOMP_BOUNCE);
    this.doubleJumpUsed = false;
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
    this.clearTint();
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.setAlpha(1);
    this.doubleJumpUsed = false;
    this.glideLeft = GLIDE_TIME;
    this.play('player-idle');
    this.invuln = true;
    this.scene.time.delayedCall(INVULN_TIME, () => {
      this.invuln = false;
    });
  }
}
