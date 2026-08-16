import { STEP, WORLD_H, WORLD_W } from './types.ts';

export class FrameLoop {
  fps = 60;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private frames = 0;
  private fpsT = 0;
  private running = false;
  private readonly step: (dt: number) => void;
  private readonly draw: (alpha: number) => void;

  constructor(step: (dt: number) => void, draw: (alpha: number) => void) {
    this.step = step;
    this.draw = draw;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number): void => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(tick);
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > 0.08) dt = 0.08;
      this.acc += dt;
      this.frames += 1;
      this.fpsT += dt;
      if (this.fpsT >= 0.4) {
        this.fps = this.frames / this.fpsT;
        this.frames = 0;
        this.fpsT = 0;
      }
      let guard = 0;
      while (this.acc >= STEP && guard < 5) {
        this.step(STEP);
        this.acc -= STEP;
        guard += 1;
      }
      this.draw(Math.min(1, this.acc / STEP));
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}

export class View {
  scale = 1;
  offsetX = 0;
  offsetY = 0;
  cssW = 0;
  cssH = 0;
  dpr = 1;
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  resize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const cssW = Math.max(1, parent.clientWidth);
    const cssH = Math.max(1, parent.clientHeight);
    this.cssW = cssW;
    this.cssH = cssH;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.canvas.width = Math.floor(cssW * dpr);
    this.canvas.height = Math.floor(cssH * dpr);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fit = Math.min(cssW / WORLD_W, cssH / WORLD_H);
    this.scale = fit;
    this.offsetX = (cssW - WORLD_W * fit) / 2;
    this.offsetY = (cssH - WORLD_H * fit) / 2;
  }

  pointerToWorld(clientX: number, clientY: number): { x: number; y: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const x = (px - this.offsetX) / this.scale;
    const y = (py - this.offsetY) / this.scale;
    if (x < 0 || y < 0 || x > WORLD_W || y > WORLD_H) return null;
    return { x, y };
  }

  applyWorld(ctx: CanvasRenderingContext2D, shakeX: number, shakeY: number): void {
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.translate(this.offsetX + shakeX, this.offsetY + shakeY);
    ctx.scale(this.scale, this.scale);
  }
}

export class TraumaCamera {
  trauma = 0;
  flash = 0;
  private sx = 0;
  private sy = 0;

  hit(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  bang(): void {
    this.hit(1);
    this.flash = 1;
  }

  sting(): void {
    this.hit(0.34);
    this.flash = Math.max(this.flash, 0.35);
  }

  update(dt: number): void {
    this.trauma = Math.max(0, this.trauma - dt * 1.45);
    this.flash = Math.max(0, this.flash - dt * 2.4);
    const mag = this.trauma * this.trauma * 46;
    this.sx = (Math.random() * 2 - 1) * mag;
    this.sy = (Math.random() * 2 - 1) * mag;
  }

  get shakeX(): number {
    return this.sx;
  }

  get shakeY(): number {
    return this.sy;
  }
}

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.hypot(dx, dy);
}

export function easeOutBack(t: number): number {
  const c = 1.70158;
  const x = t - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
}

export function seeded(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
