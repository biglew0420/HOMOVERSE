import { BUILDINGS } from './buildings';

export const STREET_HALF = 6;
export const WORLD = 20;
export const AVATAR_RADIUS = 0.32;
export const WALK_SPEED = 2.6;
export const MAX_FRAME_DT = 0.05;
export const SLOT_REACH = 2.2;
export const SPAWN = { x: 0, z: 7.2 };

export const PUBLIC_DISTRICT_LABEL = 'Procedural synthetic open-air district. Not a real mall, map, or directions.';

export type Storefront = {
  id: string;
  name: string;
  signColor: string;
  playable: boolean;
  x: number;
  z: number;
  rotY: number;
  w: number;
  h: number;
  d: number;
  interactX: number;
  interactZ: number;
};

export type TreeSpot = { x: number; z: number; scale: number };
export type LampSpot = { x: number; z: number };

export type District = {
  seed: string;
  publicName: string;
  fountain: boolean;
  storefronts: Storefront[];
  trees: TreeSpot[];
  lamps: LampSpot[];
};

const PLAY_PADS: Array<Pick<Storefront, 'x' | 'z' | 'rotY' | 'interactX' | 'interactZ'>> = [
  { x: -8.4, z: -11, rotY: -Math.PI / 2, interactX: -5.35, interactZ: -11 },
  { x: -8.4, z: 11, rotY: -Math.PI / 2, interactX: -5.35, interactZ: 11 },
  { x: 8.4, z: -11, rotY: Math.PI / 2, interactX: 5.35, interactZ: -11 },
  { x: 8.4, z: 11, rotY: Math.PI / 2, interactX: 5.35, interactZ: 11 },
];

const FACADE_PADS: Array<Pick<Storefront, 'name' | 'x' | 'z' | 'rotY'>> = [
  { name: 'Park Row', x: -14, z: -8.5, rotY: 0 },
  { name: 'Night Market', x: 14, z: -8.5, rotY: 0 },
  { name: 'Lamp Street', x: -14, z: 8.5, rotY: Math.PI },
  { name: 'Plaza Goods', x: 14, z: 8.5, rotY: Math.PI },
];

const TREE_CHOICES: TreeSpot[][] = [
  [{ x: -12, z: -14, scale: 1 }, { x: -16.5, z: -12, scale: 0.85 }],
  [{ x: 12.5, z: -15, scale: 1.05 }, { x: 16.5, z: -11, scale: 0.8 }],
  [{ x: -13, z: 14, scale: 0.95 }, { x: -17, z: 11.5, scale: 0.75 }],
  [{ x: 13, z: 15, scale: 1 }, { x: 17, z: 12, scale: 0.82 }],
];

const LAMPS: LampSpot[] = [
  { x: -7.1, z: -14 }, { x: 7.1, z: -14 },
  { x: -7.1, z: 14 }, { x: 7.1, z: 14 },
  { x: -14, z: -7.1 }, { x: 14, z: -7.1 },
  { x: -14, z: 7.1 }, { x: 14, z: 7.1 },
];

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function frameStep(dt: number): number {
  if (!Number.isFinite(dt) || dt <= 0) return 0;
  return Math.min(dt, MAX_FRAME_DT);
}

/** Camera-relative stick/keys. Yaw 0: forward is -Z, right is +X. */
export function wishVector(ax: number, az: number, yaw: number): { dx: number; dz: number } {
  const forward = -az;
  const strafe = ax;
  return {
    dx: strafe * Math.cos(yaw) + forward * Math.sin(yaw),
    dz: strafe * Math.sin(yaw) - forward * Math.cos(yaw),
  };
}

export function blocked(x: number, z: number, radius: number, fountain: boolean): boolean {
  if (Math.abs(x) > WORLD - radius || Math.abs(z) > WORLD - radius) return true;
  const edge = STREET_HALF - radius;
  if (x < -edge && z < -edge) return true;
  if (x > edge && z < -edge) return true;
  if (x < -edge && z > edge) return true;
  if (x > edge && z > edge) return true;
  if (fountain && x * x + z * z < (1.15 + radius) * (1.15 + radius)) return true;
  return false;
}

export function tryMove(x: number, z: number, dx: number, dz: number, fountain: boolean): { x: number; z: number } {
  let nx = x;
  let nz = z;
  if (!blocked(x + dx, z, AVATAR_RADIUS, fountain)) nx = x + dx;
  if (!blocked(nx, z + dz, AVATAR_RADIUS, fountain)) nz = z + dz;
  return { x: nx, z: nz };
}

export function buildDistrict(seed: string, publicName: string): District {
  const rand = mulberry32(hashString(seed));
  const order = [...BUILDINGS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const storefronts: Storefront[] = PLAY_PADS.map((pad, index) => {
    const building = order[index];
    return {
      ...pad,
      id: building.id,
      name: building.name,
      signColor: building.color,
      playable: true,
      w: 4.4,
      h: 4.7 + rand() * 1.15,
      d: 3.1,
    };
  });
  FACADE_PADS.forEach((pad, index) => {
    storefronts.push({
      ...pad,
      id: `facade-${index}`,
      signColor: '#d4af37',
      playable: false,
      w: 5.1,
      h: 4.3 + rand() * 0.9,
      d: 2.8,
      interactX: pad.x,
      interactZ: pad.z,
    });
  });
  const trees = TREE_CHOICES.map((choices) => {
    const pick = choices[Math.floor(rand() * choices.length)];
    return { ...pick, scale: pick.scale * (0.92 + rand() * 0.2) };
  });
  return {
    seed,
    publicName,
    fountain: rand() > 0.42,
    storefronts,
    trees,
    lamps: LAMPS,
  };
}

export function nearestPlayable(x: number, z: number, district: District, reach = SLOT_REACH): Storefront | null {
  let best: Storefront | null = null;
  let bestDist = reach;
  for (const store of district.storefronts) {
    if (!store.playable) continue;
    const dist = Math.hypot(x - store.interactX, z - store.interactZ);
    if (dist <= bestDist) {
      best = store;
      bestDist = dist;
    }
  }
  return best;
}

export function districtSignature(district: District): string {
  const plays = district.storefronts.filter((store) => store.playable).map((store) => `${store.id}@${store.z > 0 ? 's' : 'n'}${store.x > 0 ? 'e' : 'w'}`);
  const heights = district.storefronts.map((store) => store.h.toFixed(2)).join(',');
  return `${plays.join('|')}|f${district.fountain ? 1 : 0}|${heights}`;
}
