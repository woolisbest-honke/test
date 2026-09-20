"use strict";
/* ============================================================
   BOWS & BANNERS — offline medieval bow FPS (three.js)
   Red vs Blue CTF: steal the enemy flag, 3 captures to win.

   The files in js/ are classic scripts (no build step) sharing
   one global scope — loaded in the order listed in index.html.
   ============================================================ */

// ---------- Math helpers ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) =>
  b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const approachAngle = (cur, tgt, max) => {
  let d = tgt - cur;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return cur + clamp(d, -max, max);
};
const yawTo = (a, b) => Math.atan2(-(b.x - a.x), -(b.z - a.z));

// shared scratch vector
const _d = new THREE.Vector3();

// ---------- Audio (synthesized, no assets) ----------
const AudioSys = {
  ctx: null,
  master: null,
  noiseBuf: null,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  },
  tone(f0, f1, dur, type, vol, delay) {
    if (!this.ctx) return;
    type = type || "sine";
    vol = vol == null ? 0.3 : vol;
    delay = delay || 0;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(1, f0), t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.03);
  },
  noiseS(dur, vol, f0, f1, q, delay) {
    if (!this.ctx) return;
    delay = delay || 0;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(Math.max(20, f0), t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    f.Q.value = q || 1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(this.master);
    s.start(t);
    s.stop(t + dur + 0.03);
  },
  shoot(d) {
    const v = clamp(0.5 / (1 + d * 0.03), 0.05, 0.5);
    this.noiseS(0.12, v, 1400, 300, 1.2);
    this.tone(160, 60, 0.08, "triangle", v * 0.5);
  },
  crossShot(d) {
    const v = clamp(0.6 / (1 + d * 0.03), 0.05, 0.6);
    this.noiseS(0.16, v, 900, 200, 1.5);
    this.tone(120, 50, 0.12, "square", v * 0.4);
  },
  swing(d) {
    const v = clamp(0.4 / (1 + d * 0.05), 0.03, 0.4);
    this.noiseS(0.18, v, 300, 1200, 2);
  },
  hit(d) {
    const v = clamp(0.35 / (1 + d * 0.05), 0.03, 0.35);
    this.noiseS(0.06, v, 700, 150, 1);
    this.tone(90, 45, 0.08, "sine", v);
  },
  meleeHit(d) {
    const v = clamp(0.5 / (1 + d * 0.05), 0.05, 0.5);
    this.tone(180, 70, 0.1, "square", v * 0.5);
    this.noiseS(0.08, v, 400, 100, 1);
  },
  hurt() {
    this.tone(220, 90, 0.18, "sawtooth", 0.25);
  },
  death(d) {
    const v = clamp(0.4 / (1 + d * 0.05), 0.04, 0.4);
    this.tone(150, 40, 0.3, "sawtooth", v);
  },
  pickup(v) {
    v = v || 1;
    this.tone(520, 780, 0.12, "sine", 0.25 * v);
    this.tone(780, 1040, 0.15, "sine", 0.2 * v, 0.08);
  },
  capture() {
    this.tone(523, 523, 0.12, "square", 0.2);
    this.tone(659, 659, 0.12, "square", 0.2, 0.12);
    this.tone(784, 784, 0.28, "square", 0.25, 0.24);
  },
  victory() {
    [523, 659, 784, 1047].forEach((f, i) =>
      this.tone(f, f, 0.22, "square", 0.25, i * 0.18),
    );
  },
  defeat() {
    [392, 330, 262, 196].forEach((f, i) =>
      this.tone(f, f, 0.3, "sawtooth", 0.18, i * 0.22),
    );
  },
  reload() {
    this.tone(300, 180, 0.06, "square", 0.12);
    this.noiseS(0.08, 0.1, 800, 400, 1, 0.15);
  },
  // ---------- Ambience + music (synthesized medieval loop) ----------
  muted: false,
  musicStarted: false,
  windStarted: false,
  mNext: 0,
  mStep: 0,
  MEL: [
    293.66, 349.23, 440, 493.88, 440, 392, 349.23, 329.63, 293.66, 349.23, 440,
    493.88, 523.25, 493.88, 440, 392,
  ],
  startWind() {
    if (!this.ctx || this.windStarted) return;
    this.windStarted = true;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 300;
    f.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.value = 0.05;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lg = this.ctx.createGain();
    lg.gain.value = 0.022;
    lfo.connect(lg);
    lg.connect(g.gain);
    s.connect(f);
    f.connect(g);
    g.connect(this.master);
    s.start();
    lfo.start();
  },
  startMusic() {
    if (!this.ctx || this.musicStarted) return;
    this.musicStarted = true;
    this.mNext = this.ctx.currentTime + 0.3;
    this.mStep = 0;
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = 73.42; // D2 drone
    const g = this.ctx.createGain();
    g.gain.value = 0.03;
    o.connect(g);
    g.connect(this.master);
    o.start();
  },
  musicTick() {
    if (!this.ctx || !this.musicStarted) return;
    let guardN = 0;
    while (this.mNext < this.ctx.currentTime + 0.3 && guardN < 16) {
      this.playStep(this.mStep, Math.max(this.mNext, this.ctx.currentTime));
      this.mStep = (this.mStep + 1) % this.MEL.length;
      this.mNext += 0.3;
      guardN++;
    }
    if (this.mNext < this.ctx.currentTime)
      this.mNext = this.ctx.currentTime + 0.05;
  },
  playStep(step, t) {
    if (Math.random() < 0.88) {
      let f = this.MEL[step];
      if (Math.random() < 0.12) f *= 2;
      const o = this.ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + 0.45);
      const o2 = this.ctx.createOscillator();
      o2.type = "sine";
      o2.frequency.value = f * 2;
      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.04, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o2.connect(g2);
      g2.connect(this.master);
      o2.start(t);
      o2.stop(t + 0.26);
    }
    if (step % 4 === 0) {
      const b = [73.42, 87.31, 98, 110][(step / 4) % 4];
      const o = this.ctx.createOscillator();
      o.type = "square";
      o.frequency.value = b;
      const flt = this.ctx.createBiquadFilter();
      flt.type = "lowpass";
      flt.frequency.value = 320;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      o.connect(flt);
      flt.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + 0.55);
    }
  },
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
  },
};
