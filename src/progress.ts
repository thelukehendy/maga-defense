import type { DifficultyId, MapId } from './campaign.ts';

const KEY = 'maga-stars-v1';

type StarBook = Record<string, number>;

function slot(map: MapId, diff: DifficultyId): string {
  return `${map}:${diff}`;
}

function read(): StarBook {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StarBook;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function write(book: StarBook): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(book));
  } catch {
    /* private mode */
  }
}

export function getStars(map: MapId, diff: DifficultyId): number {
  return read()[slot(map, diff)] ?? 0;
}

export function recordStars(map: MapId, diff: DifficultyId, stars: number): number {
  const book = read();
  const key = slot(map, diff);
  const next = Math.max(book[key] ?? 0, Math.max(0, Math.min(3, stars)));
  book[key] = next;
  write(book);
  return next;
}

export function rateStars(won: boolean, approval: number, startApproval: number, leaks: number): number {
  if (!won) return 0;
  let s = 1;
  if (approval >= startApproval * 0.55 && leaks <= 8) s = 2;
  if (approval >= startApproval * 0.82 && leaks <= 2) s = 3;
  return s;
}

export function starGlyphs(n: number): string {
  const filled = Math.max(0, Math.min(3, n | 0));
  return '★'.repeat(filled) + '☆'.repeat(3 - filled);
}

export function rankTitle(won: boolean, stars: number, streak: number, kills: number): string {
  if (!won) {
    if (streak >= 18) return 'SO CLOSE IT HURTS';
    if (kills >= 80) return 'THE BASE STILL LIKES YOU';
    return 'NEEDS MORE WALL';
  }
  if (stars >= 3 && streak >= 28) return 'YUGE. HISTORIC. PERFECT.';
  if (stars >= 3) return 'STABLE GENIUS';
  if (stars >= 2 && streak >= 18) return 'RATINGS MACHINE';
  if (stars >= 2) return 'VERY PRESIDENTIAL';
  if (streak >= 18) return 'WINNING STREAKLY';
  return 'WINNING';
}
