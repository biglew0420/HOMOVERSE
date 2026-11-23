const MUTE_KEY = 'verseslots.mute.v1';

type Osc = OscillatorNode | null;

function readMute(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMute(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* private mode */
  }
}

class DemoAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private started = false;
  muted = readMute();
  private listeners = new Set<(muted: boolean) => void>();
  private nearLounge = false;
  private chimeAt = 0;

  isStarted() {
    return this.started;
  }

  onMute(fn: (muted: boolean) => void) {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    writeMute(muted);
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.22, this.ctx.currentTime, 0.05);
    }
    for (const fn of this.listeners) fn(muted);
  }

  toggle() {
    this.setMuted(!this.muted);
  }

  /** Web Audio may only start after a user gesture. */
  async start() {
    if (this.started) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    if (ctx.state === 'suspended') await ctx.resume();
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.22;
    master.connect(ctx.destination);
    this.master = master;

    this.drone(68, 'triangle', 0.04, 0.18);
    this.drone(92, 'sine', 0.03, 0.27);
    this.noise(0.025);
    this.started = true;
  }

  setNearLounge(near: boolean) {
    this.nearLounge = near;
    if (near) this.maybeChime();
  }

  click() {
    this.blip(880, 0.05, 0.07, 'square');
  }

  hover() {
    this.blip(660, 0.04, 0.04, 'sine');
  }

  bubble() {
    this.blip(520, 0.07, 0.06, 'triangle');
    this.blip(740, 0.05, 0.05, 'sine', 0.04);
  }

  enter() {
    this.blip(392, 0.12, 0.08, 'sine');
    this.blip(588, 0.1, 0.06, 'sine', 0.05);
  }

  private maybeChime() {
    if (!this.started || this.muted || !this.nearLounge) return;
    const now = performance.now();
    if (now - this.chimeAt < 7000) return;
    this.chimeAt = now;
    this.blip(523.25, 0.35, 0.07, 'sine');
    this.blip(659.25, 0.4, 0.05, 'sine', 0.08);
    this.blip(783.99, 0.5, 0.04, 'sine', 0.16);
  }

  private drone(freq: number, type: OscillatorType, gain: number, lfoHz: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lg = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    lfo.frequency.value = lfoHz;
    lg.gain.value = freq * 0.01;
    lfo.connect(lg);
    lg.connect(osc.frequency);
    osc.connect(g);
    g.connect(this.master);
    osc.start();
    lfo.start();
    void 0 as unknown as Osc;
  }

  private noise(gain: number) {
    if (!this.ctx || !this.master) return;
    const length = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 280;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start();
  }

  private blip(freq: number, duration: number, gain: number, type: OscillatorType, delay = 0) {
    if (!this.started || this.muted || !this.ctx || !this.master) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }
}

export const demoAudio = new DemoAudio();
