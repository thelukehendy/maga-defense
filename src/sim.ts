import type { Synth } from './audio.ts';
import type { TraumaCamera } from './engine.ts';
import { dist } from './engine.ts';
import type { FX } from './fx.ts';
import type { GameMap } from './map.ts';
import {
  CELL,
  DESK_BUFF,
  ENEMIES,
  type EnemyId,
  MAX_WAVES,
  SELL_RATIO,
  START_APPROVAL,
  START_DONATIONS,
  TOWERS,
  type TowerId,
  WALL_DURATION,
  WALL_HP,
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
};

export type Beam = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  life: number;
};

export type SpawnItem = { kind: EnemyId; delay: number };

const HITS = ['SAD!', 'WRONG!', 'FAKE!', 'WEAK!'];
const BIG = ['HUGE DAMAGE!', 'TREMENDOUS!', 'TARIFF\'D!', 'BILLION!'];
const KILLS = ['FIRED!', 'DEPORT!', 'GONE!', 'SO SAD!'];

function pick(arr: string[]): string {
  return arr[(Math.random() * arr.length) | 0]!;
}

function waveQueue(wave: number): SpawnItem[] {
  const q: SpawnItem[] = [];
  const push = (kind: EnemyId, n: number, gap: number): void => {
    for (let i = 0; i < n; i++) q.push({ kind, delay: gap });
  };
  switch (wave) {
    case 1:
      push('alien', 8, 0.62);
      break;
    case 2:
      push('alien', 12, 0.5);
      break;
    case 3:
      push('alien', 8, 0.48);
      push('drone', 5, 0.7);
      break;
    case 4:
      push('alien', 10, 0.42);
      push('bureaucrat', 2, 1.4);
      break;
    case 5:
      push('drone', 8, 0.55);
      push('alien', 10, 0.4);
      break;
    case 6:
      push('bureaucrat', 3, 1.2);
      push('alien', 14, 0.36);
      push('drone', 4, 0.6);
      break;
    case 7:
      push('drone', 12, 0.42);
      push('bureaucrat', 3, 1.1);
      break;
    case 8:
      push('alien', 18, 0.28);
      push('drone', 8, 0.4);
      push('bureaucrat', 4, 0.9);
      break;
    case 9:
      push('bureaucrat', 6, 0.85);
      push('drone', 10, 0.38);
      break;
    case 10:
      push('alien', 22, 0.24);
      push('drone', 12, 0.32);
      push('bureaucrat', 5, 0.7);
      break;
    case 11:
      push('drone', 16, 0.28);
      push('bureaucrat', 7, 0.65);
      push('alien', 16, 0.22);
      break;
    default:
      push('alien', 28, 0.18);
      push('drone', 18, 0.22);
      push('bureaucrat', 10, 0.5);
      break;
  }
  return q;
}

function scaledHp(kind: EnemyId, wave: number): number {
  const base = ENEMIES[kind].hp;
  return Math.round(base * Math.pow(1.155, wave - 1));
}

export class Sim {
  donations = START_DONATIONS;
  approval = START_APPROVAL;
  wave = 0;
  speed = 1;
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
  readonly map: GameMap;
  readonly fx: FX;
  readonly cam: TraumaCamera;
  readonly audio: Synth;

  constructor(map: GameMap, fx: FX, cam: TraumaCamera, audio: Synth) {
    this.map = map;
    this.fx = fx;
    this.cam = cam;
    this.audio = audio;
  }

  reset(): void {
    this.donations = START_DONATIONS;
    this.approval = START_APPROVAL;
    this.wave = 0;
    this.speed = 1;
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
  }

  startNextWave(): void {
    if (this.lost || this.won) return;
    if (this.wave >= MAX_WAVES) return;
    if (this.waveQueue.length || this.enemies.length) return;
    this.wave += 1;
    this.waveQueue = waveQueue(this.wave);
    this.spawnWait = 0.35;
    this.between = 0;
    this.announcing = 2.1;
    this.banner = `WAVE ${this.wave} — TREMENDOUS`;
    this.audio.wave();
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

  private buffMult(t: Tower): number {
    let m = 1;
    for (const d of this.towers) {
      if (d.kind !== 'desk') continue;
      const range = TOWERS.desk.range * CELL;
      if (dist(t.x, t.y, d.x, d.y) <= range) m = Math.max(m, DESK_BUFF);
    }
    return m;
  }

  private wallAt(c: number, r: number): Wall | undefined {
    return this.walls.find((w) => w.c === c && w.r === r);
  }

  private spawnEnemy(kind: EnemyId): void {
    const def = ENEMIES[kind];
    const hp = scaledHp(kind, this.wave);
    const s = this.map.sample(0);
    this.enemies.push({
      id: this.nextId++,
      kind,
      hp,
      maxHp: hp,
      dist: 0,
      speed: def.speed,
      flying: def.flying,
      reward: def.reward + Math.floor(this.wave * 1.2),
      leak: def.leak,
      radius: def.radius,
      flash: 0,
      bob: Math.random() * Math.PI * 2,
      x: s.x,
      y: s.y,
      angle: s.angle,
      z: def.flying ? 22 : 0,
    });
  }

  private kill(e: Enemy, phrase: string): void {
    e.hp = 0;
    this.donations += e.reward;
    this.fx.patriotic(e.x, e.y - e.z, e.kind === 'bureaucrat' ? 1.4 : 1);
    this.fx.say(e.x, e.y - 24, phrase, '#fff3b0', 1.15);
    this.fx.say(e.x + 10, e.y - 40, `+$${e.reward}`, '#9dffb0', 0.9);
    this.audio.death();
  }

  private damage(e: Enemy, amt: number, label?: string, color = '#fff3b0'): void {
    e.hp -= amt;
    e.flash = 0.12;
    if (label) this.fx.say(e.x + (Math.random() * 16 - 8), e.y - 16 - e.z, label, color, amt > 40 ? 1.2 : 0.85);
    if (e.hp <= 0) this.kill(e, pick(KILLS));
  }

  private aoe(x: number, y: number, radius: number, dmg: number): void {
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (dist(e.x, e.y, x, y) <= radius + e.radius) {
        this.damage(e, dmg, pick(BIG), '#e6c35c');
      }
    }
  }

  private target(t: Tower, range: number, flyingOk: boolean): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = -1;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (!flyingOk && e.flying) continue;
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
    this.damage(
      e,
      TOWERS.truth.damage,
      Math.random() < 0.18 ? (Math.random() < 0.5 ? pick(HITS) : 'FACT!') : undefined,
      '#3cf0ff',
    );
    this.fx.spawn(e.x, e.y - e.z, 4, ['#3cf0ff', '#ffffff'], 70, 'spark', 2);
    this.audio.truth();
  }

  private fireTreb(t: Tower, e: Enemy): void {
    t.angle = Math.atan2(e.y - t.y, e.x - t.x);
    const lead = e.speed * 0.55;
    const pred = this.map.sample(Math.min(this.map.length, e.dist + lead));
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
      dmg: TOWERS.trebuchet.damage,
      aoe: TOWERS.trebuchet.aoe * CELL,
    });
    this.audio.trebShoot();
  }

  private fireBrick(t: Tower, e: Enemy): boolean {
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
    for (let k = start; k < this.map.pathCells.length; k++) {
      const cell = this.map.pathCells[k]!;
      const c = cell[0];
      const r = cell[1];
      if (this.map.isHouse(c, r) || this.wallAt(c, r)) continue;
      const p = this.map.center(c, r);
      t.angle = Math.atan2(p.y - t.y, p.x - t.x);
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
        dur: 0.55,
      });
      this.audio.brick();
      return true;
    }
    return false;
  }

  private dropWall(c: number, r: number): void {
    const existing = this.wallAt(c, r);
    const p = this.map.center(c, r);
    if (existing) {
      existing.life = WALL_DURATION;
      existing.hp = WALL_HP;
      return;
    }
    this.walls.push({
      c,
      r,
      x: p.x,
      y: p.y,
      hp: WALL_HP,
      maxHp: WALL_HP,
      life: WALL_DURATION,
      maxLife: WALL_DURATION,
    });
    this.fx.spawn(p.x, p.y, 14, ['#c46a48', '#e8c9b0'], 70, 'spark', 4);
    this.fx.say(p.x, p.y - 20, 'THE WALL!', '#f0b27a', 1.1);
  }

  update(dt: number): void {
    if (this.lost || this.won) return;
    const tdt = dt * this.speed;
    this.time += tdt;
    this.announcing = Math.max(0, this.announcing - tdt);
    this.leaking = Math.max(0, this.leaking - tdt);

    if (!this.waveQueue.length && !this.enemies.length) {
      if (this.wave >= MAX_WAVES) {
        this.won = true;
        this.banner = 'TREMENDOUS VICTORY';
        this.audio.victory();
        this.fx.patriotic(this.map.center(14, 8).x, this.map.center(14, 8).y, 2.2);
        return;
      }
      if (this.wave > 0 && this.between === 0) {
        this.announcing = 1.4;
        this.banner = 'WAVE CLEARED — RATINGS UP';
        this.fx.patriotic(WORLD_W / 2, WORLD_H / 2, 1.6);
        this.audio.wave();
        this.donations += 25 + this.wave * 8;
        this.fx.say(WORLD_W / 2, WORLD_H / 2 - 40, 'BONUS DONATIONS', '#e6c35c', 1.3);
      }
      this.between += tdt;
      if (this.between >= 6.5 && this.wave >= 1) this.startNextWave();
    }

    this.spawnWait -= tdt;
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
      if (!e.flying) {
        const cell = this.map.cellOf(e.x, e.y);
        const wall = this.wallAt(cell.c, cell.r);
        if (wall) {
          speed = 0;
          wall.hp -= (e.kind === 'bureaucrat' ? 28 : 10) * tdt;
          if (wall.hp <= 0) wall.life = 0;
        } else {
          for (const o of this.enemies) {
            if (o.id === e.id || o.hp <= 0 || o.flying) continue;
            if (o.dist > e.dist && o.dist - e.dist < 26) speed = Math.min(speed, o.speed * 0.4);
          }
        }
      }
      e.dist += speed * tdt;
      if (e.dist >= this.map.length) {
        this.approval = Math.max(0, this.approval - e.leak);
        this.leaking = 0.55;
        this.cam.sting();
        this.audio.leak();
        this.fx.say(e.x, e.y - 30, `-${e.leak}% APPROVAL`, '#ff6b6b', 1.2);
        e.hp = 0;
        if (this.approval <= 0) {
          this.lost = true;
          this.banner = "YOU'RE FIRED";
          this.audio.defeat();
        }
        continue;
      }
      const s = this.map.sample(e.dist);
      e.x = s.x;
      e.y = s.y;
      e.angle = s.angle;
    }

    this.enemies = this.enemies.filter((e) => e.hp > 0);
    for (const w of this.walls) {
      if (w.life > 0 && w.hp > 0) continue;
      this.fx.boom(w.x, w.y);
      this.fx.spawn(w.x, w.y, 18, ['#c46a48', '#e8c9b0', '#e6c35c'], 110, 'spark', 5);
      this.fx.say(w.x, w.y - 18, 'WALL DOWN', '#ffb38a', 1.05);
      this.audio.hit();
      this.audio.brick();
      this.cam.hit(0.24);
    }
    this.walls = this.walls.filter((w) => w.life > 0 && w.hp > 0);

    for (const t of this.towers) {
      t.age += tdt;
      t.cooldown = Math.max(0, t.cooldown - tdt);
      if (t.kind === 'desk') continue;
      if (t.cooldown > 0) continue;
      const def = TOWERS[t.kind];
      const range = def.range * CELL;
      if (t.kind === 'truth') {
        const e = this.target(t, range, true);
        if (!e) continue;
        this.fireTruth(t, e);
        t.cooldown = 1 / (def.fireRate * this.buffMult(t));
      } else if (t.kind === 'trebuchet') {
        const e = this.target(t, range, true);
        if (!e) continue;
        this.fireTreb(t, e);
        t.cooldown = 1 / (def.fireRate * this.buffMult(t));
      } else if (t.kind === 'brick') {
        const e = this.target(t, range, false);
        if (!e) continue;
        if (this.fireBrick(t, e)) t.cooldown = 1 / (def.fireRate * this.buffMult(t));
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
        this.cam.bang();
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
        this.dropWall(b.tc, b.tr);
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
