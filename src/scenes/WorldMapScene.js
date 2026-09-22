import Phaser from 'phaser';
import Sfx from '../utils/sfx.js';
import {
  isLevelUnlocked,
  getLevelProgress,
  getTotalProgress,
} from '../utils/SaveManager.js';
import { LEVELS, LEVEL_META, ZONE_NAMES, MAX_LIVES } from '../utils/constants.js';

const NODE_LAYOUT = [
  { x: 80, y: 215, zone: 1 },
  { x: 200, y: 215, zone: 1 },
  { x: 320, y: 215, zone: 1 },
  { x: 200, y: 150, zone: 2 },
  { x: 320, y: 150, zone: 2 },
  { x: 440, y: 150, zone: 2 },
  { x: 160, y: 85, zone: 3 },
  { x: 280, y: 85, zone: 3 },
  { x: 400, y: 85, zone: 3 },
  { x: 520, y: 85, zone: 3 },
];

export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create() {
    this.launching = false;
    this.sfx = new Sfx(this);
    this.cameras.main.fadeIn(400, 26, 10, 46);

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.image(w / 2, h / 2, 'bg-sky').setScrollFactor(0).setDisplaySize(w, h);
    this.add.image(w / 2, h / 2 - 20, 'bg-clouds-far').setScrollFactor(0).setAlpha(0.7).setDisplaySize(w, h);
    this.add.image(w / 2, h / 2, 'bg-islands').setScrollFactor(0).setAlpha(0.5).setDisplaySize(w, h);
    this.add.rectangle(w / 2, h / 2, w, h, 0x112b4b, 0.35);

    this.add
      .text(w / 2, 24, 'WORLD MAP', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: '#ffcc44',
      })
      .setOrigin(0.5);

    const progress = getTotalProgress();
    this.add
      .text(w / 2, 48, `★ ${progress.totalStars}/${progress.maxStars} stars · ${progress.levelsCompleted}/${progress.totalLevels} levels`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#ffaa88',
      })
      .setOrigin(0.5);

    this.drawZoneLabels();
    this.drawPaths();
    this.nodes = [];
    this.selectedIndex = this.findFirstSelectable();

    LEVELS.forEach((_, i) => {
      this.createNode(i);
    });

    this.createPreviewPanel();

    this.footerHint = this.add
      .text(w / 2, h - 20, '', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#ccaaee',
      })
      .setOrigin(0.5);

    this.highlightNode(this.selectedIndex);

    this.add.text(w - 12, 24, 'Restart Progress', {
      fontFamily: '"Press Start 2P", monospace', fontSize: '6px',
      color: '#ffaa88', backgroundColor: '#1a0a2e', padding: { x: 8, y: 8 },
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.restartProgress());
    this.input.keyboard.on('keydown-R', () => this.restartProgress());
    this.add.text(12, 24, 'Menu', {
      fontFamily: '"Press Start 2P", monospace', fontSize: '7px', color: '#ffffff',
      backgroundColor: '#183454', padding: { x: 10, y: 8 },
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.goMenu());

    this.input.keyboard.on('keydown-LEFT', () => this.moveSelection(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this.moveSelection(1));
    this.input.keyboard.on('keydown-A', () => this.moveSelection(-1));
    this.input.keyboard.on('keydown-D', () => this.moveSelection(1));
    this.input.keyboard.on('keydown-UP', () => this.moveSelection(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(1));
    this.input.keyboard.on('keydown-ENTER', () => this.launchLevel());
    this.input.keyboard.on('keydown-SPACE', () => this.launchLevel());
    this.input.keyboard.on('keydown-ESC', () => this.goMenu());
  }

  drawZoneLabels() {
    const labels = [
      { x: 500, y: 235, text: ZONE_NAMES[1] },
      { x: 70, y: 155, text: ZONE_NAMES[2] },
      { x: 70, y: 70, text: ZONE_NAMES[3] },
    ];
    labels.forEach((l) => {
      this.add
        .text(l.x, l.y, l.text, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '6px',
        color: '#e0f4ff',
        })
        .setOrigin(0.5);
    });
  }

  drawPaths() {
    const g = this.add.graphics();
    g.lineStyle(2, 0x664488, 0.6);
    for (let i = 0; i < NODE_LAYOUT.length - 1; i++) {
      const a = NODE_LAYOUT[i];
      const b = NODE_LAYOUT[i + 1];
      if (isLevelUnlocked(i + 1) || isLevelUnlocked(i)) {
        g.lineBetween(a.x, a.y, b.x, b.y);
      }
    }
  }

  findFirstSelectable() {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (isLevelUnlocked(i)) return i;
    }
    return 0;
  }

  createNode(index) {
    const layout = NODE_LAYOUT[index];
    const meta = LEVEL_META[index];
    const unlocked = isLevelUnlocked(index);
    const progress = getLevelProgress(index);

    const container = this.add.container(layout.x, layout.y);

    const circle = this.add.circle(0, 0, 14, unlocked ? 0x3a9a8a : 0x444444);
    const num = this.add
      .text(0, -2, String(index + 1), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: unlocked ? '#ffffff' : '#888888',
      })
      .setOrigin(0.5);

    container.add([circle, num]);

    if (!unlocked) {
      const lock = this.add
        .text(0, -2, 'X', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '8px',
          color: '#666666',
        })
        .setOrigin(0.5);
      container.add(lock);
      num.setVisible(false);
    }

    const starStr = this.starDisplay(progress.stars);
    const stars = this.add
      .text(0, 18, starStr, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '5px',
        color: '#ffcc44',
      })
      .setOrigin(0.5);
    container.add(stars);

    const name = this.add
      .text(0, 30, meta.name, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '5px',
        color: unlocked ? '#ffaa88' : '#666666',
      })
      .setOrigin(0.5);
    container.add(name);

    circle.setInteractive(new Phaser.Geom.Circle(0, 0, 14), Phaser.Geom.Circle.Contains);
    circle.on('pointerover', () => {
      if (this.selectedIndex !== index) this.highlightNode(index);
    });
    circle.on('pointerdown', () => {
      const wasSelected = this.selectedIndex === index;
      this.highlightNode(index);
      if (wasSelected) this.launchLevel();
    });

    this.nodes.push({ container, circle, index, unlocked, pulseTween: null });
  }

  createPreviewPanel() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.previewBg = this.add
      .rectangle(w / 2, h - 72, w - 24, 52, 0x1a0a2e, 0.75)
      .setStrokeStyle(1, 0x664488);
    this.previewBg.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.launchLevel());

    this.previewTitle = this.add
      .text(w / 2, h - 88, '', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '7px',
        color: '#ffcc44',
      })
      .setOrigin(0.5);

    this.previewHint = this.add
      .text(w / 2, h - 72, '', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '5px',
        color: '#ccaaee',
      })
      .setOrigin(0.5);

    this.previewStats = this.add
      .text(w / 2, h - 58, '', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '5px',
        color: '#ffaa88',
      })
      .setOrigin(0.5);
  }

  updatePreview() {
    if (!this.previewTitle) return;
    const meta = LEVEL_META[this.selectedIndex];
    const prog = getLevelProgress(this.selectedIndex);
    const unlocked = isLevelUnlocked(this.selectedIndex);
    const starStr = this.starDisplay(prog.stars);

    this.previewTitle.setText(
      unlocked ? `Level ${this.selectedIndex + 1} — ${meta.name}` : `Level ${this.selectedIndex + 1} — Locked`
    );
    this.previewHint.setText(unlocked ? meta.hint : 'Complete the previous level to unlock.');
    this.previewStats.setText(
      unlocked && prog.completed
        ? `Best: ${prog.bestScore}   ${starStr}`
        : unlocked
          ? 'Not yet completed'
          : ''
    );
  }

  updateFooterHint() {
    if (!this.footerHint) return;
    const unlocked = isLevelUnlocked(this.selectedIndex);
    if (unlocked) {
      this.footerHint.setText(`← → Select   ENTER / Tap preview to play   R Reset`);
    } else {
      this.footerHint.setText('← → Select   ESC Menu');
    }
  }

  starDisplay(count) {
    let s = '';
    for (let i = 0; i < 3; i++) {
      s += i < count ? '★' : '☆';
    }
    return s;
  }

  highlightNode(index) {
    this.nodes.forEach((n) => {
      n.circle.setStrokeStyle(0);
      if (n.pulseTween) {
        n.pulseTween.stop();
        n.pulseTween = null;
      }
      n.circle.setScale(1);
    });
    const node = this.nodes[index];
    if (node) {
      node.circle.setStrokeStyle(3, 0xffcc44);
      node.pulseTween = this.tweens.add({
        targets: node.circle,
        scale: 1.12,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    this.selectedIndex = index;
    this.updatePreview();
    this.updateFooterHint();
  }

  moveSelection(dir) {
    let next = this.selectedIndex + dir;
    next = Phaser.Math.Clamp(next, 0, LEVELS.length - 1);
    if (next !== this.selectedIndex) {
      this.sfx.play('select');
      this.highlightNode(next);
    }
  }

  launchLevel() {
    if (this.launching) return;
    const node = this.nodes[this.selectedIndex];
    if (!node.unlocked) {
      this.sfx.play('hurt');
      return;
    }
    this.sfx.play('start');
    this.launching = true;
    this.cameras.main.fadeOut(300, 26, 10, 46);
    this.time.delayedCall(300, () => {
      this.scene.start('GameScene', { levelIndex: this.selectedIndex, score: 0, fromMap: true });
      this.scene.launch('UIScene', { levelIndex: this.selectedIndex, score: 0, lives: MAX_LIVES });
    });
  }

  goMenu() {
    this.cameras.main.fadeOut(300, 26, 10, 46);
    this.time.delayedCall(300, () => {
      this.scene.start('MenuScene');
    });
  }

  restartProgress() {
    this.scene.start('SettingsScene', { returnScene: 'WorldMapScene', focusReset: true });
  }
}
