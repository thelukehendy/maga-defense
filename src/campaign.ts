import { CELL, type EnemyId, type TowerId } from './types.ts';

export const DifficultyId = {
  easy: 'easy',
  normal: 'normal',
  hard: 'hard',
  insane: 'insane',
} as const;
export type DifficultyId = (typeof DifficultyId)[keyof typeof DifficultyId];

export const MapId = {
  lawn: 'lawn',
  palazzo: 'palazzo',
  border: 'border',
  avenue: 'avenue',
} as const;
export type MapId = (typeof MapId)[keyof typeof MapId];

export type LandmarkKind =
  | 'fountain'
  | 'roses'
  | 'lincoln'
  | 'palm'
  | 'pool'
  | 'golf'
  | 'cactus'
  | 'watch'
  | 'gate'
  | 'taxi'
  | 'newsstand'
  | 'billboard';

export type Landmark = { kind: LandmarkKind; c: number; r: number };

export type Theme = {
  skyTop: string;
  skyBot: string;
  grass: string;
  grassHi: string;
  pathEdge: string;
  pathFill: string;
  pathRunner: string;
  grid: string;
  star: string;
};

export type Difficulty = {
  id: DifficultyId;
  name: string;
  tag: string;
  blurb: string;
  startGold: number;
  startApproval: number;
  hpMul: number;
  spdMul: number;
  rewardMul: number;
  leakMul: number;
  waveMul: number;
};

export const DIFFICULTIES: Record<DifficultyId, Difficulty> = {
  easy: {
    id: 'easy',
    name: 'Fair & Balanced',
    tag: 'CABLE NEWS',
    blurb: 'Full $560 kit so you can try every tower. Softer swarm. A very friendly press.',
    startGold: 560,
    startApproval: 120,
    hpMul: 0.8,
    spdMul: 0.86,
    rewardMul: 1.2,
    leakMul: 0.75,
    waveMul: 0.9,
  },
  normal: {
    id: 'normal',
    name: 'Tremendous',
    tag: 'RALLY DEFAULT',
    blurb: 'The real deal. Ratings, walls, and a winding lawn.',
    startGold: 280,
    startApproval: 100,
    hpMul: 1,
    spdMul: 1,
    rewardMul: 1,
    leakMul: 1,
    waveMul: 1,
  },
  hard: {
    id: 'hard',
    name: 'Witch Hunt',
    tag: 'SPECIAL COUNSEL',
    blurb: 'Leaner war chest. Meaner swamp. They are coming faster.',
    startGold: 210,
    startApproval: 90,
    hpMul: 1.28,
    spdMul: 1.14,
    rewardMul: 1.08,
    leakMul: 1.18,
    waveMul: 1.12,
  },
  insane: {
    id: 'insane',
    name: 'SAD!',
    tag: 'UNPRECEDENTED',
    blurb: 'Everyone is against you. Still winnable. Barely.',
    startGold: 170,
    startApproval: 80,
    hpMul: 1.52,
    spdMul: 1.24,
    rewardMul: 1.12,
    leakMul: 1.3,
    waveMul: 1.22,
  },
};

export type MapDef = {
  id: MapId;
  name: string;
  subtitle: string;
  briefing: string;
  victory: string;
  defeat: string;
  theme: Theme;
  path: readonly [number, number][];
  house: readonly [number, number][];
  landmarks: readonly Landmark[];
  flavor: readonly string[];
};

function cells(run: (add: (c: number, r: number) => void) => void): [number, number][] {
  const out: [number, number][] = [];
  run((c, r) => out.push([c, r]));
  return out;
}

export const MAPS: Record<MapId, MapDef> = {
  lawn: {
    id: 'lawn',
    name: 'South Lawn',
    subtitle: 'Protect the People’s House',
    briefing:
      'Golden hour on Pennsylvania Avenue. A caravan of bureaucrats, drones, and very small Marxists is trying to cut across the lawn. The fountain still works. The roses still bloom. The House still stands — if you spend every last donation.',
    victory: 'The lawn is mowed. The fountain sparkles. Cable news is furious. Tremendous.',
    defeat: 'They walked right up the steps. Approval: zero. The roses wilt. Sad!',
    theme: {
      skyTop: '#4eb4f2',
      skyBot: '#d7f0ff',
      grass: '#2f9a46',
      grassHi: '#4ec85f',
      pathEdge: '#7a3414',
      pathFill: '#c86a38',
      pathRunner: '#c8102e',
      grid: 'rgba(255,255,255,0.16)',
      star: '#fffdf2',
    },
    path: cells((add) => {
      for (let x = 0; x <= 13; x++) add(x, 1);
      for (let y = 2; y <= 4; y++) add(13, y);
      for (let x = 12; x >= 2; x--) add(x, 4);
      for (let y = 5; y <= 7; y++) add(2, y);
      for (let x = 3; x <= 12; x++) add(x, 7);
      add(12, 8);
    }),
    house: [
      [13, 7],
      [14, 7],
      [15, 7],
      [13, 8],
      [14, 8],
      [15, 8],
      [13, 9],
      [14, 9],
      [15, 9],
    ],
    landmarks: [
      { kind: 'fountain', c: 7, r: 2 },
      { kind: 'roses', c: 5, r: 8 },
      { kind: 'lincoln', c: 10, r: 5 },
    ],
    flavor: [
      'The South Lawn has seen worse picnics.',
      'Keep them off the colonnade.',
      'The fountain is not a suggestion.',
    ],
  },
  palazzo: {
    id: 'palazzo',
    name: 'Mar-a-Lago Drive',
    subtitle: 'Gold, palms, and a very exclusive gate',
    briefing:
      'Weekend at the palazzo. Palms sway. The pool is closed to the swarm. They will try the service drive, the putting green, then the ballroom steps. Do not let a single intern reach the club soda.',
    victory: 'The orchestra plays. Membership is up. The pool remains members-only.',
    defeat: 'Someone wore sneakers on the marble. The club is ruined. So sad.',
    theme: {
      skyTop: '#3aa0e8',
      skyBot: '#ffe7b8',
      grass: '#168a62',
      grassHi: '#22b07a',
      pathEdge: '#c9a227',
      pathFill: '#f0d48a',
      pathRunner: '#9b1b30',
      grid: 'rgba(255,255,255,0.18)',
      star: '#fff6d0',
    },
    path: cells((add) => {
      for (let x = 0; x <= 10; x++) add(x, 8);
      for (let y = 7; y >= 2; y--) add(10, y);
      for (let x = 9; x >= 2; x--) add(x, 2);
      for (let y = 3; y <= 5; y++) add(2, y);
      for (let x = 3; x <= 12; x++) add(x, 5);
      add(12, 4);
      add(12, 3);
    }),
    house: [
      [13, 1],
      [14, 1],
      [15, 1],
      [13, 2],
      [14, 2],
      [15, 2],
      [13, 3],
      [14, 3],
      [15, 3],
    ],
    landmarks: [
      { kind: 'palm', c: 4, r: 7 },
      { kind: 'palm', c: 7, r: 7 },
      { kind: 'pool', c: 6, r: 3 },
      { kind: 'golf', c: 8, r: 9 },
    ],
    flavor: [
      'Jackets required. Aliens excepted.',
      'The putting green is not a public park.',
      'Somebody bring the gold cart.',
    ],
  },
  border: {
    id: 'border',
    name: 'Frontier Ridge',
    subtitle: 'Steel, dust, and a very finished wall',
    briefing:
      'High desert. One ridge. One unfinished rumor of a wall that is, in this simulator, extremely finished. Drones ignore the steel. Everything else stacks up against it like paperwork.',
    victory: 'The ridge holds. The wall is still there. Everybody said it could not be done.',
    defeat: 'They walked around. They always walk around. Ratings crater in the dust.',
    theme: {
      skyTop: '#6ec4f4',
      skyBot: '#f3d08a',
      grass: '#c4a060',
      grassHi: '#d8b878',
      pathEdge: '#6a4a28',
      pathFill: '#d2b48c',
      pathRunner: '#8a5a20',
      grid: 'rgba(255,255,255,0.14)',
      star: '#fff4d4',
    },
    path: cells((add) => {
      for (let x = 0; x <= 4; x++) add(x, 2);
      for (let y = 3; y <= 8; y++) add(4, y);
      for (let x = 5; x <= 11; x++) add(x, 8);
      for (let y = 7; y >= 3; y--) add(11, y);
      for (let x = 12; x <= 12; x++) add(x, 3);
      add(12, 4);
      add(12, 5);
      add(12, 6);
    }),
    house: [
      [13, 5],
      [14, 5],
      [15, 5],
      [13, 6],
      [14, 6],
      [15, 6],
      [13, 7],
      [14, 7],
      [15, 7],
    ],
    landmarks: [
      { kind: 'cactus', c: 1, r: 5 },
      { kind: 'cactus', c: 7, r: 4 },
      { kind: 'watch', c: 6, r: 1 },
      { kind: 'gate', c: 9, r: 6 },
    ],
    flavor: [
      'The wall has a gift shop now.',
      'Watchtower reports: still tremendous.',
      'Dust in the air. Gold in the budget.',
    ],
  },
  avenue: {
    id: 'avenue',
    name: 'Fifth Avenue',
    subtitle: 'Traffic, tickers, and a gold tower',
    briefing:
      'Midtown in the golden hour. Taxicabs. A newsstand that has never been right once. The swarm wants the lobby of the gold tower. You want them stuck in traffic until the markets open.',
    victory: 'The ticker is green. The lobby is velvet-roped. The city pretends it always liked you.',
    defeat: 'They took the elevator. The doorman quit. Opening bell is a disaster.',
    theme: {
      skyTop: '#5aa8e8',
      skyBot: '#f2c878',
      grass: '#3a8a50',
      grassHi: '#4caa64',
      pathEdge: '#5a4a38',
      pathFill: '#8a8490',
      pathRunner: '#f0d78c',
      grid: 'rgba(255,255,255,0.14)',
      star: '#fff6e0',
    },
    path: cells((add) => {
      for (let y = 0; y <= 6; y++) add(1, y);
      for (let x = 2; x <= 8; x++) add(x, 6);
      for (let y = 5; y >= 2; y--) add(8, y);
      for (let x = 9; x <= 12; x++) add(x, 2);
      for (let y = 3; y <= 8; y++) add(12, y);
    }),
    house: [
      [13, 6],
      [14, 6],
      [15, 6],
      [13, 7],
      [14, 7],
      [15, 7],
      [13, 8],
      [14, 8],
      [15, 8],
    ],
    landmarks: [
      { kind: 'taxi', c: 4, r: 4 },
      { kind: 'newsstand', c: 6, r: 8 },
      { kind: 'billboard', c: 3, r: 1 },
      { kind: 'taxi', c: 10, r: 4 },
    ],
    flavor: [
      'The ticker never sleeps. Neither should you.',
      'Do not block the gold doors.',
      'A cab honks. It is always honking.',
    ],
  },
};

export const MAP_ORDER: MapId[] = ['lawn', 'palazzo', 'border', 'avenue'];

export type UpgradeStats = {
  range: number;
  fireRate: number;
  damage: number;
  aoe: number;
  wallLife: number;
  wallHp: number;
  buff: number;
  label: string;
};

export const TOWER_LORE: Record<
  TowerId,
  { title: string; motto: string; story: string; how: string; upgrades: [string, string, string] }
> = {
  truth: {
    title: 'Truth Tower',
    motto: 'FACTS DON’T CARE ABOUT YOUR PATHING',
    story:
      'A neon-and-stone fact-checker with a satellite dish. It recites, very quickly, until the target is too embarrassed to continue existing.',
    how: 'Highest fire rate. Low damage. Best against swarms and drones. Place on corners where the path doubles back.',
    upgrades: ['FACT strobe', 'Prime-time klieg', 'UNPRECEDENTED BEAM'],
  },
  trebuchet: {
    title: 'Tariff Cannon',
    motto: 'IF IT’S HEAVY, TAX IT',
    story:
      'A bright-blue siege cannon that lobs solid-gold “TAX” shots on a lazy, insulting arc. The impact is not a metaphor. Nearby enemies pay collective duties.',
    how: 'Slow, huge, area damage. Lead the target — the TAX shot is theatrical on purpose.',
    upgrades: ['Import duty', 'Retaliatory levy', 'EMERGENCY TARIFF'],
  },
  brick: {
    title: 'Brick-Layer Cannon',
    motto: 'AND MEXICO IS SENDING THE MORTAR',
    story:
      'A patriotic masonry howitzer. It does not kill. It inconveniences, historically. Mini-walls slam onto the track and ground units stack up like a press conference.',
    how: 'Fires a wall onto the path ahead of a ground enemy. Drones fly over. Walls decay and can be smashed.',
    upgrades: ['Prefab section', 'Rebar core', 'FINISHED WALL'],
  },
  desk: {
    title: 'Executive Order Desk',
    motto: 'SIGNED. SEALED. RAPID.',
    story:
      'The Resolute Desk, slightly more gold than historically accurate. Paperwork orbits it. Nearby towers suddenly remember they can work on weekends.',
    how: 'Does not shoot. Buffs fire rate of towers in its aura. Stack desks to cover a whole killbox. Upgrade the aura, not the ego.',
    upgrades: ['Acting director', 'Cabinet session', 'DAY-ONE ORDER'],
  },
};

export const ENEMY_LORE: Record<
  EnemyId,
  { title: string; motto: string; story: string; how: string }
> = {
  alien: {
    title: 'Commie Alien',
    motto: 'WEAK. NUMEROUS. CROWNED.',
    story:
      'A walking globe in a tiny gold crown — a budget invasion from a planet that nationalized its saucers. Individually pathetic. Collectively a staffing problem. Truth Towers pop them like confetti.',
    how: 'Fast ground swarm. Low HP. Walls stop them. Truth Towers melt them. Do not let a clump leak — death by a thousand approval cuts.',
  },
  drone: {
    title: 'Fake News Drone',
    motto: 'LIVE FROM SOMEWHERE INACCURATE',
    story:
      'A flying news camera with stick arms, a mic, and no respect for masonry. It prints FAKE in midair until somebody lasers the lens.',
    how: 'Flying. Ignores mini-walls. Fast. Medium HP. Prioritize Truth Towers and Trebuchet splash along flyovers.',
  },
  bureaucrat: {
    title: 'Deep State Bureaucrat',
    motto: 'GS-15 AND UNFIREABLE',
    story:
      'A short, hooded clerk with glasses, a clipboard, and a roll of red tape. Moves like a continuing resolution. Soaks damage that would embarrass a battleship.',
    how: 'Slow ground tank. Massive HP. Chews walls. Needs Trebuchet splash plus a desk buff. Never leave one alive at the end of a wave.',
  },
};

export const STORY_CRAWL = [
  'They said the lawn could not be held.',
  'They said the palazzo was indefensible.',
  'They said the wall was a vibe.',
  'They said Fifth Avenue belongs to the swarm.',
  'You have donations, four towers, and a very good feeling.',
  'Keep them off the marble. The rest is history. Very, very winning history.',
];

export type WaveBeat = { kind: EnemyId; n: number; gap: number };

export function campaignWaves(map: MapId, wave: number): WaveBeat[] {
  const lawn: WaveBeat[][] = [
    [{ kind: 'alien', n: 8, gap: 0.62 }],
    [{ kind: 'alien', n: 14, gap: 0.48 }],
    [
      { kind: 'alien', n: 8, gap: 0.46 },
      { kind: 'drone', n: 5, gap: 0.7 },
    ],
    [
      { kind: 'alien', n: 10, gap: 0.4 },
      { kind: 'bureaucrat', n: 2, gap: 1.4 },
    ],
    [
      { kind: 'drone', n: 8, gap: 0.5 },
      { kind: 'alien', n: 12, gap: 0.36 },
    ],
    [
      { kind: 'bureaucrat', n: 3, gap: 1.15 },
      { kind: 'alien', n: 14, gap: 0.32 },
      { kind: 'drone', n: 4, gap: 0.55 },
    ],
    [
      { kind: 'drone', n: 12, gap: 0.4 },
      { kind: 'bureaucrat', n: 3, gap: 1.05 },
    ],
    [
      { kind: 'alien', n: 20, gap: 0.26 },
      { kind: 'drone', n: 8, gap: 0.38 },
      { kind: 'bureaucrat', n: 4, gap: 0.85 },
    ],
    [
      { kind: 'bureaucrat', n: 6, gap: 0.8 },
      { kind: 'drone', n: 10, gap: 0.34 },
    ],
    [
      { kind: 'alien', n: 24, gap: 0.22 },
      { kind: 'drone', n: 12, gap: 0.3 },
      { kind: 'bureaucrat', n: 5, gap: 0.65 },
    ],
    [
      { kind: 'drone', n: 16, gap: 0.26 },
      { kind: 'bureaucrat', n: 7, gap: 0.6 },
      { kind: 'alien', n: 16, gap: 0.2 },
    ],
    [
      { kind: 'alien', n: 28, gap: 0.16 },
      { kind: 'drone', n: 18, gap: 0.2 },
      { kind: 'bureaucrat', n: 10, gap: 0.48 },
    ],
  ];
  const palazzo: WaveBeat[][] = [
    [{ kind: 'alien', n: 10, gap: 0.55 }],
    [
      { kind: 'alien', n: 8, gap: 0.45 },
      { kind: 'drone', n: 4, gap: 0.7 },
    ],
    [
      { kind: 'bureaucrat', n: 2, gap: 1.5 },
      { kind: 'alien', n: 12, gap: 0.4 },
    ],
    [{ kind: 'drone', n: 10, gap: 0.48 }],
    [
      { kind: 'alien', n: 16, gap: 0.3 },
      { kind: 'bureaucrat', n: 3, gap: 1.1 },
    ],
    [
      { kind: 'drone', n: 8, gap: 0.4 },
      { kind: 'bureaucrat', n: 4, gap: 0.95 },
    ],
    [
      { kind: 'alien', n: 18, gap: 0.28 },
      { kind: 'drone', n: 10, gap: 0.36 },
    ],
    [
      { kind: 'bureaucrat', n: 6, gap: 0.75 },
      { kind: 'alien', n: 12, gap: 0.3 },
    ],
    [
      { kind: 'drone', n: 16, gap: 0.3 },
      { kind: 'bureaucrat', n: 5, gap: 0.7 },
    ],
    [
      { kind: 'alien', n: 22, gap: 0.22 },
      { kind: 'drone', n: 10, gap: 0.28 },
      { kind: 'bureaucrat', n: 6, gap: 0.62 },
    ],
    [
      { kind: 'bureaucrat', n: 8, gap: 0.55 },
      { kind: 'drone', n: 14, gap: 0.26 },
    ],
    [
      { kind: 'alien', n: 26, gap: 0.18 },
      { kind: 'drone', n: 16, gap: 0.22 },
      { kind: 'bureaucrat', n: 9, gap: 0.5 },
    ],
  ];
  const border: WaveBeat[][] = [
    [{ kind: 'alien', n: 12, gap: 0.5 }],
    [
      { kind: 'alien', n: 10, gap: 0.4 },
      { kind: 'bureaucrat', n: 1, gap: 1.6 },
    ],
    [{ kind: 'drone', n: 8, gap: 0.55 }],
    [
      { kind: 'alien', n: 16, gap: 0.34 },
      { kind: 'bureaucrat', n: 3, gap: 1.2 },
    ],
    [
      { kind: 'drone', n: 6, gap: 0.45 },
      { kind: 'alien', n: 14, gap: 0.32 },
    ],
    [
      { kind: 'bureaucrat', n: 5, gap: 0.9 },
      { kind: 'alien', n: 10, gap: 0.36 },
    ],
    [
      { kind: 'drone', n: 12, gap: 0.38 },
      { kind: 'bureaucrat', n: 4, gap: 0.85 },
    ],
    [
      { kind: 'alien', n: 22, gap: 0.24 },
      { kind: 'drone', n: 8, gap: 0.34 },
    ],
    [
      { kind: 'bureaucrat', n: 8, gap: 0.7 },
      { kind: 'drone', n: 8, gap: 0.36 },
    ],
    [
      { kind: 'alien', n: 20, gap: 0.22 },
      { kind: 'bureaucrat', n: 6, gap: 0.65 },
      { kind: 'drone', n: 10, gap: 0.3 },
    ],
    [
      { kind: 'drone', n: 18, gap: 0.24 },
      { kind: 'bureaucrat', n: 7, gap: 0.58 },
    ],
    [
      { kind: 'alien', n: 30, gap: 0.16 },
      { kind: 'drone', n: 14, gap: 0.22 },
      { kind: 'bureaucrat', n: 10, gap: 0.5 },
    ],
  ];
  const avenue: WaveBeat[][] = [
    [{ kind: 'drone', n: 6, gap: 0.6 }],
    [
      { kind: 'alien', n: 10, gap: 0.45 },
      { kind: 'drone', n: 4, gap: 0.65 },
    ],
    [
      { kind: 'bureaucrat', n: 2, gap: 1.3 },
      { kind: 'drone', n: 6, gap: 0.5 },
    ],
    [{ kind: 'alien', n: 16, gap: 0.34 }],
    [
      { kind: 'drone', n: 12, gap: 0.38 },
      { kind: 'bureaucrat', n: 3, gap: 1 },
    ],
    [
      { kind: 'alien', n: 14, gap: 0.3 },
      { kind: 'drone', n: 10, gap: 0.36 },
    ],
    [
      { kind: 'bureaucrat', n: 5, gap: 0.8 },
      { kind: 'alien', n: 12, gap: 0.3 },
    ],
    [
      { kind: 'drone', n: 16, gap: 0.3 },
      { kind: 'alien', n: 16, gap: 0.26 },
    ],
    [
      { kind: 'bureaucrat', n: 7, gap: 0.68 },
      { kind: 'drone', n: 12, gap: 0.32 },
    ],
    [
      { kind: 'alien', n: 24, gap: 0.2 },
      { kind: 'drone', n: 12, gap: 0.28 },
      { kind: 'bureaucrat', n: 5, gap: 0.62 },
    ],
    [
      { kind: 'drone', n: 20, gap: 0.22 },
      { kind: 'bureaucrat', n: 8, gap: 0.55 },
    ],
    [
      { kind: 'alien', n: 26, gap: 0.16 },
      { kind: 'drone', n: 20, gap: 0.18 },
      { kind: 'bureaucrat', n: 11, gap: 0.46 },
    ],
  ];
  const pack = { lawn, palazzo, border, avenue }[map];
  const i = Math.max(0, Math.min(pack.length - 1, wave - 1));
  return pack[i]!;
}

export const MAX_TIER = 2;

export const UPGRADE_COST: Record<TowerId, [number, number]> = {
  truth: [110, 240],
  trebuchet: [220, 420],
  brick: [150, 300],
  desk: [190, 360],
};

export function towerStats(kind: TowerId, tier: number): UpgradeStats {
  const t = Math.max(0, Math.min(MAX_TIER, tier));
  if (kind === 'truth') {
    return [
      { range: 2.55, fireRate: 6.2, damage: 9, aoe: 0, wallLife: 0, wallHp: 0, buff: 1, label: 'I' },
      { range: 2.85, fireRate: 7.6, damage: 13, aoe: 0, wallLife: 0, wallHp: 0, buff: 1, label: 'II' },
      { range: 3.15, fireRate: 9.4, damage: 18, aoe: 0, wallLife: 0, wallHp: 0, buff: 1, label: 'III' },
    ][t]!;
  }
  if (kind === 'trebuchet') {
    return [
      { range: 3.35, fireRate: 0.48, damage: 96, aoe: 1.45, wallLife: 0, wallHp: 0, buff: 1, label: 'I' },
      { range: 3.65, fireRate: 0.58, damage: 128, aoe: 1.7, wallLife: 0, wallHp: 0, buff: 1, label: 'II' },
      { range: 4.0, fireRate: 0.7, damage: 170, aoe: 2.0, wallLife: 0, wallHp: 0, buff: 1, label: 'III' },
    ][t]!;
  }
  if (kind === 'brick') {
    return [
      { range: 3.1, fireRate: 0.38, damage: 0, aoe: 0, wallLife: 7.5, wallHp: 90, buff: 1, label: 'I' },
      { range: 3.35, fireRate: 0.48, damage: 0, aoe: 0, wallLife: 10, wallHp: 140, buff: 1, label: 'II' },
      { range: 3.6, fireRate: 0.6, damage: 0, aoe: 0, wallLife: 13, wallHp: 210, buff: 1, label: 'III' },
    ][t]!;
  }
  return [
    { range: 2.25, fireRate: 0, damage: 0, aoe: 0, wallLife: 0, wallHp: 0, buff: 1.48, label: 'I' },
    { range: 2.55, fireRate: 0, damage: 0, aoe: 0, wallLife: 0, wallHp: 0, buff: 1.7, label: 'II' },
    { range: 2.9, fireRate: 0, damage: 0, aoe: 0, wallLife: 0, wallHp: 0, buff: 2.0, label: 'III' },
  ][t]!;
}

export function houseOrigin(def: MapDef): { x: number; y: number; w: number; h: number } {
  let minC = 99;
  let minR = 99;
  let maxC = 0;
  let maxR = 0;
  for (const [c, r] of def.house) {
    minC = Math.min(minC, c);
    minR = Math.min(minR, r);
    maxC = Math.max(maxC, c);
    maxR = Math.max(maxR, r);
  }
  return {
    x: minC * CELL,
    y: minR * CELL,
    w: (maxC - minC + 1) * CELL,
    h: (maxR - minR + 1) * CELL,
  };
}
