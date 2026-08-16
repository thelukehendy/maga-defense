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

  resize(insetTop = 0, insetBottom = 0, insetLeft = 0, insetRight = 0): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const cssW = Math.max(1, parent.clientWidth);
    const cssH = Math.max(1, parent.clientHeight);
    this.cssW = cssW;
    this.cssH = cssH;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.dpr = dpr;
    const bw = Math.max(1, Math.floor(cssW * dpr));
    const bh = Math.max(1, Math.floor(cssH * dpr));
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
    }
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Fit the full world into the HUD-safe playfield (never under chrome).
    const playW = Math.max(1, cssW - insetLeft - insetRight);
    const playH = Math.max(1, cssH - insetTop - insetBottom);
    const fit = Math.min(playW / WORLD_W, playH / WORLD_H);
    this.scale = fit;
    this.offsetX = insetLeft + (playW - WORLD_W * fit) / 2;
    this.offsetY = insetTop + (playH - WORLD_H * fit) / 2;
  }

  /**
   * Letterbox outside the contained world. Gutters must NOT look like placeable
   * lawn — pointerToWorld returns null there.
   */
  paintLetterbox(skyTop: string, skyBot: string, _grassHi: string, _grass: string): void {
    const { ctx } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const wx = this.offsetX;
    const wy = this.offsetY;
    const ww = WORLD_W * this.scale;
    const wh = WORLD_H * this.scale;
    // Deep frame — reads as matte, not battlefield.
    ctx.fillStyle = '#071428';
    ctx.fillRect(0, 0, this.cssW, this.cssH);
    // Soft sky wash only in the top band (above the world), never side grass.
    if (wy > 0.5) {
      const g = ctx.createLinearGradient(0, 0, 0, wy);
      g.addColorStop(0, skyTop);
      g.addColorStop(1, skyBot);
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(0, 0, this.cssW, wy);
      ctx.globalAlpha = 1;
    }
    // Subtle edge fade into the world rect so the matte doesn’t hard-cut.
    if (wx > 0.5) {
      ctx.fillStyle = skyBot;
      ctx.globalAlpha = 0.22;
      ctx.fillRect(0, wy, wx, wh);
      ctx.globalAlpha = 1;
    }
    if (wx + ww < this.cssW - 0.5) {
      ctx.fillStyle = skyBot;
      ctx.globalAlpha = 0.22;
      ctx.fillRect(wx + ww, wy, this.cssW - (wx + ww), wh);
      ctx.globalAlpha = 1;
    }
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
    this.hit(0.42);
    this.flash = Math.max(this.flash, 0.28);
  }

  sting(): void {
    this.hit(0.28);
    this.flash = Math.max(this.flash, 0.24);
  }

  clear(): void {
    this.trauma = 0;
    this.flash = 0;
    this.sx = 0;
    this.sy = 0;
  }

  update(dt: number): void {
    this.trauma = Math.max(0, this.trauma - dt * 1.7);
    this.flash = Math.max(0, this.flash - dt * 2.6);
    const mag = this.trauma * this.trauma * 18;
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
