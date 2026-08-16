import type { LandmarkKind } from './campaign.ts';
import { CELL, type EnemyId, type TowerId } from './types.ts';

const C = {
  marbleHi: '#fbfaf4',
  marble: '#f2eee6',
  marbleMid: '#e4ddd2',
  marbleLo: '#c4bbad',
  marbleDeep: '#8f8678',
  marbleVein: 'rgba(118, 122, 132, 0.28)',
  goldHi: '#fff6c8',
  gold: '#e6c35c',
  goldMid: '#c9a227',
  goldLo: '#8a6a18',
  goldDeep: '#5c470c',
  navy: '#1a2f72',
  navyMid: '#14245c',
  navyDeep: '#0c183e',
  woodHi: '#c4894a',
  wood: '#8a4e22',
  woodLo: '#5a3014',
  glass: '#12151c',
  glassHi: '#2a3348',
  steel: '#9aa6b8',
  steelHi: '#d5dde8',
  steelLo: '#4a5564',
  sandHi: '#ead4aa',
  sand: '#d2b07a',
  sandLo: '#9a7040',
  brick: '#c45a3a',
  brickHi: '#d97858',
  brickLo: '#7a3020',
  mortar: '#e8d8c4',
  ink: '#1a1204',
  shadow: 'rgba(10, 8, 6, 0.34)',
  cyan: '#3cf0ff',
  cyanHi: '#9af8ff',
  magared: '#c8102e',
} as const;

const ISO = { x: 0.72, y: 0.55 } as const;

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.max(0, Math.min(r, w * 0.5, h * 0.5));
  ctx.beginPath();
  if (rad <= 0) {
    ctx.rect(x, y, w, h);
    return;
  }
  ctx.roundRect(x, y, w, h, rad);
}

function quad(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
  fill: string,
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.lineTo(dx, dy);
  ctx.closePath();
  ctx.fill();
}

function contact(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number): void {
  ctx.fillStyle = 'rgba(12, 10, 8, 0.16)';
  ctx.beginPath();
  ctx.ellipse(cx + 3, cy + 2, rx * 1.18, ry * 1.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(10, 8, 6, 0.28)';
  ctx.beginPath();
  ctx.ellipse(cx + 1, cy + 0.5, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(6, 5, 4, 0.42)';
  ctx.beginPath();
  ctx.ellipse(cx - 1, cy, rx * 0.62, ry * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();
}

function box3(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  d: number,
  front: string,
  top: string,
  side: string,
): void {
  const dx = d * ISO.x;
  const dy = d * ISO.y;
  quad(ctx, x + w, y, x + w + dx, y - dy, x + w + dx, y + h - dy, x + w, y + h, side);
  quad(ctx, x, y, x + w, y, x + w + dx, y - dy, x + dx, y - dy, top);
  ctx.fillStyle = front;
  ctx.fillRect(x, y, w, h);
}

function goldStroke(ctx: CanvasRenderingContext2D, width: number): void {
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

function plaque(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  fill: string,
  ink: string,
  size: number,
): void {
  bevelRect(ctx, x, y, w, h, fill, C.goldHi, C.goldLo, 2);
  ctx.fillStyle = C.gold;
  ctx.fillRect(x, y, w, 1);
  ctx.fillStyle = ink;
  ctx.font = `800 ${size}px Impact, Haettenschweiler, Arial Black, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w * 0.5, y + h * 0.55);
}

function mullionWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  rows: number,
  glow: string | null,
): void {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, glow ?? C.glassHi);
  g.addColorStop(0.35, C.glass);
  g.addColorStop(1, '#0a0c12');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(210, 230, 255, 0.16)';
  ctx.fillRect(x + 1, y + 1, w * 0.42, h * 0.32);
  ctx.fillStyle = C.marbleHi;
  const cw = w / cols;
  const rh = h / rows;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
  for (let c = 1; c < cols; c++) ctx.fillRect(x + c * cw, y, 1, h);
  for (let r = 1; r < rows; r++) ctx.fillRect(x, y + r * rh, w, 1);
}

function miniPediment(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  ctx.fillStyle = C.marbleDeep;
  ctx.beginPath();
  ctx.moveTo(x - 1, y + 4);
  ctx.lineTo(x + w * 0.5, y - 5);
  ctx.lineTo(x + w + 1, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.marbleHi;
  ctx.beginPath();
  ctx.moveTo(x, y + 3);
  ctx.lineTo(x + w * 0.5, y - 4);
  ctx.lineTo(x + w * 0.5 - 1, y - 2);
  ctx.lineTo(x + 2, y + 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.marble;
  ctx.beginPath();
  ctx.moveTo(x, y + 3);
  ctx.lineTo(x + w * 0.5, y - 4);
  ctx.lineTo(x + w, y + 3);
  ctx.closePath();
  ctx.fill();
}

function usFlag(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  gold(ctx, -1.2, 0, 2.4, 28 * s);
  ctx.fillStyle = C.goldDeep;
  ctx.fillRect(0.6, 0, 0.8, 28 * s);
  const fw = 22 * s;
  const fh = 14 * s;
  for (let i = 0; i < 7; i++) {
    const wy = i * (fh / 7) + Math.sin(time * 5.4 + i * 0.7) * 0.7 * s;
    ctx.fillStyle = i % 2 === 0 ? C.magared : '#f7f4ea';
    ctx.beginPath();
    ctx.moveTo(1.2, wy);
    ctx.quadraticCurveTo(fw * 0.45, wy + Math.sin(time * 6 + i) * 1.4 * s, fw, wy + Math.sin(time * 4.2 + i) * 0.8 * s);
    ctx.lineTo(fw, wy + fh / 7 + 0.4);
    ctx.quadraticCurveTo(fw * 0.45, wy + fh / 7 + Math.sin(time * 6 + i) * 1.4 * s, 1.2, wy + fh / 7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = C.navy;
  ctx.fillRect(1.2, Math.sin(time * 5.4) * 0.5 * s, fw * 0.42, fh * 0.54);
  ctx.fillStyle = C.goldHi;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.fillRect(3.2 * s + c * 2.1 * s, 1.6 * s + r * 2.1 * s, 0.9 * s, 0.9 * s);
    }
  }
  ctx.restore();
}

function woodDoor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, C.woodHi);
  g.addColorStop(0.18, C.wood);
  g.addColorStop(0.72, C.wood);
  g.addColorStop(1, C.woodLo);
  ctx.fillStyle = C.marbleDeep;
  ctx.fillRect(x - 2, y - 2, w + 4, h + 3);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255, 220, 170, 0.18)';
  ctx.fillRect(x + 1, y + 1, 2, h - 2);
  ctx.fillStyle = C.woodLo;
  ctx.fillRect(x + w * 0.48, y + 2, 1.2, h - 4);
  ctx.fillRect(x + 3, y + h * 0.12, w * 0.38, h * 0.32);
  ctx.fillRect(x + w * 0.56, y + h * 0.12, w * 0.38, h * 0.32);
  ctx.fillRect(x + 3, y + h * 0.52, w * 0.38, h * 0.36);
  ctx.fillRect(x + w * 0.56, y + h * 0.52, w * 0.38, h * 0.36);
  gold(ctx, x + w - 6, y + h * 0.48, 3.5, 3.5);
  ctx.fillStyle = C.navyDeep;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y - 1, w * 0.42, h * 0.18, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(180, 210, 255, 0.2)';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.38, y - 2, w * 0.16, h * 0.08, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = C.marbleHi;
  ctx.fillRect(x + w * 0.5 - 0.5, y - h * 0.18, 1, h * 0.16);
}

function cornice(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, d: number): void {
  const dx = d * ISO.x;
  const dy = d * ISO.y;
  gold(ctx, x - 3, y, w + 6, 4);
  quad(ctx, x - 3, y, x + w + 3, y, x + w + 3 + dx, y - dy, x - 3 + dx, y - dy, C.goldHi);
  ctx.fillStyle = C.goldLo;
  ctx.fillRect(x - 3, y + 3, w + 6, 1.5);
}

function navyPediment(
  ctx: CanvasRenderingContext2D,
  l: number,
  r: number,
  baseY: number,
  peakX: number,
  peakY: number,
  withStar: boolean,
): void {
  ctx.fillStyle = C.navyDeep;
  ctx.beginPath();
  ctx.moveTo(l - 2, baseY + 2);
  ctx.lineTo(peakX + 3, peakY + 3);
  ctx.lineTo(r + 4, baseY + 2);
  ctx.closePath();
  ctx.fill();
  const g = ctx.createLinearGradient(l, peakY, r, baseY);
  g.addColorStop(0, '#243a86');
  g.addColorStop(0.45, C.navy);
  g.addColorStop(1, C.navyDeep);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(l, baseY);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(r, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.beginPath();
  ctx.moveTo(l + (peakX - l) * 0.18, baseY - 4);
  ctx.lineTo(peakX - 4, peakY + 8);
  ctx.lineTo(peakX - 10, peakY + 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(l, baseY);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(r, baseY);
  ctx.lineWidth = 3.4;
  ctx.strokeStyle = C.gold;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.strokeStyle = C.goldHi;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  gold(ctx, l - 2, baseY - 1, r - l + 4, 3.5);
  if (withStar) {
    star5(ctx, peakX, (peakY + baseY) * 0.5 + 2, 11, 4.6);
  }
}

export function marble(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed = 1): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, C.marbleHi);
  g.addColorStop(0.28, C.marble);
  g.addColorStop(0.72, C.marbleMid);
  g.addColorStop(1, C.marbleLo);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fillRect(x, y, w * 0.38, 2);
  ctx.fillRect(x, y, 2, h * 0.55);
  const veins = 4 + Math.floor(hash(seed * 9.1) * 5);
  ctx.strokeStyle = C.marbleVein;
  ctx.lineCap = 'round';
  for (let i = 0; i < veins; i++) {
    const a = hash(seed * 3.7 + i * 11.3);
    const b = hash(seed * 5.1 + i * 7.9);
    ctx.lineWidth = 0.6 + hash(seed + i) * 1.4;
    ctx.globalAlpha = 0.35 + hash(seed * 2 + i) * 0.4;
    ctx.beginPath();
    const x0 = x + a * w * 0.2;
    const y0 = y + b * h;
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(
      x + (0.3 + hash(i + 2) * 0.3) * w,
      y + hash(i + 4) * h,
      x + (0.55 + hash(i + 6) * 0.25) * w,
      y + hash(i + 8) * h,
      x + w,
      y + hash(i + 10) * h,
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.marbleDeep;
  ctx.fillRect(x + w - 2, y + 2, 2, h - 2);
  ctx.fillRect(x + 2, y + h - 2, w - 2, 2);
  ctx.restore();
}

export function gold(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, C.goldHi);
  g.addColorStop(0.2, '#f3d56a');
  g.addColorStop(0.42, C.gold);
  g.addColorStop(0.5, '#fff4c0');
  g.addColorStop(0.58, C.gold);
  g.addColorStop(0.82, C.goldMid);
  g.addColorStop(1, C.goldLo);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255, 255, 240, 0.45)';
  ctx.fillRect(x, y, w, Math.max(1, h * 0.18));
  ctx.fillRect(x, y, Math.max(1, w * 0.12), h);
  ctx.fillStyle = C.goldDeep;
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x + w - 1, y, 1, h);
  ctx.restore();
}

export function bevelRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  hi: string,
  lo: string,
  r = 0,
): void {
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = hi;
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x, y, 2, h);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x + 2, y + 2, w * 0.35, 1);
  ctx.fillStyle = lo;
  ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillRect(x + w - 2, y, 2, h);
  ctx.restore();
}

export function column(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const cx = x + w * 0.5;
  const shaftX = x + w * 0.16;
  const shaftW = w * 0.68;
  ctx.fillStyle = C.shadow;
  ctx.fillRect(x + 1, y + h - 3, w, 4);
  marble(ctx, x - 1, y + h - 7, w + 2, 7, 4);
  box3(ctx, x - 1, y + h - 7, w + 2, 5, 4, C.marbleMid, C.marbleHi, C.marbleDeep);
  const sg = ctx.createLinearGradient(shaftX, y, shaftX + shaftW, y);
  sg.addColorStop(0, C.marbleHi);
  sg.addColorStop(0.16, '#f7f3ea');
  sg.addColorStop(0.42, C.marble);
  sg.addColorStop(0.78, C.marbleLo);
  sg.addColorStop(1, C.marbleDeep);
  ctx.fillStyle = sg;
  ctx.fillRect(shaftX, y + 8, shaftW, h - 16);
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.fillRect(shaftX + shaftW * 0.18, y + 9, 1.6, h - 18);
  ctx.fillStyle = C.marbleDeep;
  ctx.fillRect(shaftX + shaftW - 1.4, y + 9, 1.4, h - 18);
  gold(ctx, shaftX - 1, y + 6, shaftW + 2, 3);
  gold(ctx, shaftX - 1, y + h - 11, shaftW + 2, 3);
  box3(ctx, x, y + 2, w, 6, 3.5, C.marble, C.marbleHi, C.marbleLo);
  gold(ctx, x - 0.5, y, w + 1, 2.4);
  ctx.fillStyle = C.marbleHi;
  ctx.beginPath();
  ctx.ellipse(cx, y + 2, w * 0.48, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function star5(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ir: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : ir;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.35, 0, x, y, r);
  g.addColorStop(0, C.goldHi);
  g.addColorStop(0.4, C.gold);
  g.addColorStop(1, C.goldLo);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = C.goldDeep;
  ctx.beginPath();
  ctx.moveTo(x + r * 0.15, y);
  ctx.lineTo(x + Math.cos(0.2) * r, y + Math.sin(0.2) * r);
  ctx.lineTo(x + Math.cos(0.9) * ir, y + Math.sin(0.9) * ir);
  ctx.closePath();
  ctx.fill();
}

function lawnKeep(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, leak: number): void {
  const d = 11;
  const bodyX = x + w * 0.1;
  const bodyW = w * 0.8;
  const plinthTop = y + h * 0.82;
  const bodyY = y + h * 0.34;
  const bodyH = plinthTop - bodyY - 4;

  contact(ctx, x + w * 0.52, y + h * 0.96, w * 0.46, h * 0.055);
  if (leak > 0) {
    const pulse = 0.22 + Math.abs(Math.sin(time * 8)) * 0.28;
    const rg = ctx.createRadialGradient(x + w * 0.5, y + h * 0.55, 8, x + w * 0.5, y + h * 0.55, w * 0.62);
    rg.addColorStop(0, `rgba(200, 16, 46, ${pulse})`);
    rg.addColorStop(1, 'rgba(200, 16, 46, 0)');
    ctx.fillStyle = rg;
    ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
  }

  box3(ctx, x + 8, plinthTop + 14, w - 16, 10, d + 2, C.marbleLo, C.marble, C.marbleDeep);
  marble(ctx, x + 8, plinthTop + 14, w - 16, 10, 2);
  box3(ctx, x + 16, plinthTop + 6, w - 32, 10, d, C.marbleMid, C.marbleHi, C.marbleLo);
  marble(ctx, x + 16, plinthTop + 6, w - 32, 10, 3);
  box3(ctx, x + 24, plinthTop - 2, w - 48, 10, d - 1, C.marble, C.marbleHi, C.marbleLo);
  marble(ctx, x + 24, plinthTop - 2, w - 48, 10, 4);
  gold(ctx, x + 24, plinthTop - 3, w - 48, 2);

  box3(ctx, bodyX, bodyY, bodyW, bodyH, d, C.marble, C.marbleHi, C.marbleDeep);
  marble(ctx, bodyX, bodyY, bodyW, bodyH, 11);
  cornice(ctx, bodyX, bodyY, bodyW, d);

  const winGlow = leak > 0 ? `rgba(255, 60, 70, ${0.35 + Math.sin(time * 9) * 0.2})` : null;
  const rowY0 = bodyY + bodyH * 0.14;
  const rowY1 = bodyY + bodyH * 0.48;
  const winW = bodyW * 0.09;
  const winH = bodyH * 0.22;
  const slots = [0.08, 0.2, 0.32, 0.59, 0.71, 0.83];
  for (let i = 0; i < slots.length; i++) {
    const wx = bodyX + bodyW * slots[i]!;
    mullionWindow(ctx, wx, rowY0, winW, winH * 0.9, 2, 2, winGlow);
    mullionWindow(ctx, wx, rowY1, winW, winH, 2, 3, winGlow);
    miniPediment(ctx, wx - 1, rowY1, winW + 2);
  }

  const doorW = bodyW * 0.13;
  const doorH = bodyH * 0.42;
  woodDoor(ctx, bodyX + bodyW * 0.5 - doorW * 0.5, bodyY + bodyH - doorH - 2, doorW, doorH);

  const colW = bodyW * 0.07;
  const colH = bodyH * 0.78;
  const colY = bodyY + bodyH - colH;
  const colXs = [0.34, 0.44, 0.56, 0.66];
  for (let i = 0; i < colXs.length; i++) {
    column(ctx, bodyX + bodyW * colXs[i]! - colW * 0.5, colY, colW, colH);
  }

  const portL = bodyX + bodyW * 0.3;
  const portR = bodyX + bodyW * 0.7;
  const portBase = colY + 6;
  navyPediment(ctx, portL, portR, portBase, (portL + portR) * 0.5, portBase - h * 0.1, false);

  const roofL = bodyX - 4;
  const roofR = bodyX + bodyW + 4;
  const roofBase = bodyY + 2;
  navyPediment(ctx, roofL, roofR, roofBase, x + w * 0.5, y + h * 0.05, true);
  usFlag(ctx, roofR - 6, y + h * 0.02, time, 0.95);
}

function palazzoKeep(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, leak: number): void {
  const d = 12;
  contact(ctx, x + w * 0.52, y + h * 0.97, w * 0.48, h * 0.05);
  if (leak > 0) {
    ctx.fillStyle = `rgba(200,16,46,${0.18 + Math.abs(Math.sin(time * 7)) * 0.2})`;
    ctx.fillRect(x + 6, y + 8, w - 12, h - 16);
  }
  box3(ctx, x + 10, y + h * 0.86, w - 20, 14, d, C.marbleLo, C.goldHi, C.goldLo);
  marble(ctx, x + 10, y + h * 0.86, w - 20, 14, 21);
  gold(ctx, x + 10, y + h * 0.86, w - 20, 3);

  const bx = x + w * 0.12;
  const by = y + h * 0.32;
  const bw = w * 0.76;
  const bh = h * 0.54;
  box3(ctx, bx, by, bw, bh, d, C.marble, C.goldHi, C.marbleDeep);
  marble(ctx, bx, by, bw, bh, 22);
  gold(ctx, bx - 2, by - 2, bw + 4, 6);
  cornice(ctx, bx, by, bw, d);

  const archW = bw * 0.14;
  const archH = bh * 0.42;
  for (let i = 0; i < 5; i++) {
    const ax = bx + bw * 0.08 + i * (bw * 0.17);
    const ay = by + bh - archH - 4;
    ctx.fillStyle = C.marbleDeep;
    ctx.beginPath();
    ctx.moveTo(ax, ay + archH);
    ctx.lineTo(ax, ay + archW * 0.55);
    ctx.arc(ax + archW * 0.5, ay + archW * 0.55, archW * 0.5, Math.PI, 0);
    ctx.lineTo(ax + archW, ay + archH);
    ctx.closePath();
    ctx.fill();
    const hole = ctx.createLinearGradient(ax, ay, ax + archW, ay + archH);
    hole.addColorStop(0, '#1a1430');
    hole.addColorStop(1, '#0a0814');
    ctx.fillStyle = hole;
    ctx.beginPath();
    ctx.moveTo(ax + 3, ay + archH);
    ctx.lineTo(ax + 3, ay + archW * 0.55);
    ctx.arc(ax + archW * 0.5, ay + archW * 0.55, archW * 0.5 - 3, Math.PI, 0);
    ctx.lineTo(ax + archW - 3, ay + archH);
    ctx.closePath();
    ctx.fill();
    gold(ctx, ax + archW * 0.5 - 3, ay + 2, 6, 5);
  }

  for (let i = 0; i < 6; i++) {
    mullionWindow(ctx, bx + bw * 0.08 + i * bw * 0.14, by + bh * 0.12, bw * 0.1, bh * 0.22, 2, 2, null);
  }

  const colW = bw * 0.055;
  for (let i = 0; i < 6; i++) {
    column(ctx, bx + bw * (0.07 + i * 0.155), by + bh * 0.28, colW, bh * 0.7);
  }

  ctx.fillStyle = C.goldLo;
  ctx.beginPath();
  ctx.moveTo(bx - 8, by + 8);
  ctx.lineTo(x + w * 0.5, y + h * 0.06);
  ctx.lineTo(bx + bw + 8, by + 8);
  ctx.closePath();
  ctx.fill();
  const roof = ctx.createLinearGradient(bx, y, bx + bw, by);
  roof.addColorStop(0, '#f0d48a');
  roof.addColorStop(0.5, C.gold);
  roof.addColorStop(1, C.goldLo);
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(bx - 6, by + 6);
  ctx.lineTo(x + w * 0.5, y + h * 0.08);
  ctx.lineTo(bx + bw + 6, by + 6);
  ctx.closePath();
  ctx.fill();
  goldStroke(ctx, 3.2);
  ctx.stroke();
  star5(ctx, x + w * 0.5, y + h * 0.2, 10, 4.2);
  usFlag(ctx, bx + bw - 2, y + h * 0.05, time, 0.9);
}

function borderKeep(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, leak: number): void {
  const d = 10;
  contact(ctx, x + w * 0.5, y + h * 0.96, w * 0.46, h * 0.05);
  if (leak > 0) {
    ctx.fillStyle = `rgba(180,40,20,${0.16 + Math.abs(Math.sin(time * 6)) * 0.18})`;
    ctx.fillRect(x + 8, y + 10, w - 16, h - 18);
  }
  box3(ctx, x + 12, y + h * 0.84, w - 24, 16, d, C.sand, C.sandHi, C.sandLo);
  bevelRect(ctx, x + 12, y + h * 0.84, w - 24, 16, C.sand, C.sandHi, C.sandLo, 0);

  const wallX = x + w * 0.16;
  const wallY = y + h * 0.3;
  const wallW = w * 0.68;
  const wallH = h * 0.54;
  box3(ctx, wallX, wallY, wallW, wallH, d, C.sand, C.sandHi, C.sandLo);
  marble(ctx, wallX, wallY, wallW, wallH, 40);
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = C.sand;
  ctx.fillRect(wallX, wallY, wallW, wallH);
  ctx.restore();
  ctx.fillStyle = C.sandLo;
  for (let row = 0; row < 6; row++) {
    const off = row % 2 === 0 ? 0 : 8;
    for (let col = 0; col < 8; col++) {
      ctx.fillRect(wallX + 4 + off + col * 14, wallY + 8 + row * 12, 12, 3);
    }
  }

  const tw = w * 0.18;
  const th = h * 0.62;
  for (const side of [0.08, 0.74]) {
    const tx = x + w * side;
    const ty = y + h * 0.22;
    box3(ctx, tx, ty, tw, th, d, C.sandHi, C.sandHi, C.sandLo);
    bevelRect(ctx, tx, ty, tw, th, C.sand, C.sandHi, C.sandLo, 0);
    mullionWindow(ctx, tx + tw * 0.28, ty + th * 0.18, tw * 0.44, th * 0.16, 2, 2, null);
    mullionWindow(ctx, tx + tw * 0.28, ty + th * 0.48, tw * 0.44, th * 0.16, 2, 2, null);
  }

  const merlon = 10;
  const topY = wallY - 8;
  gold(ctx, wallX - 2, topY + 8, wallW + 4, 3);
  for (let i = 0; i < 9; i++) {
    const mx = wallX + i * (wallW / 8) - merlon * 0.3;
    box3(ctx, mx, topY, merlon, 14, 5, C.steel, C.steelHi, C.steelLo);
    bevelRect(ctx, mx, topY, merlon, 14, C.steel, C.steelHi, C.steelLo, 1);
  }
  woodDoor(ctx, wallX + wallW * 0.5 - 12, wallY + wallH - 36, 24, 34);
  gold(ctx, wallX + wallW * 0.5 - 16, wallY + wallH - 40, 32, 5);
  usFlag(ctx, x + w * 0.82, y + h * 0.08, time, 1);
  ctx.fillStyle = C.steelLo;
  ctx.fillRect(x + w * 0.5 - 1, y + h * 0.08, 3, wallY - y - h * 0.08);
  gold(ctx, x + w * 0.5 - 2, y + h * 0.08, 5, 4);
}

function avenueKeep(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, leak: number): void {
  contact(ctx, x + w * 0.52, y + h * 0.97, w * 0.4, h * 0.045);
  if (leak > 0) {
    ctx.fillStyle = `rgba(200,16,46,${0.14 + Math.abs(Math.sin(time * 8)) * 0.2})`;
    ctx.fillRect(x + 20, y + 6, w - 40, h - 12);
  }
  const tiers = [
    { t: 0.72, h: 0.22, y: 0.74 },
    { t: 0.58, h: 0.2, y: 0.54 },
    { t: 0.44, h: 0.2, y: 0.34 },
    { t: 0.3, h: 0.16, y: 0.18 },
  ] as const;
  const d = 9;
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i]!;
    const tw = w * t.t;
    const th = h * t.h;
    const tx = x + (w - tw) * 0.5;
    const ty = y + h * t.y;
    box3(ctx, tx, ty, tw, th, d, C.gold, C.goldHi, C.goldLo);
    gold(ctx, tx, ty, tw, th);
    ctx.fillStyle = C.goldDeep;
    ctx.fillRect(tx + tw - 3, ty + 2, 3, th - 2);
    const cols = 4 + i;
    const rows = 3;
    const pad = 6;
    const gw = (tw - pad * 2) / cols;
    const gh = (th - pad * 2) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const gx = tx + pad + c * gw + 2;
        const gy = ty + pad + r * gh + 2;
        ctx.fillStyle = leak > 0 && (r + c + Math.floor(time * 4)) % 5 === 0 ? '#5a1020' : C.glass;
        ctx.fillRect(gx, gy, gw - 4, gh - 4);
        ctx.fillStyle = 'rgba(180,210,255,0.12)';
        ctx.fillRect(gx, gy, (gw - 4) * 0.4, (gh - 4) * 0.35);
      }
    }
  }
  const lobbyW = w * 0.28;
  const lobbyX = x + (w - lobbyW) * 0.5;
  const lobbyY = y + h * 0.86;
  box3(ctx, lobbyX, lobbyY, lobbyW, h * 0.1, d, C.ink, C.goldHi, C.goldLo);
  gold(ctx, lobbyX, lobbyY, lobbyW, 3);
  ctx.fillStyle = C.navyDeep;
  ctx.fillRect(lobbyX + lobbyW * 0.35, lobbyY + 6, lobbyW * 0.3, h * 0.08);
  const capW = w * 0.22;
  const capX = x + (w - capW) * 0.5;
  const capY = y + h * 0.08;
  box3(ctx, capX, capY, capW, h * 0.1, d, C.gold, C.goldHi, C.goldLo);
  gold(ctx, capX, capY, capW, h * 0.1);
  star5(ctx, x + w * 0.5, capY - 2, 8, 3.4);
  ctx.fillStyle = C.goldLo;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5 - 4, capY);
  ctx.lineTo(x + w * 0.5, y + 2);
  ctx.lineTo(x + w * 0.5 + 4, capY);
  ctx.closePath();
  ctx.fill();
  gold(ctx, x + w * 0.5 - 2, y + 2, 4, capY - y);
  usFlag(ctx, capX + capW - 2, capY - 10, time, 0.85);
}

export function drawKeep(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number,
  leak: number,
  mapId: string,
): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (mapId === 'palazzo') palazzoKeep(ctx, x, y, w, h, time, leak);
  else if (mapId === 'border') borderKeep(ctx, x, y, w, h, time, leak);
  else if (mapId === 'avenue') avenueKeep(ctx, x, y, w, h, time, leak);
  else lawnKeep(ctx, x, y, w, h, time, leak);
  ctx.restore();
}

function klieg(ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, on: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  gold(ctx, -4, -3, 8, 6);
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.moveTo(2, -5);
  ctx.lineTo(10, -8);
  ctx.lineTo(10, 8);
  ctx.lineTo(2, 5);
  ctx.closePath();
  ctx.fill();
  const beam = ctx.createLinearGradient(10, 0, 42, 0);
  beam.addColorStop(0, `rgba(255, 248, 210, ${0.42 * on})`);
  beam.addColorStop(1, 'rgba(255, 248, 210, 0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(10, -6);
  ctx.lineTo(44, -16);
  ctx.lineTo(44, 16);
  ctx.lineTo(10, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,230,${0.55 * on})`;
  ctx.beginPath();
  ctx.arc(8, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function truthArt(ctx: CanvasRenderingContext2D, tier: number, angle: number, time: number, cooldown: number): void {
  const t = Math.max(0, Math.min(2, Math.floor(tier)));
  const h = 30 + t * 9;
  const pulse = 0.45 + Math.sin(time * 10) * 0.2 + (cooldown < 0.08 ? 0.3 : 0);
  contact(ctx, 1, 18, 16, 6);
  const glow = ctx.createRadialGradient(0, -4, 2, 0, -4, 28 + t * 6);
  glow.addColorStop(0, `rgba(60, 240, 255, ${pulse * 0.45})`);
  glow.addColorStop(1, 'rgba(60, 240, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -4, 28 + t * 6, 0, Math.PI * 2);
  ctx.fill();

  box3(ctx, -16, 8, 32, 10, 6, C.gold, C.goldHi, C.goldLo);
  gold(ctx, -16, 8, 32, 10);
  marble(ctx, -10, 8 - h, 20, h, 8);
  box3(ctx, -10, 8 - h, 20, h, 6, C.marble, C.marbleHi, C.marbleDeep);
  marble(ctx, -10, 8 - h, 20, h, 8);
  ctx.beginPath();
  ctx.moveTo(-8, 8 - h);
  ctx.lineTo(0, 8 - h - 14 - t * 4);
  ctx.lineTo(8, 8 - h);
  ctx.closePath();
  const tip = ctx.createLinearGradient(-8, 8 - h - 14, 8, 8 - h);
  tip.addColorStop(0, C.cyanHi);
  tip.addColorStop(0.5, C.navy);
  tip.addColorStop(1, C.navyDeep);
  ctx.fillStyle = tip;
  ctx.fill();
  goldStroke(ctx, 1.6);
  ctx.stroke();

  const rings = 1 + t;
  for (let i = 0; i < rings; i++) {
    const ry = 4 - i * (h / (rings + 1));
    gold(ctx, -12, ry, 24, 3);
  }
  plaque(ctx, -12, 2, 24, 9, 'FACT', C.navyDeep, C.cyanHi, 7);

  klieg(ctx, -18, -2, -0.55 + Math.sin(time * 2) * 0.08, pulse);
  klieg(ctx, 18, -2, Math.PI + 0.55 - Math.sin(time * 2) * 0.08, pulse);
  ctx.save();
  ctx.rotate(angle);
  ctx.strokeStyle = C.cyanHi;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(16 + t * 3, 0);
  ctx.stroke();
  ctx.fillStyle = C.cyan;
  ctx.beginPath();
  ctx.arc(16 + t * 3, 0, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function trebArt(ctx: CanvasRenderingContext2D, tier: number, _angle: number, time: number, cooldown: number): void {
  const t = Math.max(0, Math.min(2, Math.floor(tier)));
  const period = 1 / 0.48;
  const u = 1 - Math.min(1, cooldown / period);
  const arm = -0.92 + u * 2.42;
  contact(ctx, 2, 18, 20, 7);
  box3(ctx, -20, 8, 40, 12, 7, C.wood, C.woodHi, C.woodLo);
  bevelRect(ctx, -20, 8, 40, 12, C.wood, C.woodHi, C.woodLo, 2);
  gold(ctx, -22, 16, 44, 5);
  ctx.fillStyle = C.magared;
  ctx.beginPath();
  ctx.moveTo(-12, 2);
  ctx.lineTo(12, 2);
  ctx.lineTo(8, 10);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4f1e8';
  ctx.beginPath();
  ctx.moveTo(-7, 2);
  ctx.lineTo(7, 2);
  ctx.lineTo(5, 5);
  ctx.lineTo(-5, 5);
  ctx.closePath();
  ctx.fill();
  gold(ctx, -3, -1, 6, 3);
  for (const s of [-1, 1]) {
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.arc(s * 14, 18, 5 + t, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.goldMid;
    ctx.beginPath();
    ctx.arc(s * 14, 18, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = C.woodLo;
  ctx.fillRect(-3, -6, 6, 18);
  gold(ctx, -4, -8, 8, 4);
  ctx.save();
  ctx.rotate(arm);
  ctx.fillStyle = C.goldMid;
  ctx.fillRect(-2, -4, 5, 28);
  gold(ctx, -2, -4, 5, 28);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(1, 24);
  ctx.quadraticCurveTo(14, 28 + Math.sin(time) * 0.5, 22, 18);
  ctx.stroke();
  if (u < 0.9) {
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.arc(24, 16, 7 + t, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.goldLo;
    ctx.beginPath();
    ctx.arc(26, 18, 7 + t, 0.2, Math.PI * 1.1);
    ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.font = '800 6px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TAX', 24, 17);
  }
  ctx.restore();
}

function brickBond(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = C.mortar;
  ctx.fillRect(x, y, w, h);
  const bh = 5;
  const bw = 9;
  for (let row = 0; row < Math.ceil(h / bh) + 1; row++) {
    const off = row % 2 === 0 ? 0 : bw * 0.5;
    for (let col = -1; col < Math.ceil(w / bw) + 1; col++) {
      const bx = x + off + col * bw;
      const by = y + row * bh;
      bevelRect(ctx, bx + 0.5, by + 0.4, bw - 1.2, bh - 0.8, C.brick, C.brickHi, C.brickLo, 0.5);
    }
  }
  ctx.restore();
}

function brickArt(ctx: CanvasRenderingContext2D, tier: number, angle: number, time: number, cooldown: number): void {
  const t = Math.max(0, Math.min(2, Math.floor(tier)));
  contact(ctx, 1, 16, 18, 6);
  box3(ctx, -20, -6, 40, 24, 7, C.brick, C.brickHi, C.brickLo);
  brickBond(ctx, -20, -6, 40, 24);
  gold(ctx, -20, -8, 40, 4);
  gold(ctx, -20, 14, 40, 4);
  if (t >= 1) gold(ctx, -20, 4, 40, 3);
  if (t >= 2) {
    gold(ctx, -22, -10, 44, 3);
    star5(ctx, 0, -14, 5, 2);
  }
  const kick = cooldown < 0.2 ? Math.sin(time * 40) * 1.2 : 0;
  ctx.save();
  ctx.rotate(angle);
  ctx.translate(kick, 0);
  box3(ctx, 8, -5, 22 + t * 3, 10, 4, C.ink, C.steelHi, C.steelLo);
  bevelRect(ctx, 8, -5, 22 + t * 3, 10, '#2a1a12', C.steel, C.ink, 1);
  gold(ctx, 28 + t * 3, -7, 8, 14);
  ctx.fillStyle = cooldown < 0.12 ? C.goldHi : C.ink;
  ctx.fillRect(30 + t * 3, -3, 4, 6);
  ctx.restore();
  plaque(ctx, -14, 18, 28, 8, 'WALL', C.navyDeep, '#f4f1e8', 7);
}

function deskArt(ctx: CanvasRenderingContext2D, tier: number, _angle: number, time: number, _cooldown: number): void {
  const t = Math.max(0, Math.min(2, Math.floor(tier)));
  contact(ctx, 2, 16, 20, 6);
  const aura = ctx.createRadialGradient(0, 0, 8, 0, 0, 28 + t * 4);
  aura.addColorStop(0, `rgba(230, 195, 92, ${0.18 + Math.sin(time * 4) * 0.08})`);
  aura.addColorStop(1, 'rgba(230, 195, 92, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, 28 + t * 4, 0, Math.PI * 2);
  ctx.fill();

  box3(ctx, -24, -2, 48, 18, 8, C.wood, C.woodHi, C.woodLo);
  const top = ctx.createLinearGradient(-24, -8, 24, 4);
  top.addColorStop(0, C.woodHi);
  top.addColorStop(0.4, C.wood);
  top.addColorStop(1, C.woodLo);
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(-22, -8);
  ctx.lineTo(22, -8);
  ctx.lineTo(26, -2);
  ctx.lineTo(-26, -2);
  ctx.closePath();
  ctx.fill();
  gold(ctx, -24, -10, 48, 3);
  gold(ctx, -8, 2, 6, 8);
  gold(ctx, 4, 2, 6, 8);
  ctx.fillStyle = C.woodLo;
  ctx.fillRect(-20, 2, 12, 10);
  ctx.fillRect(8, 2, 12, 10);

  gold(ctx, -18, -16, 5, 10);
  ctx.fillStyle = '#1f6b46';
  ctx.beginPath();
  ctx.ellipse(-15.5, -20, 7, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180, 255, 210, 0.25)';
  ctx.beginPath();
  ctx.ellipse(-17, -21, 3, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  const lamp = ctx.createRadialGradient(-15, -20, 0, -15, -20, 16);
  lamp.addColorStop(0, 'rgba(255, 230, 140, 0.35)');
  lamp.addColorStop(1, 'rgba(255, 230, 140, 0)');
  ctx.fillStyle = lamp;
  ctx.beginPath();
  ctx.arc(-15, -12, 14, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 3 + t; i++) {
    const a = time * 1.5 + i * 2.1;
    ctx.save();
    ctx.translate(Math.cos(a) * (16 + t * 2), Math.sin(a) * 8 - 10);
    ctx.rotate(a);
    ctx.fillStyle = '#f7f1d8';
    ctx.fillRect(-5, -3, 10, 7);
    ctx.fillStyle = C.goldLo;
    ctx.fillRect(-5, -3, 10, 1);
    ctx.fillStyle = C.navy;
    ctx.fillRect(-3, -1, 6, 1);
    ctx.restore();
  }
  plaque(ctx, -10, 16, 20, 8, 'EO', C.navyDeep, C.goldHi, 7);
}

export function drawTowerArt(
  ctx: CanvasRenderingContext2D,
  kind: TowerId,
  tier: number,
  angle: number,
  time: number,
  cooldown: number,
): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (kind === 'truth') truthArt(ctx, tier, angle, time, cooldown);
  else if (kind === 'trebuchet') trebArt(ctx, tier, angle, time, cooldown);
  else if (kind === 'brick') brickArt(ctx, tier, angle, time, cooldown);
  else deskArt(ctx, tier, angle, time, cooldown);
  ctx.restore();
}

function alienArt(ctx: CanvasRenderingContext2D, angle: number, bob: number, time: number): void {
  ctx.rotate(angle);
  contact(ctx, 1, 16, 12, 4.5);
  ctx.translate(0, Math.sin(bob) * 1.2);
  ctx.fillStyle = C.magared;
  ctx.beginPath();
  ctx.ellipse(1, 3, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a0c1c';
  ctx.beginPath();
  ctx.ellipse(4, 5, 11, 7.5, 0.1, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createLinearGradient(-12, -8, 12, 10);
  body.addColorStop(0, '#ff4a5a');
  body.addColorStop(0.35, C.magared);
  body.addColorStop(1, '#6a0814');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,220,220,0.35)';
  ctx.beginPath();
  ctx.ellipse(-4, -5, 5, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  gold(ctx, -11, 4, 22, 5);
  star5(ctx, 0, 6.5, 5.2, 2.2);

  const visor = ctx.createLinearGradient(-8, -10, 8, 2);
  visor.addColorStop(0, 'rgba(180, 255, 240, 0.55)');
  visor.addColorStop(0.4, 'rgba(40, 80, 90, 0.55)');
  visor.addColorStop(1, 'rgba(10, 20, 24, 0.7)');
  ctx.fillStyle = visor;
  ctx.beginPath();
  ctx.ellipse(0, -3, 9, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.ellipse(-3.4, -3.2, 2.4, 3.2, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(3.4, -3.2, 2.4, 3.2, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.cyanHi;
  ctx.beginPath();
  ctx.arc(-4.2, -4.2, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2.6, -4.2, 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#9dffb0';
  ctx.beginPath();
  ctx.moveTo(-5.5, -13);
  ctx.lineTo(-7.2, -21);
  ctx.lineTo(-4.2, -13.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.arc(-7.4, -22.2, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(157,255,176,${0.45 + Math.sin(time * 8) * 0.3})`;
  ctx.beginPath();
  ctx.arc(-7.4, -22.2, 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#9dffb0';
  ctx.beginPath();
  ctx.moveTo(5.5, -13);
  ctx.lineTo(7.2, -21);
  ctx.lineTo(4.2, -13.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.arc(7.4, -22.2, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(157,255,176,${0.45 + Math.sin(time * 8 + 1) * 0.3})`;
  ctx.beginPath();
  ctx.arc(7.4, -22.2, 1.1, 0, Math.PI * 2);
  ctx.fill();
}

function droneArt(ctx: CanvasRenderingContext2D, _angle: number, bob: number, time: number): void {
  const spin = bob * 14;
  contact(ctx, 0, 14, 14, 4);
  ctx.translate(0, Math.sin(bob) * 2);
  const chrome = ctx.createLinearGradient(-16, -8, 16, 8);
  chrome.addColorStop(0, C.steelHi);
  chrome.addColorStop(0.35, '#3a4454');
  chrome.addColorStop(0.7, '#1a222e');
  chrome.addColorStop(1, '#0c1016');
  box3(ctx, -15, -7, 30, 14, 5, '#2a3344', C.steelHi, C.ink);
  ctx.fillStyle = chrome;
  rr(ctx, -15, -7, 30, 14, 4);
  ctx.fill();
  ctx.fillStyle = C.magared;
  ctx.fillRect(-11, -3, 22, 7);
  ctx.fillStyle = '#fff';
  ctx.font = '800 6px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FAKE', 0, 0.5);
  ctx.fillStyle = '#ff3b3b';
  ctx.beginPath();
  ctx.arc(0, 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(80, 220, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(0, 8, 1.6, 0, Math.PI * 2);
  ctx.fill();
  const arms = [
    [-16, -9],
    [16, -9],
    [-16, 8],
    [16, 8],
  ] as const;
  for (let i = 0; i < arms.length; i++) {
    const [ax, ay] = arms[i]!;
    ctx.fillStyle = C.steelLo;
    ctx.fillRect(ax > 0 ? 10 : ax, ay - 1, ax > 0 ? ax - 10 : 10 - ax, 2);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(spin + i);
    ctx.fillStyle = 'rgba(200, 210, 230, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 1.3, Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = `rgba(255,40,40,${0.4 + Math.sin(time * 12) * 0.4})`;
  ctx.fillRect(-14, -6, 3, 2);
}

function bureauArt(ctx: CanvasRenderingContext2D, angle: number, bob: number, _time: number): void {
  ctx.rotate(angle * 0.15);
  ctx.translate(0, Math.sin(bob) * 0.6);
  contact(ctx, 1, 18, 12, 4);
  const wool = ctx.createLinearGradient(-12, -8, 12, 16);
  wool.addColorStop(0, '#d5d8de');
  wool.addColorStop(0.25, '#9aa0aa');
  wool.addColorStop(0.7, '#6b7280');
  wool.addColorStop(1, '#3f4450');
  box3(ctx, -11, -8, 22, 24, 5, '#8b919c', '#d5d8de', '#3f4450');
  ctx.fillStyle = wool;
  ctx.fillRect(-11, -8, 22, 24);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(-10, -7, 6, 20);
  ctx.fillStyle = '#e8eaee';
  ctx.fillRect(-3, -6, 6, 16);
  ctx.fillStyle = C.navy;
  ctx.fillRect(-1.5, -6, 3, 15);
  gold(ctx, -2, 2, 4, 2);
  ctx.fillStyle = '#e8d5b8';
  ctx.beginPath();
  ctx.ellipse(0, -15, 7.2, 7.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c4a888';
  ctx.beginPath();
  ctx.ellipse(2, -14, 5.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8d5b8';
  ctx.beginPath();
  ctx.ellipse(-1, -16, 6.2, 6.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(-3.4, -16, 3.1, 2.4, -0.1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(3.4, -16, 3.1, 2.4, 0.1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-0.4, -16);
  ctx.lineTo(0.4, -16);
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(-3.2, -16, 1.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3.2, -16, 1.1, 0, Math.PI * 2);
  ctx.fill();
  box3(ctx, 9, 4, 12, 9, 3, '#6b3e18', C.woodHi, C.woodLo);
  gold(ctx, 9, 4, 12, 2);
  gold(ctx, -9, -4, 6, 4);
  ctx.fillStyle = C.navyDeep;
  ctx.font = '700 5px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C.goldHi;
  ctx.fillText('GS', -6, -2);
  plaque(ctx, -12, 16, 24, 7, 'GS-15', '#4b5563', C.goldHi, 6);
}

export function drawEnemyArt(
  ctx: CanvasRenderingContext2D,
  kind: EnemyId,
  angle: number,
  bob: number,
  time: number,
): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (kind === 'alien') alienArt(ctx, angle, bob, time);
  else if (kind === 'drone') droneArt(ctx, angle, bob, time);
  else bureauArt(ctx, angle, bob, time);
  ctx.restore();
}

function lmFountain(ctx: CanvasRenderingContext2D, time: number): void {
  contact(ctx, 1, 22, 16, 5);
  box3(ctx, -16, 14, 32, 8, 6, C.marble, C.marbleHi, C.marbleDeep);
  marble(ctx, -16, 14, 32, 8, 50);
  box3(ctx, -11, 4, 22, 8, 5, C.marble, C.marbleHi, C.marbleLo);
  marble(ctx, -11, 4, 22, 8, 51);
  box3(ctx, -7, -6, 14, 8, 4, C.marble, C.marbleHi, C.marbleLo);
  marble(ctx, -7, -6, 14, 8, 52);
  gold(ctx, -3, -14, 6, 10);
  ctx.fillStyle = C.cyan;
  ctx.beginPath();
  ctx.arc(0, -15, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + time * 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.quadraticCurveTo(Math.cos(a) * 10, -4 + Math.sin(time * 3 + i) * 2, Math.cos(a) * 14, 8);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(80, 200, 220, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 6, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
}

function lmRoses(ctx: CanvasRenderingContext2D, time: number): void {
  contact(ctx, 1, 18, 16, 5);
  box3(ctx, -18, 6, 36, 12, 6, C.wood, C.woodHi, C.woodLo);
  gold(ctx, -18, 6, 36, 3);
  marble(ctx, -16, 8, 32, 8, 60);
  ctx.fillStyle = '#1c5a32';
  ctx.fillRect(-15, -4, 30, 12);
  ctx.fillStyle = '#2a7a44';
  ctx.fillRect(-14, -6, 28, 8);
  for (let i = 0; i < 8; i++) {
    const rx = -12 + (i % 4) * 8 + (i > 3 ? 3 : 0);
    const ry = -8 - (i > 3 ? 6 : 0) + Math.sin(time * 2 + i) * 0.6;
    ctx.fillStyle = i % 2 === 0 ? C.magared : '#e04050';
    ctx.beginPath();
    ctx.ellipse(rx, ry, 4, 3.4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.goldHi;
    ctx.beginPath();
    ctx.arc(rx, ry, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function lmLincoln(ctx: CanvasRenderingContext2D, _time: number): void {
  contact(ctx, 1, 22, 14, 5);
  box3(ctx, -14, 12, 28, 10, 6, C.marble, C.marbleHi, C.marbleDeep);
  marble(ctx, -14, 12, 28, 10, 70);
  gold(ctx, -14, 12, 28, 2);
  ctx.fillStyle = C.marbleLo;
  ctx.fillRect(-9, 2, 18, 12);
  marble(ctx, -9, 2, 18, 12, 71);
  ctx.fillStyle = C.marble;
  ctx.fillRect(-11, 6, 8, 8);
  ctx.fillRect(3, 6, 8, 8);
  ctx.fillRect(-6, -8, 12, 16);
  marble(ctx, -6, -8, 12, 16, 72);
  ctx.fillStyle = C.marbleHi;
  ctx.beginPath();
  ctx.ellipse(0, -12, 5.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.marbleDeep;
  ctx.fillRect(-5, -10, 10, 2);
  ctx.fillRect(-3, -6, 6, 3);
}

function lmPalm(ctx: CanvasRenderingContext2D, time: number): void {
  contact(ctx, 1, 22, 10, 4);
  for (let i = 0; i < 7; i++) {
    const yy = 16 - i * 5;
    const ww = 7 - i * 0.3;
    bevelRect(ctx, -ww * 0.5, yy, ww, 6, i % 2 === 0 ? '#8a5a28' : '#c4894a', C.woodHi, C.woodLo, 1);
  }
  const sway = Math.sin(time * 1.6) * 0.12;
  ctx.save();
  ctx.translate(0, -18);
  ctx.rotate(sway);
  for (let i = 0; i < 8; i++) {
    const a = -0.9 + i * 0.26;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = i % 2 === 0 ? '#2f8a44' : '#c9a227';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(18, -4, 26, 2);
    ctx.quadraticCurveTo(14, 3, 0, 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function lmPool(ctx: CanvasRenderingContext2D, time: number): void {
  contact(ctx, 2, 14, 18, 8);
  ctx.fillStyle = C.goldLo;
  ctx.beginPath();
  ctx.ellipse(-4, 2, 20, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  gold(ctx, -22, -2, 6, 4);
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.ellipse(-4, 2, 18, 10.5, -0.3, 0, Math.PI * 2);
  ctx.fill();
  const water = ctx.createLinearGradient(-16, -8, 12, 12);
  water.addColorStop(0, '#7ef0e4');
  water.addColorStop(0.45, '#2aa8b8');
  water.addColorStop(1, '#0e5a68');
  ctx.fillStyle = water;
  ctx.beginPath();
  ctx.ellipse(-4, 2, 16, 9, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(-6, 0, 10, 4, -0.3 + Math.sin(time) * 0.05, 0, Math.PI);
  ctx.stroke();
}

function lmGolf(ctx: CanvasRenderingContext2D, time: number): void {
  contact(ctx, 1, 12, 16, 6);
  ctx.fillStyle = '#1c6a32';
  ctx.beginPath();
  ctx.ellipse(0, 6, 20, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a9a52';
  ctx.beginPath();
  ctx.ellipse(-3, 4, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(4, 6, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.steelHi;
  ctx.fillRect(3.4, -16, 1.6, 22);
  gold(ctx, 3, -18, 2.4, 3);
  ctx.fillStyle = C.magared;
  ctx.beginPath();
  ctx.moveTo(5, -16);
  ctx.lineTo(16, -12 + Math.sin(time * 3) * 1.2);
  ctx.lineTo(5, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4f1e8';
  ctx.beginPath();
  ctx.arc(-6, 8, 2, 0, Math.PI * 2);
  ctx.fill();
}

function lmCactus(ctx: CanvasRenderingContext2D, time: number): void {
  contact(ctx, 1, 20, 10, 4);
  bevelRect(ctx, -6, -8, 12, 28, '#2f7a3a', '#5aaa5a', '#1a4a22', 5);
  bevelRect(ctx, -16, 0, 12, 8, '#2f7a3a', '#5aaa5a', '#1a4a22', 4);
  bevelRect(ctx, 6, -4, 11, 8, '#2f7a3a', '#5aaa5a', '#1a4a22', 4);
  ctx.strokeStyle = 'rgba(255,255,210,0.45)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-4, -4 + i * 5);
    ctx.lineTo(-8, -6 + i * 5);
    ctx.stroke();
  }
  ctx.fillStyle = C.gold;
  ctx.beginPath();
  ctx.ellipse(0, -12 + Math.sin(time * 2) * 0.4, 4, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  star5(ctx, 0, -12, 3.2, 1.4);
}

function lmWatch(ctx: CanvasRenderingContext2D, time: number): void {
  contact(ctx, 1, 22, 12, 4);
  box3(ctx, -8, -4, 16, 26, 5, C.steel, C.steelHi, C.steelLo);
  bevelRect(ctx, -8, -4, 16, 26, '#5a6574', C.steelHi, C.ink, 1);
  box3(ctx, -12, -16, 24, 14, 6, C.steelHi, C.steelHi, C.steelLo);
  bevelRect(ctx, -12, -16, 24, 14, '#8a96a8', C.steelHi, C.steelLo, 2);
  mullionWindow(ctx, -6, -12, 12, 8, 2, 1, null);
  gold(ctx, -12, -18, 24, 3);
  const a = time * 1.3;
  ctx.save();
  ctx.translate(8, -10);
  ctx.rotate(a);
  const beam = ctx.createLinearGradient(0, 0, 36, 0);
  beam.addColorStop(0, 'rgba(255, 240, 160, 0.5)');
  beam.addColorStop(1, 'rgba(255, 240, 160, 0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.lineTo(36, -10);
  ctx.lineTo(36, 10);
  ctx.lineTo(0, 3);
  ctx.closePath();
  ctx.fill();
  gold(ctx, -3, -3, 6, 6);
  ctx.restore();
}

function lmGate(ctx: CanvasRenderingContext2D, _time: number): void {
  contact(ctx, 1, 20, 18, 5);
  box3(ctx, -22, -8, 12, 28, 5, C.sand, C.sandHi, C.sandLo);
  box3(ctx, 10, -8, 12, 28, 5, C.sand, C.sandHi, C.sandLo);
  bevelRect(ctx, -22, -8, 12, 28, C.sand, C.sandHi, C.sandLo, 1);
  bevelRect(ctx, 10, -8, 12, 28, C.sand, C.sandHi, C.sandLo, 1);
  gold(ctx, -22, -10, 12, 3);
  gold(ctx, 10, -10, 12, 3);
  ctx.fillStyle = C.steelLo;
  for (let i = 0; i < 6; i++) ctx.fillRect(-9 + i * 3.2, -2, 1.6, 20);
  gold(ctx, -10, -4, 20, 3);
  star5(ctx, 0, -8, 5, 2);
}

function lmTaxi(ctx: CanvasRenderingContext2D, time: number): void {
  contact(ctx, 2, 12, 16, 5);
  ctx.save();
  ctx.rotate(-0.18);
  box3(ctx, -18, -4, 34, 14, 6, '#f0d000', '#fff38a', '#b89000');
  bevelRect(ctx, -18, -4, 34, 14, '#f0d000', '#fff38a', '#b89000', 3);
  ctx.fillStyle = C.navyDeep;
  ctx.fillRect(-10, -12, 18, 9);
  ctx.fillStyle = 'rgba(160,210,255,0.35)';
  ctx.fillRect(-8, -11, 6, 7);
  ctx.fillRect(0, -11, 6, 7);
  ctx.fillStyle = C.ink;
  ctx.fillRect(-16, 6, 8, 8);
  ctx.fillRect(10, 6, 8, 8);
  ctx.fillStyle = C.steel;
  ctx.beginPath();
  ctx.arc(-12, 12, 3.5, 0, Math.PI * 2);
  ctx.arc(14, 12, 3.5, 0, Math.PI * 2);
  ctx.fill();
  gold(ctx, -4, -16, 8, 5);
  ctx.fillStyle = C.ink;
  ctx.font = '800 5px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TAXI', -1, 4);
  ctx.fillStyle = `rgba(255,220,80,${0.4 + Math.sin(time * 10) * 0.3})`;
  ctx.fillRect(-3, -15, 6, 3);
  ctx.restore();
}

function lmNews(ctx: CanvasRenderingContext2D, time: number): void {
  contact(ctx, 1, 18, 14, 5);
  box3(ctx, -12, -4, 24, 22, 6, C.wood, C.woodHi, C.woodLo);
  bevelRect(ctx, -12, -4, 24, 22, C.wood, C.woodHi, C.woodLo, 2);
  ctx.fillStyle = C.magared;
  ctx.beginPath();
  ctx.moveTo(-16, -4);
  ctx.lineTo(0, -16);
  ctx.lineTo(16, -4);
  ctx.closePath();
  ctx.fill();
  gold(ctx, -16, -5, 32, 2);
  ctx.fillStyle = '#f4f1e8';
  ctx.fillRect(-9, 0, 8, 10);
  ctx.fillRect(1, 0, 8, 10);
  ctx.fillStyle = C.magared;
  ctx.font = '800 5px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FAKE', 0, 6 + Math.sin(time * 2) * 0.3);
}

function lmBillboard(ctx: CanvasRenderingContext2D, time: number): void {
  contact(ctx, 1, 22, 10, 4);
  ctx.fillStyle = C.steelLo;
  ctx.fillRect(-3, 0, 6, 22);
  gold(ctx, -22, -22, 44, 24);
  box3(ctx, -20, -20, 40, 20, 5, C.navy, C.navyMid, C.navyDeep);
  ctx.fillStyle = C.navy;
  ctx.fillRect(-20, -20, 40, 20);
  ctx.fillStyle = C.goldHi;
  ctx.font = '800 8px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WINNING', 0, -12);
  ctx.fillStyle = `rgba(255, 243, 176, ${0.45 + Math.sin(time * 5) * 0.4})`;
  ctx.fillText('WINNING', 0, -12);
  star5(ctx, -14, -6, 4, 1.6);
  star5(ctx, 14, -6, 4, 1.6);
}

export function drawLandmarkArt(ctx: CanvasRenderingContext2D, kind: LandmarkKind, time: number): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const s = CELL / 64;
  ctx.scale(s, s);
  if (kind === 'fountain') lmFountain(ctx, time);
  else if (kind === 'roses') lmRoses(ctx, time);
  else if (kind === 'lincoln') lmLincoln(ctx, time);
  else if (kind === 'palm') lmPalm(ctx, time);
  else if (kind === 'pool') lmPool(ctx, time);
  else if (kind === 'golf') lmGolf(ctx, time);
  else if (kind === 'cactus') lmCactus(ctx, time);
  else if (kind === 'watch') lmWatch(ctx, time);
  else if (kind === 'gate') lmGate(ctx, time);
  else if (kind === 'taxi') lmTaxi(ctx, time);
  else if (kind === 'newsstand') lmNews(ctx, time);
  else lmBillboard(ctx, time);
  ctx.restore();
}

export function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  themeGrass: string,
  themeHi: string,
  grid: string,
  seed: number,
): void {
  const pad = 1;
  bevelRect(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, themeGrass, themeHi, 'rgba(0,0,0,0.28)', 3);
  ctx.fillStyle = themeHi;
  ctx.globalAlpha = 0.18 + hash(seed) * 0.12;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + size - 6);
  ctx.quadraticCurveTo(x + size * 0.4, y + 8, x + size - 6, y + 10);
  ctx.quadraticCurveTo(x + size * 0.6, y + size * 0.4, x + 8, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  const tufts = 2 + Math.floor(hash(seed * 3.2) * 3);
  for (let i = 0; i < tufts; i++) {
    const tx = x + 8 + hash(seed + i * 4.1) * (size - 16);
    const ty = y + 10 + hash(seed + i * 7.7) * (size - 18);
    ctx.fillStyle = hash(seed + i) > 0.55 ? C.gold : themeHi;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.ellipse(tx, ty, 3.5, 2, hash(i) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, y + 3, size - 6, size - 6);
  if (hash(seed * 5) > 0.78) {
    ctx.fillStyle = C.gold;
    ctx.globalAlpha = 0.22;
    star5(ctx, x + size * 0.5, y + size * 0.5, 6, 2.6);
    ctx.globalAlpha = 1;
  }
}
