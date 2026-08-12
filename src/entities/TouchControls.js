/**
 * On-screen D-pad + jump button for touch devices.
 * Exposes continuous `left` / `right` / `jumpHeld` state (mirrors keyboard
 * `isDown` semantics) plus a one-shot `consumeJumpPress()` edge, so Player.js
 * can OR it into the same logic it already uses for keyboard/cursor input.
 */
const ALPHA_IDLE = 0.35;
const ALPHA_ACTIVE = 0.65;
const DEPTH = 110;

export default class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.left = false;
    this.right = false;
    this.jumpHeld = false;
    this._jumpQueued = false;

    const w = scene.scale.width;
    const h = scene.scale.height;
    const pad = 14;
    const r = 20;

    this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(DEPTH);

    this.leftBtn = this._makeButton(scene, pad + r, h - pad - r, r, '◀');
    this.rightBtn = this._makeButton(scene, pad + r * 3 + 8, h - pad - r, r, '▶');
    this.jumpBtn = this._makeButton(scene, w - pad - r - 6, h - pad - r - 6, r + 6, '⤒');

    this.container.add([
      this.leftBtn.bg, this.leftBtn.label,
      this.rightBtn.bg, this.rightBtn.label,
      this.jumpBtn.bg, this.jumpBtn.label,
    ]);

    this._wireHold(this.leftBtn, 'left');
    this._wireHold(this.rightBtn, 'right');
    this._wireJump(this.jumpBtn);
  }

  _makeButton(scene, x, y, radius, glyph) {
    const bg = scene.add.circle(x, y, radius, 0xffffff, ALPHA_IDLE);
    const label = scene.add
      .text(x, y, glyph, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: `${Math.floor(radius * 0.8)}px`,
        color: '#1a0a2e',
      })
      .setOrigin(0.5);
    const zone = scene.add
      .zone(x, y, radius * 2, radius * 2)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setInteractive();
    return { bg, label, zone };
  }

  _wireHold(btn, prop) {
    btn.zone.on('pointerdown', () => {
      this[prop] = true;
      btn.bg.setFillStyle(0xffffff, ALPHA_ACTIVE);
    });
    const release = () => {
      this[prop] = false;
      btn.bg.setFillStyle(0xffffff, ALPHA_IDLE);
    };
    btn.zone.on('pointerup', release);
    btn.zone.on('pointerout', release);
  }

  _wireJump(btn) {
    btn.zone.on('pointerdown', () => {
      this.jumpHeld = true;
      this._jumpQueued = true;
      btn.bg.setFillStyle(0xffffff, ALPHA_ACTIVE);
    });
    const release = () => {
      this.jumpHeld = false;
      btn.bg.setFillStyle(0xffffff, ALPHA_IDLE);
    };
    btn.zone.on('pointerup', release);
    btn.zone.on('pointerout', release);
  }

  /** One-shot edge, mirrors Phaser.Input.Keyboard.JustDown for keyboard keys. */
  consumeJumpPress() {
    if (this._jumpQueued) {
      this._jumpQueued = false;
      return true;
    }
    return false;
  }

  destroy() {
    [this.leftBtn, this.rightBtn, this.jumpBtn].forEach((b) => b.zone.destroy());
    this.container.destroy();
  }
}
