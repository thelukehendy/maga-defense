import type { Synth } from './audio.ts';
import {
  campaignWaves,
  DIFFICULTIES,
  type Difficulty,
  type DifficultyId,
  eventForWave,
  houseOrigin,
  MAX_TIER,
  type MapId,
  SPECIAL_NAME,
  towerStats,
  UPGRADE_COST,
  waveTitle,
} from './campaign.ts';
import type { TraumaCamera } from './engine.ts';
import { dist } from './engine.ts';
import type { FX } from './fx.ts';
import { GameMap } from './map.ts';
import {
  CELL,
  ENEMIES,
  type EnemyId,
  MAX_WAVES,
  SELL_RATIO,
  TOWERS,
  type TowerId,
  WORLD_H,
  WORLD_W,
} from './types.ts';

export type Enemy = {
  id: number;
  kind: EnemyId;
  hp: number;
  maxHp: number;
  dist: number;
  speed: number;
  flying: boolean;
  reward: number;
  leak: number;
  radius: number;
  flash: number;
  bob: number;
  x: number;
  y: number;
  angle: number;
  z: number;
  route: number;
  elite: boolean;
  boss: boolean;
  splitter: boolean;
};

export type Tower = {
  id: number;
  kind: TowerId;
  c: number;
  r: number;
  x: number;
  y: number;
  cooldown: number;
  angle: number;
  costPaid: number;
  age: number;
  tier: number;
  specialCd: number;
};

export type Wall = {
  c: number;
  r: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  life: number;
  maxLife: number;
};

export type Boulder = {
  kind: 'boulder';
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  t: number;
  dur: number;
  dmg: number;
  aoe: number;
};

export type BrickShot = {
  kind: 'brick';
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  tc: number;
  tr: number;
  t: number;
  dur: number;
  life: number;
  hp: number;
};

export type Beam = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  life: number;
};

export type Puddle = {
  x: number;
  y: number;
  r: number;
  life: number;
  max: number;
  dps: number;
};

export type SpawnItem = { kind: EnemyId; delay: number };

const HITS = ['SAD!', 'WRONG!', 'FAKE!', 'WEAK!', 'NO!', 'NAH!', 'COVFEFE!', 'BOOM!', 'SIT DOWN!'];
const BIG = ['HUGE DAMAGE!', 'TREMENDOUS!', "TARIFF'D!", 'BILLION!', 'YUGE!', 'BELIEVE ME!', 'KNOCKOUT!', 'OBLITERATED!'];
const KILLS: Record<EnemyId, string[]> = {
  alien: ['FIRED!', 'GONE!', 'NEXT!', 'BYE!', 'OUT!', 'DEPORT!'],
  drone: ['FAKE!', 'CUT!', 'OFF AIR!', 'SO SAD!', 'WRONG!', 'UNTRUE!'],
  bureaucrat: ['FIRED!', 'DEPORT!', 'RED TAPE!', 'OUT!', 'DRAIN IT!', 'NEXT!'],
  lobbyist: ['NO ACCESS!', 'K STREET!', 'SWAMPED!', 'CLOSED!', 'NO DEAL!', 'LOBBY CLOSED!'],
};
const STREAKS: [number, string][] = [
  [5, 'WINNING!'],
  [10, 'TREMENDOUS STREAK'],
  [18, 'UNPRECEDENTED'],
  [28, "EVERYONE'S TALKING"],
  [40, 'YUGE. HISTORIC. PERFECT.'],
];

function pick(arr: string[]): string {
  return arr[(Math.random() * arr.length) | 0]!;
}

function buildQueue(map: MapId, wave: number, waveMul: number): SpawnItem[] {
  const q: SpawnItem[] = [];
  for (const beat of campaignWaves(map, wave)) {
    const n = Math.max(1, Math.round(beat.n * waveMul));
    for (let i = 0; i < n; i++) q.push({ kind: beat.kind, delay: beat.gap });
  }
  return q;
}

function scaledHp(kind: EnemyId, wave: number): number {
  const base = ENEMIES[kind].hp;
  return Math.round(base * Math.pow(1.155, wave - 1));
}

export class Sim {
  donations = DIFFICULTIES.normal.startGold;
  approval = DIFFICULTIES.normal.startApproval;
  wave = 0;
  speed = 1;
  /** When true, cleared waves auto-advance after a short beat. */
  autoWaves = false;
  enemies: Enemy[] = [];
  towers: Tower[] = [];
  walls: Wall[] = [];
  boulders: Boulder[] = [];
  bricks: BrickShot[] = [];
  beams: Beam[] = [];
  occupied = new Set<number>();
  selected: Tower | null = null;
  placing: TowerId | null = 'truth';
  hover: { c: number; r: number } | null = null;
  armed: { c: number; r: number } | null = null;
  waveQueue: SpawnItem[] = [];
  spawnWait = 0;
  between = 0;
  announcing = 0;
  banner = '';
  won = false;
  lost = false;
  nextId = 1;
  time = 0;
  leaking = 0;
  map: GameMap;
  diff: Difficulty = DIFFICULTIES.normal;
  streak = 0;
  maxStreak = 0;
  streakT = 0;
  kills = 0;
  leakCount = 0;
  leakedThisWave = 0;
  perfectWaves = 0;
  earned = 0;
  playTime = 0;
  eventLife = 0;
  eventTitle = '';
  eventBlurb = '';
  tweetStorm = 0;
  donationDrive = 0;
  blackout = 0;
  witchHunt = 0;
  finalRally = 0;
  puddles: Puddle[] = [];
  keepTaps: number[] = [];
  comboPop = 0;
  freeze = 0;
  primeTime = 0;
  coffee = 0;
  hitstop = 0;
  danger = 0;
  feverLife = 0;
  shockwaves: { x: number; y: number; life: number; max: number }[] = [];
  sirenT = 0;
  readonly fx: FX;
  readonly cam: TraumaCamera;
  readonly audio: Synth;

  constructor(map: GameMap, fx: FX, cam: TraumaCamera, audio: Synth) {
    this.map = map;
    this.fx = fx;
    this.cam = cam;
    this.audio = audio;
  }

  configure(mapId: MapId, diffId: DifficultyId): void {
    this.map = new GameMap(mapId);
    this.diff = DIFFICULTIES[diffId];
    this.reset();
  }

  reset(): void {
    this.donations = this.diff.startGold;
    this.approval = this.diff.startApproval;
    this.wave = 0;
    this.speed = 1;
    this.autoWaves = false;
    this.enemies.length = 0;
    this.towers.length = 0;
    this.walls.length = 0;
    this.boulders.length = 0;
    this.bricks.length = 0;
    this.beams.length = 0;
    this.occupied.clear();
    this.selected = null;
    this.placing = 'truth';
    this.hover = null;
    this.armed = null;
    this.waveQueue = [];
    this.spawnWait = 0;
    this.between = 0.4;
    this.announcing = 0;
    this.banner = '';
    this.won = false;
    this.lost = false;
    this.time = 0;
    this.leaking = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.streakT = 0;
    this.kills = 0;
    this.leakCount = 0;
    this.leakedThisWave = 0;
    this.perfectWaves = 0;
    this.earned = 0;
    this.playTime = 0;
    this.eventLife = 0;
    this.eventTitle = '';
    this.eventBlurb = '';
    this.tweetStorm = 0;
    this.donationDrive = 0;
    this.blackout = 0;
    this.witchHunt = 0;
    this.finalRally = 0;
    this.puddles.length = 0;
    this.keepTaps.length = 0;
    this.comboPop = 0;
    this.freeze = 0;
    this.primeTime = 0;
    this.coffee = 0;
    this.hitstop = 0;
    this.danger = 0;
    this.feverLife = 0;
    this.shockwaves.length = 0;
    this.sirenT = 0;
  }

  startNextWave(): void {
    if (this.lost || this.won) return;
    if (this.wave >= MAX_WAVES) return;
    if (this.waveQueue.length || this.enemies.length) return;
    if (this.wave > 0 && this.between > 0 && this.between < 1.85) {
      const rush = 20 + this.wave * 6;
      this.credit(rush);
      this.fx.say(WORLD_W / 2, WORLD_H * 0.3, `EARLY RALLY +$${rush}`, '#9dffb0', 1.35);
      this.cam.hit(0.2);
    }
    this.wave += 1;
    this.waveQueue = buildQueue(this.map.def.id, this.wave, this.diff.waveMul);
    this.spawnWait = 0.28;
    this.between = 0;
    this.leakedThisWave = 0;
    this.announcing = 2.6;
    const flavor = this.map.def.flavor[(this.wave - 1) % this.map.def.flavor.length]!;
    this.banner = `WAVE ${this.wave} — ${waveTitle(this.wave)}`;
    this.fx.say(WORLD_W / 2, WORLD_H * 0.42 + 28, flavor, '#fff3b0', 1.12);
    this.audio.wave();
    if (this.wave === 1) this.audio.voice('waveOpen', true);
    else if (this.wave !== 6 && this.wave !== 12) this.audio.voice('wave');
    this.beginEvent(this.wave);
    if (this.wave === 6 || this.wave === 12) this.spawnBoss();
  }

  private beginEvent(wave: number): void {
    const ev = eventForWave(wave);
    if (!ev) return;
    this.eventTitle = ev.title;
    this.eventBlurb = ev.blurb;
    this.eventLife = ev.id === 'finale' ? 4.4 : ev.life;
    if (ev.id === 'tweet') {
      this.tweetStorm = ev.life;
      this.audio.voice('tweet');
    }
    if (ev.id === 'drive') {
      this.donationDrive = ev.life;
      this.audio.voice('drive', true);
    }
    if (ev.id === 'blackout') this.blackout = ev.life;
    if (ev.id === 'witch') {
      this.witchHunt = ev.life;
      this.audio.voice('witch', true);
    }
    if (ev.id === 'finale') {
      this.finalRally = ev.life;
      this.audio.voice('finale', true);
    }
    if (ev.id === 'coffee') this.coffee = ev.life;
    if (ev.id === 'prime') this.primeTime = ev.life;
    if (ev.id === 'caravan') {
      for (let i = 0; i < 10; i++) this.waveQueue.push({ kind: 'alien', delay: 0.18 });
    }
    if (ev.id === 'surge') {
      this.credit(80);
      this.fx.say(WORLD_W / 2, WORLD_H * 0.5, '+$80 RATINGS', '#e6c35c', 1.4);
      const keep = houseOrigin(this.map.def);
      this.fx.patriotic(keep.x + keep.w * 0.5, keep.y + keep.h * 0.4, 1.4);
    }
    this.cam.hit(0.22);
  }

  tapKeep(): boolean {
    const now = this.time;
    this.keepTaps = this.keepTaps.filter((t) => now - t < 3.2);
    this.keepTaps.push(now);
    if (this.keepTaps.length < 7) return false;
    this.keepTaps.length = 0;
    this.credit(40);
    this.fx.patriotic(WORLD_W / 2, WORLD_H * 0.72, 1.1);
    this.fx.say(WORLD_W / 2, WORLD_H * 0.62, 'COVFEFE BONUS', '#fff3b0', 1.35);
    this.audio.voice('covfefe', true);
    return true;
  }

  private credit(amount: number): void {
    const n = Math.max(0, Math.round(amount));
    this.donations += n;
    this.earned += n;
  }

  canAfford(id: TowerId): boolean {
    return this.donations >= TOWERS[id].cost;
  }

  tryPlace(c: number, r: number): boolean {
    if (!this.placing) return false;
    const def = TOWERS[this.placing];
    if (!this.map.canPlace(c, r, this.occupied)) {
      this.audio.deny();
      this.cam.hit(0.12);
      return false;
    }
    if (this.donations < def.cost) {
      this.audio.deny();
      this.fx.say(this.map.center(c, r).x, this.map.center(c, r).y, 'TOO CHEAP!', '#ff6b6b', 1.1);
      return false;
    }
    this.donations -= def.cost;
    const p = this.map.center(c, r);
    const t: Tower = {
      id: this.nextId++,
      kind: def.id,
      c,
      r,
      x: p.x,
      y: p.y,
      cooldown: 0.15,
      angle: 0,
      costPaid: def.cost,
      age: 0,
      tier: 0,
      specialCd: 0,
    };
    this.towers.push(t);
    this.occupied.add(this.map.idx(c, r));
    this.selected = t;
    this.armed = null;
    this.audio.place();
    this.fx.spawn(p.x, p.y, 16, ['#e6c35c', '#fff3b0'], 80, 'star', 3);
    this.fx.say(p.x, p.y - 18, 'BUILD!', '#e6c35c');
    return true;
  }

  trySell(): boolean {
    const t = this.selected;
    if (!t) return false;
    const refund = Math.round(t.costPaid * SELL_RATIO);
    this.donations += refund;
    this.occupied.delete(this.map.idx(t.c, t.r));
    this.towers = this.towers.filter((x) => x.id !== t.id);
    this.selected = null;
    this.armed = null;
    this.audio.sell();
    this.fx.say(t.x, t.y, `+$${refund}`, '#9dffb0');
    return true;
  }

  upgradeCost(t: Tower): number | null {
    if (t.tier >= MAX_TIER) return null;
    return UPGRADE_COST[t.kind][t.tier]!;
  }

  tryUpgrade(): boolean {
    const t = this.selected;
    if (!t) return false;
    if (t.tier >= MAX_TIER) return this.trySpecial();
    const cost = this.upgradeCost(t);
    if (cost === null) {
      this.audio.deny();
      return false;
    }
    if (this.donations < cost) {
      this.audio.deny();
      this.fx.say(t.x, t.y, 'TOO CHEAP!', '#ff6b6b');
      return false;
    }
    this.donations -= cost;
    t.tier += 1;
    t.costPaid += cost;
    t.age = 0;
    this.audio.place();
    this.fx.spawn(t.x, t.y, 22, ['#e6c35c', '#fff3b0', '#3cf0ff'], 110, 'star', 4);
    this.fx.say(t.x, t.y - 22, `TIER ${towerStats(t.kind, t.tier).label}`, '#fff3b0', 1.2);
    if (t.tier >= MAX_TIER) {
      this.fx.say(t.x, t.y - 44, 'SPECIAL READY', '#3cf0ff', 1.15);
      this.cam.hit(0.22);
      this.audio.voice('maxed');
    }
    return true;
  }

  specialReady(t: Tower): boolean {
    return t.tier >= MAX_TIER && t.specialCd <= 0;
  }

  trySpecial(): boolean {
    const t = this.selected;
    if (!t || t.tier < MAX_TIER) return false;
    if (t.specialCd > 0) {
      this.audio.deny();
      this.fx.say(t.x, t.y, 'RECHARGING', '#ffb38a', 0.95);
      return false;
    }
    t.specialCd = 16;
    t.age = 0;
    this.hitstop = Math.max(this.hitstop, 0.14);
    this.cam.bang();
    this.audio.special();
    const cue =
      t.kind === 'trebuchet'
        ? 'specialTariff'
        : t.kind === 'brick'
          ? 'specialWall'
          : t.kind === 'truth'
            ? 'specialNova'
            : t.kind === 'desk'
              ? 'specialDesk'
              : 'special';
    this.audio.voice(cue, true);
    const name = SPECIAL_NAME[t.kind] ?? 'SPECIAL';
    this.fx.say(t.x, t.y - 28, name, '#fff3b0', 1.55);
    this.shock(t.x, t.y);
    if (t.kind === 'truth') {
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        if (!e.flying && this.map.inTunnel(e.x, e.y)) continue;
        if (dist(t.x, t.y, e.x, e.y) <= 3.8 * CELL + e.radius) {
          this.beams.push({ x0: t.x, y0: t.y - 18, x1: e.x, y1: e.y - e.z, life: 0.16 });
          this.damage(e, 62, 'NOVA!', '#3cf0ff');
        }
      }
      this.fx.patriotic(t.x, t.y, 2);
    } else if (t.kind === 'trebuchet') {
      const marks = [...this.enemies].filter((e) => e.hp > 0).sort((a, b) => b.dist - a.dist).slice(0, 4);
      for (const e of marks) this.fireTreb(t, e);
    } else if (t.kind === 'brick') {
      const ground = this.enemies.filter((e) => e.hp > 0 && !e.flying).sort((a, b) => b.dist - a.dist);
      if (ground[0]) this.fireBrick(t, ground[0], 4);
    } else {
      this.freeze = 2.6;
      this.fx.say(WORLD_W / 2, WORLD_H * 0.48, 'SHUTDOWN', '#fff3b0', 1.6);
      this.fx.patriotic(WORLD_W / 2, WORLD_H * 0.5, 1.5);
    }
    return true;
  }

  selectAt(c: number, r: number): boolean {
    const found = this.towers.find((t) => t.c === c && t.r === r);
    if (found) {
      this.selected = found;
      this.placing = null;
      this.armed = null;
      this.audio.click();
      return true;
    }
    return false;
  }

  private haste(): number {
    let h = 1;
    if (this.tweetStorm > 0) h *= 1.4;
    if (this.finalRally > 0) h *= 1.22;
    if (this.feverLife > 0 || this.streak >= 20) h *= 1.42;
    return h;
  }

  private buffMult(t: Tower): number {
    let m = 1;
    for (const d of this.towers) {
      if (d.kind !== 'desk') continue;
      const st = towerStats('desk', d.tier);
      const range = st.range * CELL;
      if (dist(t.x, t.y, d.x, d.y) <= range) m = Math.max(m, st.buff);
    }
    return m * this.haste();
  }

  private wallAt(c: number, r: number): Wall | undefined {
    return this.walls.find((w) => w.c === c && w.r === r);
  }

  private shock(x: number, y: number): void {
    this.shockwaves.push({ x, y, life: 0.45, max: 0.45 });
  }

  private spawnBoss(): void {
    const route = this.map.pickRoute();
    const s = this.map.sample(0, route);
    const hp = Math.round(scaledHp('bureaucrat', this.wave) * this.diff.hpMul * (this.wave >= 12 ? 7.2 : 5.4));
    this.enemies.push({
      id: this.nextId++,
      kind: 'bureaucrat',
      hp,
      maxHp: hp,
      dist: 0,
      speed: ENEMIES.bureaucrat.speed * this.diff.spdMul * 0.72,
      flying: false,
      reward: Math.round(120 * this.diff.rewardMul * (this.wave >= 12 ? 1.6 : 1)),
      leak: Math.max(12, Math.round(28 * this.diff.leakMul)),
      radius: 26,
      flash: 0,
      bob: 0,
      x: s.x,
      y: s.y,
      angle: s.angle,
      z: 0,
      route,
      elite: true,
      boss: true,
      splitter: false,
    });
    this.fx.say(WORLD_W / 2, WORLD_H * 0.5, this.wave >= 12 ? 'THE BIGGEST CLERK' : 'SPECIAL COUNSEL', '#ff6b6b', 1.6);
    this.cam.bang();
    if (this.wave < 12) this.audio.voice('boss', true);
  }

  private spawnEnemy(kind: EnemyId, opts?: { splitter?: boolean; elite?: boolean; dist?: number; route?: number }): void {
    const def = ENEMIES[kind];
    const elite = opts?.elite ?? (this.wave >= 7 && kind !== 'lobbyist' && Math.random() < 0.16 + this.wave * 0.01);
    const splitter = opts?.splitter ?? (kind === 'alien' && this.wave >= 4 && Math.random() < 0.2);
    const hpMul = (elite ? 1.7 : 1) * (splitter ? 0.72 : 1);
    const hp = Math.round(scaledHp(kind, this.wave) * this.diff.hpMul * hpMul);
    const route = opts?.route ?? this.map.pickRoute();
    const along = opts?.dist ?? 0;
    const s = this.map.sample(along, route);
    this.enemies.push({
      id: this.nextId++,
      kind,
      hp,
      maxHp: hp,
      dist: along,
      speed: def.speed * this.diff.spdMul * (elite ? 1.08 : 1) * (splitter ? 1.12 : 1),
      flying: def.flying,
      reward: Math.round((def.reward + Math.floor(this.wave * 1.2)) * this.diff.rewardMul * (elite ? 1.6 : 1)),
      leak: Math.max(1, Math.round(def.leak * this.diff.leakMul * (elite ? 1.35 : 1))),
      radius: def.radius * (elite ? 1.16 : splitter ? 0.82 : 1),
      flash: 0,
      bob: Math.random() * Math.PI * 2,
      x: s.x,
      y: s.y,
      angle: s.angle,
      z: def.flying ? 22 : 0,
      route,
      elite,
      boss: false,
      splitter,
    });
  }

  private bumpStreak(x: number, y: number): void {
    this.streak += 1;
    this.streakT = 1.65;
    if (this.streak > this.maxStreak) this.maxStreak = this.streak;
    for (const [n, phrase] of STREAKS) {
      if (this.streak === n) {
        this.fx.say(x, y - 48, phrase, '#fff3b0', 1.45);
        this.comboPop = 1.35;
        this.cam.hit(0.32);
        this.hitstop = Math.max(this.hitstop, n >= 18 ? 0.14 : 0.07);
        this.audio.combo();
        this.audio.voice(n >= 18 ? 'comboBig' : 'combo', n >= 28);
        this.shock(x, y);
        if (n >= 20) this.feverLife = Math.max(this.feverLife, 5.5);
      }
    }
  }

  private kill(e: Enemy, phrase: string): void {
    e.hp = 0;
    this.kills += 1;
    let pay = e.reward;
    if (this.donationDrive > 0) pay *= 2;
    if (this.streak >= 5) pay = Math.round(pay * (1 + Math.min(1.8, Math.floor(this.streak / 5) * 0.16)));
    this.credit(pay);
    this.bumpStreak(e.x, e.y);
    if (e.boss) {
      this.fx.patriotic(e.x, e.y - e.z, 2.4);
      this.fx.say(e.x, e.y - 30, 'COUNSEL DISMISSED', '#fff3b0', 1.55);
      this.cam.bang();
      this.hitstop = Math.max(this.hitstop, 0.22);
      this.shock(e.x, e.y);
      this.credit(80);
    } else if (e.kind === 'bureaucrat' || e.elite) {
      this.fx.patriotic(e.x, e.y - e.z, e.elite ? 1.45 : 1.2);
      this.fx.say(e.x, e.y - 24, phrase, '#fff3b0', 1.2);
      if (e.elite) this.hitstop = Math.max(this.hitstop, 0.07);
    } else if (e.kind === 'lobbyist') {
      this.fx.spawn(e.x, e.y - e.z, 16, ['#e6c35c', '#fff3b0', '#1a4fa8'], 110, 'coin', 4.5);
      this.fx.say(e.x, e.y - 24, phrase, '#e6c35c', 1.15);
    } else {
      this.fx.spawn(e.x, e.y - e.z, 12, ['#fff3b0', '#c8102e', '#1a4fa8'], 100, 'spark', 2.6);
    }
    this.fx.say(e.x + 6, e.y - 36, `+$${pay}`, '#9dffb0', 0.95);
    this.audio.death();
    if (e.boss) this.audio.voice('killBoss', true);
    else if (e.elite && Math.random() < 0.45) this.audio.voice('killElite');
    else if (e.kind === 'drone' && Math.random() < 0.14) this.audio.voice('killDrone');
    else if (e.kind === 'bureaucrat' && Math.random() < 0.18) this.audio.voice('killBureau');
    else if (e.kind === 'lobbyist' && Math.random() < 0.2) this.audio.voice('killLobby');
    else if (Math.random() < 0.07) this.audio.voice('kill');
    if (e.splitter) {
      this.fx.say(e.x, e.y - 10, 'MARGIN OF ERROR', '#ffb38a', 1.05);
      this.spawnEnemy('alien', { splitter: false, elite: false, dist: Math.max(0, e.dist - 18), route: e.route });
      this.spawnEnemy('alien', { splitter: false, elite: false, dist: e.dist + 8, route: e.route });
    }
  }

  private damage(e: Enemy, amt: number, label?: string, color = '#fff3b0'): void {
    const mul = this.primeTime > 0 ? 1.32 : 1;
    e.hp -= amt * mul;
    e.flash = 0.12;
    if (label) this.fx.say(e.x + (Math.random() * 16 - 8), e.y - 16 - e.z, label, color, amt > 40 ? 1.25 : 0.9);
    if (e.hp <= 0) this.kill(e, pick(KILLS[e.kind] ?? KILLS.alien));
  }

  private aoe(x: number, y: number, radius: number, dmg: number): void {
    let tagged = false;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (!e.flying && this.map.inTunnel(e.x, e.y)) continue;
      if (dist(e.x, e.y, x, y) <= radius + e.radius) {
        // One splash callout max — labeling every hit floods the screen.
        const label = !tagged ? pick(BIG) : undefined;
        if (label) tagged = true;
        this.damage(e, dmg, label, '#e6c35c');
      }
    }
  }

  private target(t: Tower, range: number, flyingOk: boolean): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = -1;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (!flyingOk && e.flying) continue;
      if (!e.flying && this.map.inTunnel(e.x, e.y)) continue;
      if (dist(t.x, t.y, e.x, e.y) > range + e.radius) continue;
      if (e.dist > bestDist) {
        bestDist = e.dist;
        best = e;
      }
    }
    return best;
  }

  private fireTruth(t: Tower, e: Enemy): void {
    t.angle = Math.atan2(e.y - t.y, e.x - t.x);
    this.beams.push({ x0: t.x, y0: t.y - 18, x1: e.x, y1: e.y - e.z, life: 0.09 });
    const st = towerStats('truth', t.tier);
    const crit = Math.random() < 0.12;
    const dmg = crit ? Math.round(st.damage * 2.6) : st.damage;
    this.damage(
      e,
      dmg,
      crit || Math.random() < 0.22 ? (crit ? 'FACT!' : Math.random() < 0.5 ? pick(HITS) : 'FACT!') : undefined,
      crit ? '#fff3b0' : '#3cf0ff',
    );
    this.fx.spawn(e.x, e.y - e.z, crit ? 10 : 4, ['#3cf0ff', '#ffffff'], crit ? 130 : 70, 'spark', crit ? 3.4 : 2);
    this.audio.truth();
    if (t.tier >= 2) {
      const hit = new Set<number>([e.id]);
      let from = e;
      for (let i = 0; i < 2; i++) {
        const hop = this.chainTarget(t, from, 96, hit);
        if (!hop) break;
        hit.add(hop.id);
        this.beams.push({ x0: from.x, y0: from.y - from.z, x1: hop.x, y1: hop.y - hop.z, life: 0.09 });
        this.damage(
          hop,
          Math.round(st.damage * (i === 0 ? 0.66 : 0.44)),
          Math.random() < 0.4 ? 'CHAIN FACT!' : undefined,
          '#7ef0ff',
        );
        this.fx.spawn(hop.x, hop.y - hop.z, 6, ['#3cf0ff', '#fff'], 90, 'spark', 2.2);
        from = hop;
      }
    }
  }

  private chainTarget(t: Tower, skip: Enemy, extra: number, ignore?: Set<number>): Enemy | null {
    const range = towerStats('truth', t.tier).range * CELL + extra;
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      if (e.id === skip.id || e.hp <= 0) continue;
      if (ignore?.has(e.id)) continue;
      if (!e.flying && this.map.inTunnel(e.x, e.y)) continue;
      const d = dist(skip.x, skip.y, e.x, e.y);
      if (d > 92) continue;
      if (dist(t.x, t.y, e.x, e.y) > range + e.radius) continue;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  private fireTreb(t: Tower, e: Enemy): void {
    t.angle = Math.atan2(e.y - t.y, e.x - t.x);
    const lead = e.speed * 0.55;
    const pred = this.map.sample(Math.min(this.map.routeLength(e.route), e.dist + lead), e.route);
    const st = towerStats('trebuchet', t.tier);
    this.boulders.push({
      kind: 'boulder',
      x: t.x,
      y: t.y,
      z: 18,
      sx: t.x,
      sy: t.y,
      tx: pred.x,
      ty: pred.y,
      t: 0,
      dur: 0.72,
      dmg: st.damage,
      aoe: st.aoe * CELL,
    });
    this.audio.trebShoot();
    if (t.tier >= 2) {
      this.puddles.push({
        x: pred.x,
        y: pred.y,
        r: st.aoe * CELL * 0.72,
        life: 1.15,
        max: 1.15,
        dps: 38 + t.tier * 10,
      });
    }
  }

  private brickPending(c: number, r: number): boolean {
    return this.bricks.some((b) => b.tc === c && b.tr === r);
  }

  private fireBrick(t: Tower, e: Enemy, want = 1): boolean {
    const here = this.map.cellOf(e.x, e.y);
    let i = this.map.pathIndex[this.map.idx(here.c, here.r)];
    if (i < 0) {
      const near = this.map.nearestPathCell(e.x, e.y);
      if (!near) return false;
      i = near.i;
    }
    const mid = this.map.center(here.c, here.r);
    const pastMid =
      Math.hypot(e.x - mid.x, e.y - mid.y) < CELL * 0.2 || e.dist >= this.map.distAtCell(here.c, here.r);
    let start = pastMid ? i + 1 : i;
    let placed = 0;
    for (let k = start; k < this.map.pathCells.length; k++) {
      const cell = this.map.pathCells[k]!;
      const c = cell[0];
      const r = cell[1];
      if (this.map.isHouse(c, r) || this.wallAt(c, r) || this.brickPending(c, r)) continue;
      const p = this.map.center(c, r);
      t.angle = Math.atan2(p.y - t.y, p.x - t.x);
      const st = towerStats('brick', t.tier);
      this.bricks.push({
        kind: 'brick',
        x: t.x,
        y: t.y,
        z: 16,
        sx: t.x,
        sy: t.y,
        tx: p.x,
        ty: p.y,
        tc: c,
        tr: r,
        t: 0,
        dur: 0.55 + placed * 0.08,
        life: st.wallLife,
        hp: st.wallHp,
      });
      this.audio.brick();
      placed += 1;
      if (placed >= want) return true;
    }
    return placed > 0;
  }

  private dropWall(c: number, r: number, life: number, hp: number): void {
    const existing = this.wallAt(c, r);
    const p = this.map.center(c, r);
    if (existing) {
      existing.life = Math.max(existing.life, life);
      existing.hp = Math.max(existing.hp, hp);
      existing.maxHp = Math.max(existing.maxHp, hp);
      existing.maxLife = Math.max(existing.maxLife, life);
      return;
    }
    this.walls.push({
      c,
      r,
      x: p.x,
      y: p.y,
      hp,
      maxHp: hp,
      life,
      maxLife: life,
    });
    this.fx.spawn(p.x, p.y, 14, ['#c46a48', '#e8c9b0'], 70, 'spark', 4);
    this.fx.say(p.x, p.y - 20, 'THE WALL!', '#f0b27a', 1.1);
  }

  private deskSlow(e: Enemy): number {
    let s = 1;
    for (const d of this.towers) {
      if (d.kind !== 'desk' || d.tier < 2) continue;
      const range = towerStats('desk', d.tier).range * CELL;
      if (dist(e.x, e.y, d.x, d.y) <= range) s = Math.min(s, 0.82);
    }
    return s;
  }

  update(dt: number): void {
    if (this.lost || this.won) return;
    if (this.hitstop > 0) {
      this.hitstop = Math.max(0, this.hitstop - dt);
      dt *= 0.06;
    } else {
      dt *= this.speed;
    }
    const tdt = dt;
    this.time += tdt;
    this.playTime += tdt;
    this.announcing = Math.max(0, this.announcing - tdt);
    this.leaking = Math.max(0, this.leaking - tdt);
    this.eventLife = Math.max(0, this.eventLife - tdt);
    this.tweetStorm = Math.max(0, this.tweetStorm - tdt);
    this.donationDrive = Math.max(0, this.donationDrive - tdt);
    this.blackout = Math.max(0, this.blackout - tdt);
    this.witchHunt = Math.max(0, this.witchHunt - tdt);
    this.comboPop = Math.max(0, this.comboPop - tdt);
    this.freeze = Math.max(0, this.freeze - tdt);
    this.primeTime = Math.max(0, this.primeTime - tdt);
    this.coffee = Math.max(0, this.coffee - tdt);
    this.feverLife = Math.max(0, this.feverLife - tdt);
    this.streakT -= tdt;
    if (this.streakT <= 0 && this.streak > 0) this.streak = 0;
    for (const s of this.shockwaves) s.life -= tdt;
    this.shockwaves = this.shockwaves.filter((s) => s.life > 0);

    if (!this.waveQueue.length && !this.enemies.length) {
      if (this.wave >= MAX_WAVES) {
        this.won = true;
        this.banner = this.map.def.victory;
        this.audio.victory(this.leakCount <= 2 && this.approval >= this.diff.startApproval * 0.82);
        const keep = houseOrigin(this.map.def);
        this.fx.patriotic(keep.x + keep.w * 0.5, keep.y + keep.h * 0.45, 2.2);
        return;
      }
      if (this.wave > 0 && this.between === 0) {
        this.announcing = 1.6;
        const base = 25 + this.wave * 8;
        const approvalBonus = Math.round(this.approval * 0.12);
        let extra = 0;
        if (this.leakedThisWave === 0) {
          extra = 30 + this.wave * 6;
          this.perfectWaves += 1;
          this.banner = 'PERFECT WAVE — RATINGS THROUGH THE ROOF';
          this.fx.say(WORLD_W / 2, WORLD_H / 2 - 18, 'PERFECT RATINGS', '#fff3b0', 1.45);
          this.audio.voice('perfect');
        } else {
          this.banner = 'WAVE CLEARED — RATINGS UP';
        }
        this.credit(base + approvalBonus + extra);
        this.fx.patriotic(WORLD_W / 2, WORLD_H / 2, extra ? 2 : 1.6);
        this.audio.wave();
        this.fx.say(WORLD_W / 2, WORLD_H / 2 - 44, `+$${base + approvalBonus + extra}`, '#e6c35c', 1.3);
      }
      this.between += tdt;
      if (this.autoWaves && this.between >= 2.4 && this.wave >= 1) this.startNextWave();
    }

    this.spawnWait -= this.coffee > 0 ? tdt * 0.18 : tdt;
    while (this.waveQueue.length && this.spawnWait <= 0) {
      const item = this.waveQueue.shift()!;
      this.spawnEnemy(item.kind);
      this.spawnWait = item.delay;
    }

    for (const w of this.walls) w.life -= tdt;

    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.flash = Math.max(0, e.flash - tdt);
      e.bob += tdt * (e.flying ? 8 : 5);
      let speed = e.speed;
      if (e.kind === 'drone' && this.blackout > 0) speed *= 0.55;
      if (e.kind === 'bureaucrat' && this.witchHunt > 0) speed *= 1.32;
      speed *= this.deskSlow(e);
      if (this.freeze > 0) speed *= 0.05;
      else if (this.coffee > 0) speed *= 0.38;
      if (!e.flying) {
        const cell = this.map.cellOf(e.x, e.y);
        const wall = this.wallAt(cell.c, cell.r);
        if (wall) {
          speed = 0;
          wall.hp -= (e.kind === 'bureaucrat' ? 28 : e.kind === 'lobbyist' ? 16 : 10) * tdt;
          if (wall.hp <= 0) wall.life = 0;
        } else {
          for (const o of this.enemies) {
            if (o.id === e.id || o.hp <= 0 || o.flying) continue;
            if (o.dist > e.dist && o.dist - e.dist < 26) speed = Math.min(speed, o.speed * 0.4);
          }
        }
      }
      e.dist += speed * tdt;
      if (e.dist >= this.map.routeLength(e.route)) {
        this.approval = Math.max(0, this.approval - e.leak);
        this.leaking = 0.55;
        this.leakCount += 1;
        this.leakedThisWave += 1;
        this.streak = 0;
        this.streakT = 0;
        this.cam.sting();
        this.audio.leak();
        this.fx.say(e.x, e.y - 30, `-${e.leak}% APPROVAL`, '#ff6b6b', 1.2);
        e.hp = 0;
        if (this.approval <= 0) {
          this.lost = true;
          this.banner = this.map.def.defeat;
          this.audio.defeat();
        }
        continue;
      }
      const s = this.map.sample(e.dist, e.route);
      e.x = s.x;
      e.y = s.y;
      e.angle = s.angle;
    }

    for (const e of this.enemies) {
      if (e.hp <= 0 || e.kind !== 'lobbyist') continue;
      for (const o of this.enemies) {
        if (o.id === e.id || o.hp <= 0 || o.flying) continue;
        if (dist(e.x, e.y, o.x, o.y) <= 54) {
          o.hp = Math.min(o.maxHp, o.hp + 16 * tdt);
        }
      }
    }

    for (const p of this.puddles) {
      p.life -= tdt;
      if (p.life <= 0) continue;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        if (!e.flying && this.map.inTunnel(e.x, e.y)) continue;
        if (dist(e.x, e.y, p.x, p.y) <= p.r + e.radius) {
          e.hp -= p.dps * tdt;
          if (e.hp <= 0) this.kill(e, pick(KILLS[e.kind] ?? KILLS.alien));
        }
      }
    }
    this.puddles = this.puddles.filter((p) => p.life > 0);

    this.enemies = this.enemies.filter((e) => e.hp > 0);

    let near = 0;
    for (const e of this.enemies) {
      const left = this.map.routeLength(e.route) - e.dist;
      if (left < 180) near = Math.max(near, 1 - left / 180);
    }
    this.danger = near;
    if (this.danger > 0.42) {
      this.sirenT -= tdt;
      if (this.sirenT <= 0) {
        this.audio.siren();
        this.sirenT = 1.25;
      }
    } else {
      this.sirenT = 0;
    }
    for (const w of this.walls) {
      if (w.life > 0 && w.hp > 0) continue;
      this.fx.boom(w.x, w.y);
      this.fx.spawn(w.x, w.y, 18, ['#c46a48', '#e8c9b0', '#e6c35c'], 110, 'spark', 5);
      this.fx.say(w.x, w.y - 18, 'WALL DOWN', '#ffb38a', 1.05);
      this.audio.hit();
      this.audio.brick();
      this.cam.hit(0.4);
    }
    this.walls = this.walls.filter((w) => w.life > 0 && w.hp > 0);

    for (const t of this.towers) {
      t.age += tdt;
      t.cooldown = Math.max(0, t.cooldown - tdt);
      t.specialCd = Math.max(0, t.specialCd - tdt);
      if (t.kind === 'desk') continue;
      if (t.cooldown > 0) continue;
      const st = towerStats(t.kind, t.tier);
      const range = st.range * CELL;
      if (t.kind === 'truth') {
        const e = this.target(t, range, true);
        if (!e) continue;
        this.fireTruth(t, e);
        t.cooldown = 1 / (st.fireRate * this.buffMult(t));
      } else if (t.kind === 'trebuchet') {
        const e = this.target(t, range, true);
        if (!e) continue;
        this.fireTreb(t, e);
        t.cooldown = 1 / (st.fireRate * this.buffMult(t));
      } else if (t.kind === 'brick') {
        const e = this.target(t, range, false);
        if (!e) continue;
        if (this.fireBrick(t, e, t.tier >= 2 ? 2 : 1)) t.cooldown = 1 / (st.fireRate * this.buffMult(t));
      }
    }

    for (const b of this.boulders) {
      b.t += tdt;
      const u = Math.min(1, b.t / b.dur);
      b.x = b.sx + (b.tx - b.sx) * u;
      b.y = b.sy + (b.ty - b.sy) * u;
      b.z = 18 + Math.sin(u * Math.PI) * 86;
      if (u >= 1) {
        this.aoe(b.tx, b.ty, b.aoe, b.dmg);
        this.fx.boom(b.tx, b.ty);
        this.cam.hit(0.3);
        this.cam.flash = Math.max(this.cam.flash, 0.16);
        this.audio.boom();
        b.t = 99;
      }
    }
    this.boulders = this.boulders.filter((b) => b.t < 90);

    for (const b of this.bricks) {
      b.t += tdt;
      const u = Math.min(1, b.t / b.dur);
      b.x = b.sx + (b.tx - b.sx) * u;
      b.y = b.sy + (b.ty - b.sy) * u;
      b.z = 16 + Math.sin(u * Math.PI) * 54;
      if (u >= 1) {
        this.dropWall(b.tc, b.tr, b.life, b.hp);
        b.t = 99;
      }
    }
    this.bricks = this.bricks.filter((b) => b.t < 90);

    for (const beam of this.beams) beam.life -= tdt;
    this.beams = this.beams.filter((b) => b.life > 0);
  }

  waveReady(): boolean {
    return !this.lost && !this.won && this.wave < MAX_WAVES && !this.waveQueue.length && !this.enemies.length;
  }
}
