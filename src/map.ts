import { CELL, COLS, ROWS } from './types.ts';
import { MAPS, type MapDef, type MapId } from './campaign.ts';
import { MAP_RAILS } from './rails.ts';

export type PathSample = { x: number; y: number; angle: number; t: number };

function cellCenter(c: number, r: number): { x: number; y: number } {
  return { x: (c + 0.5) * CELL, y: (r + 0.5) * CELL };
}

function chamfer(points: { x: number; y: number }[], radius: number): { x: number; y: number }[] {
  if (points.length < 3) return points.slice();
  const out: { x: number; y: number }[] = [points[0]!];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const cur = points[i]!;
    const next = points[i + 1]!;
    const d1 = Math.hypot(cur.x - prev.x, cur.y - prev.y) || 1;
    const d2 = Math.hypot(next.x - cur.x, next.y - cur.y) || 1;
    const r = Math.min(radius, d1 * 0.45, d2 * 0.45);
    const a1x = cur.x + ((prev.x - cur.x) / d1) * r;
    const a1y = cur.y + ((prev.y - cur.y) / d1) * r;
    const a2x = cur.x + ((next.x - cur.x) / d2) * r;
    const a2y = cur.y + ((next.y - cur.y) / d2) * r;
    const steps = 7;
    out.push({ x: a1x, y: a1y });
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      const omt = 1 - t;
      out.push({
        x: omt * omt * a1x + 2 * omt * t * cur.x + t * t * a2x,
        y: omt * omt * a1y + 2 * omt * t * cur.y + t * t * a2y,
      });
    }
    out.push({ x: a2x, y: a2y });
  }
  out.push(points[points.length - 1]!);
  return out;
}

function densify(points: { x: number; y: number }[], spacing: number): PathSample[] {
  const samples: PathSample[] = [];
  let distAcc = 0;
  samples.push({ x: points[0]!.x, y: points[0]!.y, angle: 0, t: 0 });
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(seg / spacing));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      distAcc += seg / n;
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      samples.push({ x, y, angle, t: distAcc });
    }
  }
  return samples;
}

export class GameMap {
  readonly def: MapDef;
  readonly pathIndex: Int16Array;
  readonly blocked: Uint8Array;
  readonly samples: PathSample[];
  readonly length: number;
  readonly pathCells: readonly [number, number][];
  readonly whiteHouse: readonly [number, number][];

  constructor(id: MapId = 'lawn') {
    this.def = MAPS[id];
    const rails = MAP_RAILS[id];
    this.pathCells = (rails?.cells ?? this.def.path).map(([c, r]) => [c, r] as [number, number]);
    this.whiteHouse = this.def.house;
    this.pathIndex = new Int16Array(COLS * ROWS);
    this.pathIndex.fill(-1);
    this.pathCells.forEach(([c, r], i) => {
      this.pathIndex[r * COLS + c] = i;
    });
    this.blocked = new Uint8Array(COLS * ROWS);
    for (const [c, r] of this.whiteHouse) this.blocked[r * COLS + c] = 1;
    for (const lm of this.def.landmarks) {
      if (!this.inBounds(lm.c, lm.r)) throw new Error(`Landmark out of bounds: ${id} ${lm.kind} ${lm.c},${lm.r}`);
      const i = this.idx(lm.c, lm.r);
      if (this.pathIndex[i] >= 0) throw new Error(`Landmark on path: ${id} ${lm.kind} ${lm.c},${lm.r}`);
      if (this.blocked[i] === 1) throw new Error(`Landmark on house: ${id} ${lm.kind} ${lm.c},${lm.r}`);
      if (this.blocked[i] === 2) throw new Error(`Landmark overlap: ${id} ${lm.kind} ${lm.c},${lm.r}`);
      this.blocked[i] = 2;
    }
    // Prefer continuous painted-road rail so invaders track the art (no grid stair-steps).
    if (rails?.rail?.length) {
      const pts = rails.rail.map(([x, y]) => ({ x, y }));
      this.samples = densify(pts, 4);
    } else {
      const centers = this.pathCells.map(([c, r]) => cellCenter(c, r));
      this.samples = densify(chamfer(centers, 38), 4);
    }
    this.length = this.samples[this.samples.length - 1]!.t;
    if (!this.verifyPath()) throw new Error(`Path disconnected: ${id}`);
  }

  private verifyPath(): boolean {
    const start = this.pathCells[0]!;
    const goal = this.pathCells[this.pathCells.length - 1]!;
    const open: [number, number][] = [start];
    const seen = new Uint8Array(COLS * ROWS);
    seen[start[1] * COLS + start[0]] = 1;
    const dirs: [number, number][] = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    while (open.length) {
      const [c, r] = open.pop()!;
      if (c === goal[0] && r === goal[1]) return true;
      for (const [dc, dr] of dirs) {
        const nc = c + dc;
        const nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
        if (!this.isPath(nc, nr) || seen[nr * COLS + nc]) continue;
        seen[nr * COLS + nc] = 1;
        open.push([nc, nr]);
      }
    }
    return false;
  }

  idx(c: number, r: number): number {
    return r * COLS + c;
  }

  inBounds(c: number, r: number): boolean {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS;
  }

  isPath(c: number, r: number): boolean {
    return this.inBounds(c, r) && this.pathIndex[this.idx(c, r)] >= 0;
  }

  isHouse(c: number, r: number): boolean {
    return this.inBounds(c, r) && this.blocked[this.idx(c, r)] === 1;
  }

  canPlace(c: number, r: number, occupied: Set<number>): boolean {
    if (!this.inBounds(c, r)) return false;
    if (this.isPath(c, r) || this.blocked[this.idx(c, r)] !== 0) return false;
    return !occupied.has(this.idx(c, r));
  }

  cellOf(x: number, y: number): { c: number; r: number } {
    return { c: Math.floor(x / CELL), r: Math.floor(y / CELL) };
  }

  center(c: number, r: number): { x: number; y: number } {
    return cellCenter(c, r);
  }

  sample(distAlong: number): PathSample {
    const d = Math.max(0, Math.min(this.length, distAlong));
    let lo = 0;
    let hi = this.samples.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.samples[mid]!.t < d) lo = mid + 1;
      else hi = mid;
    }
    const b = this.samples[lo]!;
    const a = this.samples[Math.max(0, lo - 1)]!;
    const span = b.t - a.t || 1;
    const u = (d - a.t) / span;
    return {
      x: a.x + (b.x - a.x) * u,
      y: a.y + (b.y - a.y) * u,
      angle: b.angle,
      t: d,
    };
  }

  nearestPathCell(x: number, y: number): { c: number; r: number; i: number } | null {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < this.pathCells.length; i++) {
      const [c, r] = this.pathCells[i]!;
      const p = cellCenter(c, r);
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best < 0) return null;
    const [c, r] = this.pathCells[best]!;
    return { c, r, i: best };
  }

  distAtCell(c: number, r: number): number {
    if (this.pathIndex[this.idx(c, r)] < 0) return 0;
    const p = cellCenter(c, r);
    let best = this.samples[0]!;
    let bestD = Infinity;
    for (const sm of this.samples) {
      const d = (sm.x - p.x) ** 2 + (sm.y - p.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = sm;
      }
    }
    return best.t;
  }
}
