import Phaser from 'phaser';
import { TILE_SIZE, CRUMBLE_DELAY, CRUMBLE_RESPAWN } from '../utils/constants.js';

/**
 * Cracked stone that holds for a moment after the hero lands on it, then
 * drops away and regrows a few seconds later. `x`, `y` and `width` are in
 * tiles; `y` is the row the platform occupies (you stand on its top edge).
 */
export default class CrumblingPlatform extends Phaser.GameObjects.TileSprite {
  constructor(scene, x, y, width = 2) {
    super(scene, x * TILE_SIZE, y * TILE_SIZE, width * TILE_SIZE, TILE_SIZE, 'crumble');
    this.setOrigin(0, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(width * TILE_SIZE, 10);
    this.setDepth(1);

    this.homeX = this.x;
    this.homeY = this.y;
    this.state = 'solid';
  }

  /** Called by the collider when the hero is standing on top. */
  stepOn() {
    if (this.state !== 'solid') return;
    this.state = 'shaking';
    this.scene.sfx?.play('crack');
    this.scene.tweens.add({
      targets: this,
      x: this.homeX + 1,
      duration: 45,
      yoyo: true,
      repeat: Math.floor(CRUMBLE_DELAY / 90),
      onComplete: () => this.fall(),
    });
  }

  fall() {
    if (!this.scene) return;
    this.state = 'gone';
    this.body.enable = false;
    this.scene.dust?.(this.homeX + this.width / 2, this.homeY + 8, 8);
    this.scene.tweens.add({
      targets: this,
      y: this.homeY + 40,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeIn',
    });
    this.scene.time.delayedCall(CRUMBLE_RESPAWN, () => this.regrow());
  }

  regrow() {
    if (!this.scene) return;
    // Never reappear around the hero; wait until the space is clear.
    const player = this.scene.player;
    const bounds = new Phaser.Geom.Rectangle(this.homeX, this.homeY - 2, this.width, TILE_SIZE + 2);
    if (player && Phaser.Geom.Rectangle.Overlaps(bounds, player.getBounds())) {
      this.scene.time.delayedCall(300, () => this.regrow());
      return;
    }
    this.setPosition(this.homeX, this.homeY);
    this.body.enable = true;
    this.body.reset(this.homeX, this.homeY);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 250 });
    this.state = 'solid';
  }
}
