/**
 * CC0 PBR texture sets (Poly Haven, 1K WebP) plus a procedural fallback.
 * Albedo is tinted toward the black-and-gold dusk palette in the material color.
 */
import {
  LinearMipmapLinearFilter,
  LinearSRGBColorSpace,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type BufferGeometry,
  type Texture as TextureType,
} from 'three';
import { getDistrictTextures, type DistrictTextures } from './textures';

export type PbrKey = 'paving' | 'park' | 'brick' | 'stone' | 'stucco' | 'marble' | 'wood' | 'velvet';

export const PBR_CREDITS = [
  { key: 'env', item: 'Joburg Central Sunset 1K HDRI', source: 'Poly Haven', authors: 'Photography by Dimitrios Savva, processing by Greg Zaal', license: 'CC0 1.0', file: 'public/env/sunset_jhbcentral_1k.hdr' },
  { key: 'paving', item: 'Cobblestone Floor 13', source: 'Poly Haven', authors: 'Rob Tuytel', license: 'CC0 1.0', file: 'public/tex/paving_*.webp' },
  { key: 'park', item: 'Asphalt 02', source: 'Poly Haven', authors: 'Rob Tuytel', license: 'CC0 1.0', file: 'public/tex/park_*.webp' },
  { key: 'brick', item: 'Dark Brick Wall', source: 'Poly Haven', authors: 'Photography by Dimitrios Savva, processing by Dario Barresi', license: 'CC0 1.0', file: 'public/tex/brick_*.webp' },
  { key: 'stone', item: 'Stone Tiles', source: 'Poly Haven', authors: 'Christopher Melani', license: 'CC0 1.0', file: 'public/tex/stone_*.webp' },
  { key: 'stucco', item: 'Plastered Wall 04', source: 'Poly Haven', authors: 'Rob Tuytel', license: 'CC0 1.0', file: 'public/tex/stucco_*.webp' },
  { key: 'marble', item: 'Granite Tile (tinted as black marble)', source: 'Poly Haven', authors: 'Charlotte Baglioni', license: 'CC0 1.0', file: 'public/tex/marble_*.webp' },
  { key: 'wood', item: 'Dark Wooden Planks', source: 'Poly Haven', authors: 'Amal Kumar', license: 'CC0 1.0', file: 'public/tex/wood_*.webp' },
  { key: 'velvet', item: 'Velour Velvet', source: 'Poly Haven', authors: 'Photography by colormass, processing by Rico Cilliers', license: 'CC0 1.0', file: 'public/tex/velvet_*.webp' },
] as const;

export const HDRI_PATH = 'env/sunset_jhbcentral_1k.hdr';

const SETS: Record<PbrKey, { repeat: [number, number]; color: string; roughness: number; metalness: number }> = {
  paving: { repeat: [6, 6], color: '#8a847c', roughness: 0.92, metalness: 0.02 },
  park: { repeat: [8, 8], color: '#3a342c', roughness: 0.96, metalness: 0.02 },
  brick: { repeat: [3, 3], color: '#6a5a50', roughness: 0.9, metalness: 0.04 },
  stone: { repeat: [2.4, 2.4], color: '#6e6860', roughness: 0.86, metalness: 0.08 },
  stucco: { repeat: [2, 2], color: '#5c5248', roughness: 0.9, metalness: 0.03 },
  marble: { repeat: [2, 2], color: '#2a272e', roughness: 0.28, metalness: 0.16 },
  wood: { repeat: [2.5, 2.5], color: '#6a4a32', roughness: 0.8, metalness: 0.02 },
  velvet: { repeat: [2, 2], color: '#6a3a4e', roughness: 0.72, metalness: 0.02 },
};

function assetUrl(file: string): string {
  const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? './';
  return `${base}${file.replace(/^\//, '')}`;
}

export function hdriUrl(): string {
  return assetUrl(HDRI_PATH);
}

function configure(tex: TextureType, colorSpace: typeof SRGBColorSpace | typeof LinearSRGBColorSpace, anisotropy: number, repeat: [number, number]) {
  tex.colorSpace = colorSpace;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = anisotropy;
  tex.generateMipmaps = true;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function loadOne(loader: TextureLoader, url: string): Promise<TextureType> {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, () => reject(new Error(`Failed to load ${url}`)));
  });
}

export type PbrMaps = {
  map?: TextureType;
  normalMap?: TextureType;
  roughnessMap?: TextureType;
  metalnessMap?: TextureType;
  aoMap?: TextureType;
};

const mapCache = new Map<string, PbrMaps>();

export async function loadPbrMaps(key: PbrKey, anisotropy: number): Promise<PbrMaps> {
  const cacheKey = `${key}:${anisotropy}`;
  const hit = mapCache.get(cacheKey);
  if (hit) return hit;
  const loader = new TextureLoader();
  const meta = SETS[key];
  const [diff, nor, arm] = await Promise.all([
    loadOne(loader, assetUrl(`tex/${key}_diff.webp`)),
    loadOne(loader, assetUrl(`tex/${key}_nor.webp`)),
    loadOne(loader, assetUrl(`tex/${key}_arm.webp`)),
  ]);
  configure(diff, SRGBColorSpace, anisotropy, meta.repeat);
  configure(nor, LinearSRGBColorSpace, anisotropy, meta.repeat);
  configure(arm, LinearSRGBColorSpace, anisotropy, meta.repeat);
  const rough = arm.clone();
  rough.channel = 1;
  const metal = arm.clone();
  metal.channel = 2;
  const ao = arm.clone();
  ao.channel = 0;
  const maps: PbrMaps = { map: diff, normalMap: nor, roughnessMap: rough, metalnessMap: metal, aoMap: ao };
  mapCache.set(cacheKey, maps);
  return maps;
}

export type PlazaMaterials = {
  paving: MeshStandardMaterial;
  park: MeshStandardMaterial;
  brick: MeshStandardMaterial;
  stone: MeshStandardMaterial;
  stucco: MeshStandardMaterial;
  marble: MeshStandardMaterial;
  wood: MeshStandardMaterial;
  velvet: MeshStandardMaterial;
  gold: MeshStandardMaterial;
  glass: MeshStandardMaterial;
  ink: MeshStandardMaterial;
  source: 'pbr' | 'procedural';
};

function fromMaps(key: PbrKey, maps: PbrMaps | undefined, fallback?: TextureType): MeshStandardMaterial {
  const meta = SETS[key];
  return new MeshStandardMaterial({
    color: meta.color,
    map: maps?.map ?? fallback,
    normalMap: maps?.normalMap,
    roughnessMap: maps?.roughnessMap,
    metalnessMap: maps?.metalnessMap,
    aoMap: maps?.aoMap,
    aoMapIntensity: maps?.aoMap ? 0.85 : 0,
    roughness: meta.roughness,
    metalness: meta.metalness,
    envMapIntensity: 0.7,
  });
}

export function proceduralPlazaMaterials(seed: number, textures?: DistrictTextures): PlazaMaterials {
  const tex = textures ?? getDistrictTextures(seed);
  return {
    paving: new MeshStandardMaterial({ map: tex.paving, roughness: 0.9, color: '#8a847c' }),
    park: new MeshStandardMaterial({ map: tex.park, roughness: 1, color: '#3a342c' }),
    brick: new MeshStandardMaterial({ map: tex.brick, roughness: 0.9, metalness: 0.04 }),
    stone: new MeshStandardMaterial({ map: tex.stone, roughness: 0.82, metalness: 0.08 }),
    stucco: new MeshStandardMaterial({ map: tex.stucco, roughness: 0.88, metalness: 0.03 }),
    marble: new MeshStandardMaterial({ map: tex.marble, roughness: 0.28, metalness: 0.16, color: '#2a272e' }),
    wood: new MeshStandardMaterial({ map: tex.wood, roughness: 0.8 }),
    velvet: new MeshStandardMaterial({ map: tex.velvet, roughness: 0.72, color: '#6a3a4e' }),
    gold: new MeshStandardMaterial({ color: '#C9A45B', metalness: 0.82, roughness: 0.28, envMapIntensity: 1 }),
    glass: new MeshStandardMaterial({
      color: '#c8b0b8', metalness: 0.55, roughness: 0.08, transparent: true, opacity: 0.42,
      emissive: '#F4D9E4', emissiveIntensity: 0.16, envMapIntensity: 1,
    }),
    ink: new MeshStandardMaterial({ color: '#070605', metalness: 0.35, roughness: 0.45 }),
    source: 'procedural',
  };
}

export async function loadPlazaMaterials(seed: number, anisotropy: number): Promise<PlazaMaterials> {
  try {
    const keys = Object.keys(SETS) as PbrKey[];
    const loaded = await Promise.all(keys.map((key) => loadPbrMaps(key, anisotropy)));
    const byKey = Object.fromEntries(keys.map((key, i) => [key, loaded[i]])) as Record<PbrKey, PbrMaps>;
    const mats = proceduralPlazaMaterials(seed);
    (Object.keys(SETS) as PbrKey[]).forEach((key) => {
      mats[key].dispose();
      mats[key] = fromMaps(key, byKey[key]);
    });
    mats.source = 'pbr';
    return mats;
  } catch {
    return proceduralPlazaMaterials(seed);
  }
}

export function disposePlazaMaterials(mats: PlazaMaterials) {
  (Object.values(mats) as Array<MeshStandardMaterial | string>).forEach((item) => {
    if (item instanceof MeshStandardMaterial) item.dispose();
  });
}

/** Copy uv to uv2 so aoMap can sample. Safe to call more than once. */
export function ensureUv2(geometry: BufferGeometry) {
  const uv = geometry.attributes.uv;
  if (uv && !geometry.attributes.uv2) geometry.setAttribute('uv2', uv);
}
