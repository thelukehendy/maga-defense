import { type DifficultyId, type MapId } from './campaign.ts';
import { Synth } from './audio.ts';
import { FrameLoop, TraumaCamera, View } from './engine.ts';
import { FX } from './fx.ts';
import { bindHud, hideMenus, paintHud, type HudHandles, type HudPhase } from './hud.ts';
import { GameMap } from './map.ts';
import { paintPortraits } from './portraits.ts';
import { Renderer } from './render.ts';
import { Sim } from './sim.ts';
import { CELL, type TowerId } from './types.ts';

export class Game {
  private readonly view: View;
  private readonly loop: FrameLoop;
  private readonly cam = new TraumaCamera();
  private readonly audio = new Synth();
  private readonly map = new GameMap();
  private readonly fx = new FX();
  private readonly sim: Sim;
  private readonly renderer: Renderer;
  private readonly hud: HudHandles;
  private phase: HudPhase = 'title';
  private hudTick = 0;
  private ambient = 0;
  private selectedMap: MapId = 'lawn';
  private selectedDiff: DifficultyId = 'normal';
  private readonly coarse = window.matchMedia('(pointer: coarse)').matches;

  constructor(root: HTMLElement, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.view = new View(canvas, ctx);
    this.sim = new Sim(this.map, this.fx, this.cam, this.audio);
    this.renderer = new Renderer(this.map);
    this.hud = bindHud(root);
    this.loop = new FrameLoop(
      (dt) => this.step(dt),
      () => this.draw(),
    );
    this.bind(root, canvas);
    paintPortraits(root);
    paintHud(this.hud, this.sim, 60, this.audio.muted, false, this.phase);
    this.loop.start();
  }

  private bind(root: HTMLElement, canvas: HTMLCanvasElement): void {
    const fit = (): void => {
      this.view.resize();
      this.renderer.resize(this.view.dpr, this.view.scale);
      paintPortraits(root);
    };
    const ro = new ResizeObserver(fit);
    ro.observe(canvas.parentElement ?? canvas);
    window.addEventListener('resize', fit);
    fit();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.phase === 'play') this.setPhase('pause');
    });

    const onPtr = (ev: PointerEvent, click: boolean): void => {
      if (this.phase !== 'play') return;
      const w = this.view.pointerToWorld(ev.clientX, ev.clientY);
      if (!w) {
        this.sim.hover = null;
        canvas.style.cursor = 'crosshair';
        return;
      }
      const c = Math.floor(w.x / CELL);
      const r = Math.floor(w.y / CELL);
      this.sim.hover = { c, r };
      const valid = this.sim.placing
        ? this.sim.map.canPlace(c, r, this.sim.occupied)
        : Boolean(this.sim.towers.find((t) => t.c === c && t.r === r));
      canvas.style.cursor = valid ? 'pointer' : 'not-allowed';
      if (!click) return;
      this.audio.unlock();
      if (this.sim.selectAt(c, r)) return;
      if (this.coarse && this.sim.placing) {
        if (!this.sim.armed || this.sim.armed.c !== c || this.sim.armed.r !== r) {
          this.sim.armed = { c, r };
          this.sim.hover = { c, r };
          this.audio.click();
          return;
        }
      }
      this.sim.armed = null;
      this.sim.tryPlace(c, r);
    };
    canvas.addEventListener('pointermove', (e) => onPtr(e, false));
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onPtr(e, true);
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('pointerleave', () => {
      this.sim.hover = null;
      canvas.style.cursor = 'crosshair';
    });

    for (const card of this.hud.cards) {
      card.addEventListener('click', () => {
        this.audio.unlock();
        this.audio.click();
        const id = card.dataset.tower as TowerId;
        this.sim.placing = id;
        this.sim.selected = null;
        this.sim.armed = null;
      });
    }

    this.hud.sendBtn.addEventListener('click', () => {
      this.audio.unlock();
      this.sim.startNextWave();
    });
    this.hud.sellBtn.addEventListener('click', () => this.sim.trySell());
    this.hud.upgradeBtn?.addEventListener('click', () => {
      this.audio.unlock();
      this.sim.tryUpgrade();
    });
    for (const btn of this.hud.diffBtns) {
      btn.addEventListener('click', () => {
        this.audio.click();
        this.selectedDiff = (btn.dataset.diff ?? 'normal') as DifficultyId;
        this.applyCampaign(false);
      });
    }
    for (const card of this.hud.mapCards) {
      card.addEventListener('click', () => {
        this.audio.click();
        this.selectedMap = (card.dataset.map ?? 'lawn') as MapId;
        this.applyCampaign(false);
      });
    }
    this.hud.speedBtn.addEventListener('click', () => {
      this.audio.click();
      this.sim.speed = this.sim.speed === 1 ? 2 : this.sim.speed === 2 ? 3 : 1;
    });
    this.hud.muteBtn.addEventListener('click', () => {
      this.audio.unlock();
      this.audio.toggleMute();
    });
    this.hud.pauseBtn.addEventListener('click', () => {
      if (this.phase === 'play') this.setPhase('pause');
      else if (this.phase === 'pause') this.setPhase('play');
    });

    root.querySelector('#btn-start')?.addEventListener('click', () => {
      this.audio.unlock();
      this.audio.click();
      hideMenus(this.hud);
      this.applyCampaign(false);
      this.setPhase('select');
    });
    root.querySelector('#btn-deploy')?.addEventListener('click', () => {
      this.audio.unlock();
      this.audio.wave();
      hideMenus(this.hud);
      this.applyCampaign(true);
      this.setPhase('play');
    });
    root.querySelector('#btn-select-back')?.addEventListener('click', () => {
      this.audio.click();
      this.setPhase('title');
    });
    root.querySelector('#btn-options')?.addEventListener('click', () => {
      this.audio.click();
      this.hud.overlayInfo?.classList.add('hidden');
      this.hud.overlayOptions?.classList.toggle('hidden');
    });
    root.querySelector('#btn-opt-close')?.addEventListener('click', () => {
      this.hud.overlayOptions?.classList.add('hidden');
    });
    root.querySelector('#btn-opt-mute')?.addEventListener('click', () => {
      this.audio.unlock();
      this.audio.toggleMute();
      paintHud(this.hud, this.sim, this.loop.fps, this.audio.muted, this.phase === 'pause', this.phase);
    });
    root.querySelector('#btn-info')?.addEventListener('click', () => {
      this.audio.click();
      this.hud.overlayOptions?.classList.add('hidden');
      this.hud.overlayInfo?.classList.toggle('hidden');
      paintPortraits(root);
    });
    root.querySelector('#btn-info-close')?.addEventListener('click', () => {
      this.hud.overlayInfo?.classList.add('hidden');
    });
    root.querySelector('#btn-resume')?.addEventListener('click', () => this.setPhase('play'));
    const toHq = (): void => {
      hideMenus(this.hud);
      this.setPhase('title');
    };
    root.querySelector('#btn-pause-hq')?.addEventListener('click', toHq);
    root.querySelector('#btn-end-hq')?.addEventListener('click', toHq);
    root.querySelector('#btn-again')?.addEventListener('click', () => {
      this.audio.unlock();
      this.applyCampaign(true);
      this.setPhase('play');
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.phase === 'play') this.setPhase('pause');
      else if (e.key === 'Escape' && this.phase === 'pause') this.setPhase('play');
      if (this.phase !== 'play') return;
      if (e.key === '1') {
        this.sim.placing = 'truth';
        this.sim.selected = null;
        this.sim.armed = null;
      }
      if (e.key === '2') {
        this.sim.placing = 'trebuchet';
        this.sim.selected = null;
        this.sim.armed = null;
      }
      if (e.key === '3') {
        this.sim.placing = 'brick';
        this.sim.selected = null;
        this.sim.armed = null;
      }
      if (e.key === '4') {
        this.sim.placing = 'desk';
        this.sim.selected = null;
        this.sim.armed = null;
      }
      if (e.key === ' ') {
        e.preventDefault();
        this.sim.startNextWave();
      }
      if (e.key === 's' || e.key === 'S') this.sim.trySell();
      if (e.key === 'u' || e.key === 'U') this.sim.tryUpgrade();
    });
  }

  private applyCampaign(resetPlay: boolean): void {
    this.sim.configure(this.selectedMap, this.selectedDiff);
    this.renderer.setMap(this.sim.map, this.view.dpr, this.view.scale);
    if (!resetPlay) this.sim.reset();
  }

  private setPhase(p: HudPhase): void {
    this.phase = p;
    paintHud(this.hud, this.sim, this.loop.fps, this.audio.muted, p === 'pause', p);
  }

  private step(dt: number): void {
    this.ambient += dt;
    this.cam.update(dt);
    this.fx.update(dt);
    if (this.phase === 'play') this.sim.update(dt);
    if (this.sim.won || this.sim.lost) this.phase = 'end';
    this.hudTick += dt;
    if (this.hudTick > 0.12) {
      this.hudTick = 0;
      paintHud(this.hud, this.sim, this.loop.fps, this.audio.muted, this.phase === 'pause', this.phase);
    }
  }

  private draw(): void {
    const { ctx } = this.view;
    ctx.setTransform(this.view.dpr, 0, 0, this.view.dpr, 0, 0);
    ctx.fillStyle = '#050b18';
    ctx.fillRect(0, 0, this.view.cssW, this.view.cssH);
    this.view.applyWorld(ctx, this.cam.shakeX, this.cam.shakeY);
    this.renderer.draw(ctx, this.sim, this.fx, this.sim.time + this.ambient, this.cam.flash);
    ctx.setTransform(this.view.dpr, 0, 0, this.view.dpr, 0, 0);
  }
}
