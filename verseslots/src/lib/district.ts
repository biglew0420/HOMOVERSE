import { GOLDEN_HOUR_ID, SHOPS, type ShopDef, type ShopMaterial } from './shops';

export const STREET_HALF = 6;
export const WORLD = 16;
export const RING_RADIUS = 11.2;
export const WALK_RADIUS = 8.7;
export const AVATAR_RADIUS = 0.32;
export const WALK_SPEED = 2.6;
export const MAX_FRAME_DT = 0.05;
export const SLOT_REACH = 2.4;
export const FOUNTAIN_RADIUS = 1.32;
export const SPAWN = { x: 0, z: 4.35 };
export const BENCH = { x: 3.15, z: 1.55, rotY: -0.7 };

export const PUBLIC_DISTRICT_LABEL = 'Procedural synthetic open-air district. Not a real mall, map, or directions.';

export type Storefront = {
  id: string;
  name: string;
  signColor: string;
  awningColor: string;
  material: ShopMaterial;
  enterable: boolean;
  playable: boolean;
  href?: string;
  kind: ShopDef['kind'];
  searchHint: string;
  x: number;
  z: number;
  rotY: number;
  w: number;
  h: number;
  d: number;
  interactX: number;
  interactZ: number;
  padIndex: number;
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

export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
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
  const r = Math.hypot(x, z);
  if (r > WALK_RADIUS - radius) return true;
  if (fountain && r < FOUNTAIN_RADIUS + radius) return true;
  return false;
}

export function tryMove(x: number, z: number, dx: number, dz: number, fountain: boolean): { x: number; z: number } {
  let nx = x;
  let nz = z;
  if (!blocked(x + dx, z, AVATAR_RADIUS, fountain)) nx = x + dx;
  if (!blocked(nx, z + dz, AVATAR_RADIUS, fountain)) nz = z + dz;
  return { x: nx, z: nz };
}

const PAD_COUNT = 8;
const INSET = 2.9;

function padPose(index: number) {
  const angle = (index / PAD_COUNT) * Math.PI * 2;
  // angle 0 is due north (−Z), so spawn (facing −Z) looks at the fountain and Golden Hour beyond it.
  const x = Math.sin(angle) * RING_RADIUS;
  const z = -Math.cos(angle) * RING_RADIUS;
  return {
    angle,
    x,
    z,
    rotY: -angle,
    interactX: Math.sin(angle) * (RING_RADIUS - INSET),
    interactZ: -Math.cos(angle) * (RING_RADIUS - INSET),
  };
}

function toStorefront(shop: ShopDef, index: number, rand: () => number): Storefront {
  const pad = padPose(index);
  return {
    ...pad,
    id: shop.id,
    name: shop.name,
    signColor: shop.signColor,
    awningColor: shop.awningColor,
    material: shop.material,
    enterable: shop.enterable,
    playable: shop.playable,
    href: shop.href,
    kind: shop.kind,
    searchHint: shop.searchHint,
    w: 4.5 + rand() * 0.45,
    h: 5.1 + rand() * 1.35,
    d: 3.2,
    padIndex: index,
  };
}

export function buildDistrict(seed: string, publicName: string): District {
  const rand = mulberry32(hashString(seed));
  const golden = SHOPS.find((shop) => shop.id === GOLDEN_HOUR_ID)!;
  const rest = SHOPS.filter((shop) => shop.id !== GOLDEN_HOUR_ID);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  // Pad 0 is due north (−Z), always Golden Hour, visible beyond the fountain from spawn.
  const storefronts = [toStorefront(golden, 0, rand), ...rest.map((shop, i) => toStorefront(shop, i + 1, rand))];

  const trees: TreeSpot[] = [];
  for (let i = 0; i < PAD_COUNT; i++) {
    const angle = ((i + 0.5) / PAD_COUNT) * Math.PI * 2;
    const radius = 13.4 + rand() * 0.5;
    trees.push({
      x: Math.sin(angle) * radius,
      z: Math.cos(angle) * radius,
      scale: 0.8 + rand() * 0.28,
    });
  }

  const lamps: LampSpot[] = [];
  for (let i = 0; i < PAD_COUNT; i++) {
    const angle = (i / PAD_COUNT) * Math.PI * 2 + Math.PI / PAD_COUNT;
    const radius = 6.35;
    lamps.push({ x: Math.sin(angle) * radius, z: Math.cos(angle) * radius });
  }

  return {
    seed,
    publicName,
    fountain: true,
    storefronts,
    trees,
    lamps,
  };
}

export function nearestStore(x: number, z: number, district: District, reach = SLOT_REACH): Storefront | null {
  let best: Storefront | null = null;
  let bestDist = reach;
  for (const store of district.storefronts) {
    const dist = Math.hypot(x - store.interactX, z - store.interactZ);
    if (dist <= bestDist) {
      best = store;
      bestDist = dist;
    }
  }
  return best;
}

export function nearestEnterable(x: number, z: number, district: District, reach = SLOT_REACH): Storefront | null {
  const near = nearestStore(x, z, district, reach);
  return near && near.enterable ? near : null;
}

/** Playable means the Golden Hour door (the demo slot lives inside). */
export function nearestPlayable(x: number, z: number, district: District, reach = SLOT_REACH): Storefront | null {
  const near = nearestStore(x, z, district, reach);
  return near && near.playable ? near : null;
}

export function storeById(district: District, id: string): Storefront | undefined {
  return district.storefronts.find((store) => store.id === id);
}

export function districtSignature(district: District): string {
  const plays = district.storefronts.map((store) => `${store.id}@${store.padIndex}`);
  const heights = district.storefronts.map((store) => store.h.toFixed(2)).join(',');
  return `${plays.join('|')}|f${district.fountain ? 1 : 0}|${heights}`;
}
