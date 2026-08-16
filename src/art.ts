import type { LandmarkKind } from './campaign.ts';
import type { EnemyId, TowerId } from './types.ts';

export function star5(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, ir: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : ir;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function marble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed = 1,
): void {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.35, '#f4f1ea');
  g.addColorStop(0.7, '#e6e0d4');
  g.addColorStop(1, '#cfc6b8');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = 'rgba(150,140,130,0.28)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const yy = y + ((seed * 17 + i * 23) % 97) / 97 * h;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.bezierCurveTo(x + w * 0.3, yy + 4, x + w * 0.7, yy - 5, x + w, yy + 2);
    ctx.stroke();
  }
  ctx.restore();
  const hi = ctx.createLinearGradient(x, y, x, y + 8);
  hi.addColorStop(0, 'rgba(255,255,255,0.55)');
  hi.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hi;
  ctx.fillRect(x, y, w, 8);
}

export function gold(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#fff3b0');
  g.addColorStop(0.35, '#e6c35c');
  g.addColorStop(0.7, '#c9a227');
  g.addColorStop(1, '#8a6a1a');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x, y, w, Math.max(1, h * 0.22));
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
  ctx.fillStyle = lo;
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 3, w, h, r);
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.strokeStyle = hi;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 1, y + h - 2);
  ctx.lineTo(x + 1, y + 1);
  ctx.lineTo(x + w - 2, y + 1);
  ctx.stroke();
  ctx.strokeStyle = lo;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + h - 1);
  ctx.lineTo(x + w - 1, y + h - 1);
  ctx.lineTo(x + w - 1, y + 2);
  ctx.stroke();
  ctx.restore();
}

export function column(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, '#b8b0a4');
  g.addColorStop(0.22, '#ffffff');
  g.addColorStop(0.55, '#efeae0');
  g.addColorStop(0.82, '#c9c0b2');
  g.addColorStop(1, '#8f8678');
  ctx.fillStyle = '#6a6358';
  ctx.fillRect(x + 1, y + 2, w, h);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  gold(ctx, x - 2, y - 5, w + 4, 6);
  gold(ctx, x - 2, y + h - 2, w + 4, 6);
}

function pane(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = '#1a1204';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#1c2a44');
  g.addColorStop(1, '#0a1220');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y);
  ctx.lineTo(x + w * 0.5, y + h);
  ctx.moveTo(x, y + h * 0.5);
  ctx.lineTo(x + w, y + h * 0.5);
  ctx.stroke();
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
  ctx.translate(x, y);
  const glow = leak > 0 ? 0.55 : 0.16;
  ctx.fillStyle = `rgba(230,195,92,${glow})`;
  ctx.fillRect(-8, -8, w + 16, h + 16);

  if (mapId === 'avenue') {
    drawGoldTower(ctx, w, h, time);
  } else if (mapId === 'border') {
    drawFort(ctx, w, h, time);
  } else if (mapId === 'palazzo') {
    drawPalazzo(ctx, w, h, time);
  } else {
    drawWhiteHouse(ctx, w, h, time);
  }
  ctx.restore();
}

function drawWhiteHouse(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
  const step = 8;
  for (let i = 2; i >= 0; i--) {
    marble(ctx, 10 - i * 6, h - 18 + i * 4, w - 20 + i * 12, step, 3 + i);
  }
  marble(ctx, 14, 44, w - 28, h - 62, 8);
  ctx.fillStyle = '#1c3f9a';
  ctx.beginPath();
  ctx.moveTo(w / 2, 6);
  ctx.lineTo(w - 10, 46);
  ctx.lineTo(10, 46);
  ctx.closePath();
  ctx.fill();
  gold(ctx, 10, 44, w - 20, 5);
  ctx.strokeStyle = '#e6c35c';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#e6c35c';
  star5(ctx, w / 2, 28, 12, 5);
  ctx.fill();
  ctx.strokeStyle = '#8a6a1a';
  ctx.lineWidth = 1;
  ctx.stroke();
  const cols = 4;
  const span = w - 48;
  for (let i = 0; i < cols; i++) {
    const cx = 24 + (span / (cols - 1)) * i;
    column(ctx, cx, 52, 11, 78);
  }
  pane(ctx, 28, 58, 16, 18);
  pane(ctx, w - 46, 58, 16, 18);
  pane(ctx, 28, 86, 16, 18);
  pane(ctx, w - 46, 86, 16, 18);
  bevelRect(ctx, w / 2 - 12, 92, 24, 38, '#6b4a24', '#c4a574', '#3a2412', 2);
  gold(ctx, w / 2 + 6, 108, 4, 4);
  flag(ctx, w - 28, 8, time);
}

function drawPalazzo(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
  gold(ctx, 8, h - 16, w - 16, 12);
  marble(ctx, 16, 40, w - 32, h - 56, 4);
  ctx.fillStyle = '#1c3f9a';
  ctx.fillRect(18, 18, w - 36, 28);
  gold(ctx, 14, 14, w - 28, 8);
  ctx.fillStyle = '#e6c35c';
  star5(ctx, w / 2, 32, 10, 4);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const cx = 28 + i * 28;
    ctx.fillStyle = '#f4f1e8';
    ctx.beginPath();
    ctx.arc(cx + 6, 70, 12, Math.PI, 0);
    ctx.fill();
    marble(ctx, cx, 70, 12, 50, 2 + i);
  }
  flag(ctx, w - 26, 4, time);
}

function drawFort(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
  const sand = ctx.createLinearGradient(0, 20, 0, h);
  sand.addColorStop(0, '#e8d2a8');
  sand.addColorStop(1, '#b08958');
  ctx.fillStyle = '#5a4630';
  ctx.fillRect(12, 36, w - 20, h - 40);
  ctx.fillStyle = sand;
  ctx.fillRect(10, 32, w - 20, h - 40);
  gold(ctx, 8, 24, w - 16, 10);
  for (let i = 0; i < 7; i++) ctx.fillRect(12 + i * 24, 12, 14, 16);
  pane(ctx, 28, 50, 18, 22);
  pane(ctx, w - 52, 50, 18, 22);
  bevelRect(ctx, w / 2 - 14, 88, 28, 36, '#4a3a28', '#c4a574', '#2a1c10', 0);
  flag(ctx, w - 24, 0, time);
}

function drawGoldTower(ctx: CanvasRenderingContext2D, w: number, h: number, time: number): void {
  gold(ctx, 40, 8, w - 80, 18);
  gold(ctx, 28, 24, w - 56, 28);
  gold(ctx, 18, 50, w - 36, h - 66);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 4; col++) {
      pane(ctx, 28 + col * 34, 58 + row * 18, 14, 12);
    }
  }
  ctx.fillStyle = '#e6c35c';
  star5(ctx, w / 2, 16, 8, 3);
  ctx.fill();
  flag(ctx, w - 22, 4, time);
}

function flag(ctx: CanvasRenderingContext2D, x: number, y: number, time: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#e6c35c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 36);
  ctx.stroke();
  ctx.fillStyle = '#c8102e';
  ctx.fillRect(1, 0, 26, 16);
  ctx.fillStyle = '#1c3f9a';
  ctx.fillRect(1, 0, 11, 9);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#f4f1e8' : '#c8102e';
    ctx.fillRect(12, 2 + i * 3.5 + Math.sin(time * 6 + i) * 0.5, 14, 3);
  }
  ctx.restore();
}

export function drawTowerArt(
  ctx: CanvasRenderingContext2D,
  kind: TowerId,
  tier: number,
  angle: number,
  time: number,
  cooldown: number,
): void {
  const s = 1 + tier * 0.08;
  ctx.scale(s, s);
  if (kind === 'truth') {
    const pulse = 0.45 + Math.sin(time * 9) * 0.2;
    ctx.fillStyle = `rgba(60,240,255,${pulse * 0.28})`;
    ctx.beginPath();
    ctx.arc(0, 0, 30 + tier * 3, 0, Math.PI * 2);
    ctx.fill();
    gold(ctx, -16, 10, 32, 10);
    marble(ctx, -10, -26, 20, 38, 2);
    ctx.fillStyle = '#0b1d4a';
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(12, 8);
    ctx.lineTo(-12, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3cf0ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.rotate(angle);
    ctx.strokeStyle = '#7af7ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(20, 0);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#3cf0ff';
    ctx.font = '800 8px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tier >= 2 ? 'LIVE' : 'FACT', 0, 6);
  } else if (kind === 'trebuchet') {
    const period = 1 / (0.48 + tier * 0.1);
    const u = 1 - Math.min(1, cooldown / period);
    const arm = -0.9 + u * 2.4;
    gold(ctx, -20, 14, 40, 8);
    marble(ctx, -16, 4, 32, 12, 3);
    ctx.fillStyle = '#c8102e';
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(10, -4);
    ctx.lineTo(6, 8);
    ctx.lineTo(-6, 8);
    ctx.fill();
    ctx.save();
    ctx.rotate(arm);
    ctx.strokeStyle = '#d9c7a2';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(24, -18);
    ctx.stroke();
    ctx.fillStyle = '#e6c35c';
    ctx.beginPath();
    ctx.arc(26, -20, 8 + tier, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1204';
    ctx.font = '800 7px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', 26, -19);
    ctx.restore();
  } else if (kind === 'brick') {
    bevelRect(ctx, -20, -10, 40, 28, '#8a3b28', '#e8c9b0', '#4a1e14', 3);
    ctx.fillStyle = '#c46a48';
    for (let row = 0; row < 3; row++) {
      const off = row % 2 === 0 ? 0 : 7;
      for (let col = 0; col < 4; col++) ctx.fillRect(-16 + off + col * 10, -6 + row * 7, 8, 5);
    }
    ctx.save();
    ctx.rotate(angle);
    gold(ctx, 10, -6, 24, 12);
    ctx.restore();
    ctx.fillStyle = '#f4f1e8';
    ctx.font = '800 8px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tier >= 2 ? 'DONE' : 'WALL', 0, 26);
  } else {
    ctx.strokeStyle = `rgba(230,195,92,${0.4 + Math.sin(time * 4) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 28 + tier * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    bevelRect(ctx, -24, -10, 48, 22, '#6b4a24', '#e6c35c', '#3a2412', 2);
    gold(ctx, -24, -12, 48, 5);
    marble(ctx, -8, -20, 14, 10, 1);
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(10, -18, 8, 8);
    for (let i = 0; i < 3 + tier; i++) {
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
    ctx.fillText('EO', 0, 22);
  }
}

export function drawEnemyArt(
  ctx: CanvasRenderingContext2D,
  kind: EnemyId,
  angle: number,
  bob: number,
  _time: number,
): void {
  if (kind === 'alien') {
    ctx.rotate(angle);
    const body = ctx.createRadialGradient(-3, -4, 2, 0, 0, 16);
    body.addColorStop(0, '#ff6b6b');
    body.addColorStop(1, '#8a1020');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    gold(ctx, -8, 6, 16, 4);
    ctx.strokeStyle = '#9dffb0';
    ctx.beginPath();
    ctx.moveTo(-6, -14);
    ctx.lineTo(-8, -22);
    ctx.moveTo(6, -14);
    ctx.lineTo(8, -22);
    ctx.stroke();
    ctx.fillStyle = '#9dffb0';
    ctx.beginPath();
    ctx.arc(-8, -22, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, -22, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(-4, -2, 3, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(4, -2, 3, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'drone') {
    const spin = bob * 14;
    bevelRect(ctx, -16, -8, 32, 16, '#2a3344', '#9aa7c2', '#111', 4);
    ctx.fillStyle = '#ff3b3b';
    ctx.fillRect(-12, -4, 24, 8);
    ctx.fillStyle = '#fff';
    ctx.font = '800 6px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FAKE', 0, 0);
    for (const s of [-1, 1] as const) {
      ctx.save();
      ctx.translate(s * 18, -10);
      ctx.rotate(spin);
      ctx.strokeStyle = '#cfd6e4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(9, 0);
      ctx.moveTo(0, -9);
      ctx.lineTo(0, 9);
      ctx.stroke();
      ctx.restore();
    }
  } else {
    ctx.rotate(angle * 0.12);
    bevelRect(ctx, -12, -8, 24, 24, '#6b7280', '#e5e7eb', '#111827', 2);
    ctx.fillStyle = '#111827';
    ctx.fillRect(-3, -6, 6, 16);
    ctx.fillStyle = '#e6c35c';
    ctx.fillRect(-2, 2, 4, 6);
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.arc(0, -16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -18, 6, 3);
    ctx.strokeRect(2, -18, 6, 3);
    bevelRect(ctx, 8, 4, 12, 10, '#92400e', '#e8c9b0', '#3a1e08', 1);
    ctx.fillStyle = '#d1d5db';
    ctx.font = '700 6px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GS-15', 0, 22);
  }
}

export function drawLandmarkArt(ctx: CanvasRenderingContext2D, kind: LandmarkKind, time: number): void {
  ctx.save();
  if (kind === 'fountain') {
    marble(ctx, -18, 8, 36, 10, 2);
    marble(ctx, -12, -2, 24, 12, 3);
    marble(ctx, -6, -12, 12, 12, 4);
    ctx.strokeStyle = 'rgba(140,200,255,0.7)';
    for (let i = 0; i < 6; i++) {
      const a = time * 3 + i;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 10, -4 + Math.sin(a * 2) * 3, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (kind === 'roses') {
    bevelRect(ctx, -20, 4, 40, 16, '#6b4a24', '#e6c35c', '#3a2412', 2);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? '#c8102e' : '#8a1020';
      ctx.beginPath();
      ctx.arc(-12 + i * 6, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'lincoln') {
    marble(ctx, -14, 10, 28, 10, 5);
    ctx.fillStyle = '#e6e0d4';
    ctx.fillRect(-8, -8, 16, 20);
    ctx.beginPath();
    ctx.arc(0, -12, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'palm') {
    ctx.fillStyle = '#6b4a24';
    ctx.fillRect(-3, -6, 6, 28);
    ctx.fillStyle = '#1c6b3a';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i / 6) * Math.PI - 0.4 + Math.sin(time) * 0.05);
      ctx.fillRect(0, -18, 16, 4);
      ctx.restore();
    }
  } else if (kind === 'pool') {
    gold(ctx, -22, -10, 44, 24);
    ctx.fillStyle = '#2a9df4';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'golf') {
    ctx.fillStyle = '#2f7a3e';
    ctx.beginPath();
    ctx.ellipse(0, 6, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e6c35c';
    ctx.beginPath();
    ctx.moveTo(6, 4);
    ctx.lineTo(6, -16);
    ctx.stroke();
    ctx.fillStyle = '#c8102e';
    ctx.fillRect(6, -16, 10, 6);
  } else if (kind === 'cactus') {
    ctx.fillStyle = '#2f7a3e';
    ctx.fillRect(-5, -8, 10, 28);
    ctx.fillRect(-16, 0, 12, 6);
    ctx.fillRect(6, -4, 12, 6);
    ctx.fillStyle = '#e6c35c';
    ctx.beginPath();
    ctx.arc(0, -12, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'watch') {
    bevelRect(ctx, -8, -6, 16, 30, '#4a5560', '#e6c35c', '#1a1f24', 1);
    ctx.fillStyle = '#ffe9a0';
    ctx.beginPath();
    ctx.arc(0, -10, 6 + Math.sin(time * 4), 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'gate') {
    bevelRect(ctx, -22, -8, 44, 28, '#6b4a24', '#e6c35c', '#2a1c10', 2);
    ctx.fillStyle = '#1a1204';
    ctx.fillRect(-8, 0, 16, 20);
  } else if (kind === 'taxi') {
    bevelRect(ctx, -18, -6, 36, 16, '#f5c518', '#fff3b0', '#8a6a1a', 4);
    ctx.fillStyle = '#1a1204';
    ctx.fillRect(-10, -2, 8, 6);
    ctx.fillRect(4, -2, 8, 6);
    ctx.beginPath();
    ctx.arc(-10, 12, 4, 0, Math.PI * 2);
    ctx.arc(10, 12, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'newsstand') {
    bevelRect(ctx, -16, -10, 32, 28, '#c8102e', '#fff', '#4a1020', 2);
    ctx.fillStyle = '#fff';
    ctx.font = '700 6px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FAKE', 0, 4);
  } else {
    bevelRect(ctx, -24, -16, 48, 28, '#0b1d4a', '#e6c35c', '#050b18', 2);
    ctx.fillStyle = '#e6c35c';
    ctx.font = '800 8px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WINNING', 0, 0);
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
  ctx.fillStyle = seed > 0.5 ? themeHi : themeGrass;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.strokeStyle = grid;
  ctx.strokeRect(x + 3, y + 3, size - 6, size - 6);
}
