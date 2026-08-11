import Phaser from 'phaser';
import Sfx from '../utils/sfx.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.sfx = new Sfx(this);
    this.panelOpen = false;
    this.panelJustClosed = false;
    this.cameras.main.fadeIn(400, 26, 10, 46);

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.image(w / 2, h / 2, 'bg-sky').setScrollFactor(0).setDisplaySize(w, h);
    this.add.image(w / 2, h / 2 - 20, 'bg-clouds-far').setScrollFactor(0).setAlpha(0.7).setDisplaySize(w, h);
    this.add.image(w / 2, h / 2, 'bg-islands').setScrollFactor(0).setAlpha(0.5).setDisplaySize(w, h);

    this.add
      .text(w / 2, 60, 'SKY HOP', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '28px',
        color: '#ffcc44',
        stroke: '#1a0a2e',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(w / 2, 100, 'Sunset Island Adventure', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#ffaa88',
      })
      .setOrigin(0.5);

    this.menuItems = [
      { label: 'Play', action: () => this.goWorldMap() },
      { label: 'How to Play', action: () => this.showHowToPlay() },
      { label: 'Settings', action: () => this.goSettings() },
      { label: 'Credits', action: () => this.showCredits() },
    ];
    this.selectedIndex = 0;
    this.menuTexts = [];

    this.menuItems.forEach((item, i) => {
      const txt = this.add
        .text(w / 2, 160 + i * 28, item.label, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '10px',
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
      .text(w / 2, h - 24, '↑ ↓ Select   ENTER — World Map', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#ccaaee',
      })
      .setOrigin(0.5);

    this.input.keyboard.on('keydown-UP', () => this.moveMenu(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.moveMenu(1));
    this.input.keyboard.on('keydown-ENTER', () => this.confirmMenu());
    this.input.keyboard.on('keydown-SPACE', () => this.confirmMenu());
  }

  refreshMenuHighlight() {
    this.menuTexts.forEach((txt, i) => {
      txt.setColor(i === this.selectedIndex ? '#ffffff' : '#aaaaaa');
      txt.setScale(i === this.selectedIndex ? 1.05 : 1);
    });
  }

  moveMenu(dir) {
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.menuItems.length);
    this.sfx.play('select');
    this.refreshMenuHighlight();
  }

  confirmMenu() {
    if (this.panelOpen || this.panelJustClosed) return;
    this.menuItems[this.selectedIndex].action();
  }

  goWorldMap() {
    this.sfx.play('start');
    this.cameras.main.fadeOut(300, 26, 10, 46);
    this.time.delayedCall(300, () => {
      this.scene.start('WorldMapScene');
    });
  }

  goSettings() {
    this.sfx.play('select');
    this.scene.start('SettingsScene', { returnScene: 'MenuScene' });
  }

  showHowToPlay() {
    this.showInfoPanel('HOW TO PLAY', [
      '← → or A D — Move',
      'SPACE / W / ↑ — Jump',
      'Hold jump for higher leaps',
      'Stomp enemies from above',
      'Collect ★ stars for points',
      'Reach the flag to win',
      'Esc / P — Pause menu',
      'R — Restart level',
    ]);
  }

  showCredits() {
    this.showInfoPanel('CREDITS', [
      'Sky Hop — Sunset Edition',
      'Built with Phaser 3 + Vite',
      'Procedural pixel art',
      '10 levels of sky-hopping fun',
      '',
      'Made with ♥ for demo',
    ]);
  }

  showInfoPanel(title, lines) {
    const w = this.scale.width;
    const h = this.scale.height;

    const panel = this.add.container(0, 0).setDepth(50);
    panel.add(this.add.rectangle(w / 2, h / 2, w, h, 0x1a0a2e, 0.85));

    panel.add(
      this.add
        .text(w / 2, 50, title, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '12px',
          color: '#ffcc44',
        })
        .setOrigin(0.5)
    );

    lines.forEach((line, i) => {
      panel.add(
        this.add
          .text(w / 2, 100 + i * 20, line, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '7px',
            color: '#ffffff',
          })
          .setOrigin(0.5)
      );
    });

    panel.add(
      this.add
        .text(w / 2, h - 40, 'Press ESC or ENTER to close', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '7px',
          color: '#ffaa88',
        })
        .setOrigin(0.5)
    );

    const close = () => {
      this.panelOpen = false;
      this.panelJustClosed = true;
      this.time.delayedCall(100, () => {
        this.panelJustClosed = false;
      });
      panel.destroy();
      this.input.keyboard.off('keydown-ESC', close);
      this.input.keyboard.off('keydown-ENTER', close);
      this.input.keyboard.off('keydown-SPACE', close);
    };

    this.panelOpen = true;
    this.input.keyboard.once('keydown-ESC', close);
    this.input.keyboard.once('keydown-ENTER', close);
    this.input.keyboard.once('keydown-SPACE', close);
  }
}
