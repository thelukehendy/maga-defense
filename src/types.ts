export const CELL = 64;
export const COLS = 16;
export const ROWS = 10;
export const WORLD_W = COLS * CELL;
export const WORLD_H = ROWS * CELL;
export const STEP = 1 / 60;

export const TowerId = {
  truth: 'truth',
  trebuchet: 'trebuchet',
  brick: 'brick',
  desk: 'desk',
} as const;
export type TowerId = (typeof TowerId)[keyof typeof TowerId];

export const EnemyId = {
  alien: 'alien',
  drone: 'drone',
  bureaucrat: 'bureaucrat',
} as const;
export type EnemyId = (typeof EnemyId)[keyof typeof EnemyId];

export const Phase = {
  title: 'title',
  playing: 'playing',
  paused: 'paused',
  victory: 'victory',
  defeat: 'defeat',
} as const;
export type Phase = (typeof Phase)[keyof typeof Phase];

export type Vec = { x: number; y: number };

export type TowerDef = {
  id: TowerId;
  name: string;
  tag: string;
  cost: number;
  range: number;
  fireRate: number;
  damage: number;
  aoe: number;
  color: string;
  blurb: string;
};

export const TOWERS: Record<TowerId, TowerDef> = {
  truth: {
    id: 'truth',
    name: 'Truth Tower',
    tag: 'FACT!',
    cost: 80,
    range: 2.55,
    fireRate: 6.2,
    damage: 9,
    aoe: 0,
    color: '#3cf0ff',
    blurb: 'Rapid neon FACT lasers. Low damage, high volume.',
  },
  trebuchet: {
    id: 'trebuchet',
    name: 'Tariff Trebuchet',
    tag: 'TAX',
    cost: 190,
    range: 3.35,
    fireRate: 0.48,
    damage: 96,
    aoe: 1.45,
    color: '#e6c35c',
    blurb: 'Lobs heavy TAX boulders. Slow. HUGE. Area damage.',
  },
  brick: {
    id: 'brick',
    name: 'Brick-Layer Cannon',
    tag: 'WALL',
    cost: 115,
    range: 3.1,
    fireRate: 0.38,
    damage: 0,
    aoe: 0,
    color: '#d96b4a',
    blurb: 'Builds temporary mini-walls on the track. Drones fly over.',
  },
  desk: {
    id: 'desk',
    name: 'Executive Order Desk',
    tag: 'EO',
    cost: 165,
    range: 2.25,
    fireRate: 0,
    damage: 0,
    aoe: 0,
    color: '#f0d78c',
    blurb: 'Aura buffs nearby tower fire rates. Tremendous paper.',
  },
};

export type EnemyDef = {
  id: EnemyId;
  name: string;
  hp: number;
  speed: number;
  reward: number;
  leak: number;
  flying: boolean;
  radius: number;
};

export const ENEMIES: Record<EnemyId, EnemyDef> = {
  alien: {
    id: 'alien',
    name: 'Commie Alien',
    hp: 20,
    speed: 72,
    reward: 9,
    leak: 7,
    flying: false,
    radius: 14,
  },
  drone: {
    id: 'drone',
    name: 'Fake News Drone',
    hp: 26,
    speed: 118,
    reward: 14,
    leak: 10,
    flying: true,
    radius: 13,
  },
  bureaucrat: {
    id: 'bureaucrat',
    name: 'Deep State Bureaucrat',
    hp: 165,
    speed: 34,
    reward: 32,
    leak: 18,
    flying: false,
    radius: 18,
  },
};

export const START_DONATIONS = 260;
export const START_APPROVAL = 100;
export const MAX_WAVES = 12;
export const WALL_DURATION = 7.5;
export const WALL_HP = 90;
export const SELL_RATIO = 0.6;
export const DESK_BUFF = 1.48;
