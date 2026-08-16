import { drawEnemyArt, drawTowerArt } from './art.ts';
import type { EnemyId, TowerId } from './types.ts';

export function paintPortraits(root: HTMLElement): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  for (const canvas of root.querySelectorAll<HTMLCanvasElement>('[data-portrait]')) {
    const spec = canvas.dataset.portrait ?? '';
    const cssW = Math.max(48, canvas.clientWidth || Number(canvas.getAttribute('width')) || 96);
    const cssH = Math.max(48, canvas.clientHeight || Number(canvas.getAttribute('height')) || 96);
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    const sky = ctx.createLinearGradient(0, 0, 0, cssH);
    sky.addColorStop(0, '#7ec8f4');
    sky.addColorStop(1, '#c8ec9a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.save();
    ctx.translate(cssW / 2, cssH * 0.62);
    const s = Math.min(cssW, cssH) / 78;
    ctx.scale(s, s);
    const [kind, id] = spec.split(':');
    if (kind === 'tower') drawTowerArt(ctx, id as TowerId, 1, -0.35, 1.1, 0.05);
    else if (kind === 'enemy') drawEnemyArt(ctx, id as EnemyId, 0.15, 0.6, 1.1);
    ctx.restore();
  }
}
