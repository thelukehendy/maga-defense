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
  | 'billboard'
  | 'tree'
  | 'bush'
  | 'pond'
  | 'bridge'
  | 'tunnel'
  | 'bench'
  | 'lamp'
  | 'statue';

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
  art?: string;
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

/** TOP portal → BOTTOM keep. Readable center S (COLS=10, ROWS=18). */
function centerSPath(): [number, number][] {
  return cells((add) => {
    for (let y = 0; y <= 2; y++) add(4, y);
    for (let x = 5; x <= 8; x++) add(x, 2);
    for (let y = 3; y <= 5; y++) add(8, y);
    for (let x = 7; x >= 1; x--) add(x, 5);
    for (let y = 6; y <= 9; y++) add(1, y);
    for (let x = 2; x <= 7; x++) add(x, 9);
    for (let y = 10; y <= 12; y++) add(7, y);
    for (let x = 6; x >= 3; x--) add(x, 12);
    for (let y = 13; y <= 14; y++) add(3, y);
    add(4, 14);
  });
}

export const MAPS: Record<MapId, MapDef> = {
  lawn: {
    id: 'lawn',
    art: './maps/play-lawn.jpg?v=5',
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
    // Portrait: spawn at top, keep at bottom. Center S through the lawn.
    path: centerSPath(),
    house: [
      [3, 15],
      [4, 15],
      [5, 15],
      [3, 16],
      [4, 16],
      [5, 16],
      [3, 17],
      [4, 17],
      [5, 17],
    ],
    landmarks: [],
    flavor: [
      'The South Lawn has seen worse picnics.',
      'Keep them off the colonnade.',
      'The fountain is not a suggestion.',
      'Somebody mow after this.',
      'The roses did not ask for this.',
    ],
  },
  palazzo: {
    id: 'palazzo',
    art: './maps/play-palazzo.jpg?v=5',
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
    // Service drive S down to the ballroom steps (bottom keep).
    path: centerSPath(),
    house: [
      [3, 15],
      [4, 15],
      [5, 15],
      [3, 16],
      [4, 16],
      [5, 16],
      [3, 17],
      [4, 17],
      [5, 17],
    ],
    landmarks: [],
    flavor: [
      'Jackets required. Aliens excepted.',
      'The putting green is not a public park.',
      'Somebody bring the gold cart.',
      'The pool remains members-only.',
      'Sneakers are still a federal issue.',
    ],
  },
  border: {
    id: 'border',
    art: './maps/play-border.jpg?v=9',
    name: 'Frontier Ridge',
    subtitle: 'Steel, dust, and a very finished wall',
    briefing:
      'High desert switchbacks, a split in the ridge, and a tunnel the swarm loves. Ground units under the rock cannot be hit. Drones still fly the long way. Hold the gate.',
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
    // Ridge S-switchbacks down to the finished wall / keep.
    path: centerSPath(),
    house: [
      [3, 15],
      [4, 15],
      [5, 15],
      [3, 16],
      [4, 16],
      [5, 16],
      [3, 17],
      [4, 17],
      [5, 17],
    ],
    landmarks: [],
    flavor: [
      'The tunnel is not a suggestion.',
      'Watchtower reports: still tremendous.',
      'They split. You cover both.',
      'Dust in the air. Ratings in the toilet. Not on your watch.',
      'Finish the wall. Then finish the wave.',
    ],
  },
  avenue: {
    id: 'avenue',
    art: './maps/play-avenue.jpg?v=6',
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
    // Midtown S: avenue → crosstown → lobby approach.
    path: centerSPath(),
    house: [
      [3, 15],
      [4, 15],
      [5, 15],
      [3, 16],
      [4, 16],
      [5, 16],
      [3, 17],
      [4, 17],
      [5, 17],
    ],
    landmarks: [],
    flavor: [
      'The ticker never sleeps. Neither should you.',
      'Do not block the gold doors.',
      'A cab honks. It is always honking.',
      'The lobby is velvet-roped. Keep it that way.',
      'Opening bell in twelve waves. Make it green.',
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
    how: 'Highest fire rate. Low damage. Best against swarms and drones. Place on corners. Max it: FACTS chain twice, then E for FACT NOVA.',
    upgrades: ['FACT strobe', 'Prime-time klieg', 'UNPRECEDENTED BEAM'],
  },
  trebuchet: {
    title: 'Tariff Cannon',
    motto: 'IF IT’S HEAVY, TAX IT',
    story:
      'A bright-blue siege cannon that lobs solid-gold “TAX” shots on a lazy, insulting arc. The impact is not a metaphor. Nearby enemies pay collective duties.',
    how: 'Slow, huge, area damage. Lead the target. Max it: a gold puddle that keeps collecting. E for ORBITAL TARIFF.',
    upgrades: ['Import duty', 'Retaliatory levy', 'EMERGENCY TARIFF'],
  },
  brick: {
    title: 'Brick-Layer Cannon',
    motto: 'AND MEXICO IS SENDING THE MORTAR',
    story:
      'A patriotic masonry howitzer. It does not kill. It inconveniences, historically. Mini-walls slam onto the track and ground units stack up like a press conference.',
    how: 'Fires a wall onto the path ahead of a ground enemy. Drones fly over. Walls decay and can be smashed. Max it: two sections, then E to FINISH THE WALL.',
    upgrades: ['Prefab section', 'Rebar core', 'FINISHED WALL'],
  },
  desk: {
    title: 'Executive Order Desk',
    motto: 'SIGNED. SEALED. RAPID.',
    story:
      'The Resolute Desk, slightly more gold than historically accurate. Paperwork orbits it. Nearby towers suddenly remember they can work on weekends.',
    how: 'Does not shoot. Buffs fire rate of towers in its aura. Stack desks over a killbox. Max it: the swamp also slows down. E for GOVERNMENT SHUTDOWN.',
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
    how: 'Fast ground swarm. Low HP. Walls stop them. Truth Towers melt them. Later waves split — two smaller aliens from one. Do not let a clump leak.',
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
    how: 'Slow ground tank. Massive HP. Chews walls. Needs Trebuchet splash plus a desk buff. Waves 6 and 12 send a Special Counsel. Tax him like you mean it.',
  },
  lobbyist: {
    title: 'K-Street Lobbyist',
    motto: 'THE SWAMP HAS A LOUNGE',
    story:
      'Pinstripes, sunglasses, and a briefcase full of other people’s money. He does not fight. He networks. Nearby swamp creatures suddenly remember their health insurance.',
    how: 'Support. Heals nearby ground units. Medium HP. Burst the clump with TAX before the briefcase parks next to a bureaucrat.',
  },
};

export const WAVE_TITLES = [
  'OPENING STATEMENT',
  'CROWD’S GETTING BIG',
  'THEY BROUGHT CAMERAS',
  'THE SWAMP ARRIVES',
  'RATINGS HOUR',
  'SPECIAL COUNSEL',
  'BOTH SIDES NOW',
  'THE CARAVAN',
  'EVERY NETWORK',
  'THE BASE IS LIT',
  'HISTORIC, THEY SAY',
  'THE GREATEST WAVE',
] as const;

export const PAUSE_QUOTES = [
  'The deep state waits for no one, but we can make an exception.',
  'Even tremendous presidents hydrate.',
  'This is a scheduled commercial break. Stay with us.',
  'They said you would never pause. They were wrong. As usual.',
  'The lawn is not going anywhere. Probably.',
  'We are taking a very brief, very winning break.',
  'Somebody get the ratings. Pause them if you have to.',
  'The Special Counsel is stretching. Do not let him.',
  'Fever is a lifestyle. Resume when you are ready to be historic.',
] as const;

export const END_QUOTES_WIN = [
  'Cable news is furious. The fountain sparkles. You look fantastic.',
  'They said it could not be done. It was done. Very professionally.',
  'Approval is a lifestyle. You are living it.',
  'The swarm has been deported from the metaphor.',
  'Historic. Unprecedented. Slightly gold.',
  'The ticker is green. The swamp is not. Perfect.',
  'You maxed the lawn. They will write books. Bad books.',
] as const;

export const END_QUOTES_LOSS = [
  'Somebody get this man a lawyer. And a Truth Tower.',
  'The roses wilt. The ticker is red. So sad.',
  'You had a very good feeling. The feeling has left the building.',
  'They walked in. They always walk in if you let them.',
  'The base is texting. The texts are not complimentary.',
  'The Counsel took a victory lap. Do not allow that again.',
  'More wall. More FACTS. Less coffee break.',
] as const;

export const TICKER = [
  'BREAKING: lawn still green • swarm still fake • you still winning •',
  'MARKETS LOVE WALLS • DONATIONS UP • DRONES WRONG AGAIN •',
  'SOURCES SAY: tremendous • experts: furious • fountain: fine •',
  'POLL: 99% of you are doing a fantastic job • 1% is the swamp •',
  'WEATHER: sunny with a chance of tariffs • bring a Truth Tower •',
  'ALERT: Special Counsel spotted near the roses • TAX accordingly •',
  'FEVER WATCH: streak 20 is a lifestyle • do not drop it •',
] as const;

export const SPECIAL_NAME: Record<string, string> = {
  truth: 'FACT NOVA',
  trebuchet: 'ORBITAL TARIFF',
  brick: 'FINISH THE WALL',
  desk: 'GOVERNMENT SHUTDOWN',
};

export type FieldEventId =
  | 'tweet'
  | 'drive'
  | 'blackout'
  | 'witch'
  | 'surge'
  | 'finale'
  | 'coffee'
  | 'prime'
  | 'caravan'
  | 'counsel';

export type FieldEvent = {
  id: FieldEventId;
  title: string;
  blurb: string;
  life: number;
};

export function eventForWave(wave: number): FieldEvent | null {
  if (wave === 2) return { id: 'coffee', title: 'COFFEE BREAK', blurb: 'The swamp forgot how to walk. Briefly.', life: 2.6 };
  if (wave === 3) return { id: 'tweet', title: 'TWEET STORM', blurb: 'Towers work weekends.', life: 8 };
  if (wave === 4) return { id: 'prime', title: 'EXECUTIVE TIME', blurb: 'Everything hits harder. Believe me.', life: 8 };
  if (wave === 5) return { id: 'drive', title: 'DONATION DRIVE', blurb: 'Kills pay double. Briefly.', life: 10 };
  if (wave === 6) return { id: 'counsel', title: 'SPECIAL COUNSEL', blurb: 'A very large clerk is coming. TAX him.', life: 4.5 };
  if (wave === 7) return { id: 'blackout', title: 'FAKE NEWS BLACKOUT', blurb: 'Drones forget how to fly fast.', life: 10 };
  if (wave === 8) return { id: 'caravan', title: 'THE CARAVAN', blurb: 'Extra aliens. They did not RSVP.', life: 3.2 };
  if (wave === 9) return { id: 'witch', title: 'WITCH HUNT', blurb: 'Bureaucrats found a second wind.', life: 8 };
  if (wave === 10) return { id: 'prime', title: 'PRIME TIME', blurb: 'Every network. Every shot. Yuge.', life: 9 };
  if (wave === 11) return { id: 'surge', title: 'RATINGS SURGE', blurb: 'The base is calling. Cash incoming.', life: 3.2 };
  if (wave === 12) return { id: 'finale', title: 'FINAL RALLY', blurb: 'Everybody is watching. Fire faster.', life: 99 };
  return null;
}

export function waveTitle(wave: number): string {
  return WAVE_TITLES[Math.max(0, Math.min(WAVE_TITLES.length - 1, wave - 1))] ?? `WAVE ${wave}`;
}

export function wavePreview(map: MapId, wave: number): string {
  const beats = campaignWaves(map, wave);
  const counts: Partial<Record<EnemyId, number>> = {};
  for (const b of beats) counts[b.kind] = (counts[b.kind] ?? 0) + b.n;
  const names: Record<EnemyId, string> = {
    alien: 'aliens',
    drone: 'drones',
    bureaucrat: 'clerks',
    lobbyist: 'lobbyists',
  };
  return (Object.keys(counts) as EnemyId[])
    .map((k) => `${counts[k]} ${names[k]}`)
    .join(' · ');
}

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
      { kind: 'lobbyist', n: 1, gap: 1.1 },
      { kind: 'bureaucrat', n: 2, gap: 1.4 },
    ],
    [
      { kind: 'drone', n: 8, gap: 0.5 },
      { kind: 'alien', n: 12, gap: 0.36 },
    ],
    [
      { kind: 'bureaucrat', n: 3, gap: 1.15 },
      { kind: 'lobbyist', n: 2, gap: 0.9 },
      { kind: 'alien', n: 12, gap: 0.32 },
      { kind: 'drone', n: 4, gap: 0.55 },
    ],
    [
      { kind: 'drone', n: 12, gap: 0.4 },
      { kind: 'bureaucrat', n: 3, gap: 1.05 },
    ],
    [
      { kind: 'alien', n: 18, gap: 0.26 },
      { kind: 'lobbyist', n: 2, gap: 0.7 },
      { kind: 'drone', n: 8, gap: 0.38 },
      { kind: 'bureaucrat', n: 4, gap: 0.85 },
    ],
    [
      { kind: 'bureaucrat', n: 6, gap: 0.8 },
      { kind: 'drone', n: 10, gap: 0.34 },
    ],
    [
      { kind: 'alien', n: 22, gap: 0.22 },
      { kind: 'lobbyist', n: 3, gap: 0.55 },
      { kind: 'drone', n: 12, gap: 0.3 },
      { kind: 'bureaucrat', n: 5, gap: 0.65 },
    ],
    [
      { kind: 'drone', n: 16, gap: 0.26 },
      { kind: 'bureaucrat', n: 7, gap: 0.6 },
      { kind: 'alien', n: 16, gap: 0.2 },
    ],
    [
      { kind: 'alien', n: 24, gap: 0.16 },
      { kind: 'lobbyist', n: 4, gap: 0.42 },
      { kind: 'drone', n: 16, gap: 0.2 },
      { kind: 'bureaucrat', n: 9, gap: 0.48 },
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
      { kind: 'lobbyist', n: 1, gap: 1.2 },
      { kind: 'alien', n: 12, gap: 0.4 },
    ],
    [{ kind: 'drone', n: 10, gap: 0.48 }],
    [
      { kind: 'alien', n: 16, gap: 0.3 },
      { kind: 'bureaucrat', n: 3, gap: 1.1 },
    ],
    [
      { kind: 'drone', n: 8, gap: 0.4 },
      { kind: 'lobbyist', n: 2, gap: 0.85 },
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
      { kind: 'alien', n: 20, gap: 0.22 },
      { kind: 'lobbyist', n: 3, gap: 0.5 },
      { kind: 'drone', n: 10, gap: 0.28 },
      { kind: 'bureaucrat', n: 6, gap: 0.62 },
    ],
    [
      { kind: 'bureaucrat', n: 8, gap: 0.55 },
      { kind: 'drone', n: 14, gap: 0.26 },
    ],
    [
      { kind: 'alien', n: 22, gap: 0.18 },
      { kind: 'lobbyist', n: 4, gap: 0.4 },
      { kind: 'drone', n: 14, gap: 0.22 },
      { kind: 'bureaucrat', n: 8, gap: 0.5 },
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
      { kind: 'lobbyist', n: 2, gap: 0.8 },
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
      { kind: 'alien', n: 18, gap: 0.22 },
      { kind: 'lobbyist', n: 3, gap: 0.55 },
      { kind: 'bureaucrat', n: 6, gap: 0.65 },
      { kind: 'drone', n: 10, gap: 0.3 },
    ],
    [
      { kind: 'drone', n: 18, gap: 0.24 },
      { kind: 'bureaucrat', n: 7, gap: 0.58 },
    ],
    [
      { kind: 'alien', n: 26, gap: 0.16 },
      { kind: 'lobbyist', n: 4, gap: 0.4 },
      { kind: 'drone', n: 12, gap: 0.22 },
      { kind: 'bureaucrat', n: 9, gap: 0.5 },
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
      { kind: 'lobbyist', n: 1, gap: 1.0 },
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
      { kind: 'lobbyist', n: 2, gap: 0.7 },
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
      { kind: 'alien', n: 22, gap: 0.16 },
      { kind: 'lobbyist', n: 4, gap: 0.36 },
      { kind: 'drone', n: 18, gap: 0.18 },
      { kind: 'bureaucrat', n: 10, gap: 0.46 },
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
