/** Simple Web Audio SFX generator — no external files needed. */
import { isMuted } from './SaveManager.js';

export default class Sfx {
  constructor(scene) {
    this.scene = scene;
    this.ctx = scene.sound?.context ?? null;
    this.master = null;
    if (this.ctx) {
      this.master = this.ctx.createGain();
      this.master.gain.value = isMuted() ? 0 : 0.25;
      this.master.connect(this.ctx.destination);
    }
  }

  setMuted(muted) {
    if (this.master) {
      this.master.gain.value = muted ? 0 : 0.25;
    }
  }

  play(type) {
    if (!this.ctx || !this.master || isMuted()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.master);

    switch (type) {
      case 'jump':
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
        break;
      case 'coin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1320, t + 0.05);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
        break;
      case 'stomp':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
        break;
      case 'hurt':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.3);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.master);
          o.type = 'square';
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.2, t + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.01, t + i * 0.12 + 0.2);
          o.start(t + i * 0.12);
          o.stop(t + i * 0.12 + 0.2);
        });
        break;
      case 'start':
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(660, t + 0.08);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
        break;
      case 'powerup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, t);
        osc.frequency.setValueAtTime(990, t + 0.08);
        osc.frequency.setValueAtTime(1320, t + 0.16);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.25);
        break;
      case 'select':
        osc.type = 'square';
        osc.frequency.setValueAtTime(520, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        osc.start(t);
        osc.stop(t + 0.08);
        break;
      default:
        break;
    }
  }
}
