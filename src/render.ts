import { easeOutBack, seeded } from './engine.ts';
import { star } from './fx.ts';
import type { FX } from './fx.ts';
import { drawEnemyArt, drawKeep, drawKeepLeak, drawLandmarkArt, drawTowerArt } from './art.ts';
import { houseOrigin, MAX_TIER, TICKER, towerStats, type Theme } from './campaign.ts';
import type { GameMap } from './map.ts';
import type { Enemy, Sim, Tower, Wall } from './sim.ts';
import { CELL, COLS, ROWS, TOWERS, WORLD_H, WORLD_W } from './types.ts';

function hexRgb(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 3) {
    return [
      parseInt(h[0]! + h[0]!, 16),
      parseInt(h[1]! + h[1]!, 16),
      parseInt(h[2]! + h[2]!, 16),
    ];
  }
  const n = parseInt(h.slice(0, 6), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(a: string, b: string, t: number): string {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const m = (x: number, y: number): number => Math.round(x + (y - x) * t);
  return `rgb(${m(pa[0], pb[0])},${m(pa[1], pb[1])},${m(pa[2], pb[2])})`;
}

function ridgeY(x: number, seed: number, base: number, amp: number): number {
  return (
    base +
    Math.sin(x * 0.011 + seed) * amp +
    Math.sin(x * 0.028 + seed * 1.7) * amp * 0.42 +
    (seeded(seed * 11 + x * 0.19) - 0.5) * 6
  );
}

export class Renderer {
  private bg: HTMLCanvasElement;
  private bgx: CanvasRenderingContext2D;
  private map: GameMap;
  private art: HTMLImageElement | null = null;
  private readonly artCache = new Map<string, HTMLImageElement>();

  constructor(map: GameMap) {
    this.map = map;
    const off = document.createElement('canvas');
    off.width = WORLD_W;
    off.height = WORLD_H;
    this.bg = off;
    this.bgx = off.getContext('2d')!;
    this.bake();
    void this.ensureArt(map.def.art);
  }

  /** Preload all map art so swaps are instant. */
  preloadArts(urls: string[]): void {
    for (const url of urls) void this.ensureArt(url);
  }

  resize(dpr: number, scale: number): void {
    const mul = Math.max(1, dpr * scale);
    this.bg.width = Math.ceil(WORLD_W * mul);
    this.bg.height = Math.ceil(WORLD_H * mul);
    this.bgx.setTransform(mul, 0, 0, mul, 0, 0);
    this.bake();
  }

  setMap(map: GameMap, dpr: number, scale: number): void {
    this.map = map;
    // Bake immediately (cached art or procedural), then re-bake when fetch completes.
    const pending = this.ensureArt(map.def.art);
    this.resize(dpr, scale);
    void pending.then(() => {
      if (this.map === map) this.resize(dpr, scale);
    });
  }

  private ensureArt(url: string | undefined): Promise<void> {
    if (!url) {
      this.art = null;
      return Promise.resolve();
    }
    const cached = this.artCache.get(url);
    if (cached?.complete && cached.naturalWidth > 0) {
      this.art = cached;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const img = cached ?? new Image();
      img.decoding = 'async';
      const done = (): void => {
        this.artCache.set(url, img);
        if (this.map.def.art === url) {
          this.art = img;
          this.bake();
        }
        resolve();
      };
      img.onload = done;
      img.onerror = () => {
        if (this.map.def.art === url) this.art = null;
        resolve();
      };
      if (!cached) {
        img.src = url;
        this.artCache.set(url, img);
      }
      if (img.complete && img.naturalWidth > 0) done();
    });
  }

  private bake(): void {
    const ctx = this.bgx;
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    const theme = this.map.def.theme;
    const art = this.art;

    if (art && art.complete && art.naturalWidth > 0) {
      // Painted battlefield only — no path/build overlays. Invader rail matches art.
      ctx.drawImage(art, 0, 0, WORLD_W, WORLD_H);
      return;
    }

    this.bakeProcedural(ctx, theme);
  }

  private bakeProcedural(ctx: CanvasRenderingContext2D, theme: Theme): void {
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    sky.addColorStop(0, theme.skyTop);
    sky.addColorStop(0.22, mixHex(theme.skyTop, theme.skyBot, 0.45));
    sky.addColorStop(1, theme.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    this.paintSun(ctx, WORLD_W - 86, 34);
    for (let i = 0; i < 5; i++) {
      const x = 70 + seeded(i * 13.1 + 2) * (WORLD_W - 200);
      const y = 14 + seeded(i * 21.7) * 28;
      const s = 0.65 + seeded(i * 8.3) * 0.75;
      this.cloud(ctx, x, y, s, 0.92);
    }

    const far = mixHex(theme.grass, '#102010', 0.38);
    const mid = mixHex(theme.grass, '#1a2814', 0.22);
    this.fillRidge(ctx, 1.1, 22, 16, far, 86);
    this.paintSkyline(ctx, theme, 58);
    this.fillRidge(ctx, 2.4, 36, 11, mid, 110);

    const field = ctx.createLinearGradient(0, 40, 0, WORLD_H);
    field.addColorStop(0, theme.grassHi);
    field.addColorStop(0.28, theme.grass);
    field.addColorStop(1, mixHex(theme.grass, '#14140c', 0.2));
    this.fillRidge(ctx, 3.2, 48, 10, field, WORLD_H);

    ctx.strokeStyle = mixHex(theme.grass, '#0c180c', 0.42);
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, ridgeY(0, 3.2, 48, 10));
    for (let x = 16; x <= WORLD_W; x += 16) ctx.lineTo(x, ridgeY(x, 3.2, 48, 10));
    ctx.stroke();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.map.isPath(c, r) || this.map.blocked[this.map.idx(c, r)] === 1) continue;
        const x = c * CELL;
        const y = r * CELL;
        const lip = ridgeY(x + CELL * 0.5, 3.2, 48, 10);
        const top = Math.max(y + 3, lip + 1);
        const h = y + CELL - 3 - top;
        if (h < 8) continue;
        const shade = seeded(c * 19 + r * 31);
        ctx.globalAlpha = 0.16 + shade * 0.22;
        ctx.fillStyle = shade > 0.52 ? theme.grassHi : mixHex(theme.grass, '#163018', 0.18);
        ctx.beginPath();
        ctx.roundRect(x + 3, top, CELL - 6, h, 8);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (seeded(c * 5.1 + r * 2.7) > 0.38) this.grassTuft(ctx, theme, x, Math.max(y, lip), c, r);
      }
    }

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#7a0c1c';
    ctx.lineWidth = 48;
    this.strokePath(ctx);
    ctx.strokeStyle = '#c8102e';
    ctx.lineWidth = 38;
    this.strokePath(ctx);
    this.stampBricks(ctx);
    ctx.strokeStyle = 'rgba(255, 252, 245, 0.28)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([7, 11]);
    this.strokePath(ctx);
    ctx.setLineDash([]);

    const start = this.map.sample(0);
    this.drawInBadge(ctx, start.x, start.y);
  }

  private fillRidge(
    ctx: CanvasRenderingContext2D,
    seed: number,
    base: number,
    amp: number,
    fill: string | CanvasGradient,
    bottom: number,
  ): void {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, bottom);
    ctx.lineTo(0, ridgeY(0, seed, base, amp));
    for (let x = 16; x <= WORLD_W; x += 16) ctx.lineTo(x, ridgeY(x, seed, base, amp));
    ctx.lineTo(WORLD_W, bottom);
    ctx.closePath();
    ctx.fill();
  }

  private paintSun(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    ctx.save();
    ctx.strokeStyle = '#ffe566';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.18;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * 22, sy + Math.sin(a) * 22);
      ctx.lineTo(sx + Math.cos(a) * 30, sy + Math.sin(a) * 30);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffe566';
    ctx.beginPath();
    ctx.arc(sx, sy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8b02a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 252, 220, 0.7)';
    ctx.beginPath();
    ctx.ellipse(sx - 4, sy - 4, 6, 4.5, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private paintSkyline(ctx: CanvasRenderingContext2D, theme: Theme, ground: number): void {
    const sil = mixHex(theme.pathEdge, theme.skyTop, 0.28);
    const ox = 28;
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 9; i++) {
      const w = 9 + seeded(i * 6.1) * 12;
      const h = 14 + seeded(i * 9.4) * 28;
      const x = ox + i * 17 + seeded(i * 3.2) * 4;
      const y = ground - h + ridgeY(x, 1.1, 0, 4) * 0.15;
      ctx.fillStyle = sil;
      ctx.fillRect(x, y, w, h);
      if (seeded(i * 4.8) > 0.55) {
        ctx.fillRect(x + w * 0.35, y - 8, 2.2, 8);
      }
      ctx.fillStyle = theme.star;
      ctx.globalAlpha = 0.28;
      const cols = Math.max(1, Math.floor(w / 4));
      const rows = Math.max(1, Math.floor(h / 5));
      for (let wy = 0; wy < rows; wy++) {
        for (let wx = 0; wx < cols; wx++) {
          if (seeded(i * 20 + wy * 3 + wx) < 0.45) continue;
          ctx.fillRect(x + 2 + wx * 4, y + 3 + wy * 5, 1.6, 1.6);
        }
      }
      ctx.globalAlpha = 0.5;
    }
    ctx.restore();
  }

  private cloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, alpha: number): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fffef8';
    ctx.strokeStyle = 'rgba(110, 160, 205, 0.38)';
    ctx.lineWidth = Math.max(1.1, 1.7 * s);
    ctx.beginPath();
    ctx.ellipse(x, y, 22 * s, 13 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 17 * s, y + 3 * s, 14 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 17 * s, y + 4 * s, 13 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 5 * s, y - 8 * s, 12 * s, 10 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 9 * s, y - 6 * s, 11 * s, 9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(x - 6 * s, y - 4 * s, 8 * s, 5 * s, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private grassTuft(ctx: CanvasRenderingContext2D, theme: Theme, x: number, y: number, c: number, r: number): void {
    const n = 2 + Math.floor(seeded(c * 2.2 + r * 8.1) * 3);
    ctx.save();
    ctx.strokeStyle = mixHex(theme.grassHi, '#d8ffc0', 0.2);
    ctx.lineWidth = 1.35;
    ctx.lineCap = 'round';
    for (let k = 0; k < n; k++) {
      const tx = x + 10 + seeded(c * 9 + r + k * 4.1) * (CELL - 20);
      const ty = y + 22 + seeded(c + r * 7 + k) * (CELL - 28);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx - 3, ty - 7, tx - 1, ty - 11);
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + 2, ty - 8, tx + 4, ty - 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  private clipToPath(ctx: CanvasRenderingContext2D, half: number): void {
    const s = this.map.samples;
    ctx.beginPath();
    for (let i = 0; i < s.length; i++) {
      const p = s[i]!;
      const ang = i === 0 && s.length > 1 ? s[1]!.angle : p.angle;
      const nx = -Math.sin(ang) * half;
      const ny = Math.cos(ang) * half;
      if (i === 0) ctx.moveTo(p.x + nx, p.y + ny);
      else ctx.lineTo(p.x + nx, p.y + ny);
    }
    for (let i = s.length - 1; i >= 0; i--) {
      const p = s[i]!;
      const ang = i === 0 && s.length > 1 ? s[1]!.angle : p.angle;
      const nx = Math.sin(ang) * half;
      const ny = -Math.cos(ang) * half;
      ctx.lineTo(p.x + nx, p.y + ny);
    }
    ctx.closePath();
    ctx.clip();
  }

  private stampBricks(ctx: CanvasRenderingContext2D): void {
    const bricks = ['#c8102e', '#e04050', '#a01024', '#f24a58'];
    const bw = 15;
    const bh = 9;
    const gap = 2.2;
    ctx.save();
    this.clipToPath(ctx, 17);
    let next = 0;
    let row = 0;
    for (const s of this.map.samples) {
      if (s.t < next) continue;
      next = s.t + bw + gap;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      for (let lane = -1; lane <= 1; lane++) {
        const ox = ((row + lane + 3) & 1) === 0 ? 0 : 6;
        const by = lane * (bh + gap);
        ctx.fillStyle = bricks[(row * 3 + lane + 4) & 3]!;
        ctx.beginPath();
        ctx.roundRect(ox - bw / 2, by - bh / 2, bw, bh, 1.6);
        ctx.fill();
        ctx.fillStyle = '#ff6a78';
        ctx.fillRect(ox - bw / 2 + 1, by - bh / 2 + 0.5, bw - 2, bh * 0.28);
        ctx.strokeStyle = '#0c1838';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
      row++;
    }
    ctx.restore();
  }

  private drawInBadge(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#e6c35c';
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6a4a10';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff6c8';
    ctx.beginPath();
    ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#e6c35c';
    star(ctx, 0, -5.2, 3.1, 1.25, 5);
    ctx.fill();
    ctx.fillStyle = '#7a3414';
    ctx.font = '800 9px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IN', 0, 3.2);
    ctx.restore();
  }

  private drawAmbient(ctx: CanvasRenderingContext2D, time: number): void {
    for (let i = 0; i < 4; i++) {
      const drift = ((seeded(i * 4.4) * WORLD_W + time * (8 + i * 3)) % (WORLD_W + 140)) - 70;
      const y = 12 + seeded(i * 19.2) * 48;
      const s = 0.55 + seeded(i * 7.1) * 0.5;
      this.cloud(ctx, drift, y, s, 0.28 + seeded(i) * 0.12);
    }
    for (let i = 0; i < 3; i++) {
      const x = seeded(i * 11.3) * WORLD_W;
      const y = 40 + seeded(i * 17.9) * (WORLD_H - 50);
      const tw = 0.25 + Math.abs(Math.sin(time * (1.4 + seeded(i) * 2) + i)) * 0.75;
      ctx.globalAlpha = tw * 0.5;
      ctx.fillStyle = i % 4 === 0 ? '#e6c35c' : '#fff8d6';
      ctx.beginPath();
      ctx.arc(x, y, 1.1 + tw * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(230, 195, 92, 0.7)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([8, 14]);
    ctx.lineDashOffset = -time * 42;
    this.strokePath(ctx);
    ctx.restore();
  }

  private strokePath(ctx: CanvasRenderingContext2D): void {
    const routes = this.map.routes?.length ? this.map.routes : [this.map.samples];
    const colors = ['rgba(0, 255, 90, 0.95)', 'rgba(80, 200, 255, 0.95)'];
    routes.forEach((s, ri) => {
      ctx.strokeStyle = colors[ri % colors.length]!;
      ctx.beginPath();
      ctx.moveTo(s[0]!.x, s[0]!.y);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i]!.x, s[i]!.y);
      ctx.stroke();
    });
    for (const t of this.map.tunnels) {
      ctx.strokeStyle = 'rgba(255, 180, 40, 0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(t.x, t.y, t.w, t.h);
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    sim: Sim,
    fx: FX,
    time: number,
    flash: number,
  ): void {
    ctx.drawImage(this.bg, 0, 0, WORLD_W, WORLD_H);
    // Painted maps already have sky/scenery — skip procedural ambient wash.
    if (!this.art || !this.art.complete || this.art.naturalWidth <= 0) {
      this.drawAmbient(ctx, time);
    } else if (typeof location !== 'undefined' && /(?:^|[?&])debugPath=1(?:&|$)/.test(location.search)) {
      // Dev-only: thin rail so we can lock invaders to painted asphalt.
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(0, 255, 90, 0.95)';
      ctx.lineWidth = 3;
      this.strokePath(ctx);
      ctx.restore();
    }
    // Painted art already includes scenery — only draw landmarks as fallback.
    if (!this.art || !this.art.complete) {
      for (const lm of this.map.def.landmarks) {
        const p = this.map.center(lm.c, lm.r);
        ctx.save();
        ctx.translate(p.x, p.y);
        drawLandmarkArt(ctx, lm.kind, time);
        ctx.restore();
      }
    }
    this.drawHouse(ctx, time, sim.leaking);
    if (sim.hover && sim.placing) this.drawGhost(ctx, sim, sim.hover);
    else if (sim.armed && sim.placing) this.drawGhost(ctx, sim, sim.armed);
    if (sim.selected) this.drawRange(ctx, sim.selected, time, 1);
    for (const t of sim.towers) {
      if (t.kind === 'desk') this.drawRange(ctx, t, time, 0.45);
    }
    for (const w of sim.walls) this.drawWall(ctx, w);
    for (const p of sim.puddles) this.drawPuddle(ctx, p, time);
    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 230, 140, ${flash * 0.35})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    if (sim.leaking > 0) {
      ctx.fillStyle = `rgba(200, 16, 46, ${sim.leaking * 0.22})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    if (sim.approval <= (sim.diff?.startApproval ?? 100) * 0.3) {
      const g = ctx.createRadialGradient(WORLD_W / 2, WORLD_H / 2, WORLD_W * 0.2, WORLD_W / 2, WORLD_H / 2, WORLD_W * 0.72);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(90, 8, 18, 0.28)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    if (sim.tweetStorm > 0 || sim.finalRally > 0 || sim.primeTime > 0) {
      ctx.fillStyle = `rgba(230, 195, 92, ${0.05 + Math.sin(time * 9) * 0.03})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    if (sim.freeze > 0) {
      ctx.fillStyle = `rgba(80, 200, 255, ${0.1 + sim.freeze * 0.04})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    if (sim.coffee > 0) {
      ctx.fillStyle = 'rgba(90, 50, 20, 0.12)';
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    if (sim.feverLife > 0 || sim.streak >= 20) {
      ctx.fillStyle = `rgba(200, 16, 46, ${0.06 + Math.sin(time * 14) * 0.04})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    if (sim.danger > 0.2) {
      const g = ctx.createRadialGradient(WORLD_W / 2, WORLD_H * 0.82, 40, WORLD_W / 2, WORLD_H, WORLD_W * 0.7);
      g.addColorStop(0, `rgba(200, 16, 46, ${sim.danger * 0.28})`);
      g.addColorStop(1, 'rgba(200, 16, 46, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    type Layer = { y: number; draw: () => void };
    const layers: Layer[] = [];
    for (const t of sim.towers) {
      layers.push({ y: t.y, draw: () => this.drawTower(ctx, t, sim, time) });
    }
    for (const e of sim.enemies) {
      if (e.hp <= 0) continue;
      if (!e.flying && this.map.inTunnel(e.x, e.y)) continue;
      layers.push({ y: e.y, draw: () => this.drawEnemy(ctx, e, time) });
    }
    layers.sort((a, b) => a.y - b.y);
    for (const layer of layers) layer.draw();
    for (const b of sim.beams) this.drawBeam(ctx, b);
    for (const b of sim.boulders) this.drawBoulder(ctx, b);
    for (const b of sim.bricks) this.drawBrickShot(ctx, b);
    for (const s of sim.shockwaves) this.drawShock(ctx, s);
    fx.draw(ctx);

    this.drawSpawn(ctx, sim, time);
    this.drawHudChrome(ctx, sim, time);
    this.drawTicker(ctx, time);

    if (sim.announcing > 0) this.drawBanner(ctx, sim);
    if (sim.eventLife > 0.05) this.drawEvent(ctx, sim);
  }

  private bannerAlpha(life: number, hold = 2.2): number {
    const fadeIn = 0.22;
    const fadeOut = 0.4;
    if (life > hold - fadeIn) return Math.max(0, Math.min(1, (hold - life) / fadeIn));
    if (life < fadeOut) return Math.max(0, life / fadeOut);
    return 1;
  }

  private drawBanner(ctx: CanvasRenderingContext2D, sim: Sim): void {
    const a = this.bannerAlpha(sim.announcing, 2.4);
    const y = WORLD_H * 0.36;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(8, 16, 36, 0.72)';
    ctx.beginPath();
    ctx.roundRect(28, y, WORLD_W - 56, 78, 10);
    ctx.fill();
    ctx.strokeStyle = '#e6c35c';
    ctx.lineWidth = 3;
    ctx.stroke();
    const stripe = ctx.createLinearGradient(28, y, WORLD_W - 28, y);
    stripe.addColorStop(0, '#c8102e');
    stripe.addColorStop(0.5, '#e6c35c');
    stripe.addColorStop(1, '#1a4fa8');
    ctx.fillStyle = stripe;
    ctx.fillRect(32, y + 6, WORLD_W - 64, 5);
    ctx.fillRect(32, y + 67, WORLD_W - 64, 5);
    ctx.fillStyle = '#fff6c2';
    ctx.font = '800 20px Impact, Haettenschweiler, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#1a1204';
    ctx.lineWidth = 5;
    ctx.strokeText(sim.banner, WORLD_W / 2, y + 40);
    ctx.fillText(sim.banner, WORLD_W / 2, y + 40);
    ctx.restore();
  }

  private drawEvent(ctx: CanvasRenderingContext2D, sim: Sim): void {
    const a = Math.min(1, sim.eventLife, sim.eventLife > 1 ? 1 : sim.eventLife);
    ctx.save();
    ctx.globalAlpha = Math.min(1, a) * 0.95;
    const y = 18;
    ctx.fillStyle = 'rgba(90, 8, 18, 0.82)';
    ctx.beginPath();
    ctx.roundRect(40, y, WORLD_W - 80, 58, 8);
    ctx.fill();
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = '#ffd0d8';
    ctx.font = '800 10px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BREAKING', WORLD_W / 2, y + 12);
    ctx.fillStyle = '#fff3b0';
    ctx.font = '800 16px Impact, sans-serif';
    ctx.fillText(sim.eventTitle, WORLD_W / 2, y + 30);
    ctx.fillStyle = '#f4f1e8';
    ctx.font = '700 11px Georgia, serif';
    ctx.fillText(sim.eventBlurb, WORLD_W / 2, y + 46);
    ctx.restore();
  }

  private drawSpawn(ctx: CanvasRenderingContext2D, sim: Sim, time: number): void {
    const s = sim.map.sample(0);
    const pulse = 0.55 + Math.sin(time * 4.2) * 0.25;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.strokeStyle = `rgba(230, 195, 92, ${0.35 + pulse * 0.45})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 16 + pulse * 6, 0, Math.PI * 2);
    ctx.stroke();
    if (sim.waveQueue.length) {
      ctx.fillStyle = '#e6c35c';
      ctx.font = '800 9px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('IN', 0, 3);
    }
    ctx.restore();
  }

  private drawShock(ctx: CanvasRenderingContext2D, s: { x: number; y: number; life: number; max: number }): void {
    const t = 1 - Math.max(0, s.life / s.max);
    ctx.save();
    ctx.globalAlpha = (1 - t) * 0.75;
    ctx.strokeStyle = '#fff3b0';
    ctx.lineWidth = 5 - t * 3;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 18 + t * 110, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#c8102e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 10 + t * 78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawTicker(ctx: CanvasRenderingContext2D, time: number): void {
    const line = TICKER[Math.floor(time / 9) % TICKER.length] ?? TICKER[0]!;
    const text = `${line}  ${line}`;
    const x = WORLD_W - ((time * 52) % (WORLD_W + 280));
    ctx.save();
    ctx.fillStyle = 'rgba(8, 16, 36, 0.72)';
    ctx.fillRect(0, WORLD_H - 22, WORLD_W, 22);
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(0, WORLD_H - 22, WORLD_W, 3);
    ctx.fillStyle = '#fff3b0';
    ctx.font = '800 11px Impact, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, WORLD_H - 9);
    ctx.restore();
  }

  private drawHudChrome(ctx: CanvasRenderingContext2D, sim: Sim, time: number): void {
    const boss = sim.enemies.find((e) => e.boss && e.hp > 0);
    if (boss) {
      ctx.save();
      const y = sim.eventLife > 0 ? 82 : 16;
      ctx.fillStyle = 'rgba(8, 16, 36, 0.82)';
      ctx.beginPath();
      ctx.roundRect(48, y, WORLD_W - 96, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(56, y + 16, WORLD_W - 112, 7);
      ctx.fillStyle = '#e6c35c';
      ctx.fillRect(56, y + 16, (WORLD_W - 112) * (boss.hp / boss.maxHp), 7);
      ctx.fillStyle = '#fff3b0';
      ctx.font = '800 11px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sim.wave >= 12 ? 'THE BIGGEST CLERK' : 'SPECIAL COUNSEL', WORLD_W / 2, y + 9);
      ctx.restore();
    }
    if (sim.streak >= 5) {
      const pop = sim.comboPop > 0 ? 1 + sim.comboPop * 0.22 : 1;
      const fever = sim.feverLife > 0 || sim.streak >= 20;
      ctx.save();
      ctx.translate(WORLD_W / 2, sim.eventLife > 0 || boss ? 118 : 86);
      ctx.scale(pop, pop);
      ctx.globalAlpha = 0.94;
      ctx.fillStyle = fever ? 'rgba(90, 8, 18, 0.88)' : 'rgba(12, 28, 68, 0.78)';
      ctx.beginPath();
      ctx.roundRect(-92, -18, 184, 36, 8);
      ctx.fill();
      ctx.strokeStyle = fever ? '#ff6b6b' : '#e6c35c';
      ctx.lineWidth = fever ? 3 : 2;
      ctx.stroke();
      ctx.fillStyle = '#fff3b0';
      ctx.font = '800 16px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fever ? `FEVER ${sim.streak}` : `STREAK ${sim.streak}`, 0, 1);
      ctx.restore();
    }
    if (sim.wave === 0 && sim.towers.length === 0) {
      const tw = 0.7 + Math.sin(time * 3) * 0.15;
      ctx.save();
      ctx.globalAlpha = tw;
      ctx.fillStyle = 'rgba(8, 16, 36, 0.55)';
      ctx.beginPath();
      ctx.roundRect(70, WORLD_H * 0.52, WORLD_W - 140, 36, 8);
      ctx.fill();
      ctx.fillStyle = '#fff3b0';
      ctx.font = '800 13px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TAP A CARD, THEN TAP GRASS', WORLD_W / 2, WORLD_H * 0.52 + 18);
      ctx.restore();
    }
  }

  private drawPuddle(ctx: CanvasRenderingContext2D, p: { x: number; y: number; r: number; life: number; max: number }, time: number): void {
    const a = Math.max(0, p.life / p.max) * 0.55;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(230, 195, 92, 0.35)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff3b0';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = -time * 30;
    ctx.stroke();
    ctx.fillStyle = '#5c470c';
    ctx.font = '800 10px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TAX', p.x, p.y + 3);
    ctx.restore();
  }

  private drawRange(ctx: CanvasRenderingContext2D, t: Tower, time: number, alpha: number): void {
    const r = towerStats(t.kind, t.tier).range * CELL;
    ctx.save();
    ctx.globalAlpha = alpha * (0.35 + Math.sin(time * 3) * 0.08);
    ctx.beginPath();
    ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = TOWERS[t.kind].color;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.fillStyle = TOWERS[t.kind].color;
    ctx.globalAlpha *= 0.12;
    ctx.fill();
    ctx.restore();
  }

  private drawGhost(ctx: CanvasRenderingContext2D, sim: Sim, h: { c: number; r: number }): void {
    const ok = sim.map.canPlace(h.c, h.r, sim.occupied) && sim.canAfford(sim.placing!);
    const p = sim.map.center(h.c, h.r);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = ok ? 'rgba(80, 200, 120, 0.38)' : 'rgba(200, 40, 40, 0.42)';
    ctx.beginPath();
    ctx.roundRect(h.c * CELL + 3, h.r * CELL + 3, CELL - 6, CELL - 6, 8);
    ctx.fill();
    ctx.strokeStyle = ok ? '#9dffb0' : '#ff6b6b';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    const fake: Tower = {
      id: -1,
      kind: sim.placing!,
      c: h.c,
      r: h.r,
      x: p.x,
      y: p.y,
      cooldown: 0,
      angle: 0,
      costPaid: 0,
      age: 1,
      tier: 0,
      specialCd: 0,
    };
    this.drawRange(ctx, fake, 0, 0.7);
    this.drawTower(ctx, fake, sim, 0);
    ctx.restore();
  }

  private drawHouse(ctx: CanvasRenderingContext2D, time: number, leak: number): void {
    const box = houseOrigin(this.map.def);
    // Painted battlefield already includes the keep — only pulse damage feedback.
    if (this.art && this.art.complete && this.art.naturalWidth > 0) {
      drawKeepLeak(ctx, box.x, box.y, box.w, box.h, time, leak);
      return;
    }
    drawKeep(ctx, box.x, box.y, box.w, box.h, time, leak, this.map.def.id);
  }

  private drawWall(ctx: CanvasRenderingContext2D, w: Wall): void {
    ctx.save();
    ctx.translate(w.x, w.y);
    const pulse = 0.88 + (w.life / w.maxLife) * 0.12;
    ctx.globalAlpha = pulse;
    const bw = 52;
    const bh = 28;
    ctx.fillStyle = '#e6c35c';
    ctx.fillRect(-bw / 2 - 2, -bh / 2 - 2, bw + 4, bh + 4);
    ctx.strokeStyle = '#0c1838';
    ctx.lineWidth = 3;
    ctx.strokeRect(-bw / 2 - 2, -bh / 2 - 2, bw + 4, bh + 4);
    for (let i = 0; i < 5; i++) {
      const mx = -bw / 2 - 2 + i * ((bw + 4) / 5);
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(mx + 1, -bh / 2 - 8, (bw + 4) / 5 - 3, 8);
      ctx.strokeStyle = '#0c1838';
      ctx.lineWidth = 2;
      ctx.strokeRect(mx + 1, -bh / 2 - 8, (bw + 4) / 5 - 3, 8);
    }

    const mortar = 2.5;
    const inset = 3;
    const rows = 2;
    const cols = 3;
    const brickH = (bh - inset * 2 - mortar) / rows;
    const brickW = (bw - inset * 2 - mortar * (cols - 1)) / cols;
    for (let row = 0; row < rows; row++) {
      const off = row % 2 === 0 ? 0 : brickW * 0.22;
      for (let col = 0; col < cols; col++) {
        if (row === 1 && col === 2) continue;
        const extra = row === 1 && col === 1 ? brickW * 0.35 : 0;
        const x = -bw / 2 + inset + col * (brickW + mortar) + (col === 0 ? 0 : off);
        const y = -bh / 2 + inset + row * (brickH + mortar);
        const rw = brickW + extra - (col === 0 ? 0 : off * 0.35);
        ctx.fillStyle = '#c8102e';
        ctx.fillRect(x, y, rw, brickH);
        ctx.fillStyle = '#ee4458';
        ctx.fillRect(x, y, rw, brickH * 0.34);
        ctx.fillStyle = '#8a0a1c';
        ctx.fillRect(x, y + brickH - 2.2, rw, 2.2);
        ctx.strokeStyle = '#e6c35c';
        ctx.lineWidth = 1.1;
        ctx.strokeRect(x, y, rw, brickH);
        const maga = (row === 0 && col === 1) || (row === 1 && col === 0);
        if (maga && rw > 12) {
          ctx.fillStyle = '#fffef8';
          ctx.font = '800 9px Impact, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('MAGA', x + rw / 2, y + brickH / 2 + 0.4);
        }
      }
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#1a1204';
    ctx.fillRect(-18, 18, 36, 5);
    ctx.fillStyle = '#9dffb0';
    ctx.fillRect(-18, 18, 36 * (w.hp / w.maxHp), 5);
    ctx.strokeStyle = '#e6c35c';
    ctx.lineWidth = 1;
    ctx.strokeRect(-18, 18, 36, 5);
    ctx.restore();
  }

  private drawTower(ctx: CanvasRenderingContext2D, t: Tower, sim: Sim, time: number): void {
    ctx.save();
    ctx.translate(t.x, t.y);
    const pop = t.age < 0.3 ? easeOutBack(Math.min(1, t.age / 0.3)) : 1;
    ctx.scale(pop, pop);
    if (sim.selected?.id === t.id) {
      ctx.strokeStyle = 'rgba(255, 243, 176, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-28, -28, 56, 56, 8);
      ctx.stroke();
    }
    if (t.tier >= MAX_TIER && t.specialCd <= 0 && t.id >= 0) {
      ctx.strokeStyle = `rgba(60, 240, 255, ${0.45 + Math.sin(time * 10) * 0.3})`;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(0, 0, 32 + Math.sin(time * 8) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (t.kind !== 'desk') {
      let buffed = false;
      for (const d of sim.towers) {
        if (d.kind !== 'desk') continue;
        const range = towerStats('desk', d.tier).range * CELL;
        const dx = d.x - t.x;
        const dy = d.y - t.y;
        if (dx * dx + dy * dy <= range * range) buffed = true;
      }
      if (buffed) {
        ctx.strokeStyle = `rgba(230, 195, 92, ${0.4 + Math.sin(time * 8) * 0.25})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    drawTowerArt(ctx, t.kind, t.tier, t.angle, time, t.cooldown);
    ctx.restore();
  }

  private drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number): void {
    ctx.save();
    ctx.translate(e.x, e.y - e.z + Math.sin(e.bob) * (e.flying ? 3 : 1));
    if (e.boss) {
      ctx.strokeStyle = `rgba(200, 16, 46, ${0.6 + Math.sin(time * 7) * 0.28})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 4, e.radius + 10, e.radius + 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(230, 195, 92, ${0.5 + Math.sin(time * 5) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 4, e.radius + 16, e.radius + 12, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.scale(1.58, 1.58);
    } else if (e.elite) {
      ctx.strokeStyle = `rgba(230, 195, 92, ${0.55 + Math.sin(time * 6) * 0.25})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 2, e.radius + 8, e.radius + 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.scale(1.12, 1.12);
    }
    if (e.splitter) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = `rgba(255, 179, 138, ${0.45 + Math.sin(time * 8) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.radius + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (e.kind === 'lobbyist') {
      ctx.strokeStyle = `rgba(80, 220, 120, ${0.25 + Math.sin(time * 5) * 0.12})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (e.flying) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(0, e.z + 10, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawEnemyArt(ctx, e.kind, e.angle, e.bob, time);
    if (e.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, e.flash * 6)})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.radius + 4, e.radius + 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const barW = e.boss ? 36 : 22;
    ctx.fillStyle = '#1a1204';
    ctx.fillRect(-barW / 2, -e.radius - 12, barW, e.boss ? 5 : 4);
    ctx.fillStyle = e.hp / e.maxHp > 0.4 ? '#3cff8a' : '#c8102e';
    if (e.elite || e.boss) ctx.fillStyle = '#e6c35c';
    ctx.fillRect(-barW / 2, -e.radius - 12, barW * (e.hp / e.maxHp), e.boss ? 5 : 4);
    if (e.boss) {
      ctx.fillStyle = '#fff3b0';
      ctx.font = '800 8px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('COUNSEL', 0, -e.radius - 18);
    }
    ctx.restore();
  }

  private drawBeam(ctx: CanvasRenderingContext2D, b: { x0: number; y0: number; x1: number; y1: number; life: number }): void {
    ctx.save();
    const a = Math.max(0, b.life / 0.09);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(b.x0, b.y0);
    ctx.lineTo(b.x1, b.y1);
    ctx.globalAlpha = a * 0.32;
    ctx.strokeStyle = '#c8102e';
    ctx.lineWidth = 11;
    ctx.stroke();
    ctx.globalAlpha = a * 0.7;
    ctx.strokeStyle = '#ff3348';
    ctx.lineWidth = 5.5;
    ctx.stroke();
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private drawBoulder(ctx: CanvasRenderingContext2D, b: { x: number; y: number; z: number }): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y + 8, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(b.x, b.y - b.z);
    ctx.fillStyle = '#e6c35c';
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5c470c';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 9.2, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff6c8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 252, 220, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-3.2, -4.2, 4.2, 2.4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5c470c';
    ctx.font = '800 9px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TAX', 0, 1);
    ctx.restore();
  }

  private drawBrickShot(ctx: CanvasRenderingContext2D, b: { x: number; y: number; z: number }): void {
    ctx.save();
    ctx.translate(b.x, b.y - b.z);
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(-9, -6, 18, 12);
    ctx.fillStyle = '#ee4458';
    ctx.fillRect(-9, -6, 18, 4);
    ctx.fillStyle = '#8a0a1c';
    ctx.fillRect(-9, 4, 18, 2);
    ctx.strokeStyle = '#e6c35c';
    ctx.lineWidth = 2;
    ctx.strokeRect(-9, -6, 18, 12);
    ctx.fillStyle = '#fffef8';
    ctx.font = '800 5px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MAGA', 0, 1);
    ctx.restore();
  }
}
