import { ENEMY_LORE, MAX_TIER, TOWER_LORE, towerStats, UPGRADE_COST } from './campaign.ts';
import type { Sim } from './sim.ts';
import { MAX_WAVES, TOWERS, type TowerId } from './types.ts';

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
  endTitle: HTMLElement;
  endBody: HTMLElement;
  missionName: HTMLElement | null;
  upgradeBtn: HTMLButtonElement | null;
  inspectTitle: HTMLElement | null;
  inspectBody: HTMLElement | null;
  inspectStats: HTMLElement | null;
  diffBtns: HTMLButtonElement[];
  mapCards: HTMLButtonElement[];
  overlayCodex: HTMLElement | null;
  codexBtn: HTMLButtonElement | null;
  codexCloseBtn: HTMLButtonElement | null;
};

type SimPaint = Sim & { diff?: { id?: string } };

function opt<T extends HTMLElement>(root: HTMLElement, sel: string): T | null {
  return root.querySelector<T>(sel);
}

function formatStats(kind: TowerId, tier: number): string {
  const s = towerStats(kind, tier);
  const parts = [`TIER ${s.label}`, `RNG ${s.range.toFixed(2)}`];
  if (s.damage) parts.push(`DMG ${s.damage}`, `ROF ${s.fireRate}`);
  if (s.aoe) parts.push(`AOE ${s.aoe}`);
  if (s.wallHp) parts.push(`WALL ${s.wallHp}HP / ${s.wallLife}s`);
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
    stats.textContent = `${formatStats(kind, tier)} · ${upgradeName}`;
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
  title.textContent = 'THREAT BRIEF';
  body.textContent = 'Select a tower on the lawn, or pick a card to preview the arsenal.';
  stats.textContent = threats;
}

function paintUpgrade(hud: HudHandles, sim: Sim): void {
  const btn = hud.upgradeBtn;
  if (!btn) return;
  const t = sim.selected;
  if (!t) {
    btn.disabled = true;
    btn.textContent = 'UPGRADE';
    return;
  }
  const tier = t.tier ?? 0;
  if (tier >= MAX_TIER) {
    btn.disabled = true;
    btn.textContent = 'MAXED';
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
  const overlayCodex = opt<HTMLElement>(root, '#overlay-codex');
  const codexBtn = opt<HTMLButtonElement>(root, '#btn-codex');
  const codexCloseBtn = opt<HTMLButtonElement>(root, '#btn-codex-close');
  const hideCodex = (): void => {
    overlayCodex?.classList.add('hidden');
  };
  const toggleCodex = (): void => {
    overlayCodex?.classList.toggle('hidden');
  };
  codexBtn?.addEventListener('click', toggleCodex);
  codexCloseBtn?.addEventListener('click', hideCodex);

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
    endTitle: $('#end-title'),
    endBody: $('#end-body'),
    missionName: opt(root, '#mission-name'),
    upgradeBtn: opt<HTMLButtonElement>(root, '#btn-upgrade'),
    inspectTitle: opt(root, '#inspect-title'),
    inspectBody: opt(root, '#inspect-body'),
    inspectStats: opt(root, '#inspect-stats'),
    diffBtns: [...root.querySelectorAll<HTMLButtonElement>('[data-diff]')],
    mapCards: [...root.querySelectorAll<HTMLButtonElement>('[data-map]')],
    overlayCodex,
    codexBtn,
    codexCloseBtn,
  };
}

export function paintHud(
  hud: HudHandles,
  sim: Sim,
  fps: number,
  muted: boolean,
  paused: boolean,
  phase: 'title' | 'play' | 'pause' | 'end',
): void {
  hud.donations.textContent = `$${sim.donations.toLocaleString()}`;
  hud.approvalFill.style.width = `${sim.approval}%`;
  hud.approvalFill.classList.toggle('low', sim.approval <= 30);
  hud.approvalText.textContent = `${sim.approval}%`;
  hud.wave.textContent = `${Math.min(sim.wave, MAX_WAVES)}/${MAX_WAVES}`;
  hud.fps.textContent = `${Math.round(fps)} FPS`;
  hud.speedBtn.textContent = `${sim.speed}×`;
  hud.muteBtn.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
  hud.pauseBtn.textContent = paused ? 'RESUME' : 'PAUSE';
  hud.sendBtn.disabled = !sim.waveReady();
  hud.sendBtn.classList.toggle('pulse', sim.waveReady());
  hud.sendBtn.textContent = sim.wave === 0 ? 'START WAVE 1' : sim.waveReady() ? 'SEND NEXT WAVE' : 'WAVE INCOMING';
  hud.sellBtn.disabled = !sim.selected;
  hud.sellBtn.textContent = sim.selected
    ? `SELL $${Math.round(sim.selected.costPaid * 0.6)}`
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
  hud.overlayPause.classList.toggle('hidden', phase !== 'pause');
  hud.overlayEnd.classList.toggle('hidden', phase !== 'end');
  if (phase === 'title' || phase === 'end') hud.overlayCodex?.classList.add('hidden');
  if (sim.won) {
    hud.endTitle.textContent = 'TREMENDOUS VICTORY';
    hud.endBody.textContent = sim.map.def.victory;
  } else if (sim.lost) {
    hud.endTitle.textContent = "YOU'RE FIRED";
    hud.endBody.textContent = sim.map.def.defeat;
  }
}
