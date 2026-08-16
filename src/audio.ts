export class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem('maga-mute') === '1';
    } catch {
      this.muted = false;
    }
  }

  get ready(): boolean {
    return this.ctx !== null;
  }

  unlock(): void {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.24;
      this.master.connect(this.ctx.destination);
      this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 1.2, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(v: boolean): void {
    this.muted = v;
    try {
      localStorage.setItem('maga-mute', v ? '1' : '0');
    } catch {
      /* private mode */
    }
    if (this.master) this.master.gain.setTargetAtTime(v ? 0 : 0.24, this.now(), 0.02);
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  private out(): GainNode | null {
    return this.master;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain = 0.12,
    slide?: number,
  ): void {
    const ctx = this.ctx;
    const out = this.out();
    if (!ctx || !out) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private burst(dur: number, freq: number, q: number, gain: number): void {
    const ctx = this.ctx;
    const out = this.out();
    const buf = this.noise;
    if (!ctx || !out || !buf) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(out);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  place(): void {
    this.tone(880, 0.08, 'square', 0.08);
    this.tone(1320, 0.12, 'triangle', 0.07, 1760);
    this.burst(0.08, 400, 2, 0.08);
  }

  deny(): void {
    this.tone(180, 0.16, 'sawtooth', 0.1, 90);
  }

  truth(): void {
    this.tone(1400 + Math.random() * 400, 0.055, 'square', 0.045, 2200);
  }

  trebShoot(): void {
    this.burst(0.18, 220, 0.8, 0.16);
    this.tone(140, 0.22, 'sawtooth', 0.08, 70);
  }

  boom(): void {
    this.burst(0.32, 90, 0.6, 0.28);
    this.tone(70, 0.28, 'sine', 0.16, 40);
    this.tone(220, 0.12, 'triangle', 0.06);
  }

  brick(): void {
    this.burst(0.14, 320, 1.4, 0.14);
    this.tone(160, 0.1, 'square', 0.06);
  }

  hit(): void {
    this.tone(420 + Math.random() * 80, 0.04, 'triangle', 0.04);
  }

  death(): void {
    this.tone(660, 0.08, 'square', 0.07, 990);
    this.tone(990, 0.14, 'triangle', 0.05, 1320);
    this.burst(0.1, 800, 3, 0.08);
  }

  leak(): void {
    this.tone(320, 0.35, 'sawtooth', 0.1, 90);
    this.tone(240, 0.4, 'triangle', 0.08, 70);
  }

  wave(): void {
    const notes = [392, 523, 659, 784];
    notes.forEach((n, i) => {
      window.setTimeout(() => this.tone(n, 0.16, 'triangle', 0.09), i * 90);
    });
  }

  victory(): void {
    const notes = [523, 659, 784, 1046, 784, 1046];
    notes.forEach((n, i) => {
      window.setTimeout(() => this.tone(n, 0.22, 'triangle', 0.1), i * 110);
    });
  }

  defeat(): void {
    [392, 311, 247, 196].forEach((n, i) => {
      window.setTimeout(() => this.tone(n, 0.28, 'sawtooth', 0.09), i * 180);
    });
  }

  sell(): void {
    this.tone(990, 0.08, 'triangle', 0.06, 440);
  }

  click(): void {
    this.tone(720, 0.04, 'square', 0.04);
  }
}
