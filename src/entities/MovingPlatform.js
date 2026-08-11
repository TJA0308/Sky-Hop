import Phaser from 'phaser';
import { TILE_SIZE } from '../utils/constants.js';

export default class MovingPlatform extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, distance, axis = 'x', speed = 40) {
    super(scene, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'moving-platform');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.body.setAllowGravity(false);
    this.setSize(14, 8);
    this.setOffset(1, 4);
    this.setDepth(1);

    this.originX = this.x;
    this.originY = this.y;
    this.distance = distance * TILE_SIZE;
    this.axis = axis;
    this.speed = speed;
    this.direction = 1;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.axis === 'x') {
      this.setVelocityX(this.speed * this.direction);
      if (this.x >= this.originX + this.distance) {
        this.direction = -1;
      } else if (this.x <= this.originX) {
        this.direction = 1;
      }
    } else {
      this.setVelocityY(this.speed * this.direction);
      if (this.y >= this.originY + this.distance) {
        this.direction = -1;
      } else if (this.y <= this.originY) {
        this.direction = 1;
      }
    }
  }
}
