import Phaser from 'phaser';
import Sfx from '../utils/sfx.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.sfx = new Sfx(this);

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.image(w / 2, h / 2, 'bg-sky').setScrollFactor(0).setDisplaySize(w, h);
    this.add.image(w / 2, h / 2 - 20, 'bg-clouds-far').setScrollFactor(0).setAlpha(0.7).setDisplaySize(w, h);
    this.add.image(w / 2, h / 2, 'bg-islands').setScrollFactor(0).setAlpha(0.5).setDisplaySize(w, h);

    this.add
      .text(w / 2, 70, 'SKY HOP', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '28px',
        color: '#ffcc44',
        stroke: '#1a0a2e',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, 110, 'Sunset Island Adventure', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#ffaa88',
      })
      .setOrigin(0.5);

    this.prompt = this.add
      .text(w / 2, 200, 'Press ENTER to Start', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: this.prompt,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    const hintY = 260;
    const hints = [
      '← → or A D  —  Move',
      'SPACE / W / ↑  —  Jump',
      'R  —  Restart level',
    ];
    hints.forEach((line, i) => {
      this.add
        .text(w / 2, hintY + i * 18, line, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '7px',
          color: '#ccaaee',
        })
        .setOrigin(0.5);
    });

    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.sfx.play('start');
      this.scene.start('GameScene', { levelIndex: 0, score: 0 });
      this.scene.launch('UIScene', { levelIndex: 0, score: 0, lives: 3 });
    }
  }
}
