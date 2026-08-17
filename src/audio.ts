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

const B = './audio/bytes';

type Clip = { src: string; dur: number; vol?: number };

const C = {
  ahNo: { src: `${B}/ah-no.mp3`, dur: 1.36, vol: 0.52 },
  america: { src: `${B}/america.mp3`, dur: 1.12, vol: 0.5 },
  americaAgain: { src: `${B}/america-great-again.mp3`, dur: 3.71, vol: 0.46 },
  americaFirst: { src: `${B}/america-first.mp3`, dur: 7.34, vol: 0.42 },
  byeBye: { src: `${B}/bye-bye.mp3`, dur: 1.52, vol: 0.54 },
  china: { src: `${B}/china.mp3`, dur: 1.44, vol: 0.52 },
  competition: { src: `${B}/competition.mp3`, dur: 1.44, vol: 0.52 },
  donald: { src: `${B}/donald-trump.mp3`, dur: 1.06, vol: 0.5 },
  eightBillion: { src: `${B}/eight-billion.mp3`, dur: 5.28, vol: 0.42 },
  fantastic: { src: `${B}/fantastic.mp3`, dur: 0.86, vol: 0.56 },
  friends: { src: `${B}/friends.mp3`, dur: 2.59, vol: 0.48 },
  goodTime: { src: `${B}/have-a-good-time.mp3`, dur: 0.89, vol: 0.54 },
  greatest: { src: `${B}/greatest-president.mp3`, dur: 3.19, vol: 0.46 },
  lookAtThis: { src: `${B}/look-at-this-guy.mp3`, dur: 1.1, vol: 0.54 },
  nasty: { src: `${B}/nasty.mp3`, dur: 1.57, vol: 0.52 },
  no: { src: `${B}/no.mp3`, dur: 0.73, vol: 0.56 },
  nobody: { src: `${B}/nobody-like-me.mp3`, dur: 2.53, vol: 0.48 },
  promised: { src: `${B}/promised.mp3`, dur: 1.7, vol: 0.52 },
  ringtone: { src: `${B}/ringtone.mp3`, dur: 6.84, vol: 0.4 },
  thankYou: { src: `${B}/thank-you.mp3`, dur: 2.51, vol: 0.48 },
  theyDont: { src: `${B}/they-dont-like-me.mp3`, dur: 2.04, vol: 0.5 },
  toughGuy: { src: `${B}/tough-guy.mp3`, dur: 1.15, vol: 0.54 },
  wrong: { src: `${B}/wrong.mp3`, dur: 0.65, vol: 0.56 },
} as const satisfies Record<string, Clip>;

export type VoiceCue =
  | 'kill'
  | 'killElite'
  | 'killBoss'
  | 'killDrone'
  | 'killBureau'
  | 'killLobby'
  | 'leak'
  | 'deny'
  | 'wave'
  | 'waveOpen'
  | 'boss'
  | 'special'
  | 'specialTariff'
  | 'specialWall'
  | 'specialNova'
  | 'specialDesk'
  | 'combo'
  | 'comboBig'
  | 'perfect'
  | 'covfefe'
  | 'drive'
  | 'witch'
  | 'tweet'
  | 'finale'
  | 'deploy'
  | 'maxed'
  | 'victory'
  | 'victoryBig'
  | 'defeat';

const POOLS: Record<VoiceCue, Clip[]> = {
  kill: [C.byeBye, C.fantastic, C.wrong],
  killElite: [C.lookAtThis, C.toughGuy, C.byeBye],
  killBoss: [C.byeBye, C.nobody, C.promised],
  killDrone: [C.wrong, C.no, C.ahNo],
  killBureau: [C.toughGuy, C.lookAtThis, C.byeBye],
  killLobby: [C.nasty, C.wrong, C.byeBye],
  leak: [C.ahNo, C.no, C.theyDont, C.nasty],
  deny: [C.no, C.wrong, C.ahNo],
  wave: [C.goodTime, C.america, C.donald, C.competition],
  waveOpen: [C.competition, C.goodTime],
  boss: [C.lookAtThis, C.toughGuy],
  special: [C.nobody, C.donald],
  specialTariff: [C.china, C.nobody],
  specialWall: [C.promised, C.nobody],
  specialNova: [C.nobody, C.fantastic],
  specialDesk: [C.nobody, C.promised],
  combo: [C.fantastic, C.america],
  comboBig: [C.nobody, C.americaAgain],
  perfect: [C.fantastic, C.america, C.promised],
  covfefe: [C.thankYou, C.fantastic],
  drive: [C.eightBillion],
  witch: [C.theyDont, C.nasty],
  tweet: [C.friends, C.donald],
  finale: [C.americaAgain, C.competition],
  deploy: [C.goodTime, C.friends],
  maxed: [C.promised, C.nobody],
  victory: [C.americaAgain, C.greatest, C.thankYou],
  victoryBig: [C.americaFirst, C.greatest],
  defeat: [C.ringtone, C.theyDont, C.ahNo],
};

const MUSIC_VOL = { play: 0.42, menu: 0.28, duck: 0.11 };
const MASTER_VOL = 0.18;
const VOICE_GAP = 0.45;

function tagAudio(el: HTMLAudioElement): HTMLAudioElement {
  el.preload = 'auto';
  el.setAttribute('playsinline', 'true');
  el.setAttribute('webkit-playsinline', 'true');
  (el as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
  return el;
}

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    /* private mode */
  }
  return fallback;
}

function writeFlag(key: string, v: boolean): void {
  try {
    localStorage.setItem(key, v ? '1' : '0');
  } catch {
    /* private mode */
  }
}

export class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private silent: HTMLAudioElement | null = null;
  private bgm: HTMLAudioElement | null = null;
  private voiceEl: HTMLAudioElement | null = null;
  private mapId = 'lawn';
  private unlocked = false;
  private ducking = false;
  private bedVol = MUSIC_VOL.play;
  private voiceBusyUntil = 0;
  private recent: string[] = [];
  musicMuted = false;
  sfxMuted = false;

  constructor() {
    const legacy = readFlag('maga-mute', false);
    this.musicMuted = readFlag('maga-music', legacy);
    this.sfxMuted = readFlag('maga-sfx', legacy);
  }

  /** True when both beds are off — HUD treats this as total mute. */
  get muted(): boolean {
    return this.musicMuted && this.sfxMuted;
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
      this.master.gain.value = this.sfxMuted ? 0 : MASTER_VOL;
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
    this.playBed(this.musicMuted ? 0 : MUSIC_VOL.play);
  }

  playMenu(): void {
    if (!this.unlocked) return;
    this.mapId = 'lawn';
    this.playBed(this.musicMuted ? 0 : MUSIC_VOL.menu);
  }

  private playBed(volume: number): void {
    if (!this.unlocked) return;
    const src = MUSIC[this.mapId] ?? MUSIC.lawn;
    if (!this.bgm || this.bgm.getAttribute('data-src') !== src) {
      this.bgm?.pause();
      this.bgm = tagAudio(new Audio(src));
      this.bgm.loop = true;
      this.bgm.setAttribute('data-src', src);
    }
    this.bedVol = volume;
    this.bgm.volume = this.ducking && volume > 0 ? MUSIC_VOL.duck : volume;
    if (this.musicMuted || volume <= 0) {
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

  stopVoice(): void {
    if (this.voiceEl) {
      this.voiceEl.pause();
      this.voiceEl = null;
    }
    this.voiceBusyUntil = 0;
    this.duck(false);
  }

  setMusicMuted(v: boolean): void {
    this.musicMuted = v;
    writeFlag('maga-music', v);
    if (v) this.bgm?.pause();
    else if (this.unlocked) this.playMusic();
  }

  setSfxMuted(v: boolean): void {
    this.sfxMuted = v;
    writeFlag('maga-sfx', v);
    if (v) this.stopVoice();
    if (this.master) this.master.gain.setTargetAtTime(v ? 0 : MASTER_VOL, this.now(), 0.02);
  }

  toggleMusic(): boolean {
    this.setMusicMuted(!this.musicMuted);
    return this.musicMuted;
  }

  toggleSfx(): boolean {
    this.setSfxMuted(!this.sfxMuted);
    return this.sfxMuted;
  }

  voice(cue: VoiceCue, force = false): void {
    if (!this.unlocked || this.sfxMuted) return;
    const now = performance.now();
    const busy = this.voiceEl && !this.voiceEl.paused && !this.voiceEl.ended;
    if (!force && (busy || now < this.voiceBusyUntil)) return;
    const pool = POOLS[cue];
    if (!pool.length) return;
    const pick = this.pickClip(pool);
    this.playVoice(pick, force);
  }

  private pickClip(pool: Clip[]): Clip {
    const fresh = pool.filter((c) => !this.recent.includes(c.src));
    const bag = fresh.length ? fresh : pool;
    const clip = bag[(Math.random() * bag.length) | 0]!;
    this.recent.push(clip.src);
    if (this.recent.length > 6) this.recent.shift();
    return clip;
  }

  private playVoice(clip: Clip, force: boolean): void {
    if (force) this.stopVoice();
    const a = tagAudio(new Audio(clip.src));
    a.volume = Math.max(0, Math.min(1, clip.vol ?? 0.5));
    this.voiceEl = a;
    this.voiceBusyUntil = performance.now() + (clip.dur + VOICE_GAP) * 1000;
    this.duck(true);
    const done = (): void => {
      if (this.voiceEl !== a) return;
      this.voiceEl = null;
      this.duck(false);
    };
    a.addEventListener('ended', done);
    a.addEventListener('error', done);
    void a.play().catch(done);
  }

  private duck(on: boolean): void {
    this.ducking = on;
    if (!this.bgm || this.musicMuted || this.bedVol <= 0) return;
    this.bgm.volume = on ? MUSIC_VOL.duck : this.bedVol;
  }

  private sfxOn(): boolean {
    return this.unlocked && !this.sfxMuted;
  }

  private playSfx(src: string, volume = 0.5): void {
    if (!this.sfxOn()) return;
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
    if (!this.sfxOn()) return;
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
    if (!this.sfxOn()) return;
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
    this.voice('deny');
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
    this.voice('leak');
  }

  wave(): void {
    this.playSfx(SFX.wave, 0.5);
    const notes = [392, 523, 659, 784];
    notes.forEach((n, i) => {
      window.setTimeout(() => this.tone(n, 0.16, 'triangle', 0.06), i * 90);
    });
  }

  victory(big = false): void {
    this.playSfx(SFX.victory, 0.55);
    this.voice(big ? 'victoryBig' : 'victory', true);
    const notes = [523, 659, 784, 1046, 784, 1046];
    notes.forEach((n, i) => {
      window.setTimeout(() => this.tone(n, 0.22, 'triangle', 0.08), i * 110);
    });
  }

  defeat(): void {
    this.playSfx(SFX.defeat, 0.55);
    this.voice('defeat', true);
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

  special(): void {
    this.playSfx(SFX.wave, 0.62);
    this.playSfx(SFX.boom, 0.5);
    [523, 659, 784, 1046].forEach((n, i) => {
      window.setTimeout(() => this.tone(n, 0.18, 'triangle', 0.08), i * 70);
    });
  }

  combo(): void {
    this.playSfx(SFX.wave, 0.42);
    this.tone(880, 0.12, 'square', 0.07, 1320);
    this.tone(1320, 0.1, 'triangle', 0.05);
  }

  siren(): void {
    this.tone(880, 0.28, 'sawtooth', 0.045, 420);
    this.tone(420, 0.28, 'sawtooth', 0.035, 880);
  }
}
