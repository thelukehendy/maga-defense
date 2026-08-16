import type { LandmarkKind } from './campaign.ts';
import { CELL, type EnemyId, type TowerId } from './types.ts';

const INK = '#0c1838';
const INK_W = 2.2;

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
  ctx.fillStyle = `rgba(255,255,245,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, -0.45, 0, Math.PI * 2);
  ctx.fill();
}

function blobLo(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, a = 0.2): void {
  ctx.fillStyle = `rgba(90,40,12,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0.35, 0, Math.PI * 2);
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
  rr(ctx, x, y, w, h, r);
  paint(ctx, lin(ctx, x, y, x + w, y + h, hi, mid, lo), line);
  ctx.save();
  rr(ctx, x, y, w, h, r);
  ctx.clip();
  blobHi(ctx, x + w * 0.28, y + h * 0.22, w * 0.3, h * 0.16, 0.42);
  blobLo(ctx, x + w * 0.74, y + h * 0.78, w * 0.32, h * 0.2, 0.16);
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

function usFlag(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  pole(ctx, 0, 0, 26 * s);
  const fw = 20 * s;
  const fh = 12 * s;
  const cantonH = fh * 0.54;
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
  clayRect(ctx, 1.2, cy0, fw * 0.4, cantonH, 1.2, C.blueHi, C.blue, C.blueLo, 1.4);
  ctx.fillStyle = C.goldHi;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.fillRect(2.8 * s + c * 1.9 * s, cy0 + 1.4 * s + r * 1.9 * s, 0.85 * s, 0.85 * s);
    }
  }
  ctx.restore();
}

function goldBand(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  clayRect(ctx, x, y, w, h, Math.min(2, h * 0.45), C.goldHi, C.gold, C.goldLo, 1.6);
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
  clayRect(ctx, x - 1, y + h - 6, w + 2, 6, 2, C.white, '#e8e0d4', '#b8b0a4', 1.8);
  clayRect(ctx, x + w * 0.12, y + 6, w * 0.76, h - 12, w * 0.38, C.white, '#f2eee6', '#c8c0b4', 1.9);
  goldBand(ctx, x + w * 0.08, y + 5, w * 0.84, 3);
  goldBand(ctx, x + w * 0.08, y + h - 10, w * 0.84, 3);
  clayRect(ctx, x, y, w, 7, 2.5, C.white, '#efeae0', '#c4bcb0', 1.8);
  blobHi(ctx, x + w * 0.32, y + h * 0.35, w * 0.12, h * 0.22, 0.35);
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

function leakRim(
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

function keepCannon(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir);
  clayRect(ctx, -4, -5, 22, 10, 4, C.steelHi, C.steel, C.steelLo, 1.8);
  goldBand(ctx, 4, -6, 3.5, 12);
  goldBand(ctx, 14, -6.5, 5, 13);
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
  clayBall(ctx, x, y, r, C.woodHi, C.wood, C.woodLo, 1.9);
  clayBall(ctx, x, y, r * 0.38, C.goldHi, C.gold, C.goldLo, 1.5);
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
  clayRect(ctx, x, y, w, h, 3, C.blueHi, C.blue, C.blueLo, 1.8);
  goldBand(ctx, x, y, w, 2);
  ctx.fillStyle = C.white;
  ctx.font = `800 ${size}px Impact, Arial Black, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w * 0.5, y + h * 0.58);
}

function lawnKeep(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, leak: number): void {
  const cx = x + w * 0.5;
  ground(ctx, cx, y + h * 0.94, w * 0.44, h * 0.055);
  leakRim(ctx, x, y, w, h, time, leak);

  clayRect(ctx, x + w * 0.06, y + h * 0.86, w * 0.88, h * 0.1, 5, C.stoneHi, C.stone, C.stoneLo);
  goldBand(ctx, x + w * 0.06, y + h * 0.86, w * 0.88, 4);
  clayRect(ctx, x + w * 0.12, y + h * 0.78, w * 0.76, h * 0.09, 5, C.white, '#efe8dc', '#c8c0b4');
  goldBand(ctx, x + w * 0.12, y + h * 0.78, w * 0.76, 3.5);
  clayRect(ctx, x + w * 0.18, y + h * 0.71, w * 0.64, h * 0.08, 4, C.white, '#f6f1e8', '#d0c8bc');

  const wingY = y + h * 0.52;
  const wingH = h * 0.22;
  clayRect(ctx, x + w * 0.08, wingY, w * 0.18, wingH, 5, C.white, '#f4efe6', '#c8c0b4');
  clayRect(ctx, x + w * 0.74, wingY, w * 0.18, wingH, 5, C.white, '#f4efe6', '#c8c0b4');
  for (let i = 0; i < 3; i++) {
    clayRect(ctx, x + w * 0.09 + i * w * 0.055, wingY - 8, w * 0.04, 10, 1.5, C.white, '#efe8dc', '#b8b0a4', 1.6);
    clayRect(ctx, x + w * 0.76 + i * w * 0.055, wingY - 8, w * 0.04, 10, 1.5, C.white, '#efe8dc', '#b8b0a4', 1.6);
  }
  keepCannon(ctx, x + w * 0.12, wingY + 8, Math.PI);
  keepCannon(ctx, x + w * 0.88, wingY + 8, 0);

  const bx = x + w * 0.2;
  const by = y + h * 0.34;
  const bw = w * 0.6;
  const bh = h * 0.4;
  clayRect(ctx, bx, by, bw, bh, 6, C.white, '#f7f3ea', '#cfc7bb');
  goldBand(ctx, bx - 2, by, bw + 4, 5);

  toyWindow(ctx, bx + bw * 0.08, by + bh * 0.18, bw * 0.12, bh * 0.22, 2, 2);
  toyWindow(ctx, bx + bw * 0.8, by + bh * 0.18, bw * 0.12, bh * 0.22, 2, 2);
  toyWindow(ctx, bx + bw * 0.08, by + bh * 0.5, bw * 0.12, bh * 0.26, 2, 2);
  toyWindow(ctx, bx + bw * 0.8, by + bh * 0.5, bw * 0.12, bh * 0.26, 2, 2);

  const doorW = bw * 0.16;
  woodDoor(ctx, cx - doorW * 0.5, by + bh - bh * 0.42 - 2, doorW, bh * 0.42);

  const colW = bw * 0.08;
  const colH = bh * 0.72;
  const colY = by + bh - colH;
  const colXs = [0.28, 0.4, 0.6, 0.72];
  for (let i = 0; i < colXs.length; i++) {
    toyColumn(ctx, bx + bw * colXs[i]! - colW * 0.5, colY, colW, colH);
  }

  const pL = bx + bw * 0.22;
  const pR = bx + bw * 0.78;
  const pBase = colY + 4;
  const pPeak = pBase - h * 0.09;
  tri(ctx, pL, pBase, cx, pPeak, pR, pBase, C.white, '#d8d0c4');
  goldBand(ctx, pL - 2, pBase - 2, pR - pL + 4, 4);
  star5(ctx, cx, (pPeak + pBase) * 0.5 + 1, 8, 3.4);

  const domeY = by + 4;
  clayOval(ctx, cx, domeY, bw * 0.22, h * 0.12, 0, C.white, '#f4efe6', '#c0b8ac');
  goldBand(ctx, cx - bw * 0.2, domeY + h * 0.02, bw * 0.4, 4);
  clayRect(ctx, cx - 4, y + h * 0.08, 8, h * 0.12, 2, C.goldHi, C.gold, C.goldLo, 1.7);
  clayBall(ctx, cx, y + h * 0.07, 5.5, C.goldHi, C.gold, C.goldLo, 1.6);
  star5(ctx, cx, y + h * 0.02, 6, 2.5);

  usFlag(ctx, x + w * 0.14, y + h * 0.28, time, 0.85);
  usFlag(ctx, x + w * 0.86, y + h * 0.28, time + 0.4, 0.85);
}

function palazzoKeep(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, leak: number): void {
  const cx = x + w * 0.5;
  ground(ctx, cx, y + h * 0.95, w * 0.46, h * 0.05);
  leakRim(ctx, x, y, w, h, time, leak);
  miniPalm(ctx, x + w * 0.08, y + h * 0.72, time, 0.85);
  miniPalm(ctx, x + w * 0.92, y + h * 0.72, time + 0.8, 0.85);

  clayRect(ctx, x + w * 0.1, y + h * 0.84, w * 0.8, h * 0.1, 5, C.goldHi, C.gold, C.goldLo);
  const bx = x + w * 0.14;
  const by = y + h * 0.36;
  const bw = w * 0.72;
  const bh = h * 0.5;
  clayRect(ctx, bx, by, bw, bh, 8, C.goldHi, C.gold, C.goldLo);
  goldBand(ctx, bx - 3, by - 2, bw + 6, 7);

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
    toyWindow(ctx, bx + bw * 0.09 + i * bw * 0.17, by + bh * 0.1, bw * 0.1, bh * 0.2, 2, 2);
  }

  tri(ctx, bx - 10, by + 8, cx, y + h * 0.08, bx + bw + 10, by + 8, C.goldHi, C.goldLo);
  goldBand(ctx, bx - 6, by + 4, bw + 12, 5);
  star5(ctx, cx, y + h * 0.2, 10, 4.2);
  usFlag(ctx, bx + bw - 4, y + h * 0.1, time, 0.9);
}

function borderKeep(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, leak: number): void {
  const cx = x + w * 0.5;
  ground(ctx, cx, y + h * 0.95, w * 0.44, h * 0.05);
  leakRim(ctx, x, y, w, h, time, leak);
  clayRect(ctx, x + w * 0.1, y + h * 0.84, w * 0.8, h * 0.1, 4, C.sandHi, C.sand, C.sandLo);

  const wallX = x + w * 0.18;
  const wallY = y + h * 0.34;
  const wallW = w * 0.64;
  const wallH = h * 0.52;
  clayRect(ctx, wallX, wallY, wallW, wallH, 4, C.sandHi, C.sand, C.sandLo);
  ctx.fillStyle = C.sandLo;
  for (let row = 0; row < 6; row++) {
    const off = row % 2 === 0 ? 0 : 7;
    for (let col = 0; col < 8; col++) {
      ctx.fillRect(wallX + 6 + off + col * 14, wallY + 10 + row * 12, 11, 2.5);
    }
  }

  const tw = w * 0.18;
  const th = h * 0.58;
  for (const side of [0.08, 0.74]) {
    const tx = x + w * side;
    const ty = y + h * 0.24;
    clayRect(ctx, tx, ty, tw, th, 4, C.sandHi, C.sand, C.sandLo);
    toyWindow(ctx, tx + tw * 0.28, ty + th * 0.18, tw * 0.44, th * 0.14, 2, 2);
    toyWindow(ctx, tx + tw * 0.28, ty + th * 0.48, tw * 0.44, th * 0.14, 2, 2);
    for (let i = 0; i < 3; i++) {
      clayRect(ctx, tx + 3 + i * (tw / 3), ty - 8, tw * 0.22, 10, 1.5, C.steelHi, C.steel, C.steelLo, 1.6);
    }
  }

  goldBand(ctx, wallX - 2, wallY - 2, wallW + 4, 4);
  for (let i = 0; i < 8; i++) {
    clayRect(ctx, wallX + i * (wallW / 8) + 2, wallY - 12, 9, 14, 1.5, C.steelHi, C.steel, C.steelLo, 1.6);
  }
  woodDoor(ctx, cx - 12, wallY + wallH - 36, 24, 34);
  usFlag(ctx, x + w * 0.82, y + h * 0.1, time, 1);
  clayRect(ctx, cx - 1.5, y + h * 0.1, 3, wallY - y - h * 0.1, 1, C.goldHi, C.gold, C.goldLo, 1.5);
}

function avenueKeep(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number, leak: number): void {
  const cx = x + w * 0.5;
  ground(ctx, cx, y + h * 0.96, w * 0.38, h * 0.045);
  leakRim(ctx, x, y, w, h, time, leak);
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
  const capW = w * 0.2;
  clayRect(ctx, cx - capW * 0.5, y + h * 0.08, capW, h * 0.1, 4, C.goldHi, C.gold, C.goldLo);
  star5(ctx, cx, y + h * 0.06, 8, 3.4);
  tri(ctx, cx - 5, y + h * 0.08, cx, y + 2, cx + 5, y + h * 0.08, C.goldHi, C.goldLo, 1.6);
  usFlag(ctx, cx + capW * 0.45, y + h * 0.02, time, 0.85);
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
  const bodyH = 28 + t * 8;
  const dishR = 11 + t * 3;
  ground(ctx, 1, 18, 16, 5.5);
  clayRect(ctx, -16, 8, 32, 12, 4, C.stoneHi, C.stone, C.stoneLo);
  clayRect(ctx, -11, 8 - bodyH, 22, bodyH, 5, C.stoneHi, C.stone, C.stoneLo);
  toyWindow(ctx, -5, 8 - bodyH * 0.55, 10, 8, 2, 1);
  const rings = 1 + t;
  for (let i = 0; i < rings; i++) {
    goldBand(ctx, -13, 4 - i * (bodyH / (rings + 0.6)), 26, 3.4);
  }
  plaque(ctx, -11, 11, 22, 8, 'FACT', 6);
  usFlag(ctx, 12, 8 - bodyH - 4, time, 0.55);

  ctx.save();
  ctx.translate(0, 8 - bodyH - 2);
  ctx.rotate(angle);
  clayRect(ctx, -3, -3, 8, 6, 2, C.steelHi, C.steel, C.steelLo, 1.6);
  clayOval(ctx, 10 + t, 0, dishR, dishR * 0.72, 0, C.blueHi, C.blue, C.blueLo, 2);
  clayOval(ctx, 8 + t, 0, dishR * 0.55, dishR * 0.4, 0, '#8ec8f8', C.blueHi, C.blueLo, 1.5);
  clayBall(ctx, 6, 0, 2.6, C.redHi, C.red, C.redLo, 1.4);
  const pulse = 0.4 + Math.sin(time * 12) * 0.2 + (cooldown < 0.08 ? 0.35 : 0);
  const beam = ctx.createLinearGradient(10, 0, 36 + t * 4, 0);
  beam.addColorStop(0, `rgba(200,16,46,${pulse})`);
  beam.addColorStop(1, 'rgba(200,16,46,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(10, -2.2);
  ctx.lineTo(38 + t * 4, -7);
  ctx.lineTo(38 + t * 4, 7);
  ctx.lineTo(10, 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function trebArt(ctx: CanvasRenderingContext2D, tier: number, angle: number, time: number, cooldown: number): void {
  const t = Math.max(0, Math.min(2, Math.floor(tier)));
  const period = 2.1;
  const u = Math.max(0, Math.min(1, cooldown / period));
  const recoil = u * u * (8 + t);
  ground(ctx, 2, 18, 18, 6);
  clayRect(ctx, -20, 6, 40, 14, 5, C.woodHi, C.wood, C.woodLo);
  goldBand(ctx, -22, 16, 44, 4);
  wheel(ctx, -14, 18, 7 + t * 0.6);
  wheel(ctx, 14, 18, 7 + t * 0.6);
  usFlag(ctx, -18, -8, time, 0.5);

  ctx.save();
  ctx.rotate(angle);
  ctx.translate(-recoil, 0);
  const len = 30 + t * 4;
  clayRect(ctx, -6, -8, len, 16, 7, C.blueHi, C.blue, C.blueLo);
  goldBand(ctx, 4, -9, 4, 18);
  goldBand(ctx, 14, -9, 4, 18);
  goldBand(ctx, len - 10, -10, 7, 20);
  clayOval(ctx, len - 2, 0, 5, 8, 0, C.goldHi, C.gold, C.goldLo, 1.7);
  clayBall(ctx, -4, 0, 6, C.blueHi, C.blue, C.blueLo, 1.8);
  ctx.restore();
}

function brickArt(ctx: CanvasRenderingContext2D, tier: number, angle: number, time: number, cooldown: number): void {
  const t = Math.max(0, Math.min(2, Math.floor(tier)));
  const recoil = Math.max(0, Math.min(1, cooldown * 1.8)) * 5;
  const glow = 0.55 + Math.sin(time * 6) * 0.2;
  ground(ctx, 1, 17, 17, 5.5);
  clayRect(ctx, -18, 8, 36, 12, 4, C.woodHi, C.wood, C.woodLo);
  usFlag(ctx, -16, -6, time, 0.5);
  clayRect(ctx, -16, -8, 32, 20, 4, C.redHi, C.red, C.redLo);
  goldBand(ctx, -16, -9, 32, 3.5);
  goldBand(ctx, -16, 9, 32, 3.5);
  if (t >= 1) goldBand(ctx, -16, 1, 32, 3);
  if (t >= 2) star5(ctx, 0, -14, 5, 2.1);
  magaBrick(ctx, -10, -4, 20, 10, glow);
  ctx.save();
  ctx.rotate(angle);
  ctx.translate(-recoil, 0);
  clayRect(ctx, 6, -6, 22 + t * 3, 12, 4, C.redHi, C.red, C.redLo);
  goldBand(ctx, 26 + t * 3, -8, 7, 16);
  magaBrick(ctx, 10, -4, 14, 8, glow + (cooldown < 0.15 ? 0.4 : 0));
  ctx.restore();
}

function deskArt(ctx: CanvasRenderingContext2D, tier: number, _angle: number, time: number, _cooldown: number): void {
  const t = Math.max(0, Math.min(2, Math.floor(tier)));
  ground(ctx, 2, 17, 18, 5.5);
  const aura = ctx.createRadialGradient(0, 0, 6, 0, 0, 28 + t * 4);
  aura.addColorStop(0, `rgba(230,195,92,${0.22 + Math.sin(time * 4) * 0.08})`);
  aura.addColorStop(1, 'rgba(230,195,92,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, 28 + t * 4, 0, Math.PI * 2);
  ctx.fill();

  clayRect(ctx, -20, -4, 40, 22, 5, C.stoneHi, C.stone, C.stoneLo);
  clayRect(ctx, -22, -10, 44, 10, 3, C.goldHi, C.gold, C.goldLo);
  goldBand(ctx, -8, -2, 5, 8);
  goldBand(ctx, 3, -2, 5, 8);
  clayRect(ctx, -16, 4, 10, 10, 2, C.goldHi, C.gold, C.goldLo, 1.6);
  clayRect(ctx, 6, 4, 10, 10, 2, C.goldHi, C.gold, C.goldLo, 1.6);

  ctx.save();
  ctx.translate(-12, -12);
  ctx.rotate(-0.35);
  clayRect(ctx, 0, -3, 16, 6, 2, C.steelHi, C.steel, C.steelLo, 1.6);
  ctx.restore();
  ctx.save();
  ctx.translate(12, -12);
  ctx.rotate(0.35);
  clayRect(ctx, 0, -3, 16, 6, 2, C.steelHi, C.steel, C.steelLo, 1.6);
  ctx.restore();

  usFlag(ctx, 16, -18, time, 0.5);
  for (let i = 0; i < 3 + t; i++) {
    const a = time * 1.5 + i * 2.1;
    ctx.save();
    ctx.translate(Math.cos(a) * (15 + t * 2), Math.sin(a) * 7 - 12);
    ctx.rotate(a);
    clayRect(ctx, -5, -3, 10, 7, 1.5, C.white, '#f0e8d0', '#d0c4a8', 1.4);
    ctx.fillStyle = C.blue;
    ctx.fillRect(-3, -1, 6, 1.2);
    ctx.restore();
  }
  plaque(ctx, -10, 16, 20, 8, 'EO', 7);
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
  ground(ctx, 1, 14, 10, 3.5);
  ctx.save();
  ctx.translate(-5, 10);
  ctx.rotate(-0.25 + walk);
  clayOval(ctx, 0, 0, 3.2, 5.5, 0.15, C.oceanHi, C.ocean, C.oceanLo, 1.6);
  ctx.restore();
  ctx.save();
  ctx.translate(5, 10);
  ctx.rotate(0.25 - walk);
  clayOval(ctx, 0, 0, 3.2, 5.5, -0.15, C.oceanHi, C.ocean, C.oceanLo, 1.6);
  ctx.restore();

  clayBall(ctx, 0, -1, 12.5, C.oceanHi, C.ocean, C.oceanLo, 2);
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, -1, 12.5, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = C.land;
  ctx.beginPath();
  ctx.ellipse(-4, -4, 5.5, 3.8, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5, 1, 4.2, 3.2, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-1, 6, 4.8, 2.6, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.landLo;
  ctx.beginPath();
  ctx.ellipse(-3, -3, 3.2, 2.2, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, -1, 12.5, 0, Math.PI * 2);
  ink(ctx, 2);
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(-3.4, -3, 1.7, 2.2, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(3.4, -3, 1.7, 2.2, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(-4, -3.8, 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2.8, -3.8, 0.55, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, 1.5);
  ctx.beginPath();
  ctx.moveTo(-3.6, -6.2);
  ctx.lineTo(-1.2, -5.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3.6, -6.2);
  ctx.lineTo(1.2, -5.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 1.5, 3.2, 0.25, Math.PI - 0.25);
  ctx.stroke();

  clayRect(ctx, -7, -16, 14, 4, 1.5, C.goldHi, C.gold, C.goldLo, 1.6);
  tri(ctx, -6, -16, -4, -21, -2, -16, C.goldHi, C.goldLo, 1.4);
  tri(ctx, 2, -16, 4, -21, 6, -16, C.goldHi, C.goldLo, 1.4);
  tri(ctx, -2, -16, 0, -22, 2, -16, C.goldHi, C.goldLo, 1.4);
  clayBall(ctx, 0, -16.5, 1.6, C.redHi, C.red, C.redLo, 1.2);
}

function droneArt(ctx: CanvasRenderingContext2D, angle: number, bob: number, time: number): void {
  ctx.rotate(angle * 0.15);
  ctx.translate(0, Math.sin(bob) * 1.4);
  const spin = time * 10;
  ground(ctx, 0, 14, 11, 3.2);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 8, 12, 3.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 8, 8, 2.1, spin * 0.02, 0, Math.PI * 2);
  ctx.stroke();

  clayRect(ctx, -13, -8, 26, 16, 4, C.steelHi, C.steelLo, INK);
  clayRect(ctx, -9, -4, 18, 9, 2, C.redHi, C.red, C.redLo, 1.6);
  ctx.fillStyle = C.white;
  ctx.font = '800 6px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FAKE', 0, 1);

  clayBall(ctx, 0, -9, 7.5, '#d8eef8', '#4a88b8', '#102030', 2);
  clayBall(ctx, 0, -9, 4.2, '#8ec8f8', '#1a4fa8', '#081428', 1.5);
  blobHi(ctx, -2, -11, 1.8, 1.2, 0.7);
  ctx.fillStyle = `rgba(200,16,46,${0.45 + Math.sin(time * 12) * 0.4})`;
  ctx.beginPath();
  ctx.arc(0, -9, 1.4, 0, Math.PI * 2);
  ctx.fill();

  ink(ctx, 2);
  ctx.beginPath();
  ctx.moveTo(-13, 2);
  ctx.lineTo(-20, 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(13, 2);
  ctx.lineTo(20, 6);
  ctx.stroke();
  clayBall(ctx, -20, 9, 2.2, C.steelHi, C.steel, C.steelLo, 1.4);
  clayOval(ctx, 22, 5, 3.5, 5.5, 0.4, C.steelHi, C.steel, INK, 1.5);
  clayBall(ctx, 22, 0, 2.4, C.goldHi, C.gold, C.goldLo, 1.3);

  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(s * 14, -10);
    ctx.rotate(spin);
    ctx.fillStyle = 'rgba(200,210,230,0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 1.2, Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();
    clayBall(ctx, 0, 0, 1.5, C.goldHi, C.gold, C.goldLo, 1.2);
    ctx.restore();
  }
}

function bureauArt(ctx: CanvasRenderingContext2D, angle: number, bob: number, _time: number): void {
  ctx.rotate(angle * 0.12);
  ctx.translate(0, Math.sin(bob) * 0.5);
  ground(ctx, 1, 16, 11, 3.8);

  ctx.beginPath();
  ctx.moveTo(-2, 14);
  ctx.quadraticCurveTo(-16, 10, -18, 16);
  ctx.lineTo(-8, 16);
  ctx.closePath();
  paint(ctx, lin(ctx, -18, 10, -2, 16, C.redHi, C.red, C.redLo), 1.7);
  clayOval(ctx, -16, 12, 4.5, 3.2, 0.2, C.redHi, C.red, C.redLo, 1.6);

  clayOval(ctx, 0, 6, 11, 12, 0, C.robeHi, C.robe, C.robeLo, 2);
  clayRect(ctx, -9, -2, 18, 18, 8, C.robeHi, C.robe, C.robeLo, 2);
  ctx.beginPath();
  ctx.moveTo(-9, -4);
  ctx.quadraticCurveTo(0, -22, 9, -4);
  ctx.lineTo(7, 2);
  ctx.quadraticCurveTo(0, -8, -7, 2);
  ctx.closePath();
  paint(ctx, lin(ctx, 0, -20, 0, 2, C.robeHi, C.robeLo), 2);

  clayOval(ctx, 0, -8, 6.2, 6.6, 0, C.skin, C.skin, C.skinLo, 1.7);
  ink(ctx, 1.4);
  ctx.beginPath();
  ctx.ellipse(-2.6, -8.5, 2.6, 1.9, -0.1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(2.6, -8.5, 2.6, 1.9, 0.1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-0.3, -8.5);
  ctx.lineTo(0.3, -8.5);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(-2.5, -8.5, 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2.5, -8.5, 0.85, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, 1.5);
  ctx.beginPath();
  ctx.arc(0, -5.2, 2.2, 0.2, Math.PI - 0.2);
  ctx.stroke();

  clayRect(ctx, 7, 0, 11, 9, 2, C.woodHi, C.wood, C.woodLo, 1.6);
  goldBand(ctx, 7, 0, 11, 2);
  ctx.fillStyle = INK;
  ctx.fillRect(9, 3, 7, 1);
  ctx.fillRect(9, 5.5, 5, 1);
  clayRect(ctx, -12, 2, 6, 8, 1.5, C.goldHi, C.gold, C.goldLo, 1.4);
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
  ground(ctx, 1, 20, 15, 4.5);
  clayOval(ctx, 0, 16, 16, 6, 0, C.white, '#efe8dc', '#c8c0b4');
  clayOval(ctx, 0, 8, 11, 5, 0, C.white, '#f4efe6', '#c8c0b4');
  clayOval(ctx, 0, 1, 7, 4, 0, C.white, '#f7f3ea', '#c8c0b4');
  clayRect(ctx, -2.5, -12, 5, 10, 2, C.goldHi, C.gold, C.goldLo, 1.6);
  clayBall(ctx, 0, -13, 2.4, C.oceanHi, C.ocean, C.oceanLo, 1.4);
  ink(ctx, 1.7);
  ctx.strokeStyle = '#6ad4e8';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + time * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(Math.cos(a) * 9, -2 + Math.sin(time * 3 + i) * 2, Math.cos(a) * 13, 10);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(80,210,230,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 7, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function lmRoses(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 18, 15, 4.5);
  clayRect(ctx, -17, 6, 34, 12, 4, C.woodHi, C.wood, C.woodLo);
  goldBand(ctx, -17, 6, 34, 3);
  clayRect(ctx, -15, -6, 30, 14, 4, C.grassHi, C.grass, C.grassLo, 1.8);
  for (let i = 0; i < 8; i++) {
    const rx = -12 + (i % 4) * 8 + (i > 3 ? 3 : 0);
    const ry = -8 - (i > 3 ? 6 : 0) + Math.sin(time * 2 + i) * 0.6;
    clayOval(ctx, rx, ry, 4, 3.3, 0.2, C.redHi, C.red, C.redLo, 1.5);
    clayBall(ctx, rx, ry, 1.1, C.goldHi, C.gold, C.goldLo, 1.1);
  }
}

function lmLincoln(ctx: CanvasRenderingContext2D, time: number): void {
  ground(ctx, 1, 20, 13, 4.5);
  clayRect(ctx, -14, 12, 28, 10, 3, C.white, '#efe8dc', '#c8c0b4');
  goldBand(ctx, -14, 12, 28, 3);
  clayRect(ctx, -10, 2, 20, 12, 3, C.white, '#f4efe6', '#c8c0b4');
  clayRect(ctx, -11, 6, 8, 8, 2, C.white, '#efe8dc', '#c0b8ac', 1.6);
  clayRect(ctx, 3, 6, 8, 8, 2, C.white, '#efe8dc', '#c0b8ac', 1.6);
  clayRect(ctx, -6, -8, 12, 16, 4, C.white, '#f7f3ea', '#c8c0b4');
  clayOval(ctx, 0, -12, 5.5, 6, 0, C.white, '#f4efe6', '#c0b8ac');
  clayRect(ctx, -5, -10, 10, 2.4, 1, C.stoneLo, C.stone, C.stoneHi, 1.4);
  star5(ctx, 0, -20 + Math.sin(time * 2) * 0.3, 3.2, 1.4);
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
  ground(ctx, 1, 20, 11, 3.8);
  clayRect(ctx, -8, -4, 16, 26, 4, C.steelHi, C.steel, C.steelLo);
  clayRect(ctx, -12, -16, 24, 14, 4, C.steelHi, C.steel, C.steelLo);
  toyWindow(ctx, -6, -12, 12, 8, 2, 1);
  goldBand(ctx, -12, -18, 24, 3);
  ctx.save();
  ctx.translate(8, -10);
  ctx.rotate(time * 1.3);
  const beam = ctx.createLinearGradient(0, 0, 34, 0);
  beam.addColorStop(0, 'rgba(255,240,160,0.5)');
  beam.addColorStop(1, 'rgba(255,240,160,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(0, -3);
  ctx.lineTo(34, -10);
  ctx.lineTo(34, 10);
  ctx.lineTo(0, 3);
  ctx.closePath();
  ctx.fill();
  clayRect(ctx, -3, -3, 6, 6, 2, C.goldHi, C.gold, C.goldLo, 1.5);
  ctx.restore();
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
