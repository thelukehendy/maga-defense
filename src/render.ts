import { easeOutBack, seeded } from './engine.ts';
import { star } from './fx.ts';
import type { FX } from './fx.ts';
import type { GameMap } from './map.ts';
import type { Enemy, Sim, Tower, Wall } from './sim.ts';
import { CELL, COLS, ROWS, TOWERS, WORLD_H, WORLD_W } from './types.ts';

export class Renderer {
  private bg: HTMLCanvasElement;
  private bgx: CanvasRenderingContext2D;
  private readonly map: GameMap;

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

  private bake(): void {
    const ctx = this.bgx;
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    const g = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    g.addColorStop(0, '#0a1a3a');
    g.addColorStop(0.45, '#10244c');
    g.addColorStop(1, '#071326');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    for (let i = 0; i < 90; i++) {
      const x = seeded(i * 3.1) * WORLD_W;
      const y = seeded(i * 7.7) * WORLD_H;
      ctx.globalAlpha = 0.15 + seeded(i * 9.2) * 0.5;
      ctx.fillStyle = '#fff8d6';
      star(ctx, x, y, 2 + seeded(i) * 3, 1, 5);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.map.isPath(c, r) || this.map.isHouse(c, r)) continue;
        const x = c * CELL;
        const y = r * CELL;
        const shade = 0.04 + seeded(c * 19 + r * 31) * 0.05;
        ctx.fillStyle = `rgba(18, 72, 42, ${0.28 + shade})`;
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        ctx.strokeStyle = 'rgba(230, 195, 92, 0.14)';
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
    ctx.strokeStyle = '#8a6a1a';
    ctx.lineWidth = 46;
    this.strokePath(ctx);
    ctx.strokeStyle = '#d9c7a2';
    ctx.lineWidth = 40;
    this.strokePath(ctx);
    ctx.strokeStyle = '#c8102e';
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
      ctx.font = '800 32px Impact, Haettenschweiler, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sim.banner, WORLD_W / 2, WORLD_H * 0.38 + 35);
      ctx.restore();
      void a;
    }
  }

  private drawRange(ctx: CanvasRenderingContext2D, t: Tower, time: number, alpha: number): void {
    const r = TOWERS[t.kind].range * CELL;
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
    };
    this.drawRange(ctx, fake, 0, 0.7);
    this.drawTower(ctx, fake, sim, 0);
    ctx.restore();
  }

  private drawHouse(ctx: CanvasRenderingContext2D, time: number, leak: number): void {
    const x = 13 * CELL;
    const y = 7 * CELL;
    const w = 3 * CELL;
    const h = 3 * CELL;
    ctx.save();
    ctx.translate(x, y);
    const glow = leak > 0 ? 0.5 : 0.18;
    ctx.fillStyle = `rgba(230, 195, 92, ${glow})`;
    ctx.fillRect(-6, -6, w + 12, h + 12);
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(8, 38, w - 16, h - 46);
    ctx.fillStyle = '#1c3f9a';
    ctx.beginPath();
    ctx.moveTo(w / 2, 4);
    ctx.lineTo(w - 6, 42);
    ctx.lineTo(6, 42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e6c35c';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#e6c35c';
    star(ctx, w / 2, 24, 10, 4, 5);
    ctx.fill();
    const cols = 5;
    for (let i = 0; i < cols; i++) {
      const cx = 22 + i * 30;
      ctx.fillStyle = '#f8f4e8';
      ctx.fillRect(cx, 48, 10, 78);
      ctx.fillStyle = '#e6c35c';
      ctx.beginPath();
      ctx.arc(cx + 5, 48, 7, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#1a1204';
    ctx.fillRect(w / 2 - 14, 92, 28, 36);
    ctx.fillStyle = '#e6c35c';
    ctx.font = '700 9px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WH', w / 2, 128);

    ctx.save();
    ctx.translate(w / 2 + 52, 8);
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(0, 0, 28, 18);
    ctx.fillStyle = '#1c3f9a';
    ctx.fillRect(0, 0, 12, 10);
    for (let i = 0; i < 4; i++) {
      const wy = 2 + i * 4 + Math.sin(time * 6 + i) * 0.6;
      ctx.fillStyle = i % 2 === 0 ? '#f4f1e8' : '#c8102e';
      ctx.fillRect(12, wy, 16, 3);
    }
    ctx.strokeStyle = '#e6c35c';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 36);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
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
      const range = TOWERS.desk.range * CELL;
      for (const d of sim.towers) {
        if (d.kind !== 'desk') continue;
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
    if (t.kind === 'truth') this.truth(ctx, t, time);
    else if (t.kind === 'trebuchet') this.treb(ctx, t);
    else if (t.kind === 'brick') this.brick(ctx, t);
    else this.desk(ctx, t, time);
    ctx.restore();
  }

  private truth(ctx: CanvasRenderingContext2D, t: Tower, time: number): void {
    const pulse = 0.55 + Math.sin(time * 10) * 0.2;
    ctx.fillStyle = `rgba(60, 240, 255, ${pulse * 0.32})`;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(60, 240, 255, ${pulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b1d4a';
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(14, 16);
    ctx.lineTo(-14, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3cf0ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.rotate(t.angle);
    ctx.strokeStyle = '#7af7ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(18, 0);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#3cf0ff';
    ctx.font = '800 8px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FACT', 0, 8);
  }

  private treb(ctx: CanvasRenderingContext2D, t: Tower): void {
    const def = TOWERS.trebuchet;
    const period = 1 / (def.fireRate * 1.0001);
    const u = 1 - Math.min(1, t.cooldown / period);
    const arm = -0.9 + u * 2.4;
    ctx.fillStyle = '#3a2412';
    ctx.fillRect(-16, 6, 32, 12);
    ctx.fillStyle = '#e6c35c';
    ctx.fillRect(-18, 16, 36, 6);
    ctx.fillStyle = '#c8102e';
    ctx.beginPath();
    ctx.moveTo(-10, -2);
    ctx.lineTo(10, -2);
    ctx.lineTo(6, 8);
    ctx.lineTo(-6, 8);
    ctx.fill();
    ctx.save();
    ctx.rotate(arm);
    ctx.strokeStyle = '#d9c7a2';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(22, -18);
    ctx.stroke();
    ctx.fillStyle = '#e6c35c';
    ctx.beginPath();
    ctx.arc(24, -20, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1204';
    ctx.font = '800 7px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', 24, -19);
    ctx.restore();
  }

  private brick(ctx: CanvasRenderingContext2D, t: Tower): void {
    ctx.fillStyle = '#6b3a28';
    ctx.fillRect(-18, -8, 36, 24);
    ctx.strokeStyle = '#e6c35c';
    ctx.strokeRect(-18, -8, 36, 24);
    ctx.fillStyle = '#c46a48';
    ctx.fillRect(-14, -4, 12, 8);
    ctx.fillRect(2, -4, 12, 8);
    ctx.fillRect(-8, 6, 16, 8);
    ctx.save();
    ctx.rotate(t.angle);
    ctx.fillStyle = '#2a1a12';
    ctx.fillRect(8, -5, 22, 10);
    ctx.fillStyle = '#e6c35c';
    ctx.fillRect(26, -7, 8, 14);
    ctx.restore();
    ctx.fillStyle = '#f4f1e8';
    ctx.font = '800 8px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WALL', 0, 22);
  }

  private desk(ctx: CanvasRenderingContext2D, t: Tower, time: number): void {
    ctx.strokeStyle = `rgba(230, 195, 92, ${0.45 + Math.sin(time * 4) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#6b4a24';
    ctx.fillRect(-22, -8, 44, 20);
    ctx.fillStyle = '#e6c35c';
    ctx.fillRect(-22, -10, 44, 4);
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(-10, -18, 12, 10);
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(8, -16, 8, 8);
    for (let i = 0; i < 3; i++) {
      const a = time * 1.6 + i * 2.1;
      ctx.fillStyle = '#fff3b0';
      ctx.save();
      ctx.translate(Math.cos(a) * 18, Math.sin(a) * 10 - 6);
      ctx.rotate(a);
      ctx.fillRect(-4, -3, 8, 6);
      ctx.restore();
    }
    ctx.fillStyle = '#fff3b0';
    ctx.font = '800 8px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EO', 0, 20);
    void t;
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
    if (e.kind === 'alien') this.alien(ctx, e);
    else if (e.kind === 'drone') this.drone(ctx, e);
    else this.bureaucrat(ctx, e);
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

  private alien(ctx: CanvasRenderingContext2D, e: Enemy): void {
    ctx.rotate(e.angle);
    ctx.fillStyle = '#c8102e';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e6c35c';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = '#9dffb0';
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.lineTo(-8, -22);
    ctx.moveTo(6, -14);
    ctx.lineTo(8, -22);
    ctx.stroke();
    ctx.fillStyle = '#9dffb0';
    ctx.beginPath();
    ctx.arc(-8, -22, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, -22, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(-4, -2, 3, 4, -0.2, 0, Math.PI * 2);
    ctx.ellipse(4, -2, 3, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e6c35c';
    star(ctx, 0, 8, 5, 2, 5);
    ctx.fill();
  }

  private drone(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const spin = e.bob * 14;
    ctx.fillStyle = '#2a3344';
    ctx.beginPath();
    ctx.roundRect(-14, -7, 28, 14, 4);
    ctx.fill();
    ctx.strokeStyle = '#c8102e';
    ctx.stroke();
    ctx.fillStyle = '#ff3b3b';
    ctx.fillRect(-10, -3, 20, 6);
    ctx.fillStyle = '#fff';
    ctx.font = '800 6px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FAKE', 0, 0);
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * 16, -8);
      ctx.rotate(spin);
      ctx.strokeStyle = '#9aa7c2';
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.moveTo(0, -8);
      ctx.lineTo(0, 8);
      ctx.stroke();
      ctx.restore();
    }
  }

  private bureaucrat(ctx: CanvasRenderingContext2D, e: Enemy): void {
    ctx.rotate(e.angle * 0.15);
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(-10, -8, 20, 22);
    ctx.fillStyle = '#111827';
    ctx.fillRect(-2, -6, 4, 14);
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.arc(0, -14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.strokeRect(-8, -16, 6, 3);
    ctx.strokeRect(2, -16, 6, 3);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(8, 4, 10, 8);
    ctx.fillStyle = '#d1d5db';
    ctx.font = '700 6px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GS-15', 0, 18);
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
