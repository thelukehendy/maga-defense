import type { LandmarkKind } from './campaign.ts';
import { CELL, type EnemyId, type TowerId } from './types.ts';

const INK = '#0c1838';
const INK_W = 3;

const C = {
  red: '#c8102e',
  redHi: '#f24a58',
  redLo: '#7a0c1c',
  white: '#fff8ee',
  blue: '#1a4fa8',
  blueHi: '#4c7fd6',
  blueLo: '#0d2e72',
  gold: '#e6c35c',
  goldHi: '#fff3b0',
  goldLo: '#8a6418',
  stoneHi: '#eef0f4',
  stone: '#c5cad3',
  stoneLo: '#7a818c',
  woodHi: '#d4a05a',
  wood: '#a86a32',
  woodLo: '#6a3a16',
  sandHi: '#f0d8a8',
  sand: '#d4b070',
  sandLo: '#9a7038',
  grassHi: '#7ed45a',
  grass: '#3a9a3a',
  grassLo: '#1e6a24',
  oceanHi: '#7ec8f8',
  ocean: '#2a7ad4',
  oceanLo: '#0e3e88',
  land: '#4cba4a',
  landLo: '#2a7a28',
  steelHi: '#d8dee8',
  steel: '#8a96a8',
  steelLo: '#3a4454',
  robe: '#2a3040',
  robeHi: '#4a5468',
  robeLo: '#12161e',
  skin: '#f0c8a0',
  skinLo: '#c49068',
} as const;

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function ink(ctx: CanvasRenderingContext2D, w = INK_W): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = w;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.max(0, Math.min(r, w * 0.5, h * 0.5));
  ctx.beginPath();
  if (rad <= 0) ctx.rect(x, y, w, h);
  else ctx.roundRect(x, y, w, h, rad);
}

function paint(ctx: CanvasRenderingContext2D, fill: string | CanvasGradient, line = INK_W): void {
  ctx.fillStyle = fill;
  ctx.fill();
  if (line > 0) {
    ink(ctx, line);
    ctx.stroke();
  }
}

function lin(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  a: string,
  b: string,
  c?: string,
): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, a);
  if (c) {
    g.addColorStop(0.45, b);
    g.addColorStop(1, c);
  } else {
    g.addColorStop(1, b);
  }
  return g;
}

function blobHi(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, a = 0.5): void {
  const arx = Math.max(0.5, Math.abs(rx));
  const ary = Math.max(0.5, Math.abs(ry));
  ctx.fillStyle = `rgba(255,255,245,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, arx, ary, -0.45, 0, Math.PI * 2);
  ctx.fill();
}

function clayRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  hi: string,
  mid: string,
  lo: string,
  line = INK_W,
): void {
  const ww = Math.max(1, Math.abs(w));
  const hh = Math.max(1, Math.abs(h));
  const xx = w < 0 ? x + w : x;
  const yy = h < 0 ? y + h : y;
  rr(ctx, xx, yy, ww, hh, Math.min(r, ww * 0.45, hh * 0.45));
  paint(ctx, lin(ctx, xx, yy, xx + ww, yy + hh, hi, mid, lo), line);
  ctx.save();
  rr(ctx, xx, yy, ww, hh, Math.min(r, ww * 0.45, hh * 0.45));
  ctx.clip();
  blobHi(ctx, xx + ww * 0.28, yy + hh * 0.18, ww * 0.34, hh * 0.14, 0.4);
  ctx.restore();
}

function clayBall(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  hi: string,
  mid: string,
  lo: string,
  line = INK_W,
): void {
  const g = ctx.createRadialGradient(cx - r * 0.38, cy - r * 0.42, r * 0.04, cx + r * 0.12, cy + r * 0.18, r);
  g.addColorStop(0, hi);
  g.addColorStop(0.42, mid);
  g.addColorStop(1, lo);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  paint(ctx, g, line);
  blobHi(ctx, cx - r * 0.32, cy - r * 0.36, r * 0.28, r * 0.18, 0.55);
}

function clayOval(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot: number,
  hi: string,
  mid: string,
  lo: string,
  line = INK_W,
): void {
  const g = ctx.createRadialGradient(cx - rx * 0.35, cy - ry * 0.4, 0, cx, cy, Math.max(rx, ry));
  g.addColorStop(0, hi);
  g.addColorStop(0.45, mid);
  g.addColorStop(1, lo);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  paint(ctx, g, line);
  blobHi(ctx, cx - rx * 0.3, cy - ry * 0.35, rx * 0.28, ry * 0.18, 0.45);
}

function tri(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  hi: string,
  lo: string,
  line = INK_W,
): void {
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  paint(ctx, lin(ctx, ax, ay, cx, cy, hi, lo), line);
}

function ground(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number): void {
  ctx.fillStyle = 'rgba(12, 18, 40, 0.22)';
  ctx.beginPath();
  ctx.ellipse(cx + 1.5, cy + 1, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function star5(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ir: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const radv = i % 2 === 0 ? r : ir;
    const px = x + Math.cos(a) * radv;
    const py = y + Math.sin(a) * radv;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const g = ctx.createRadialGradient(x - r * 0.28, y - r * 0.34, 0, x, y, r);
  g.addColorStop(0, C.goldHi);
  g.addColorStop(0.4, C.gold);
  g.addColorStop(1, C.goldLo);
  paint(ctx, g, Math.max(1.5, r * 0.16));
  blobHi(ctx, x - r * 0.12, y - r * 0.22, r * 0.2, r * 0.12, 0.5);
}

function pole(ctx: CanvasRenderingContext2D, x: number, y: number, h: number): void {
  clayRect(ctx, x - 1.1, y, 2.2, h, 1, C.goldHi, C.gold, C.goldLo, 1.5);
}

function flagSilhouette(
  ctx: CanvasRenderingContext2D,
  fw: number,
  fh: number,
  time: number,
  s: number,
): void {
  ctx.beginPath();
  ctx.moveTo(1.2, 0);
  ctx.quadraticCurveTo(fw * 0.45, Math.sin(time * 6) * 1.3 * s, fw, Math.sin(time * 4.1) * 0.7 * s);
  ctx.lineTo(fw, fh + Math.sin(time * 4.1 + 6) * 0.7 * s);
  ctx.quadraticCurveTo(fw * 0.45, fh + Math.sin(time * 6 + 6) * 1.3 * s, 1.2, fh);
  ctx.closePath();
}

function usFlag(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  pole(ctx, 0, 0, 26 * s);
  const fw = 20 * s;
  const fh = 12 * s;
  const cantonH = fh * 0.54;
  flagSilhouette(ctx, fw, fh, time, s);
  paint(ctx, C.blueLo, INK_W);
  for (let i = 0; i < 7; i++) {
    const wy = i * (fh / 7) + Math.sin(time * 5.2 + i * 0.65) * 0.7 * s;
    const wave = Math.sin(time * 6 + i) * 1.3 * s;
    ctx.beginPath();
    ctx.moveTo(1.2, wy);
    ctx.quadraticCurveTo(fw * 0.45, wy + wave, fw, wy + Math.sin(time * 4.1 + i) * 0.7 * s);
    ctx.lineTo(fw, wy + fh / 7 + 0.4);
    ctx.quadraticCurveTo(fw * 0.45, wy + fh / 7 + wave, 1.2, wy + fh / 7);
    ctx.closePath();
    paint(ctx, i % 2 === 0 ? C.red : C.white, 0);
  }
  const cy0 = Math.sin(time * 5.2) * 0.45 * s;
  clayRect(ctx, 1.2, cy0, fw * 0.4, cantonH, 1.2, C.blueHi, C.blue, C.blueLo, 1.8);
  ctx.fillStyle = C.goldHi;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.fillRect(2.8 * s + c * 1.9 * s, cy0 + 1.4 * s + r * 1.9 * s, 0.85 * s, 0.85 * s);
    }
  }
  flagSilhouette(ctx, fw, fh, time, s);
  ctx.strokeStyle = C.blueLo;
  ctx.lineWidth = INK_W;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

function goldBand(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  clayRect(ctx, x, y, w, h, Math.min(2, h * 0.45), C.goldHi, C.gold, C.goldLo, 1.6);
}

function glowDisk(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  rgb: string,
  a: number,
): void {
  const rad = Math.max(1, r);
  const g = ctx.createRadialGradient(cx, cy, rad * 0.12, cx, cy, rad);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(0.48, `rgba(${rgb},${a * 0.32})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.fill();
}

function glowCone(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  half0: number,
  half1: number,
  rgb: string,
  a: number,
): void {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(0.42, `rgba(${rgb},${a * 0.38})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x0, -half0);
  ctx.lineTo(x1, -half1);
  ctx.lineTo(x1, half1);
  ctx.lineTo(x0, half0);
  ctx.closePath();
  ctx.fill();
}

function mason(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  rows: number,
): void {
  ctx.save();
  rr(ctx, x, y, w, h, Math.min(4, w * 0.14, h * 0.14));
  ctx.clip();
  const bw = w / Math.max(1, cols);
  const bh = h / Math.max(1, rows);
  ctx.strokeStyle = 'rgba(12,24,56,0.34)';
  ctx.lineWidth = 1.15;
  ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(255,255,245,0.12)';
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (bw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const bx = x + c * bw + off;
      const by = y + r * bh;
      ctx.strokeRect(bx + 0.55, by + 0.55, bw - 1.1, bh - 1.1);
      ctx.fillRect(bx + 1.4, by + 1.05, bw * 0.36, bh * 0.2);
    }
  }
  ctx.restore();
}

function bolt(ctx: CanvasRenderingContext2D, x: number, y: number, r = 1.7): void {
  clayBall(ctx, x, y, r, C.goldHi, C.gold, C.goldLo, 1.15);
}

function merlons(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  n: number,
  h = 9,
  hi: string = C.stoneHi,
  mid: string = C.stone,
  lo: string = C.stoneLo,
): void {
  const slot = w / Math.max(1, n);
  const mw = slot * 0.56;
  for (let i = 0; i < n; i++) {
    clayRect(ctx, x + i * slot + (slot - mw) * 0.5, y - h, mw, h + 3, 1.4, hi, mid, lo, 1.8);
  }
}

function labelText(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, size: number): void {
  ctx.font = `800 ${size}px Impact, Arial Black, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;
  ctx.fillText(text, x, y + 0.9);
  ctx.fillStyle = C.white;
  ctx.fillText(text, x, y);
}

function toyWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  rows: number,
): void {
  clayRect(ctx, x, y, w, h, 2, '#8ec8f0', '#2a5088', '#122040', 1.8);
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.fillRect(x + 1.5, y + 1.2, w * 0.4, h * 0.32);
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 1.3;
  ctx.lineJoin = 'round';
  const cw = w / cols;
  const rh = h / rows;
  for (let c = 1; c < cols; c++) {
    ctx.beginPath();
    ctx.moveTo(x + c * cw, y + 1);
    ctx.lineTo(x + c * cw, y + h - 1);
    ctx.stroke();
  }
  for (let r = 1; r < rows; r++) {
    ctx.beginPath();
    ctx.moveTo(x + 1, y + r * rh);
    ctx.lineTo(x + w - 1, y + r * rh);
    ctx.stroke();
  }
}

function toyColumn(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const line = h > 28 ? INK_W : 2.2;
  const capH = Math.max(5, Math.min(11, h * 0.18));
  const baseH = Math.max(4, Math.min(9, h * 0.15));
  clayRect(ctx, x - 2.5, y + h - baseH, w + 5, baseH, 2, C.goldHi, C.gold, C.goldLo, line);
  clayRect(ctx, x + w * 0.16, y + capH, w * 0.68, h - capH - baseH, w * 0.28, C.white, '#e8e2d6', C.stoneLo, line);
  ctx.fillStyle = C.blueLo;
  ctx.globalAlpha = 0.42;
  ctx.fillRect(x + w * 0.16, y + capH, w * 0.2, h - capH - baseH);
  ctx.globalAlpha = 1;
  goldBand(ctx, x + w * 0.04, y + capH - 1, w * 0.92, Math.max(3.5, capH * 0.42));
  goldBand(ctx, x + w * 0.04, y + h - baseH - 3, w * 0.92, Math.max(3.5, capH * 0.42));
  clayRect(ctx, x - 2.5, y, w + 5, capH, 2.5, C.goldHi, C.gold, C.goldLo, line);
}

function woodDoor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  clayRect(ctx, x - 2, y - 2, w + 4, h + 3, 3, C.goldHi, C.gold, C.goldLo, 1.8);
  clayRect(ctx, x, y, w, h, 2.5, C.woodHi, C.wood, C.woodLo, 1.9);
  ctx.fillStyle = C.woodLo;
  ctx.fillRect(x + w * 0.48, y + 3, 1.4, h - 6);
  clayRect(ctx, x + w - 7, y + h * 0.48, 3.5, 3.5, 1.5, C.goldHi, C.gold, C.goldLo, 1.3);
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 2);
  ctx.lineTo(x + w * 0.5, y - h * 0.16);
  ctx.lineTo(x + w - 2, y + 2);
  ctx.closePath();
  paint(ctx, lin(ctx, x, y, x + w, y, C.blueHi, C.blue, C.blueLo), 1.6);
}

/** Damage pulse on the keep — used alone when painted map art already draws the building. */
export function drawKeepLeak(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number,
  leak: number,
): void {
  if (leak <= 0) return;
  const pulse = 0.28 + Math.abs(Math.sin(time * 8)) * 0.42;
  rr(ctx, x + 3, y + 4, w - 6, h - 8, 14);
  ctx.strokeStyle = `rgba(200,16,46,${pulse * leak})`;
  ctx.lineWidth = 5 + leak * 3;
  ctx.lineJoin = 'round';
  ctx.stroke();
  rr(ctx, x + 6, y + 7, w - 12, h - 14, 12);
  ctx.strokeStyle = `rgba(255,90,90,${pulse * 0.45 * leak})`;
  ctx.lineWidth = 2.2;
  ctx.stroke();
}

function leakRim(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  time: number,
  leak: number,
): void {
  drawKeepLeak(ctx, x, y, w, h, time, leak);
}

function keepCannon(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir);
  clayBall(ctx, 0, 0, 9.5, C.steelHi, C.steel, C.steelLo, 2);
  goldBand(ctx, -6, -3, 12, 3.2);
  clayRect(ctx, 2, -9, 22, 6.5, 3, C.steelHi, C.steel, C.steelLo, 1.8);
  clayRect(ctx, 2, 2.5, 22, 6.5, 3, C.steelHi, C.steel, C.steelLo, 1.8);
  goldBand(ctx, 8, -10, 3.2, 8);
  goldBand(ctx, 8, 1.5, 3.2, 8);
  goldBand(ctx, 18, -10.5, 5, 9);
  goldBand(ctx, 18, 1, 5, 9);
  clayOval(ctx, 24, -5.8, 3.2, 4.2, 0, C.goldHi, C.gold, C.goldLo, 1.4);
  clayOval(ctx, 24, 5.8, 3.2, 4.2, 0, C.goldHi, C.gold, C.goldLo, 1.4);
  ctx.restore();
}

function palmFrond(ctx: CanvasRenderingContext2D, time: number, scale: number): void {
  const sway = Math.sin(time * 1.6) * 0.14;
  ctx.save();
  ctx.rotate(sway);
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate(-0.95 + i * 0.27);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(16 * scale, -5 * scale, 24 * scale, 1 * scale);
    ctx.quadraticCurveTo(12 * scale, 4 * scale, 0, 2 * scale);
    ctx.closePath();
    paint(ctx, i % 2 === 0 ? C.grassHi : C.gold, 1.5);
    ctx.restore();
  }
  ctx.restore();
}

function miniPalm(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 5; i++) {
    clayRect(ctx, -3 * s, (10 - i * 6) * s, 6 * s, 7 * s, 2, C.woodHi, C.wood, C.woodLo, 1.5);
  }
  ctx.translate(0, -18 * s);
  palmFrond(ctx, time, s);
  ctx.restore();
}

function magaBrick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, glow: number): void {
  if (glow > 0) {
    ctx.fillStyle = `rgba(255,70,40,${0.22 * glow})`;
    rr(ctx, x - 3, y - 3, w + 6, h + 6, 4);
    ctx.fill();
    ctx.fillStyle = `rgba(255,200,80,${0.16 * glow})`;
    rr(ctx, x - 1, y - 1, w + 2, h + 2, 3);
    ctx.fill();
  }
  clayRect(ctx, x, y, w, h, 2.4, C.redHi, C.red, C.redLo, 1.8);
  ctx.fillStyle = C.white;
  ctx.font = `800 ${Math.max(5, h * 0.42)}px Impact, Arial Black, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MAGA', x + w * 0.5, y + h * 0.55);
}

function wheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  clayBall(ctx, x, y, r, C.woodHi, C.wood, C.woodLo, 2);
  ink(ctx, 1.35);
  ctx.strokeStyle = C.woodLo;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82);
    ctx.stroke();
  }
  clayBall(ctx, x, y, r * 0.42, C.goldHi, C.gold, C.goldLo, 1.5);
  clayBall(ctx, x, y, r * 0.16, C.steelHi, C.steel, C.steelLo, 1.15);
}

function plaque(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  size: number,
): void {
  clayRect(ctx, x - 1.6, y - 1.6, w + 3.2, h + 3.2, 3.6, C.goldHi, C.gold, C.goldLo, 1.8);
  clayRect(ctx, x, y, w, h, 2.6, C.blueHi, C.blue, C.blueLo, 1.6);
  goldBand(ctx, x, y, w, Math.max(2, h * 0.22));
  goldBand(ctx, x, y + h - Math.max(2, h * 0.18), w, Math.max(2, h * 0.18));
  labelText(ctx, x + w * 0.5, y + h * 0.56, text, size);
}

function lawnKeep(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, leak: number): void {
  const cx = x + w * 0.5;
  ground(ctx, cx, y + h * 0.95, w * 0.48, h * 0.055);
  leakRim(ctx, x, y, w, h, time, leak);

  const wallY = y + h * 0.72;
  const wallH = h * 0.23;
  clayRect(ctx, x + w * 0.02, wallY, w * 0.96, wallH, 6, C.stoneHi, C.stone, C.stoneLo, INK_W);
  mason(ctx, x + w * 0.02, wallY, w * 0.96, wallH, 10, 3);
  goldBand(ctx, x + w * 0.02, wallY, w * 0.96, 6);
  goldBand(ctx, x + w * 0.02, wallY + wallH - 5, w * 0.96, 5);
  merlons(ctx, x + w * 0.08, wallY, w * 0.84, 11, Math.max(10, h * 0.055));
  clayRect(ctx, x + w * 0.18, y + h * 0.86, w * 0.64, h * 0.08, 4, C.goldHi, C.gold, C.goldLo, INK_W);

  const tw = w * 0.2;
  const th = h * 0.42;
  for (const side of [0.03, 0.77] as const) {
    const tx = x + w * side;
    const ty = y + h * 0.38;
    clayRect(ctx, tx, ty, tw, th, 5, C.stoneHi, C.stone, C.stoneLo, INK_W);
    mason(ctx, tx, ty, tw, th, 3, 5);
    goldBand(ctx, tx - 2, ty, tw + 4, 5);
    merlons(ctx, tx + 3, ty, tw - 6, 3, 11);
    toyWindow(ctx, tx + tw * 0.28, ty + th * 0.22, tw * 0.44, th * 0.16, 2, 2);
    toyWindow(ctx, tx + tw * 0.28, ty + th * 0.48, tw * 0.44, th * 0.16, 2, 2);
    keepCannon(ctx, tx + tw * 0.5, ty + 16, side < 0.5 ? Math.PI : 0);
  }

  const wingY = y + h * 0.46;
  const wingH = h * 0.28;
  clayRect(ctx, x + w * 0.2, wingY, w * 0.18, wingH, 5, C.white, '#f4efe6', C.stoneLo, INK_W);
  clayRect(ctx, x + w * 0.62, wingY, w * 0.18, wingH, 5, C.white, '#f4efe6', C.stoneLo, INK_W);
  goldBand(ctx, x + w * 0.2, wingY, w * 0.18, 4);
  goldBand(ctx, x + w * 0.62, wingY, w * 0.18, 4);
  toyWindow(ctx, x + w * 0.225, wingY + wingH * 0.2, w * 0.13, wingH * 0.36, 2, 2);
  toyWindow(ctx, x + w * 0.645, wingY + wingH * 0.2, w * 0.13, wingH * 0.36, 2, 2);

  const bx = x + w * 0.24;
  const by = y + h * 0.26;
  const bw = w * 0.52;
  const bh = h * 0.48;
  clayRect(ctx, bx, by, bw, bh, 6, C.white, '#f7f3ea', C.stoneLo, INK_W);
  mason(ctx, bx, by + bh * 0.55, bw, bh * 0.45, 6, 3);
  goldBand(ctx, bx - 2, by, bw + 4, 6);
  toyWindow(ctx, bx + 6, by + bh * 0.1, bw * 0.14, bh * 0.18, 2, 2);
  toyWindow(ctx, bx + bw - bw * 0.14 - 6, by + bh * 0.1, bw * 0.14, bh * 0.18, 2, 2);

  const px = bx + bw * 0.14;
  const py = by + bh * 0.28;
  const pw = bw * 0.72;
  const ph = bh * 0.72;
  clayRect(ctx, px, py, pw, ph, 3, C.blueHi, C.blue, C.blueLo, INK_W);
  goldBand(ctx, px, py, pw, 4);

  const doorW = Math.min(24, bw * 0.18);
  woodDoor(ctx, cx - doorW * 0.5, py + ph - bh * 0.42, doorW, bh * 0.4);

  const colW = Math.max(12, pw * 0.14);
  const colH = ph - 8;
  const colY = py + ph - colH;
  const colSlots = [0.12, 0.34, 0.66, 0.88];
  for (let i = 0; i < colSlots.length; i++) {
    toyColumn(ctx, px + pw * colSlots[i]! - colW * 0.5, colY, colW, colH);
  }

  const pL = px - 7;
  const pR = px + pw + 7;
  const pBase = py + 4;
  const pPeak = by - h * 0.02;
  tri(ctx, pL, pBase, cx, pPeak, pR, pBase, C.blueHi, C.blueLo, INK_W);
  ctx.beginPath();
  ctx.moveTo(pL + 10, pBase - 2);
  ctx.lineTo(cx, pPeak + 10);
  ctx.lineTo(pR - 10, pBase - 2);
  ctx.closePath();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2.8;
  ctx.lineJoin = 'round';
  ctx.stroke();
  goldBand(ctx, pL - 2, pBase - 4, pR - pL + 4, 6);
  star5(ctx, cx, pPeak + (pBase - pPeak) * 0.58, Math.max(14, h * 0.085), Math.max(5.8, h * 0.034));

  const drumW = bw * 0.42;
  const drumH = h * 0.09;
  const drumY = pPeak - drumH * 0.55;
  clayRect(ctx, cx - drumW * 0.5, drumY, drumW, drumH, 3, C.blueHi, C.blue, C.blueLo, INK_W);
  goldBand(ctx, cx - drumW * 0.52, drumY, drumW + 4, 4);
  goldBand(ctx, cx - drumW * 0.52, drumY + drumH * 0.55, drumW + 4, 4);
  clayOval(ctx, cx, drumY + 3, drumW * 0.52, h * 0.125, 0, C.goldHi, C.gold, C.goldLo, INK_W);
  clayOval(ctx, cx, drumY + 1, drumW * 0.34, h * 0.07, 0, C.goldHi, C.white, C.gold, 1.8);
  const domeTop = drumY + 3 - h * 0.125;
  clayRect(ctx, cx - 4.5, y + h * 0.03, 9, Math.max(8, domeTop - (y + h * 0.03)), 2, C.goldHi, C.gold, C.goldLo, INK_W);
  clayBall(ctx, cx, y + h * 0.03, 7, C.goldHi, C.gold, C.goldLo, INK_W);
  star5(ctx, cx, y - 1, 8.5, 3.5);

  usFlag(ctx, x + w * 0.13, y + h * 0.2, time, 0.92);
  usFlag(ctx, x + w * 0.87, y + h * 0.2, time + 0.4, 0.92);
}

function palazzoKeep(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, leak: number): void {
  const cx = x + w * 0.5;
  ground(ctx, cx, y + h * 0.95, w * 0.46, h * 0.05);
  leakRim(ctx, x, y, w, h, time, leak);
  miniPalm(ctx, x + w * 0.08, y + h * 0.72, time, 0.85);
  miniPalm(ctx, x + w * 0.92, y + h * 0.72, time + 0.8, 0.85);

  clayRect(ctx, x + w * 0.06, y + h * 0.82, w * 0.88, h * 0.13, 5, C.stoneHi, C.stone, C.stoneLo);
  mason(ctx, x + w * 0.06, y + h * 0.82, w * 0.88, h * 0.13, 8, 2);
  merlons(ctx, x + w * 0.1, y + h * 0.82, w * 0.8, 9, 10, C.goldHi, C.gold, C.goldLo);
  clayRect(ctx, x + w * 0.1, y + h * 0.84, w * 0.8, h * 0.1, 5, C.goldHi, C.gold, C.goldLo);

  const bx = x + w * 0.14;
  const by = y + h * 0.34;
  const bw = w * 0.72;
  const bh = h * 0.52;
  clayRect(ctx, bx, by, bw, bh, 8, C.goldHi, C.gold, C.goldLo);
  goldBand(ctx, bx - 3, by - 2, bw + 6, 7);
  merlons(ctx, bx + 8, by, bw - 16, 7, 9, C.goldHi, C.gold, C.goldLo);

  const archW = bw * 0.13;
  const archH = bh * 0.42;
  for (let i = 0; i < 5; i++) {
    const ax = bx + bw * 0.07 + i * (bw * 0.175);
    const ay = by + bh - archH - 3;
    ctx.beginPath();
    ctx.moveTo(ax, ay + archH);
    ctx.lineTo(ax, ay + archW * 0.55);
    ctx.arc(ax + archW * 0.5, ay + archW * 0.55, archW * 0.5, Math.PI, 0);
    ctx.lineTo(ax + archW, ay + archH);
    ctx.closePath();
    paint(ctx, lin(ctx, ax, ay, ax + archW, ay + archH, '#3a2060', '#120818'), 1.8);
    clayBall(ctx, ax + archW * 0.5, ay + 4, 3.2, C.goldHi, C.gold, C.goldLo, 1.4);
  }
  for (let i = 0; i < 5; i++) {
    toyWindow(ctx, bx + bw * 0.09 + i * bw * 0.17, by + bh * 0.14, bw * 0.1, bh * 0.2, 2, 2);
  }

  keepCannon(ctx, x + w * 0.12, y + h * 0.5, Math.PI);
  keepCannon(ctx, x + w * 0.88, y + h * 0.5, 0);

  tri(ctx, bx - 10, by + 8, cx, y + h * 0.06, bx + bw + 10, by + 8, C.goldHi, C.goldLo);
  goldBand(ctx, bx - 6, by + 4, bw + 12, 5);
  clayOval(ctx, cx, y + h * 0.16, bw * 0.18, h * 0.08, 0, C.goldHi, C.gold, C.goldLo, INK_W);
  star5(ctx, cx, y + h * 0.16, 11, 4.6);
  usFlag(ctx, bx + bw - 4, y + h * 0.08, time, 0.9);
}

function borderKeep(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, leak: number): void {
  const cx = x + w * 0.5;
  ground(ctx, cx, y + h * 0.95, w * 0.44, h * 0.05);
  leakRim(ctx, x, y, w, h, time, leak);
  clayRect(ctx, x + w * 0.08, y + h * 0.84, w * 0.84, h * 0.11, 4, C.sandHi, C.sand, C.sandLo);
  goldBand(ctx, x + w * 0.08, y + h * 0.84, w * 0.84, 4);

  const wallX = x + w * 0.18;
  const wallY = y + h * 0.34;
  const wallW = w * 0.64;
  const wallH = h * 0.52;
  clayRect(ctx, wallX, wallY, wallW, wallH, 4, C.sandHi, C.sand, C.sandLo);
  mason(ctx, wallX, wallY, wallW, wallH, 8, 6);
  goldBand(ctx, wallX - 2, wallY - 2, wallW + 4, 5);
  merlons(ctx, wallX + 2, wallY, wallW - 4, 8, 13, C.steelHi, C.steel, C.steelLo);

  const tw = w * 0.18;
  const th = h * 0.58;
  for (const side of [0.08, 0.74]) {
    const tx = x + w * side;
    const ty = y + h * 0.24;
    clayRect(ctx, tx, ty, tw, th, 4, C.sandHi, C.sand, C.sandLo);
    mason(ctx, tx, ty, tw, th, 3, 6);
    toyWindow(ctx, tx + tw * 0.28, ty + th * 0.18, tw * 0.44, th * 0.14, 2, 2);
    toyWindow(ctx, tx + tw * 0.28, ty + th * 0.48, tw * 0.44, th * 0.14, 2, 2);
    merlons(ctx, tx + 2, ty, tw - 4, 3, 10, C.steelHi, C.steel, C.steelLo);
    keepCannon(ctx, tx + tw * 0.5, ty + 14, side < 0.5 ? Math.PI : 0);
  }

  woodDoor(ctx, cx - 12, wallY + wallH - 36, 24, 34);
  usFlag(ctx, x + w * 0.82, y + h * 0.08, time, 1);
  clayRect(ctx, cx - 1.5, y + h * 0.08, 3, wallY - y - h * 0.08, 1, C.goldHi, C.gold, C.goldLo, 1.5);
  star5(ctx, cx, y + h * 0.07, 8, 3.4);
}

function avenueKeep(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, leak: number): void {
  const cx = x + w * 0.5;
  ground(ctx, cx, y + h * 0.96, w * 0.38, h * 0.045);
  leakRim(ctx, x, y, w, h, time, leak);

  clayRect(ctx, x + w * 0.12, y + h * 0.86, w * 0.76, h * 0.1, 5, C.stoneHi, C.stone, C.stoneLo);
  mason(ctx, x + w * 0.12, y + h * 0.86, w * 0.76, h * 0.1, 8, 2);
  merlons(ctx, x + w * 0.16, y + h * 0.86, w * 0.68, 8, 10);

  const tiers = [
    { t: 0.7, hh: 0.2, yy: 0.74 },
    { t: 0.56, hh: 0.2, yy: 0.54 },
    { t: 0.42, hh: 0.2, yy: 0.34 },
    { t: 0.28, hh: 0.16, yy: 0.18 },
  ] as const;
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i]!;
    const tw = w * t.t;
    const th = h * t.hh;
    const tx = x + (w - tw) * 0.5;
    const ty = y + h * t.yy;
    clayRect(ctx, tx, ty, tw, th, 5, C.goldHi, C.gold, C.goldLo);
    goldBand(ctx, tx - 2, ty, tw + 4, 4);
    const cols = 4 + i;
    const rows = 3;
    const pad = 7;
    const gw = (tw - pad * 2) / cols;
    const gh = (th - pad * 2) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        clayRect(
          ctx,
          tx + pad + c * gw + 1.5,
          ty + pad + r * gh + 1.5,
          gw - 3.5,
          gh - 3.5,
          1.6,
          '#6aa0d0',
          '#1a3058',
          '#0a1428',
          1.3,
        );
      }
    }
  }
  const lobbyW = w * 0.26;
  clayRect(ctx, cx - lobbyW * 0.5, y + h * 0.86, lobbyW, h * 0.1, 4, C.goldHi, C.gold, C.goldLo);
  clayRect(ctx, cx - lobbyW * 0.12, y + h * 0.9, lobbyW * 0.24, h * 0.07, 2, C.blueHi, C.blue, INK, 1.6);
  const capW = w * 0.22;
  clayRect(ctx, cx - capW * 0.5, y + h * 0.06, capW, h * 0.12, 4, C.goldHi, C.gold, C.goldLo);
  merlons(ctx, cx - capW * 0.46, y + h * 0.06, capW * 0.92, 4, 8, C.goldHi, C.gold, C.goldLo);
  star5(ctx, cx, y + h * 0.04, 8.5, 3.6);
  tri(ctx, cx - 6, y + h * 0.06, cx, y, cx + 6, y + h * 0.06, C.goldHi, C.goldLo, 1.6);
  keepCannon(ctx, x + w * 0.22, y + h * 0.7, Math.PI);
  keepCannon(ctx, x + w * 0.78, y + h * 0.7, 0);
  usFlag(ctx, cx + capW * 0.45, y + h * 0.0, time, 0.85);
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

function truthArt(ctx: CanvasRenderingContext2D, tier: number, angle: number, time: number, cooldown: number): void {
  const t = Math.max(0, Math.min(2, Math.floor(tier)));
  const bodyH = 28 + t * 5;
  const dishR = 15.5 + t * 2.6;
  const pulse = 0.48 + Math.sin(time * 12) * 0.22 + (cooldown < 0.08 ? 0.38 : 0);

  ground(ctx, 1, 20, 18, 6);
  clayRect(ctx, -18, 8, 36, 14, 4, C.stoneHi, C.stone, C.stoneLo);
  mason(ctx, -18, 8, 36, 14, 5, 2);
  goldBand(ctx, -19, 8, 38, 3.6);
  goldBand(ctx, -19, 19, 38, 3.2);
  bolt(ctx, -15, 14);
  bolt(ctx, 15, 14);

  clayRect(ctx, -12, 8 - bodyH, 24, bodyH, 4, C.stoneHi, C.stone, C.stoneLo);
  mason(ctx, -12, 8 - bodyH, 24, bodyH, 3, 4 + t);
  goldBand(ctx, -13, 8 - bodyH, 26, 3.2);
  clayRect(ctx, -14, 8 - bodyH + 5, 4, bodyH - 10, 1.2, C.goldHi, C.gold, C.goldLo, 1.4);
  clayRect(ctx, 10, 8 - bodyH + 5, 4, bodyH - 10, 1.2, C.goldHi, C.gold, C.goldLo, 1.4);

  glowDisk(ctx, 0, 8 - bodyH * 0.48, 9, '200,16,46', 0.32 + pulse * 0.28);
  clayRect(ctx, -5.5, 8 - bodyH * 0.48 - 4.5, 11, 9, 2, C.redHi, C.red, C.redLo, 1.8);
  ctx.fillStyle = `rgba(255,230,140,${0.5 + pulse * 0.4})`;
  ctx.fillRect(-3.2, 8 - bodyH * 0.48 - 2.4, 6.4, 4.4);

  clayRect(ctx, -16, 8 - bodyH - 6, 32, 8, 2.6, C.woodHi, C.wood, C.woodLo, 2);
  goldBand(ctx, -16, 8 - bodyH - 6, 32, 2.6);
  bolt(ctx, -13, 8 - bodyH - 2);
  bolt(ctx, 13, 8 - bodyH - 2);
  merlons(ctx, -14, 8 - bodyH - 6, 28, 5, 5, C.woodHi, C.wood, C.woodLo);

  usFlag(ctx, -17, 8 - bodyH - 22, time, 0.42);
  plaque(ctx, -12, 13, 24, 8.5, 'FACT', 7);

  ctx.save();
  ctx.translate(0, 8 - bodyH - 4);
  ctx.rotate(angle);
  glowDisk(ctx, 15, 0, dishR + 7, '200,16,46', 0.26 + pulse * 0.22);
  clayRect(ctx, -5, -4.5, 13, 9, 2.6, C.steelHi, C.steel, C.steelLo, 1.8);
  goldBand(ctx, 2, -5.5, 3.2, 11);
  clayOval(ctx, 16 + t, 0, dishR, dishR * 0.58, 0, C.steelHi, C.blueHi, C.blueLo, 2.8);
  clayOval(ctx, 14.2 + t, 0, dishR * 0.72, dishR * 0.38, 0, '#dff0ff', C.blueHi, C.blue, 1.6);
  ctx.beginPath();
  ctx.ellipse(16 + t, 0, dishR * 0.94, dishR * 0.52, 0, 0, Math.PI * 2);
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  clayRect(ctx, 6, -2.6, 10, 5.2, 2, C.steelHi, C.steel, C.steelLo, 1.5);
  clayBall(ctx, 8.5, 0, 3.5, C.redHi, C.red, C.redLo, 1.8);
  glowDisk(ctx, 8.5, 0, 7.5, '255,90,40', pulse * 0.55);
  glowCone(ctx, 18, 52 + t * 5, 2.8, 10, '200,16,46', pulse);
  glowCone(ctx, 18, 44 + t * 4, 1.2, 3.6, '255,220,120', pulse * 0.9);
  ctx.restore();
}

function trebArt(ctx: CanvasRenderingContext2D, tier: number, angle: number, time: number, cooldown: number): void {
  const t = Math.max(0, Math.min(2, Math.floor(tier)));
  const period = 2.1;
  const u = Math.max(0, Math.min(1, cooldown / period));
  const recoil = u * u * (8 + t);
  const glow = 0.28 + (1 - u) * 0.4 + Math.sin(time * 8) * 0.08;

  ground(ctx, 2, 20, 20, 6.5);
  clayRect(ctx, -22, 4, 44, 16, 5, C.woodHi, C.wood, C.woodLo);
  goldBand(ctx, -23, 4, 46, 3.6);
  goldBand(ctx, -23, 16.5, 46, 4);
  bolt(ctx, -18, 10);
  bolt(ctx, 0, 12);
  bolt(ctx, 18, 10);
  clayRect(ctx, -20, 14, 40, 5, 2, C.steelHi, C.steel, C.steelLo, 1.6);
  wheel(ctx, -15, 20, 8.2 + t * 0.55);
  wheel(ctx, 15, 20, 8.2 + t * 0.55);
  usFlag(ctx, -20, -12, time, 0.48);
  plaque(ctx, -12, 6, 24, 8, 'TAX', 7);

  ctx.save();
  ctx.rotate(angle);
  ctx.translate(-recoil, 0);
  const len = 32 + t * 4;
  glowDisk(ctx, len - 2, 0, 13, '76,127,214', 0.32 + glow * 0.25);
  clayBall(ctx, -2, 0, 9.2, C.blueHi, C.blue, C.blueLo, 2.2);
  goldBand(ctx, -6, -5, 10, 3);
  clayRect(ctx, -5, -9.5, len, 19, 8, C.blueHi, C.blue, C.blueLo, 2.4);
  goldBand(ctx, 6, -10.5, 4.2, 21);
  goldBand(ctx, 16, -10.5, 4.2, 21);
  goldBand(ctx, len - 13, -11.5, 8, 23);
  bolt(ctx, 8, 0, 1.8);
  bolt(ctx, 18, 0, 1.8);
  labelText(ctx, len * 0.4, 0.6, 'TAX', 8);
  clayOval(ctx, len - 1, 0, 6.2, 10.5, 0, C.steelHi, C.steel, C.steelLo, 2);
  clayOval(ctx, len + 1.4, 0, 3.6, 6.8, 0, '#140c18', C.blueLo, INK, 1.6);
  glowDisk(ctx, len + 2, 0, 9, '255,210,90', glow);
  ctx.restore();
}

function brickArt(ctx: CanvasRenderingContext2D, tier: number, angle: number, time: number, cooldown: number): void {
  const t = Math.max(0, Math.min(2, Math.floor(tier)));
  const recoil = Math.max(0, Math.min(1, cooldown * 1.8)) * 5;
  const glow = 0.55 + Math.sin(time * 6) * 0.22;

  ground(ctx, 1, 20, 18, 6);
  clayRect(ctx, -20, 6, 40, 16, 4, C.stoneHi, C.stone, C.stoneLo);
  mason(ctx, -20, 6, 40, 16, 5, 2);
  goldBand(ctx, -21, 6, 42, 3.5);
  goldBand(ctx, -21, 19, 42, 3);
  merlons(ctx, -18, 6, 36, 5, 7);
  bolt(ctx, -16, 13);
  bolt(ctx, 16, 13);

  usFlag(ctx, -18, -20, time, 0.45);
  if (t >= 1) usFlag(ctx, 18, -18, time + 0.35, 0.4);

  glowDisk(ctx, 0, -2, 20, '200,16,46', 0.18 + glow * 0.16);
  clayRect(ctx, -16, -10, 32, 18, 4, C.redHi, C.red, C.redLo);
  goldBand(ctx, -16, -11, 32, 3.5);
  goldBand(ctx, -16, 6, 32, 3.5);
  magaBrick(ctx, -12, -8, 24, 8, glow);
  magaBrick(ctx, -10, 1, 20, 6.5, glow * 0.85);
  if (t >= 2) star5(ctx, 0, -16, 5.8, 2.4);

  plaque(ctx, -12, 13.5, 24, 8.5, 'WALL', 6.5);

  ctx.save();
  ctx.rotate(angle);
  ctx.translate(-recoil, 0);
  clayRect(ctx, 4, -7.5, 24 + t * 3, 15, 5, C.steelHi, C.steel, C.steelLo, 2.2);
  goldBand(ctx, 10, -8.5, 3.6, 17);
  goldBand(ctx, 24 + t * 3, -9.5, 7, 19);
  magaBrick(ctx, 8, -4.2, 16, 8.4, glow + (cooldown < 0.15 ? 0.4 : 0));
  clayOval(ctx, 28 + t * 3, 0, 4.4, 7.4, 0, C.redHi, C.red, C.redLo, 1.6);
  glowDisk(ctx, 30 + t * 3, 0, 8.5, '255,80,40', 0.28 + glow * 0.22);
  ctx.restore();
}

function deskArt(ctx: CanvasRenderingContext2D, tier: number, _angle: number, time: number, _cooldown: number): void {
  const t = Math.max(0, Math.min(2, Math.floor(tier)));
  const pulse = 0.24 + Math.sin(time * 4) * 0.08;

  ground(ctx, 2, 20, 19, 6);
  glowDisk(ctx, 0, 2, 30 + t * 4, '230,195,92', pulse);
  ctx.strokeStyle = `rgba(230,195,92,${0.42 + Math.sin(time * 5) * 0.16})`;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0, 5, 26 + t * 3, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,243,176,${0.28 + Math.sin(time * 5 + 1) * 0.12})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 5, 19 + t * 2, 8, 0, 0, Math.PI * 2);
  ctx.stroke();

  clayRect(ctx, -20, 8, 40, 12, 4, C.stoneHi, C.stone, C.stoneLo);
  mason(ctx, -20, 8, 40, 12, 5, 2);
  goldBand(ctx, -21, 8, 42, 3.4);
  merlons(ctx, -18, 8, 36, 6, 6);

  clayRect(ctx, -18, -2, 36, 16, 4, C.woodHi, C.wood, C.woodLo);
  clayRect(ctx, -21, -9, 42, 11, 3.2, C.goldHi, C.gold, C.goldLo);
  goldBand(ctx, -8, 0, 5.2, 7);
  goldBand(ctx, 2.8, 0, 5.2, 7);
  clayRect(ctx, -15, 4, 10, 8, 2, C.goldHi, C.gold, C.goldLo, 1.5);
  clayRect(ctx, 5, 4, 10, 8, 2, C.goldHi, C.gold, C.goldLo, 1.5);
  bolt(ctx, -10, 8, 1.5);
  bolt(ctx, 10, 8, 1.5);

  clayBall(ctx, -14, -11, 3.2, C.goldHi, C.gold, C.goldLo, 1.4);
  clayBall(ctx, 14, -11, 3.2, C.goldHi, C.gold, C.goldLo, 1.4);
  star5(ctx, 0, -14, 6.2, 2.6);

  ctx.save();
  ctx.translate(-12, -13);
  ctx.rotate(-0.38);
  clayRect(ctx, 0, -3, 16, 6, 2, C.steelHi, C.steel, C.steelLo, 1.6);
  goldBand(ctx, 11, -3.5, 3, 7);
  ctx.restore();
  ctx.save();
  ctx.translate(12, -13);
  ctx.rotate(0.38);
  clayRect(ctx, 0, -3, 16, 6, 2, C.steelHi, C.steel, C.steelLo, 1.6);
  goldBand(ctx, 11, -3.5, 3, 7);
  ctx.restore();

  usFlag(ctx, 17, -22, time, 0.48);
  usFlag(ctx, -17, -20, time + 0.5, 0.42);

  for (let i = 0; i < 3 + t; i++) {
    const a = time * 1.5 + i * 2.1;
    ctx.save();
    ctx.translate(Math.cos(a) * (16 + t * 2), Math.sin(a) * 7.5 - 13);
    ctx.rotate(a);
    clayRect(ctx, -5.5, -3.2, 11, 7.4, 1.6, C.white, '#f0e8d0', '#d0c4a8', 1.4);
    ctx.fillStyle = C.blue;
    ctx.fillRect(-3.4, -1.2, 6.8, 1.3);
    ctx.fillStyle = C.red;
    ctx.fillRect(-3.4, 1.4, 5.2, 1.1);
    ctx.restore();
  }
  plaque(ctx, -11, 16, 22, 8.5, 'EO', 7.5);
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

function alienArt(ctx: CanvasRenderingContext2D, angle: number, bob: number, _time: number): void {
  ctx.rotate(angle * 0.35);
  const walk = Math.sin(bob) * 0.45;

  ctx.save();
  ctx.translate(-16, 1);
  ctx.rotate(-0.55 + walk * 0.25);
  clayOval(ctx, 0, 0, 5, 8.5, 0.15, C.oceanHi, C.ocean, C.oceanLo, INK_W);
  clayBall(ctx, 0, 8, 3.8, C.goldHi, C.gold, C.goldLo, 2.2);
  ctx.restore();
  ctx.save();
  ctx.translate(16, 1);
  ctx.rotate(0.55 - walk * 0.25);
  clayOval(ctx, 0, 0, 5, 8.5, -0.15, C.oceanHi, C.ocean, C.oceanLo, INK_W);
  clayBall(ctx, 0, 8, 3.8, C.goldHi, C.gold, C.goldLo, 2.2);
  ctx.restore();

  ctx.save();
  ctx.translate(-7.5, 14);
  ctx.rotate(-0.28 + walk);
  clayOval(ctx, 0, 0, 5, 8, 0.12, C.oceanHi, C.ocean, C.oceanLo, INK_W);
  clayBall(ctx, 0, 7.2, 3.6, C.goldHi, C.gold, C.goldLo, 2.2);
  ctx.restore();
  ctx.save();
  ctx.translate(7.5, 14);
  ctx.rotate(0.28 - walk);
  clayOval(ctx, 0, 0, 5, 8, -0.12, C.oceanHi, C.ocean, C.oceanLo, INK_W);
  clayBall(ctx, 0, 7.2, 3.6, C.goldHi, C.gold, C.goldLo, 2.2);
  ctx.restore();

  clayBall(ctx, 0, -1, 14.5, C.oceanHi, C.ocean, C.oceanLo, INK_W);
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, -1, 14.5, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = C.land;
  ctx.beginPath();
  ctx.ellipse(-5.5, -5.5, 6.8, 4.6, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(6.4, 1.2, 5.4, 3.8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-1.2, 7.4, 5.8, 3.2, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, 2);
  ctx.strokeStyle = C.landLo;
  ctx.beginPath();
  ctx.ellipse(-5.5, -5.5, 6.8, 4.6, -0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(6.4, 1.2, 5.4, 3.8, 0.3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  clayOval(ctx, 0, -1, 15, 5.2, 0.12, C.goldHi, C.gold, C.goldLo, INK_W);
  ctx.beginPath();
  ctx.arc(0, -1, 14.5, 0, Math.PI * 2);
  ink(ctx, INK_W);
  ctx.stroke();

  clayRect(ctx, -13, 1.6, 26, 7, 2.2, C.redHi, C.red, C.redLo, INK_W);
  star5(ctx, 0, 5.1, 4.6, 1.9);

  clayRect(ctx, -12, -21.5, 24, 7.5, 2.2, C.goldHi, C.gold, C.goldLo, INK_W);
  for (let i = 0; i < 5; i++) {
    const sx = -10.5 + i * 5.2;
    const peak = i === 2 ? -36 : -30;
    tri(ctx, sx, -21.5, sx + 2.6, peak, sx + 5.2, -21.5, C.goldHi, C.goldLo, 2.2);
  }
  clayBall(ctx, 0, -21.5, 3, C.redHi, C.red, C.redLo, 2);
  glowDisk(ctx, 0, -21.5, 6, '200,16,46', 0.28);
}

function droneArt(ctx: CanvasRenderingContext2D, angle: number, bob: number, time: number): void {
  ctx.rotate(angle * 0.15);
  ctx.translate(0, Math.sin(bob) * 1.4);
  const spin = time * 10;
  const blink = 0.4 + Math.sin(time * 14) * 0.3;

  clayRect(ctx, -19, 11, 34, 4, 1.6, C.steelHi, C.steel, INK, INK_W);
  bolt(ctx, -16, 13, 1.3);
  bolt(ctx, 12, 13, 1.3);

  for (const s of [-1, 1]) {
    clayRect(ctx, s * 11 - 3.5, -17, 7, 13, 2.2, C.steelHi, C.steel, INK, INK_W);
    goldBand(ctx, s * 11 - 3.5, -8, 7, 2.4);
    ctx.save();
    ctx.translate(s * 19, -17);
    ctx.rotate(spin);
    glowDisk(ctx, 0, 0, 13, '76,127,214', 0.22);
    clayOval(ctx, 0, 0, 12, 3.8, 0, C.blueHi, C.blue, C.blueLo, INK_W);
    clayOval(ctx, 0, 0, 3.8, 12, 0, C.blueHi, C.blue, C.blueLo, INK_W);
    clayBall(ctx, 0, 0, 3.1, C.goldHi, C.gold, C.goldLo, 2.2);
    ctx.restore();
  }

  clayRect(ctx, -17, -11, 28, 22, 4.5, C.steelHi, C.steel, INK, INK_W);
  goldBand(ctx, -17, -11, 28, 3);
  goldBand(ctx, -17, 8, 28, 3);
  clayRect(ctx, -7, -18, 14, 9, 2.2, C.goldHi, C.gold, C.goldLo, INK_W);
  clayRect(ctx, 8, -8, 18, 16, 3.2, C.blueHi, C.blue, C.blueLo, INK_W);
  glowDisk(ctx, 28, 0, 10, '76,127,214', 0.3 + blink * 0.2);
  clayOval(ctx, 27, 0, 7.4, 8.6, 0, C.blueHi, '#8ec8f8', INK, INK_W);
  clayBall(ctx, 29, 0, 3.6, C.redHi, C.red, C.redLo, 2.2);
  glowDisk(ctx, 29, 0, 6, '255,70,40', blink * 0.55);

  clayRect(ctx, -15, 1.5, 24, 10, 2.2, C.redHi, C.red, C.redLo, INK_W);
  labelText(ctx, -3, 6.6, 'FAKE', 9);

  ink(ctx, INK_W);
  ctx.beginPath();
  ctx.moveTo(-12, 6);
  ctx.lineTo(-23, 17);
  ctx.stroke();
  clayOval(ctx, -25, 18, 4.8, 6.8, 0.5, C.steelHi, C.gold, C.goldLo, INK_W);
  clayRect(ctx, -4, -24, 3.2, 10, 1.2, C.steelHi, C.steel, C.steelLo, 1.6);
  clayOval(ctx, -2.4, -26, 5.5, 3.2, 0.2, C.steelHi, C.steel, INK, 1.8);
}

function bureauArt(ctx: CanvasRenderingContext2D, angle: number, bob: number, _time: number): void {
  ctx.rotate(angle * 0.12);
  ctx.translate(0, Math.sin(bob) * 0.5);

  ctx.beginPath();
  ctx.moveTo(-2, 14);
  ctx.quadraticCurveTo(-18, 9, -23, 18);
  ctx.lineTo(-8, 18);
  ctx.closePath();
  paint(ctx, lin(ctx, -23, 10, -2, 18, C.redHi, C.red, C.redLo), INK_W);
  clayOval(ctx, -20, 13.5, 6, 4, 0.2, C.redHi, C.red, C.redLo, INK_W);
  clayOval(ctx, -20, 13.5, 3.2, 2.2, 0.2, C.goldHi, C.gold, C.goldLo, 1.3);

  clayOval(ctx, -6.5, 17.5, 5.6, 3.4, -0.15, C.goldHi, C.gold, C.goldLo, 2.2);
  clayOval(ctx, 6.5, 17.5, 5.6, 3.4, 0.15, C.goldHi, C.gold, C.goldLo, 2.2);

  clayRect(ctx, -13, -1, 26, 21, 6.5, C.robeHi, C.robe, C.robeLo, INK_W);
  goldBand(ctx, -10, 8, 20, 3.2);
  ctx.beginPath();
  ctx.moveTo(-14, 1);
  ctx.lineTo(0, -32);
  ctx.lineTo(14, 1);
  ctx.lineTo(10, 6);
  ctx.quadraticCurveTo(0, -8, -10, 6);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, -32, 0, 6, C.robeHi, C.robeLo), INK_W);
  goldBand(ctx, -10, -7.5, 20, 3.6);

  clayOval(ctx, 0, -8.5, 7.8, 8, 0, C.skin, C.skin, C.skinLo, INK_W);
  clayRect(ctx, -8, -12.2, 7.2, 5.8, 1.5, C.goldHi, C.gold, C.goldLo, 2);
  clayRect(ctx, 0.8, -12.2, 7.2, 5.8, 1.5, C.goldHi, C.gold, C.goldLo, 2);
  ctx.fillStyle = INK;
  ctx.fillRect(-1.3, -10, 2.6, 1.8);
  ctx.beginPath();
  ctx.arc(-4.2, -9.2, 1.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4.2, -9.2, 1.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-3.2, -5.2);
  ctx.quadraticCurveTo(0, -3.6, 3.2, -5.2);
  ctx.strokeStyle = C.skinLo;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  clayBall(ctx, 10, 7.5, 3.6, C.skin, C.skin, C.skinLo, 2.2);
  clayRect(ctx, 8, -5, 18, 17, 2.2, C.white, '#f4f1e8', C.goldLo, INK_W);
  clayRect(ctx, 9, -7, 16, 4.4, 1.2, C.goldHi, C.gold, C.goldLo, 2);
  ctx.fillStyle = INK;
  ctx.fillRect(11.5, 1.5, 12, 1.8);
  ctx.fillRect(11.5, 5.6, 10, 1.8);
  ctx.fillRect(11.5, 9.7, 8, 1.8);
  clayRect(ctx, 21, -2, 4, 12, 1.2, C.redHi, C.red, C.redLo, 1.5);
}

function lobbyArt(ctx: CanvasRenderingContext2D, angle: number, bob: number, time: number): void {
  ctx.rotate(angle * 0.14);
  ctx.translate(0, Math.sin(bob) * 0.55);
  const walk = Math.sin(bob) * 0.35;

  ctx.save();
  ctx.translate(-6, 16);
  ctx.rotate(-0.18 + walk);
  clayOval(ctx, 0, 0, 5.2, 3.2, 0.1, C.goldHi, C.gold, C.goldLo, 2);
  ctx.restore();
  ctx.save();
  ctx.translate(6.5, 16);
  ctx.rotate(0.18 - walk);
  clayOval(ctx, 0, 0, 5.2, 3.2, -0.1, C.goldHi, C.gold, C.goldLo, 2);
  ctx.restore();

  clayRect(ctx, -11, -2, 22, 20, 5, C.blueHi, C.blue, C.blueLo, INK_W);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-10, -1, 20, 18);
  ctx.clip();
  ctx.strokeStyle = 'rgba(244,241,232,0.22)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-9 + i * 3.4, -1);
    ctx.lineTo(-9 + i * 3.4, 18);
    ctx.stroke();
  }
  ctx.restore();
  clayRect(ctx, -3.2, -2, 6.4, 16, 1.4, C.goldHi, C.gold, C.goldLo, 2);
  clayRect(ctx, -2.2, -1, 4.4, 14, 1, C.redHi, C.red, C.redLo, 1.4);

  ctx.save();
  ctx.translate(-12, 6);
  ctx.rotate(-0.45 + walk * 0.2);
  clayOval(ctx, 0, 0, 3.4, 5.5, 0, C.blueHi, C.blue, C.blueLo, 2);
  clayBall(ctx, 0, 5.2, 2.8, C.skin, C.skin, C.skinLo, 2);
  ctx.restore();

  ctx.save();
  ctx.translate(13, 4);
  ctx.rotate(0.55);
  clayRect(ctx, 0, -6, 16, 12, 2.2, C.goldHi, C.gold, C.goldLo, INK_W);
  clayRect(ctx, 1.2, -4.6, 13.6, 3.2, 1, C.goldLo, C.gold, C.goldHi, 1.2);
  labelText(ctx, 8, 1.4, '$', 10);
  clayRect(ctx, -2, -2, 4, 6, 1.2, C.goldHi, C.gold, C.goldLo, 1.6);
  ctx.restore();

  clayOval(ctx, 0, -11, 8.2, 8.4, 0, C.skin, C.skin, C.skinLo, INK_W);
  clayOval(ctx, 0, -16.5, 7.4, 3.6, 0, '#3a2a18', '#24180e', '#120c08', 2);
  clayRect(ctx, -8.2, -13.6, 16.4, 3.4, 1.2, INK, '#1a1208', INK, 1.6);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-7.2, -13.2, 6, 1.2);
  ctx.fillRect(1.4, -13.2, 6, 1.2);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(-3.4, -10.4, 1.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3.4, -10.4, 1.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-2.4, -6.6);
  ctx.quadraticCurveTo(0, -5.2, 2.4, -6.6);
  ctx.strokeStyle = C.skinLo;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  glowDisk(ctx, 13, 4, 10, '230,195,92', 0.18 + Math.sin(time * 6) * 0.08);
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
  else if (kind === 'lobbyist') lobbyArt(ctx, angle, bob, time);
  else bureauArt(ctx, angle, bob, time);
  ctx.restore();
}

function lmFountain(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 20, 16, 4.5);
  clayOval(ctx, 0, 16, 17, 6.5, 0, C.blueHi, C.blue, C.blueLo, 3);
  goldBand(ctx, -16, 13, 32, 4);
  clayOval(ctx, 0, 8, 11, 5, 0, C.white, C.blueHi, C.blueLo, 2.6);
  goldBand(ctx, -10, 6, 20, 3);
  clayRect(ctx, -3, -12, 6, 12, 2, C.goldHi, C.gold, C.goldLo, 2.2);
  clayBall(ctx, 0, -14, 3.2, C.goldHi, C.gold, C.goldLo, 2);
  ink(ctx, 2.2);
  ctx.strokeStyle = C.blueHi;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + time * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(Math.cos(a) * 8, -2 + Math.sin(time * 3 + i) * 2, Math.cos(a) * 12, 10);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(76,127,214,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 7, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function lmRoses(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 18, 15, 4.5);
  clayRect(ctx, -17, 6, 34, 12, 4, C.woodHi, C.wood, C.woodLo, 2.4);
  goldBand(ctx, -17, 6, 34, 3);
  clayRect(ctx, -15, -6, 30, 14, 4, C.grassHi, C.grass, C.grassLo, 2.2);
  for (let i = 0; i < 6; i++) {
    const rx = -11 + (i % 3) * 11;
    const ry = -10 - (i > 2 ? 8 : 0) + Math.sin(time * 2 + i) * 0.6;
    clayOval(ctx, rx, ry, 7, 6, 0.15, C.redHi, C.red, C.redLo, 2.2);
    clayBall(ctx, rx, ry, 2.2, C.goldHi, C.gold, C.goldLo, 1.6);
  }
}

function lmLincoln(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 20, 16, 4.5);
  clayRect(ctx, -16, 14, 32, 8, 3, C.white, C.blueLo, C.blueLo, 2.6);
  goldBand(ctx, -16, 14, 32, 3);
  clayRect(ctx, -13, 2, 26, 14, 3, C.blueHi, C.blue, C.blueLo, 2.6);
  const colW = 4.2;
  for (let i = 0; i < 4; i++) {
    toyColumn(ctx, -10 + i * 6.6, 3, colW, 12);
  }
  tri(ctx, -12, 3, 0, -10 + Math.sin(time * 2) * 0.2, 12, 3, C.blueHi, C.blueLo, 2.6);
  goldBand(ctx, -12, 2, 24, 3);
  star5(ctx, 0, -2, 5.5, 2.3);
}

function lmPalm(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 20, 9, 3.5);
  for (let i = 0; i < 7; i++) {
    clayRect(ctx, -4 + (i % 2) * 0.6, 14 - i * 5, 8 - i * 0.25, 7, 2.5, C.woodHi, C.wood, C.woodLo, 1.7);
  }
  ctx.save();
  ctx.translate(0, -18);
  palmFrond(ctx, time, 1);
  clayBall(ctx, -3, 2, 2.4, C.goldHi, C.gold, C.goldLo, 1.3);
  clayBall(ctx, 3, 2, 2.4, C.goldHi, C.gold, C.goldLo, 1.3);
  ctx.restore();
}

function lmPool(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 2, 14, 16, 7);
  clayOval(ctx, -3, 2, 19, 11, -0.28, C.goldHi, C.gold, C.goldLo);
  clayOval(ctx, -3, 2, 16, 9, -0.28, C.oceanHi, C.ocean, C.oceanLo, 1.8);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(-5, 0, 9, 3.4, -0.28 + Math.sin(time) * 0.05, 0, Math.PI);
  ctx.stroke();
}

function lmGolf(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 12, 15, 5.5);
  clayOval(ctx, 0, 6, 19, 9.5, 0, C.grassHi, C.grass, C.grassLo);
  clayOval(ctx, -3, 4, 12, 6, 0, '#b8e878', C.grassHi, C.grass, 1.5);
  clayBall(ctx, 4, 6, 2.3, INK, C.steelLo, INK, 1.4);
  clayRect(ctx, 3.2, -16, 1.8, 22, 0.8, C.steelHi, C.steel, C.steelLo, 1.4);
  goldBand(ctx, 2.6, -18, 3, 3);
  ctx.beginPath();
  ctx.moveTo(5, -16);
  ctx.lineTo(16, -12 + Math.sin(time * 3) * 1.2);
  ctx.lineTo(5, -8);
  ctx.closePath();
  paint(ctx, C.red, 1.5);
  clayBall(ctx, -6, 8, 2.1, C.white, '#f0f0f0', C.stone, 1.4);
}

function lmCactus(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 18, 9, 3.5);
  clayRect(ctx, -6, -8, 12, 28, 6, C.grassHi, C.grass, C.grassLo);
  clayRect(ctx, -16, 0, 12, 8, 4, C.grassHi, C.grass, C.grassLo, 1.8);
  clayRect(ctx, 6, -4, 11, 8, 4, C.grassHi, C.grass, C.grassLo, 1.8);
  ink(ctx, 1.2);
  ctx.strokeStyle = 'rgba(255,255,210,0.65)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-4, -4 + i * 5);
    ctx.lineTo(-8, -6 + i * 5);
    ctx.stroke();
  }
  clayOval(ctx, 0, -12 + Math.sin(time * 2) * 0.4, 4, 3.2, 0, C.goldHi, C.gold, C.goldLo, 1.4);
  star5(ctx, 0, -12, 3.2, 1.4);
}

function lmWatch(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 20, 13, 4);
  clayRect(ctx, -11, 10, 6, 12, 2, C.woodHi, C.wood, C.woodLo, 1.8);
  clayRect(ctx, 5, 10, 6, 12, 2, C.woodHi, C.wood, C.woodLo, 1.8);
  clayRect(ctx, -16, 4, 32, 8, 3, C.woodHi, C.wood, C.woodLo, 2);
  goldBand(ctx, -16, 4, 32, 2.4);
  for (let i = 0; i < 5; i++) {
    clayRect(ctx, -13 + i * 6.4, -6, 2.2, 12, 0.8, C.woodHi, C.wood, C.woodLo, 1.3);
  }
  clayRect(ctx, -16, -8, 32, 3.2, 1.2, C.goldHi, C.gold, C.goldLo, 1.6);
  clayRect(ctx, -3, -18, 2.2, 12, 0.8, C.woodHi, C.wood, C.woodLo, 1.4);
  ctx.beginPath();
  ctx.moveTo(-1, -18);
  ctx.lineTo(12, -14 + Math.sin(time * 2.2) * 0.8);
  ctx.lineTo(-1, -11);
  ctx.closePath();
  paint(ctx, C.red, 1.5);
}

function lmGate(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 18, 16, 4.5);
  clayRect(ctx, -22, -8, 12, 28, 4, C.sandHi, C.sand, C.sandLo);
  clayRect(ctx, 10, -8, 12, 28, 4, C.sandHi, C.sand, C.sandLo);
  goldBand(ctx, -22, -10, 12, 3);
  goldBand(ctx, 10, -10, 12, 3);
  for (let i = 0; i < 6; i++) {
    clayRect(ctx, -9 + i * 3.2, -2, 1.8, 20, 0.8, C.steelHi, C.steel, C.steelLo, 1.3);
  }
  goldBand(ctx, -10, -4, 20, 3);
  star5(ctx, 0, -8 + Math.sin(time) * 0.3, 5, 2);
}

function lmTaxi(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 2, 12, 15, 4.5);
  ctx.save();
  ctx.rotate(-0.16);
  clayRect(ctx, -18, -4, 34, 14, 5, '#ffe44a', '#f0d000', '#b89000');
  clayRect(ctx, -10, -12, 18, 9, 3, C.blueHi, C.blue, C.blueLo, 1.7);
  ctx.fillStyle = 'rgba(180,220,255,0.45)';
  ctx.fillRect(-8, -11, 6, 7);
  ctx.fillRect(0, -11, 6, 7);
  clayBall(ctx, -12, 12, 4.2, C.steelLo, INK, INK, 1.6);
  clayBall(ctx, 14, 12, 4.2, C.steelLo, INK, INK, 1.6);
  goldBand(ctx, -4, -16, 8, 5);
  ctx.fillStyle = INK;
  ctx.font = '800 5px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TAXI', -1, 3);
  ctx.fillStyle = `rgba(255,220,80,${0.4 + Math.sin(time * 10) * 0.3})`;
  ctx.fillRect(-3, -15, 6, 3);
  ctx.save();
  ctx.translate(16, 2);
  glowCone(ctx, 0, 16, 2.2, 6, '255,220,80', 0.28 + Math.sin(time * 10) * 0.08);
  ctx.restore();
  ctx.restore();
}

function lmNews(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 18, 13, 4.5);
  clayRect(ctx, -12, -4, 24, 22, 4, C.woodHi, C.wood, C.woodLo);
  tri(ctx, -16, -4, 0, -16, 16, -4, C.redHi, C.redLo);
  goldBand(ctx, -16, -5, 32, 2.5);
  clayRect(ctx, -9, 0, 8, 10, 1.5, C.white, '#f4f1e8', '#d8d0c0', 1.4);
  clayRect(ctx, 1, 0, 8, 10, 1.5, C.white, '#f4f1e8', '#d8d0c0', 1.4);
  ctx.fillStyle = C.red;
  ctx.font = '800 5px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FAKE', 0, 6 + Math.sin(time * 2) * 0.3);
}

function lmBillboard(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 20, 9, 3.5);
  clayRect(ctx, -3, 0, 6, 22, 2, C.steelHi, C.steel, C.steelLo, 1.7);
  clayRect(ctx, -22, -22, 44, 24, 4, C.goldHi, C.gold, C.goldLo);
  clayRect(ctx, -20, -20, 40, 20, 3, C.blueHi, C.blue, C.blueLo);
  ctx.fillStyle = C.goldHi;
  ctx.font = '800 8px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('WINNING', 0, -12);
  ctx.fillStyle = `rgba(255,243,176,${0.45 + Math.sin(time * 5) * 0.4})`;
  ctx.fillText('WINNING', 0, -12);
  star5(ctx, -14, -6, 4, 1.6);
  star5(ctx, 14, -6, 4, 1.6);
}

function lmTree(ctx: CanvasRenderingContext2D, time: number): void {
  const sway = Math.sin(time * 1.4) * 0.5;
  ground(ctx, 1, 20, 12, 4);
  clayRect(ctx, -4.5, 2, 9, 20, 3, C.woodHi, C.wood, C.woodLo, 2);
  clayOval(ctx, -1 + sway, 16, 7, 3.2, 0, C.woodHi, C.wood, C.woodLo, 1.5);
  clayBall(ctx, sway, -6, 15, C.grassHi, C.grass, C.grassLo, 2.4);
  clayBall(ctx, -11 + sway, -1, 10, C.grassHi, C.grass, C.grassLo, 2);
  clayBall(ctx, 11 + sway, -1, 10, C.grassHi, C.grass, C.grassLo, 2);
  clayBall(ctx, sway * 0.6, -14, 9, '#9ae86a', C.grassHi, C.grass, 1.8);
  clayBall(ctx, -6 + sway, -8, 2.2, C.goldHi, C.gold, C.goldLo, 1.2);
  clayBall(ctx, 7 + sway, -4, 2.2, C.goldHi, C.gold, C.goldLo, 1.2);
}

function lmBush(ctx: CanvasRenderingContext2D, time: number): void {
  const bob = Math.sin(time * 1.8) * 0.4;
  ground(ctx, 1, 16, 14, 4);
  clayOval(ctx, 0, 10, 16, 7, 0, C.grassHi, C.grass, C.grassLo, 2.2);
  clayOval(ctx, -9, 7 + bob, 10, 7, -0.2, C.grassHi, C.grass, C.grassLo, 2);
  clayOval(ctx, 9, 7 + bob * 0.7, 9.5, 6.5, 0.18, '#9ae86a', C.grassHi, C.grass, 2);
  clayOval(ctx, 0, 4 + bob, 8, 6, 0, C.grassHi, C.grass, C.grassLo, 1.8);
  clayBall(ctx, -6, 5, 2, C.redHi, C.red, C.redLo, 1.3);
  clayBall(ctx, 5, 3, 1.8, C.redHi, C.red, C.redLo, 1.3);
  clayBall(ctx, 1, 8, 1.6, C.goldHi, C.gold, C.goldLo, 1.2);
}

function lmPond(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 12, 16, 6);
  clayOval(ctx, 0, 4, 20, 11, 0.08, C.grassHi, C.grass, C.grassLo, 2);
  clayOval(ctx, 0, 4, 16, 8.5, 0.08, C.oceanHi, C.ocean, C.oceanLo, 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-2, 2, 8, 2.6, 0.08 + Math.sin(time) * 0.04, 0, Math.PI);
  ctx.stroke();
  clayOval(ctx, -6, 5, 4.5, 2.2, -0.3, C.grassHi, C.grass, C.grassLo, 1.4);
  clayOval(ctx, 7, 6, 3.8, 1.9, 0.25, C.grassHi, C.grass, C.grassLo, 1.4);
  clayBall(ctx, -6, 4, 1.6, C.white, C.redHi, C.red, 1.2);
  clayBall(ctx, 7, 5, 1.4, C.white, C.goldHi, C.gold, 1.2);
  clayRect(ctx, 12, 2, 2, 10, 1, C.grassHi, C.grass, C.grassLo, 1.3);
  clayRect(ctx, 15, 4, 1.6, 8, 1, C.grassHi, C.grass, C.grassLo, 1.2);
}

function lmBridge(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 18, 16, 4);
  clayRect(ctx, -18, 10, 8, 10, 3, C.stoneHi, C.stone, C.stoneLo, 2);
  clayRect(ctx, 10, 10, 8, 10, 3, C.stoneHi, C.stone, C.stoneLo, 2);
  ctx.beginPath();
  ctx.moveTo(-16, 10);
  ctx.quadraticCurveTo(0, -6 + Math.sin(time * 1.2) * 0.3, 16, 10);
  ctx.lineTo(16, 14);
  ctx.quadraticCurveTo(0, 0, -16, 14);
  ctx.closePath();
  paint(ctx, lin(ctx, -16, -4, 16, 14, C.woodHi, C.wood, C.woodLo), 2.2);
  goldBand(ctx, -8, 2, 16, 2.2);
  for (let i = 0; i < 5; i++) {
    clayRect(ctx, -12 + i * 6, 0, 1.8, 8, 0.7, C.woodHi, C.wood, C.woodLo, 1.2);
  }
  clayRect(ctx, -14, -2, 28, 2.4, 1, C.woodHi, C.wood, C.woodLo, 1.4);
}

function lmTunnel(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 18, 16, 5);
  clayOval(ctx, 0, 8, 22, 12, 0, C.sandHi, C.sand, C.sandLo, 2.2);
  clayOval(ctx, 0, 4, 18, 12, 0, C.stoneHi, C.stone, C.stoneLo, 2.4);
  clayOval(ctx, 0, 5, 11, 10, 0, C.steelLo, INK, '#060a14', 2);
  ctx.fillStyle = `rgba(255,243,176,${0.12 + Math.sin(time * 2) * 0.06})`;
  ctx.beginPath();
  ctx.ellipse(0, 6, 6, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  clayRect(ctx, -18, 12, 36, 8, 3, C.stoneHi, C.stone, C.stoneLo, 2);
  goldBand(ctx, -10, 12, 20, 2.4);
  clayOval(ctx, -16, 8, 6, 5, -0.2, C.grassHi, C.grass, C.grassLo, 1.6);
  clayOval(ctx, 16, 8, 6, 5, 0.2, C.grassHi, C.grass, C.grassLo, 1.6);
}

function lmBench(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 16, 14, 4);
  clayRect(ctx, -14, 8, 3.2, 10, 1.2, C.woodHi, C.wood, C.woodLo, 1.6);
  clayRect(ctx, 11, 8, 3.2, 10, 1.2, C.woodHi, C.wood, C.woodLo, 1.6);
  clayRect(ctx, -16, 6, 32, 5, 2, C.woodHi, C.wood, C.woodLo, 2);
  goldBand(ctx, -16, 6, 32, 2);
  clayRect(ctx, -15, -4, 2.4, 12, 1, C.woodHi, C.wood, C.woodLo, 1.4);
  clayRect(ctx, 12.5, -4, 2.4, 12, 1, C.woodHi, C.wood, C.woodLo, 1.4);
  clayRect(ctx, -16, -6, 32, 3.2, 1.4, C.woodHi, C.wood, C.woodLo, 1.8);
  bolt(ctx, -8, 8, 1.3);
  bolt(ctx, 8, 8, 1.3);
  ctx.fillStyle = `rgba(255,243,176,${0.18 + Math.sin(time * 2) * 0.08})`;
  ctx.beginPath();
  ctx.ellipse(0, 4, 10, 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function lmLamp(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 20, 8, 3.2);
  clayRect(ctx, -5, 16, 10, 6, 2, C.stoneHi, C.stone, C.stoneLo, 1.8);
  clayRect(ctx, -1.6, -4, 3.2, 22, 1.2, C.goldHi, C.gold, C.goldLo, 1.6);
  clayRect(ctx, -6, -8, 12, 3, 1.2, C.goldHi, C.gold, C.goldLo, 1.5);
  glowDisk(ctx, 0, -14, 12, '255,236,150', 0.32 + Math.sin(time * 3.2) * 0.1);
  clayBall(ctx, 0, -14, 6.2, C.goldHi, '#ffe48a', C.gold, 2);
  clayBall(ctx, -2, -16, 2.2, C.white, C.goldHi, C.gold, 1.1);
}

function lmStatue(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 20, 12, 4);
  clayRect(ctx, -12, 12, 24, 10, 3, C.stoneHi, C.stone, C.stoneLo, 2.2);
  goldBand(ctx, -12, 12, 24, 2.4);
  clayRect(ctx, -8, 4, 16, 10, 2.5, C.stoneHi, C.stone, C.stoneLo, 2);
  clayRect(ctx, -7, -6, 14, 12, 4, C.goldHi, C.gold, C.goldLo, 2);
  clayBall(ctx, 0, -12 + Math.sin(time * 1.5) * 0.25, 6.2, C.goldHi, C.gold, C.goldLo, 2);
  clayRect(ctx, -3, -8, 6, 4, 1.5, C.goldHi, C.gold, C.goldLo, 1.4);
  star5(ctx, 0, 8, 3.4, 1.4);
}

export function drawLandmarkArt(ctx: CanvasRenderingContext2D, kind: LandmarkKind, time: number): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const s = CELL / 64;
  ctx.scale(s, s);
  switch (kind) {
    case 'fountain':
      lmFountain(ctx, time);
      break;
    case 'roses':
      lmRoses(ctx, time);
      break;
    case 'lincoln':
      lmLincoln(ctx, time);
      break;
    case 'palm':
      lmPalm(ctx, time);
      break;
    case 'pool':
      lmPool(ctx, time);
      break;
    case 'golf':
      lmGolf(ctx, time);
      break;
    case 'cactus':
      lmCactus(ctx, time);
      break;
    case 'watch':
      lmWatch(ctx, time);
      break;
    case 'gate':
      lmGate(ctx, time);
      break;
    case 'taxi':
      lmTaxi(ctx, time);
      break;
    case 'newsstand':
      lmNews(ctx, time);
      break;
    case 'billboard':
      lmBillboard(ctx, time);
      break;
    case 'tree':
      lmTree(ctx, time);
      break;
    case 'bush':
      lmBush(ctx, time);
      break;
    case 'pond':
      lmPond(ctx, time);
      break;
    case 'bridge':
      lmBridge(ctx, time);
      break;
    case 'tunnel':
      lmTunnel(ctx, time);
      break;
    case 'bench':
      lmBench(ctx, time);
      break;
    case 'lamp':
      lmLamp(ctx, time);
      break;
    case 'statue':
      lmStatue(ctx, time);
      break;
    default: {
      const _never: never = kind;
      void _never;
    }
  }
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
  clayRect(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, 6, themeHi, themeGrass, 'rgba(0,0,0,0.22)', 1.6);
  ctx.fillStyle = themeHi;
  ctx.globalAlpha = 0.2 + hash(seed) * 0.12;
  ctx.beginPath();
  ctx.ellipse(x + size * 0.32, y + size * 0.3, size * 0.22, size * 0.12, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  const tufts = 2 + Math.floor(hash(seed * 3.2) * 3);
  for (let i = 0; i < tufts; i++) {
    const tx = x + 8 + hash(seed + i * 4.1) * (size - 16);
    const ty = y + 10 + hash(seed + i * 7.7) * (size - 18);
    ctx.fillStyle = hash(seed + i) > 0.55 ? C.gold : themeHi;
    ctx.globalAlpha = 0.32;
    ctx.beginPath();
    ctx.ellipse(tx, ty, 3.5, 2, hash(i) * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = grid;
  ctx.lineWidth = 1.2;
  ctx.lineJoin = 'round';
  rr(ctx, x + 3, y + 3, size - 6, size - 6, 5);
  ctx.stroke();
  if (hash(seed * 5) > 0.78) {
    ctx.globalAlpha = 0.28;
    star5(ctx, x + size * 0.5, y + size * 0.5, 6, 2.6);
    ctx.globalAlpha = 1;
  }
}
