import Phaser from 'phaser';
import Sfx from '../utils/sfx.js';
import { isMuted, setMuted, resetSave } from '../utils/SaveManager.js';
import { toggleFullscreen } from '../utils/fullscreen.js';

export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsScene' });
  }

  init(data) {
    this.returnScene = data.returnScene || 'MenuScene';
    this.confirmReset = false;
  }

  create() {
    this.sfx = new Sfx(this);
    this.muted = isMuted();

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.image(w / 2, h / 2, 'bg-sky').setScrollFactor(0).setDisplaySize(w, h);
    this.add.rectangle(w / 2, h / 2, w, h, 0x1a0a2e, 0.5);

    this.add
      .text(w / 2, 50, 'SETTINGS', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '16px',
        color: '#ffcc44',
      })
      .setOrigin(0.5);

    this.menuItems = [
      { label: () => this.muteText(), action: () => this.toggleMute() },
      { label: () => this.fullscreenText(), action: () => this.toggleFullscreen() },
      { label: () => (this.confirmReset ? 'Confirm Reset?' : 'Reset Progress'), action: () => this.handleReset() },
    ];
    this.selectedIndex = 0;
    this.menuTexts = [];

    this.menuItems.forEach((item, i) => {
      const txt = this.add
        .text(w / 2, 130 + i * 32, item.label(), {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: i === 0 ? '#ffffff' : '#aaaaaa',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: false });
      txt.on('pointerover', () => {
        this.selectedIndex = i;
        this.refreshMenuHighlight();
      });
      txt.on('pointerdown', item.action);
      this.menuTexts.push(txt);
    });

    this.add
      .text(w / 2, h - 50, '↑ ↓ Select   ENTER Confirm   M Mute   F Fullscreen', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '5px',
        color: '#ccaaee',
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, h - 28, 'ESC — Back', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#ffaa88',
      })
      .setOrigin(0.5);

    this.input.keyboard.on('keydown-UP', () => this.moveMenu(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.moveMenu(1));
    this.input.keyboard.on('keydown-M', () => this.toggleMute());
    this.input.keyboard.on('keydown-F', () => this.toggleFullscreen());
    this.input.keyboard.on('keydown-ESC', () => this.goBack());
    this.input.keyboard.on('keydown-ENTER', () => this.confirmMenu());
    this.input.keyboard.on('keydown-SPACE', () => this.confirmMenu());
  }

  muteText() {
    return this.muted ? 'Sound: OFF' : 'Sound: ON';
  }

  fullscreenText() {
    return this.scale.isFullscreen ? 'Fullscreen: ON' : 'Fullscreen: OFF';
  }

  refreshMenuHighlight() {
    this.menuTexts.forEach((txt, i) => {
      txt.setColor(i === this.selectedIndex ? '#ffffff' : '#aaaaaa');
      txt.setText(this.menuItems[i].label());
      if (i === 2 && this.confirmReset) {
        txt.setColor('#ff4444');
      }
    });
  }

  moveMenu(dir) {
    this.selectedIndex = Phaser.Math.Clamp(this.selectedIndex + dir, 0, this.menuItems.length - 1);
    this.sfx.play('select');
    this.refreshMenuHighlight();
  }

  confirmMenu() {
    this.menuItems[this.selectedIndex].action();
  }

  toggleMute() {
    this.muted = !this.muted;
    setMuted(this.muted);
    this.sfx.setMuted(this.muted);
    this.refreshMenuHighlight();
    if (!this.muted) this.sfx.play('select');
  }

  toggleFullscreen() {
    toggleFullscreen(this.scale);
    this.time.delayedCall(100, () => this.refreshMenuHighlight());
    this.sfx.play('select');
  }

  handleReset() {
    if (!this.confirmReset) {
      this.confirmReset = true;
      this.refreshMenuHighlight();
      return;
    }
    resetSave();
    this.confirmReset = false;
    this.sfx.play('start');
    this.refreshMenuHighlight();
  }

  goBack() {
    this.confirmReset = false;
    this.sfx.play('select');
    this.scene.start(this.returnScene);
  }
}
