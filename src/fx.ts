import { lerp } from './engine.ts';

export type Particle = {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  spin: number;
  ang: number;
  kind: 'spark' | 'coin' | 'star' | 'smoke';
};

export type Floater = {
  alive: boolean;
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
  text: string;
  color: string;
  scale: number;
};

const P_CAP = 720;
const F_CAP = 64;

export class FX {
  readonly particles: Particle[] = [];
  readonly floaters: Floater[] = [];
  private pi = 0;
  private fi = 0;
  time = 0;

  constructor() {
    for (let i = 0; i < P_CAP; i++) {
      this.particles.push({
        alive: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        max: 1,
        size: 2,
        color: '#fff',
        spin: 0,
        ang: 0,
        kind: 'spark',
      });
    }
    for (let i = 0; i < F_CAP; i++) {
      this.floaters.push({
        alive: false,
        x: 0,
        y: 0,
        vy: 0,
        life: 0,
        max: 1,
        text: '',
        color: '#fff',
        scale: 1,
      });
    }
  }

  clear(): void {
    for (const p of this.particles) p.alive = false;
    for (const f of this.floaters) f.alive = false;
    this.pi = 0;
    this.fi = 0;
    this.time = 0;
  }

  private p(): Particle {
    const start = this.pi;
    for (let n = 0; n < P_CAP; n++) {
      const i = (start + n) % P_CAP;
      const q = this.particles[i]!;
      if (!q.alive) {
        this.pi = (i + 1) % P_CAP;
        return q;
      }
    }
    const q = this.particles[this.pi]!;
    this.pi = (this.pi + 1) % P_CAP;
    return q;
  }

  private f(): Floater {
    const start = this.fi;
    for (let n = 0; n < F_CAP; n++) {
      const i = (start + n) % F_CAP;
      const q = this.floaters[i]!;
      if (!q.alive) {
        this.fi = (i + 1) % F_CAP;
        return q;
      }
    }
    const q = this.floaters[this.fi]!;
    this.fi = (this.fi + 1) % F_CAP;
    return q;
  }

  spawn(
    x: number,
    y: number,
    n: number,
    color: string | string[],
    speed: number,
    kind: Particle['kind'] = 'spark',
    size = 3,
  ): void {
    for (let i = 0; i < n; i++) {
      const p = this.p();
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random());
      const pal = Array.isArray(color) ? color[i % color.length]! : color;
      p.alive = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s - (kind === 'coin' ? 40 : 0);
      p.life = 0;
      p.max = 0.35 + Math.random() * 0.55;
      p.size = size * (0.6 + Math.random());
      p.color = pal;
      p.spin = (Math.random() - 0.5) * 12;
      p.ang = Math.random() * 6;
      p.kind = kind;
    }
  }

  patriotic(x: number, y: number, power = 1): void {
    this.spawn(x, y, Math.floor(18 * power), ['#c8102e', '#f4f1e8', '#1c3f9a'], 140 * power, 'star', 4);
    this.spawn(x, y, Math.floor(10 * power), ['#e6c35c', '#fff3b0'], 90 * power, 'coin', 5);
    this.spawn(x, y, Math.floor(8 * power), ['#9aa7c2'], 50 * power, 'smoke', 8);
  }

  boom(x: number, y: number): void {
    this.spawn(x, y, 28, ['#e6c35c', '#ff9f1c', '#fff3b0', '#c8102e'], 180, 'spark', 5);
    this.spawn(x, y, 10, ['#6b7280', '#d1d5db'], 40, 'smoke', 12);
  }

  say(x: number, y: number, text: string, color: string, scale = 1): void {
    const f = this.f();
    f.alive = true;
    f.x = x;
    f.y = y - 10;
    f.vy = -38;
    f.life = 0;
    f.max = 0.95;
    f.text = text;
    f.color = color;
    f.scale = scale;
  }

  update(dt: number): void {
    this.time += dt;
    for (const p of this.particles) {
      if (!p.alive) continue;
      p.life += dt;
      if (p.life >= p.max) {
        p.alive = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.kind === 'coin' ? 220 : 40) * dt;
      p.vx *= 1 - dt * 1.4;
      p.ang += p.spin * dt;
    }
    for (const f of this.floaters) {
      if (!f.alive) continue;
      f.life += dt;
      if (f.life >= f.max) {
        f.alive = false;
        continue;
      }
      f.y += f.vy * dt;
      f.vy *= 1 - dt * 2.2;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      if (!p.alive) continue;
      const t = p.life / p.max;
      const a = 1 - t;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.ang);
      ctx.globalAlpha = a;
      if (p.kind === 'star') {
        ctx.fillStyle = p.color;
        star(ctx, 0, 0, p.size, p.size * 0.42, 5);
        ctx.fill();
      } else if (p.kind === 'coin') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8a6a1a';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (p.kind === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (0.7 + t), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
      }
      ctx.restore();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of this.floaters) {
      if (!f.alive) continue;
      const t = f.life / f.max;
      const pop = t < 0.15 ? lerp(0.4, 1.15, t / 0.15) : lerp(1.15, 1, (t - 0.15) / 0.85);
      ctx.save();
      ctx.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1;
      ctx.translate(f.x, f.y);
      ctx.scale(pop * f.scale, pop * f.scale);
      ctx.font = '700 13px Impact, Haettenschweiler, sans-serif';
      ctx.strokeStyle = '#1a1204';
      ctx.lineWidth = 4;
      ctx.strokeText(f.text, 0, 0);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ir: number, n: number): void {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const ang = (i * Math.PI) / n - Math.PI / 2;
    const rad = i % 2 === 0 ? r : ir;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export { star };
