import { TOWERS, type TowerId, MAX_WAVES } from './types.ts';
import type { Sim } from './sim.ts';

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
};

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
    cards: [...root.querySelectorAll<HTMLButtonElement>('[data-tower]')],
    overlayTitle: $('#overlay-title'),
    overlayPause: $('#overlay-pause'),
    overlayEnd: $('#overlay-end'),
    endTitle: $('#end-title'),
    endBody: $('#end-body'),
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

  for (const card of hud.cards) {
    const id = card.dataset.tower as TowerId;
    const def = TOWERS[id];
    card.classList.toggle('selected', sim.placing === id);
    card.classList.toggle('poor', sim.donations < def.cost);
    const cost = card.querySelector('.cost');
    if (cost) cost.textContent = `$${def.cost}`;
  }

  hud.overlayTitle.classList.toggle('hidden', phase !== 'title');
  hud.overlayPause.classList.toggle('hidden', phase !== 'pause');
  hud.overlayEnd.classList.toggle('hidden', phase !== 'end');
  if (sim.won) {
    hud.endTitle.textContent = 'TREMENDOUS VICTORY';
    hud.endBody.textContent = 'The base stands. Ratings through the roof. Everybody says so.';
  } else if (sim.lost) {
    hud.endTitle.textContent = "YOU'RE FIRED";
    hud.endBody.textContent = 'Approval hit zero. The swarm reached the lawn. Sad!';
  }
}
