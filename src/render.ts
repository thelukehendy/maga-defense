import { easeOutBack, seeded } from './engine.ts';
import { star } from './fx.ts';
import type { FX } from './fx.ts';
import { drawEnemyArt, drawKeep, drawLandmarkArt, drawTowerArt } from './art.ts';
import { houseOrigin, towerStats } from './campaign.ts';
import type { GameMap } from './map.ts';
import type { Enemy, Sim, Tower, Wall } from './sim.ts';
import { CELL, COLS, ROWS, TOWERS, WORLD_H, WORLD_W } from './types.ts';

export class Renderer {
  private bg: HTMLCanvasElement;
  private bgx: CanvasRenderingContext2D;
  private map: GameMap;

  constructor(map: GameMap) {
    this.map = map;
    const off = document.createElement('canvas');
    off.width = WORLD_W;
    off.height = WORLD_H;
    this.bg = off;
    this.bgx = off.getContext('2d')!;
    this.bake();
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
    this.resize(dpr, scale);
  }

  private bake(): void {
    const ctx = this.bgx;
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    const theme = this.map.def.theme;
    const g = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    g.addColorStop(0, theme.skyTop);
    g.addColorStop(1, theme.skyBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    for (let i = 0; i < 90; i++) {
      const x = seeded(i * 3.1) * WORLD_W;
      const y = seeded(i * 7.7) * WORLD_H;
      ctx.globalAlpha = 0.15 + seeded(i * 9.2) * 0.5;
      ctx.fillStyle = theme.star;
      star(ctx, x, y, 2 + seeded(i) * 3, 1, 5);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.map.isPath(c, r) || this.map.blocked[this.map.idx(c, r)] !== 0) continue;
        const x = c * CELL;
        const y = r * CELL;
        const shade = seeded(c * 19 + r * 31);
        ctx.fillStyle = shade > 0.5 ? theme.grassHi : theme.grass;
        ctx.globalAlpha = 0.78 + shade * 0.18;
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = theme.grid;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3, y + 3, CELL - 6, CELL - 6);
        if (seeded(c * 5 + r) > 0.72) {
          ctx.fillStyle = 'rgba(230, 195, 92, 0.12)';
          star(ctx, x + CELL * 0.5, y + CELL * 0.5, 7, 3, 5);
          ctx.fill();
        }
      }
    }

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = theme.pathEdge;
    ctx.lineWidth = 46;
    this.strokePath(ctx);
    ctx.strokeStyle = theme.pathFill;
    ctx.lineWidth = 40;
    this.strokePath(ctx);
    ctx.strokeStyle = theme.pathRunner;
    ctx.lineWidth = 14;
    this.strokePath(ctx);
    ctx.strokeStyle = '#f4f1e8';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 12]);
    this.strokePath(ctx);
    ctx.setLineDash([]);

    const start = this.map.sample(0);
    ctx.fillStyle = '#e6c35c';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1204';
    ctx.font = '800 9px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IN', start.x, start.y);
  }

  private drawAmbient(ctx: CanvasRenderingContext2D, time: number): void {
    for (let i = 0; i < 36; i++) {
      const x = seeded(i * 11.3) * WORLD_W;
      const y = seeded(i * 17.9) * WORLD_H;
      const tw = 0.25 + Math.abs(Math.sin(time * (1.4 + seeded(i) * 2) + i)) * 0.75;
      ctx.globalAlpha = tw * 0.55;
      ctx.fillStyle = i % 5 === 0 ? '#e6c35c' : '#fff8d6';
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + tw, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 243, 176, 0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 16]);
    ctx.lineDashOffset = -time * 42;
    this.strokePath(ctx);
    ctx.restore();
  }

  private strokePath(ctx: CanvasRenderingContext2D): void {
    const s = this.map.samples;
    ctx.beginPath();
    ctx.moveTo(s[0]!.x, s[0]!.y);
    for (let i = 1; i < s.length; i++) ctx.lineTo(s[i]!.x, s[i]!.y);
    ctx.stroke();
  }

  draw(
    ctx: CanvasRenderingContext2D,
    sim: Sim,
    fx: FX,
    time: number,
    flash: number,
  ): void {
    ctx.drawImage(this.bg, 0, 0, WORLD_W, WORLD_H);
    this.drawAmbient(ctx, time);
    for (const lm of this.map.def.landmarks) {
      const p = this.map.center(lm.c, lm.r);
      ctx.save();
      ctx.translate(p.x, p.y);
      drawLandmarkArt(ctx, lm.kind, time);
      ctx.restore();
    }
    this.drawHouse(ctx, time, sim.leaking);
    if (sim.hover && sim.placing) this.drawGhost(ctx, sim, sim.hover);
    else if (sim.armed && sim.placing) this.drawGhost(ctx, sim, sim.armed);
    if (sim.selected) this.drawRange(ctx, sim.selected, time, 1);
    for (const t of sim.towers) {
      if (t.kind === 'desk') this.drawRange(ctx, t, time, 0.45);
    }
    for (const w of sim.walls) this.drawWall(ctx, w);
    const sorted = [...sim.towers].sort((a, b) => a.y - b.y);
    for (const t of sorted) this.drawTower(ctx, t, sim, time);
    const foes = [...sim.enemies].sort((a, b) => a.y - b.y);
    for (const e of foes) this.drawEnemy(ctx, e, time);
    for (const b of sim.beams) this.drawBeam(ctx, b);
    for (const b of sim.boulders) this.drawBoulder(ctx, b);
    for (const b of sim.bricks) this.drawBrickShot(ctx, b);
    fx.draw(ctx);

    if (flash > 0) {
      ctx.fillStyle = `rgba(255, 230, 140, ${flash * 0.62})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    if (sim.leaking > 0) {
      ctx.fillStyle = `rgba(200, 16, 46, ${sim.leaking * 0.28})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }

    if (sim.announcing > 0) {
      const a = Math.min(1, sim.announcing / 0.25, (2.1 - 0.15) > sim.announcing ? 1 : sim.announcing / 0.25);
      ctx.save();
      ctx.globalAlpha = Math.min(1, sim.announcing, 1);
      ctx.fillStyle = 'rgba(8, 16, 36, 0.55)';
      ctx.fillRect(0, WORLD_H * 0.38, WORLD_W, 70);
      ctx.strokeStyle = '#e6c35c';
      ctx.lineWidth = 3;
      ctx.strokeRect(40, WORLD_H * 0.38, WORLD_W - 80, 70);
      ctx.fillStyle = '#e6c35c';
      ctx.font = '800 18px Impact, Haettenschweiler, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sim.banner, WORLD_W / 2, WORLD_H * 0.38 + 35);
      ctx.restore();
      void a;
    }
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
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = ok ? 'rgba(80, 200, 120, 0.35)' : 'rgba(200, 40, 40, 0.4)';
    ctx.fillRect(h.c * CELL + 2, h.r * CELL + 2, CELL - 4, CELL - 4);
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
    };
    this.drawRange(ctx, fake, 0, 0.7);
    this.drawTower(ctx, fake, sim, 0);
    ctx.restore();
  }

  private drawHouse(ctx: CanvasRenderingContext2D, time: number, leak: number): void {
    const box = houseOrigin(this.map.def);
    drawKeep(ctx, box.x, box.y, box.w, box.h, time, leak, this.map.def.id);
  }

  private drawWall(ctx: CanvasRenderingContext2D, w: Wall): void {
    ctx.save();
    ctx.translate(w.x, w.y);
    const pulse = 0.85 + (w.life / w.maxLife) * 0.15;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#8a3b28';
    ctx.fillRect(-22, -14, 44, 28);
    ctx.strokeStyle = '#e6c35c';
    ctx.lineWidth = 2;
    ctx.strokeRect(-22, -14, 44, 28);
    ctx.fillStyle = '#c46a48';
    for (let row = 0; row < 3; row++) {
      const off = row % 2 === 0 ? 0 : 8;
      for (let col = 0; col < 4; col++) {
        ctx.fillRect(-20 + off + col * 12, -12 + row * 8, 10, 6);
      }
    }
    ctx.fillStyle = '#1a1204';
    ctx.fillRect(-18, 16, 36, 5);
    ctx.fillStyle = '#9dffb0';
    ctx.fillRect(-18, 16, 36 * (w.hp / w.maxHp), 5);
    ctx.restore();
  }

  private drawTower(ctx: CanvasRenderingContext2D, t: Tower, sim: Sim, time: number): void {
    ctx.save();
    ctx.translate(t.x, t.y);
    const pop = t.age < 0.3 ? easeOutBack(Math.min(1, t.age / 0.3)) : 1;
    ctx.scale(pop, pop);
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


  private drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, _time: number): void {
    ctx.save();
    ctx.translate(e.x, e.y - e.z + Math.sin(e.bob) * (e.flying ? 3 : 1));
    if (e.flying) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(0, e.z + 10, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawEnemyArt(ctx, e.kind, e.angle, e.bob, _time);
    if (e.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, e.flash * 6)})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.radius + 4, e.radius + 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const bw = 22;
    ctx.fillStyle = '#1a1204';
    ctx.fillRect(-bw / 2, -e.radius - 12, bw, 4);
    ctx.fillStyle = e.hp / e.maxHp > 0.4 ? '#3cff8a' : '#c8102e';
    ctx.fillRect(-bw / 2, -e.radius - 12, bw * (e.hp / e.maxHp), 4);
    ctx.restore();
  }


  private drawBeam(ctx: CanvasRenderingContext2D, b: { x0: number; y0: number; x1: number; y1: number; life: number }): void {
    ctx.save();
    const a = Math.max(0, b.life / 0.09);
    ctx.globalAlpha = a * 0.45;
    ctx.strokeStyle = '#3cf0ff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(b.x0, b.y0);
    ctx.lineTo(b.x1, b.y1);
    ctx.stroke();
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#7af7ff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
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
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6a1a';
    ctx.stroke();
    ctx.fillStyle = '#1a1204';
    ctx.font = '800 10px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TAX', 0, 1);
    ctx.restore();
  }

  private drawBrickShot(ctx: CanvasRenderingContext2D, b: { x: number; y: number; z: number }): void {
    ctx.save();
    ctx.translate(b.x, b.y - b.z);
    ctx.fillStyle = '#c46a48';
    ctx.fillRect(-8, -5, 16, 10);
    ctx.strokeStyle = '#5a2a1a';
    ctx.strokeRect(-8, -5, 16, 10);
    ctx.restore();
  }
}
