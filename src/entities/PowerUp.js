import Phaser from 'phaser';
import { TILE_SIZE } from '../utils/constants.js';

export default class PowerUp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = 'doubleJump') {
    super(scene, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'powerup');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.setSize(12, 12);
    this.setDepth(4);
    this.type = type;
    this.collected = false;

    scene.tweens.add({
      targets: this,
      y: this.y - 4,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: this,
      alpha: 0.7,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
