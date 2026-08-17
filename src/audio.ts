/** HTMLAudio playback so iPhone Silent-switch still hears music/SFX after a tap. */

const MUSIC: Record<string, string> = {
  lawn: './audio/music-lawn.mp3',
  palazzo: './audio/music-palazzo.mp3',
  border: './audio/music-border.mp3',
  avenue: './audio/music-avenue.mp3',
};

const SFX = {
  boom: './audio/sfx-boom.mp3',
  death: './audio/sfx-death.mp3',
  hit: './audio/sfx-hit.mp3',
  place: './audio/sfx-place.mp3',
  leak: './audio/sfx-leak.mp3',
  wave: './audio/sfx-wave.mp3',
  click: './audio/sfx-click.mp3',
  deny: './audio/sfx-deny.mp3',
  brick: './audio/sfx-brick.mp3',
  truth: './audio/sfx-laser.mp3',
  treb: './audio/sfx-cannon.mp3',
  sell: './audio/sfx-sell.mp3',
  victory: './audio/sfx-victory.mp3',
  defeat: './audio/sfx-defeat.mp3',
};

const VOICE = {
  sosad: './audio/voice-sosad.mp3',
  fired: './audio/voice-fired.mp3',
  uhoh: './audio/voice-uhoh.mp3',
};

function tagAudio(el: HTMLAudioElement): HTMLAudioElement {
  el.preload = 'auto';
  el.setAttribute('playsinline', 'true');
  el.setAttribute('webkit-playsinline', 'true');
  (el as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
  return el;
}

export class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private silent: HTMLAudioElement | null = null;
  private bgm: HTMLAudioElement | null = null;
  private mapId = 'lawn';
  private unlocked = false;
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem('maga-mute') === '1';
    } catch {
      this.muted = false;
    }
  }

  get ready(): boolean {
    return this.unlocked;
  }

  unlock(): void {
    const domSilent = document.querySelector<HTMLAudioElement>('#ios-silent');
    if (domSilent) {
      tagAudio(domSilent);
      domSilent.loop = true;
      domSilent.volume = 0.01;
      void domSilent.play().catch(() => {
        /* gesture may still be required */
      });
      this.silent = domSilent;
    }
    if (!this.silent) {
      this.silent = tagAudio(new Audio('./audio/silent.mp3'));
      this.silent.loop = true;
      this.silent.volume = 0.01;
    }
    void this.silent.play().catch(() => {
      /* gesture may still be required */
    });
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.18;
      this.master.connect(this.ctx.destination);
      this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 1.2, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.unlocked = true;
  }

  setMap(id: string): void {
    this.mapId = id;
    if (this.unlocked) this.playMusic();
  }

  playMusic(): void {
    if (!this.unlocked) return;
    const src = MUSIC[this.mapId] ?? MUSIC.lawn;
    if (!this.bgm || this.bgm.getAttribute('data-src') !== src) {
      this.bgm?.pause();
      this.bgm = tagAudio(new Audio(src));
      this.bgm.loop = true;
      this.bgm.volume = this.muted ? 0 : 0.42;
      this.bgm.setAttribute('data-src', src);
    }
    if (this.muted) {
      this.bgm.pause();
      return;
    }
    void this.bgm.play().catch(() => {
      /* autoplay blocked until next gesture */
    });
  }

  stopMusic(): void {
    this.bgm?.pause();
  }

  setMuted(v: boolean): void {
    this.muted = v;
    try {
      localStorage.setItem('maga-mute', v ? '1' : '0');
    } catch {
      /* private mode */
    }
    if (this.bgm) this.bgm.volume = v ? 0 : 0.42;
    if (v) this.bgm?.pause();
    else if (this.unlocked) this.playMusic();
    if (this.master) this.master.gain.setTargetAtTime(v ? 0 : 0.18, this.now(), 0.02);
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  voiceLine(kind?: keyof typeof VOICE): void {
    const keys = Object.keys(VOICE) as (keyof typeof VOICE)[];
    const pick = kind ?? keys[Math.floor(Math.random() * keys.length)]!;
    this.playSfx(VOICE[pick], 0.72);
  }

  private playSfx(src: string, volume = 0.5): void {
    if (this.muted || !this.unlocked) return;
    const a = tagAudio(new Audio(src));
    a.volume = Math.max(0, Math.min(1, volume));
    void a.play().catch(() => {
      /* file missing — synth fallback already fired by caller when needed */
    });
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
    this.playSfx(SFX.place, 0.45);
    this.tone(880, 0.08, 'square', 0.05);
  }

  deny(): void {
    this.playSfx(SFX.deny, 0.45);
    this.tone(180, 0.16, 'sawtooth', 0.08, 90);
  }

  truth(): void {
    this.playSfx(SFX.truth, 0.28);
    this.tone(1400 + Math.random() * 400, 0.055, 'square', 0.03, 2200);
  }

  trebShoot(): void {
    this.playSfx(SFX.treb, 0.5);
    this.burst(0.18, 220, 0.8, 0.1);
  }

  boom(): void {
    this.playSfx(SFX.boom, 0.62);
    this.burst(0.32, 90, 0.6, 0.16);
  }

  brick(): void {
    this.playSfx(SFX.brick, 0.45);
    this.burst(0.14, 320, 1.4, 0.1);
  }

  hit(): void {
    this.playSfx(SFX.hit, 0.35);
    this.tone(420 + Math.random() * 80, 0.04, 'triangle', 0.03);
  }

  death(): void {
    this.playSfx(SFX.death, 0.55);
    this.burst(0.1, 800, 3, 0.06);
  }

  leak(): void {
    this.playSfx(SFX.leak, 0.55);
    this.tone(320, 0.35, 'sawtooth', 0.08, 90);
  }

  wave(): void {
    this.playSfx(SFX.wave, 0.5);
    const notes = [392, 523, 659, 784];
    notes.forEach((n, i) => {
      window.setTimeout(() => this.tone(n, 0.16, 'triangle', 0.06), i * 90);
    });
  }

  victory(): void {
    this.playSfx(SFX.victory, 0.6);
    const notes = [523, 659, 784, 1046, 784, 1046];
    notes.forEach((n, i) => {
      window.setTimeout(() => this.tone(n, 0.22, 'triangle', 0.08), i * 110);
    });
  }

  defeat(): void {
    this.playSfx(SFX.defeat, 0.6);
    this.voiceLine('sosad');
    [392, 311, 247, 196].forEach((n, i) => {
      window.setTimeout(() => this.tone(n, 0.28, 'sawtooth', 0.07), i * 180);
    });
  }

  sell(): void {
    this.playSfx(SFX.sell, 0.4);
    this.tone(990, 0.08, 'triangle', 0.05, 440);
  }

  click(): void {
    this.playSfx(SFX.click, 0.3);
    this.tone(720, 0.04, 'square', 0.03);
  }
}
