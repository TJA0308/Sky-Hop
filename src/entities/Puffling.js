import Phaser from 'phaser';
import { GRAVITY } from '../utils/constants.js';

export default class Puffling extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, patrolLeft, patrolRight) {
    super(scene, x, y, 'puffling', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setSize(12, 10);
    this.setOffset(2, 4);
    this.setDepth(5);
    this.setImmovable(true);
    this.body.setGravityY(GRAVITY);

    this.patrolLeft = patrolLeft;
    this.patrolRight = patrolRight;
    this.speed = 40;
    this.direction = -1;
    this.isSquished = false;

    this.play('puffling-walk');
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.isSquished) return;

    const ahead = this.scene.groundLayer.getTileAtWorldXY(
      this.x + this.direction * 10, this.body.bottom + 3
    );
    if (this.body.blocked.down && !ahead?.collides) this.direction *= -1;
    if (this.x <= this.patrolLeft || this.body.blocked.left) {
      this.direction = 1;
      this.setFlipX(true);
    } else if (this.x >= this.patrolRight || this.body.blocked.right) {
      this.direction = -1;
      this.setFlipX(false);
    }
    this.setVelocityX(this.speed * this.direction);
  }

  squish() {
    if (this.isSquished) return;
    this.isSquished = true;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.play('puffling-squish');
    this.scene.sfx?.play('stomp');
    this.scene.time.delayedCall(400, () => {
      this.destroy();
    });
  }
}
