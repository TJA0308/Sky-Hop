/**
 * Generated background music: a soft arpeggio over a bass note, one four-bar
 * chord loop per zone. Pure Web Audio, no audio files, like the sound effects.
 *
 * Notes are scheduled slightly ahead of the audio clock from a timer, which
 * keeps the rhythm steady even when the game's frame rate dips.
 */
import { isMuted } from './SaveManager.js';

const VOLUME = 0.5;
const LOOKAHEAD_S = 0.25;
const TICK_MS = 50;
const ARP = [0, 1, 2, 3, 2, 1, 2, 3];

// Each bar: [bass, four chord tones] as MIDI note numbers.
const THEMES = [
  { bpm: 100, bars: [[48, 60, 64, 67, 71], [45, 57, 60, 64, 67], [41, 57, 60, 65, 69], [43, 59, 62, 67, 69]] },
  { bpm: 112, bars: [[38, 57, 60, 62, 65], [34, 58, 62, 65, 69], [41, 57, 60, 65, 69], [36, 55, 60, 64, 67]] },
  { bpm: 88, bars: [[45, 57, 60, 64, 71], [41, 53, 57, 60, 64], [40, 55, 59, 62, 64], [38, 53, 57, 60, 65]] },
  { bpm: 96, bars: [[41, 57, 60, 65, 69], [40, 55, 60, 64, 67], [38, 57, 60, 62, 65], [34, 58, 62, 65, 70]] },
];

const midiToHz = (midi) => 440 * 2 ** ((midi - 69) / 12);

class Music {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.timer = null;
    this.zone = -1;
    this.step = 0;
    this.nextTime = 0;
    this.muted = false;
  }

  /** Starts (or switches to) a zone's theme. Safe to call from every scene. */
  play(ctx, zone) {
    if (!ctx) return;
    if (this.ctx !== ctx) {
      this.ctx = ctx;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;
      this.master = ctx.createGain();
      this.master.connect(filter);
      filter.connect(ctx.destination);
    }
    this.muted = isMuted();
    this.master.gain.value = this.muted ? 0 : VOLUME;
    if (zone !== this.zone) {
      this.zone = zone;
      this.step = 0;
    }
    if (!this.timer) {
      this.nextTime = ctx.currentTime + 0.1;
      this.timer = setInterval(() => this.tick(), TICK_MS);
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : VOLUME, this.ctx.currentTime, 0.05);
  }

  tick() {
    const ctx = this.ctx;
    // The clock is frozen until the browser allows audio (first key or tap).
    if (ctx.state !== 'running' || this.muted) return;
    if (this.nextTime < ctx.currentTime) this.nextTime = ctx.currentTime + 0.05;
    const theme = THEMES[this.zone] ?? THEMES[0];
    const stepLength = 60 / theme.bpm / 2;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD_S) {
      this.scheduleStep(theme, this.step, this.nextTime, stepLength);
      this.nextTime += stepLength;
      this.step++;
    }
  }

  scheduleStep(theme, step, time, stepLength) {
    const bar = theme.bars[Math.floor(step / 8) % theme.bars.length];
    const beat = step % 8;
    const secondPass = Math.floor(step / 32) % 2 === 1;
    if (beat === 0 || beat === 4) this.note(bar[0], time, stepLength * 3.5, 'sine', 0.11);
    const lift = secondPass && (beat === 3 || beat === 7) ? 12 : 0;
    this.note(bar[1 + ARP[beat]] + lift, time, stepLength * 1.8, 'triangle', beat % 2 === 0 ? 0.06 : 0.04);
  }

  note(midi, time, duration, type, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = midiToHz(midi);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }
}

const music = new Music();
export default music;

export function playZoneMusic(scene, zone) {
  music.play(scene.sound?.context ?? null, zone);
}
