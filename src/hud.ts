import type { Synth } from './audio.ts';
import { ENEMY_LORE, MAX_TIER, MAP_ORDER, SPECIAL_NAME, TOWER_LORE, towerStats, UPGRADE_COST, wavePreview, END_QUOTES_LOSS, END_QUOTES_WIN } from './campaign.ts';
import { getStars, rankTitle, rateStars, recordStars, starGlyphs } from './progress.ts';
import type { Sim } from './sim.ts';
import { MAX_WAVES, SELL_RATIO, TOWERS, type TowerId } from './types.ts';

export type HudPhase = 'title' | 'select' | 'play' | 'pause' | 'end';

export type HudHandles = {
  donations: HTMLElement;
  approvalFill: HTMLElement;
  approvalText: HTMLElement;
  wave: HTMLElement;
  fps: HTMLElement;
  speedBtn: HTMLButtonElement;
  muteBtn: HTMLButtonElement;
  pauseBtn: HTMLButtonElement;
  sendBtn: HTMLButtonElement;
  sellBtn: HTMLButtonElement;
  cards: HTMLButtonElement[];
  overlayTitle: HTMLElement;
  overlayPause: HTMLElement;
  overlayEnd: HTMLElement;
  overlaySelect: HTMLElement | null;
  overlayOptions: HTMLElement | null;
  overlayInfo: HTMLElement | null;
  endTitle: HTMLElement;
  endBody: HTMLElement;
  missionName: HTMLElement | null;
  upgradeBtn: HTMLButtonElement | null;
  inspectTitle: HTMLElement | null;
  inspectBody: HTMLElement | null;
  inspectStats: HTMLElement | null;
  diffBtns: HTMLButtonElement[];
  mapCards: HTMLButtonElement[];
  optMusicBtn: HTMLButtonElement | null;
  optSfxBtn: HTMLButtonElement | null;
  endStars: HTMLElement | null;
  endStats: HTMLElement | null;
  endRank: HTMLElement | null;
  nextMapBtn: HTMLButtonElement | null;
  pauseQuote: HTMLElement | null;
};

type SimPaint = Sim & { diff?: { id?: string } };

function opt<T extends HTMLElement>(root: HTMLElement, sel: string): T | null {
  return root.querySelector<T>(sel);
}

function formatStats(kind: TowerId, tier: number): string {
  const s = towerStats(kind, tier);
  const parts = [`TIER ${s.label}`, `RNG ${s.range.toFixed(1)}`];
  if (s.damage) parts.push(`DMG ${s.damage}`);
  if (s.aoe) parts.push(`AOE ${s.aoe}`);
  if (s.wallHp) parts.push(`WALL ${s.wallHp}HP`);
  if (s.buff > 1) parts.push(`AURA ${s.buff.toFixed(2)}×`);
  return parts.join(' · ');
}

function paintInspect(hud: HudHandles, sim: Sim): void {
  const title = hud.inspectTitle;
  const body = hud.inspectBody;
  const stats = hud.inspectStats;
  if (!title || !body || !stats) return;

  if (sim.selected) {
    const kind = sim.selected.kind;
    const tier = sim.selected.tier ?? 0;
    const lore = TOWER_LORE[kind];
    const upgradeName = lore.upgrades[Math.min(tier, lore.upgrades.length - 1)] ?? lore.upgrades[0];
    title.textContent = lore.title;
    body.textContent = `${lore.motto} — ${lore.how}`;
    stats.textContent = `${formatStats(kind, tier)} · ${upgradeName}${tier >= MAX_TIER ? ` · ${SPECIAL_NAME[kind] ?? 'SPECIAL'} (E)` : ''}`;
    return;
  }

  if (sim.placing) {
    const lore = TOWER_LORE[sim.placing];
    title.textContent = `PLACE ${lore.title}`;
    body.textContent = `${lore.motto} — ${lore.how}`;
    stats.textContent = formatStats(sim.placing, 0);
    return;
  }

    const threats = Object.values(ENEMY_LORE)
      .map((e) => `${e.title}: ${e.motto}`)
      .join(' · ');
    if (sim.waveReady() && sim.wave < MAX_WAVES) {
      const next = sim.wave + 1;
      title.textContent = next === 1 ? 'OPENING STATEMENT' : `NEXT — WAVE ${next}`;
      body.textContent = wavePreview(sim.map.def.id, next);
      stats.textContent = 'Place · Upgrade · Hold the lawn';
      return;
    }
    title.textContent = 'THREAT BRIEF';
    body.textContent = 'Select a tower on the lawn, or pick a card to preview the arsenal.';
    stats.textContent = threats;
  }

function paintUpgrade(hud: HudHandles, sim: Sim): void {
  const btn = hud.upgradeBtn;
  if (!btn) return;
  const t = sim.selected;
  btn.classList.remove('special-ready');
  if (!t) {
    btn.disabled = true;
    btn.textContent = 'UPGRADE';
    return;
  }
  const tier = t.tier ?? 0;
  if (tier >= MAX_TIER) {
    if (t.specialCd > 0) {
      btn.disabled = true;
      btn.textContent = `SPECIAL ${Math.ceil(t.specialCd)}s`;
      return;
    }
    btn.disabled = false;
    btn.textContent = SPECIAL_NAME[t.kind] ?? 'SPECIAL';
    btn.classList.add('special-ready');
    return;
  }
  const cost = UPGRADE_COST[t.kind][tier] ?? 0;
  btn.disabled = sim.donations < cost;
  btn.textContent = `UPGRADE $${cost}`;
}

export function bindHud(root: HTMLElement): HudHandles {
  const $ = (sel: string): HTMLElement => {
    const el = root.querySelector(sel);
    if (!el) throw new Error(`Missing ${sel}`);
    return el as HTMLElement;
  };

  return {
    donations: $('#stat-donations'),
    approvalFill: $('#approval-fill'),
    approvalText: $('#approval-text'),
    wave: $('#stat-wave'),
    fps: $('#stat-fps'),
    speedBtn: $('#btn-speed') as HTMLButtonElement,
    muteBtn: $('#btn-mute') as HTMLButtonElement,
    pauseBtn: $('#btn-pause') as HTMLButtonElement,
    sendBtn: $('#btn-send') as HTMLButtonElement,
    sellBtn: $('#btn-sell') as HTMLButtonElement,
    cards: [...root.querySelectorAll<HTMLButtonElement>('.arsenal [data-tower]')],
    overlayTitle: $('#overlay-title'),
    overlayPause: $('#overlay-pause'),
    overlayEnd: $('#overlay-end'),
    overlaySelect: opt(root, '#overlay-select'),
    overlayOptions: opt(root, '#overlay-options'),
    overlayInfo: opt(root, '#overlay-info'),
    endTitle: $('#end-title'),
    endBody: $('#end-body'),
    missionName: opt(root, '#mission-name'),
    upgradeBtn: opt<HTMLButtonElement>(root, '#btn-upgrade'),
    inspectTitle: opt(root, '#inspect-title'),
    inspectBody: opt(root, '#inspect-body'),
    inspectStats: opt(root, '#inspect-stats'),
    diffBtns: [...root.querySelectorAll<HTMLButtonElement>('[data-diff]')],
    mapCards: [...root.querySelectorAll<HTMLButtonElement>('[data-map]')],
    optMusicBtn: opt<HTMLButtonElement>(root, '#btn-opt-music'),
    optSfxBtn: opt<HTMLButtonElement>(root, '#btn-opt-sfx'),
    endStars: opt(root, '#end-stars'),
    endStats: opt(root, '#end-stats'),
    endRank: opt(root, '#end-rank'),
    nextMapBtn: opt<HTMLButtonElement>(root, '#btn-next-map'),
    pauseQuote: opt(root, '#pause-quote'),
  };
}

export function hideMenus(hud: HudHandles): void {
  hud.overlayOptions?.classList.add('hidden');
  hud.overlayInfo?.classList.add('hidden');
}

export function paintHud(
  hud: HudHandles,
  sim: Sim,
  fps: number,
  audio: Synth,
  paused: boolean,
  phase: HudPhase,
): void {
  const gold = `$${sim.donations.toLocaleString()}`;
  if (hud.donations.textContent !== gold) {
    hud.donations.textContent = gold;
    hud.donations.classList.remove('bump');
    void hud.donations.offsetWidth;
    hud.donations.classList.add('bump');
  }
  const maxA = Math.max(1, sim.diff?.startApproval ?? 100);
  hud.approvalFill.style.width = `${Math.min(100, (100 * sim.approval) / maxA)}%`;
  hud.approvalFill.classList.toggle('low', sim.approval <= maxA * 0.3);
  hud.approvalText.textContent = `Approval ${sim.approval}%`;
  hud.approvalFill.parentElement?.setAttribute('aria-valuenow', String(sim.approval));
  hud.wave.textContent = `${Math.min(sim.wave, MAX_WAVES)}/${MAX_WAVES}`;
  hud.fps.textContent = `${Math.round(fps)} FPS`;
  hud.fps.parentElement?.classList.toggle('hidden', !/(?:^|[?&])debug=1(?:&|$)/.test(location.search));
  const narrow = typeof window !== 'undefined' && window.matchMedia('(max-width: 420px)').matches;
  hud.speedBtn.textContent = `${sim.speed}×`;
  hud.muteBtn.textContent = audio.sfxMuted ? (narrow ? 'FX OFF' : 'EFFECTS OFF') : narrow ? 'FX' : 'EFFECTS ON';
  if (hud.optMusicBtn) hud.optMusicBtn.textContent = audio.musicMuted ? 'MUSIC OFF' : 'MUSIC ON';
  if (hud.optSfxBtn) hud.optSfxBtn.textContent = audio.sfxMuted ? 'EFFECTS OFF' : 'EFFECTS ON';
  hud.pauseBtn.textContent = paused ? (narrow ? 'GO' : 'RESUME') : 'PAUSE';
  if (sim.waveReady()) {
    hud.sendBtn.disabled = false;
    hud.sendBtn.classList.toggle('auto-on', sim.autoWaves && sim.wave > 0);
    hud.sendBtn.classList.toggle('pulse', !(sim.autoWaves && sim.wave > 0));
    if (sim.autoWaves && sim.wave > 0) {
      const left = Math.max(0, 2.4 - sim.between);
      hud.sendBtn.textContent = narrow ? `AUTO ${left.toFixed(1)}` : `AUTO IN ${left.toFixed(1)}s`;
    } else {
      hud.sendBtn.textContent = sim.wave === 0
        ? narrow
          ? 'WAVE 1'
          : 'START WAVE 1'
        : narrow
          ? 'NEXT'
          : 'SEND NEXT WAVE';
    }
    if (sim.wave < MAX_WAVES) {
      hud.sendBtn.title = wavePreview(sim.map.def.id, sim.wave + 1);
    }
  } else {
    hud.sendBtn.disabled = false;
    hud.sendBtn.classList.toggle('pulse', !sim.autoWaves);
    hud.sendBtn.classList.toggle('auto-on', sim.autoWaves);
    hud.sendBtn.textContent = sim.autoWaves
      ? narrow
        ? 'AUTO ON'
        : 'AUTO START ON'
      : narrow
        ? 'AUTO'
        : 'AUTO START';
  }
  hud.sellBtn.disabled = !sim.selected;
  hud.sellBtn.textContent = sim.selected
    ? `SELL $${Math.round(sim.selected.costPaid * SELL_RATIO)}`
    : narrow
      ? 'SELL'
      : 'SELL TOWER';

  const mapName = sim.map?.def?.name;
  if (hud.missionName && mapName) hud.missionName.textContent = mapName;

  const diffId = (sim as SimPaint).diff?.id;
  if (diffId) {
    for (const btn of hud.diffBtns) {
      btn.classList.toggle('selected', btn.dataset.diff === diffId);
    }
  }

  const mapId = sim.map?.def?.id;
  if (mapId) {
    for (const card of hud.mapCards) {
      card.classList.toggle('selected', card.dataset.map === mapId);
      const starEl = card.querySelector<HTMLElement>('.plaque-stars');
      const id = card.dataset.map;
      if (starEl && id && diffId) {
        starEl.textContent = starGlyphs(getStars(id as typeof MAP_ORDER[number], diffId as 'easy' | 'normal' | 'hard' | 'insane'));
      }
    }
  }

  for (const card of hud.cards) {
    const id = card.dataset.tower as TowerId;
    const def = TOWERS[id];
    const lore = TOWER_LORE[id];
    card.classList.toggle('selected', sim.placing === id);
    card.classList.toggle('poor', sim.donations < def.cost);
    const cost = card.querySelector('.cost');
    if (cost) cost.textContent = `$${def.cost}`;
    card.title = `${lore.motto} — ${lore.how}`;
  }

  paintUpgrade(hud, sim);
  paintInspect(hud, sim);

  hud.overlayTitle.classList.toggle('hidden', phase !== 'title');
  hud.overlaySelect?.classList.toggle('hidden', phase !== 'select');
  hud.overlayPause.classList.toggle('hidden', phase !== 'pause');
  hud.overlayEnd.classList.toggle('hidden', phase !== 'end');
  if (phase === 'play' || phase === 'end' || phase === 'select') hideMenus(hud);
  if (phase === 'end') paintEnd(hud, sim);
}

function paintEnd(hud: HudHandles, sim: Sim): void {
  const mins = Math.floor(sim.playTime / 60);
  const secs = Math.floor(sim.playTime % 60)
    .toString()
    .padStart(2, '0');
  const stars = rateStars(sim.won, sim.approval, sim.diff.startApproval, sim.leakCount);
  const rank = rankTitle(sim.won, stars, sim.maxStreak, sim.kills);
  const quotes = sim.won ? END_QUOTES_WIN : END_QUOTES_LOSS;
  const quote = quotes[(sim.kills + sim.maxStreak + (sim.won ? 7 : 2)) % quotes.length]!;
  if (sim.won) {
    recordStars(sim.map.def.id, sim.diff.id, stars);
    hud.endTitle.textContent = stars >= 3 ? 'YUGE VICTORY' : 'TREMENDOUS VICTORY';
    hud.endBody.textContent = `${sim.map.def.victory} ${quote}`;
  } else {
    hud.endTitle.textContent = "YOU'RE FIRED";
    hud.endBody.textContent = `${sim.map.def.defeat} ${quote}`;
  }
  if (hud.endRank) hud.endRank.textContent = rank;
  if (hud.endStars) hud.endStars.textContent = starGlyphs(stars);
  if (hud.endStats) {
    hud.endStats.innerHTML = [
      ['Fired', String(sim.kills)],
      ['Leaks', String(sim.leakCount)],
      ['Perfect', String(sim.perfectWaves)],
      ['Streak', String(sim.maxStreak)],
      ['Raised', `$${sim.earned.toLocaleString()}`],
      ['Time', `${mins}:${secs}`],
    ]
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
      .join('');
  }
  const idx = MAP_ORDER.indexOf(sim.map.def.id);
  const hasNext = sim.won && idx >= 0 && idx < MAP_ORDER.length - 1;
  hud.nextMapBtn?.classList.toggle('hidden', !hasNext);
}
