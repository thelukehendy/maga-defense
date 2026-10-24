import { TraumaCamera } from '../src/engine.ts';
import { FX } from '../src/fx.ts';
import { GameMap } from '../src/map.ts';
import { Sim } from '../src/sim.ts';
import type { Synth } from '../src/audio.ts';
import type { DifficultyId, MapId } from '../src/campaign.ts';
import type { TowerId } from '../src/types.ts';
import { CELL } from '../src/types.ts';

class QuietAudio {
  unlock(): void {}
  setMap(): void {}
  wave(): void {}
  voice(): void {}
  click(): void {}
  deny(): void {}
  place(): void {}
  truth(): void {}
  trebShoot(): void {}
  brick(): void {}
  hit(): void {}
  death(): void {}
  leak(): void {}
  boom(): void {}
  sell(): void {}
  victory(): void {}
  defeat(): void {}
  combo(): void {}
  siren(): void {}
  special(): void {}
  stopVoice(): void {}
}

/** Place towers on grass cells nearest the rail(s), Truth first. */
function smartKit(sim: Sim): void {
  const map = sim.map;
  type Cand = { c: number; r: number; score: number };
  const cands: Cand[] = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 10; c++) {
      if (!map.canPlace(c, r, sim.occupied)) continue;
      const p = map.center(c, r);
      let near = Infinity;
      for (const route of map.routes) {
        for (let i = 0; i < route.length; i += 8) {
          const s = route[i]!;
          near = Math.min(near, Math.hypot(s.x - p.x, s.y - p.y));
        }
      }
      if (near > 2.8 * CELL) continue;
      // Prefer mid-path bends (not spawn, not keep).
      const along = 1 - Math.abs(r / 14 - 0.45);
      cands.push({ c, r, score: along * 100 - near });
    }
  }
  cands.sort((a, b) => b.score - a.score);
  const order: TowerId[] = ['truth', 'truth', 'brick', 'trebuchet', 'desk', 'truth', 'brick'];
  let i = 0;
  for (const kind of order) {
    while (i < cands.length) {
      const spot = cands[i++]!;
      if (!map.canPlace(spot.c, spot.r, sim.occupied)) continue;
      sim.placing = kind;
      if (sim.tryPlace(spot.c, spot.r)) break;
    }
  }
}

function run(mapId: MapId, diff: DifficultyId) {
  const audio = new QuietAudio() as unknown as Synth;
  const fx = new FX();
  const cam = new TraumaCamera();
  const map = new GameMap(mapId);
  const sim = new Sim(map, fx, cam, audio);
  sim.configure(mapId, diff);
  smartKit(sim);
  // Mid-run upgrades when affordable
  sim.speed = 4;
  let frames = 0;
  const max = 60 * 60 * 7;
  while (!sim.won && !sim.lost && frames < max) {
    if (sim.waveReady()) {
      for (const t of [...sim.towers]) {
        sim.selected = t;
        sim.tryUpgrade();
      }
      sim.selected = null;
      sim.startNextWave();
    }
    sim.update(1 / 60);
    fx.update(1 / 60);
    frames++;
  }
  return {
    mapId,
    diff,
    won: sim.won,
    lost: sim.lost,
    wave: sim.wave,
    kills: sim.kills,
    leaks: sim.leakCount,
    towers: sim.towers.length,
    gold: sim.donations,
    approval: sim.approval,
    frames,
  };
}

const out = [];
for (const m of ['lawn', 'palazzo', 'border', 'avenue'] as MapId[]) {
  out.push(run(m, 'easy'));
}
out.push(run('lawn', 'normal'));
out.push(run('lawn', 'hard'));
out.push(run('border', 'normal'));
console.log(JSON.stringify(out, null, 2));
