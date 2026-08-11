import Phaser from 'phaser';

export default class Wisp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, patrolRange = 3) {
    super(scene, x, y, 'wisp', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setSize(10, 12);
    this.setOffset(3, 2);
    this.setDepth(5);
    this.setImmovable(true);
    this.body.setAllowGravity(false);

    this.originY = y;
    this.patrolRange = patrolRange * 16;
    this.speed = 35;
    this.direction = 1;
    this.isSquished = false;

    this.play('wisp-float');
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.isSquished) return;

    this.setVelocityY(this.speed * this.direction);

    if (this.y >= this.originY + this.patrolRange) {
      this.direction = -1;
    } else if (this.y <= this.originY - this.patrolRange) {
      this.direction = 1;
    }
  }

  squish() {
    if (this.isSquished) return;
    this.isSquished = true;
    this.setVelocity(0, 0);
    this.body.enable = false;
    this.setTint(0x666666);
    this.scene.sfx?.play('stomp');
    this.scene.time.delayedCall(400, () => {
      this.destroy();
    });
  }
}
