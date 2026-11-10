import { CanvasTexture, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace, type CanvasTexture as CanvasTextureType } from 'three';

export type DistrictTextures = {
  paving: CanvasTextureType;
  park: CanvasTextureType;
  plaster: CanvasTextureType;
};

const cache = new Map<number, DistrictTextures>();

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

function makeCanvas(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d unavailable');
  return { canvas, ctx };
}

function finish(canvas: HTMLCanvasElement, repeat: number): CanvasTextureType {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 4;
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Original procedural textures. Not photographs and not a scan of a real street. */
export function getDistrictTextures(seed: number): DistrictTextures {
  const key = seed >>> 0;
  const hit = cache.get(key);
  if (hit) return hit;
  const rand = mulberry32(key);
  const size = 256;

  const paving = makeCanvas(size);
  paving.ctx.fillStyle = '#3a342c';
  paving.ctx.fillRect(0, 0, size, size);
  const cols = 6;
  const rows = 8;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const wobble = (rand() - 0.5) * 6;
      const shade = 48 + Math.floor(rand() * 28);
      paving.ctx.fillStyle = `rgb(${shade + 18},${shade + 8},${shade - 4})`;
      const ox = (y % 2) * (size / cols / 2);
      paving.ctx.fillRect(ox + x * (size / cols) + 1, y * (size / rows) + 1 + wobble * 0, size / cols - 2, size / rows - 2);
    }
  }
  paving.ctx.strokeStyle = 'rgba(212,175,55,0.18)';
  paving.ctx.lineWidth = 2;
  paving.ctx.beginPath();
  paving.ctx.moveTo(size / 2, 0);
  paving.ctx.lineTo(size / 2, size);
  paving.ctx.stroke();

  const park = makeCanvas(size);
  park.ctx.fillStyle = '#1a2218';
  park.ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 700; i++) {
    const g = 30 + Math.floor(rand() * 40);
    park.ctx.fillStyle = `rgba(${g - 10},${g + 15},${g - 8},0.85)`;
    park.ctx.fillRect(rand() * size, rand() * size, 2 + rand() * 4, 1 + rand() * 2);
  }

  const plaster = makeCanvas(size);
  plaster.ctx.fillStyle = '#16130f';
  plaster.ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1800; i++) {
    const n = 16 + Math.floor(rand() * 22);
    plaster.ctx.fillStyle = `rgba(${n + 8},${n + 4},${n},0.55)`;
    plaster.ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 3, 1 + rand() * 2);
  }

  const textures = {
    paving: finish(paving.canvas, 6),
    park: finish(park.canvas, 4),
    plaster: finish(plaster.canvas, 1),
  };
  cache.set(key, textures);
  return textures;
}
