import { CanvasTexture, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace, type CanvasTexture as CanvasTextureType } from 'three';

export type DistrictTextures = {
  paving: CanvasTextureType;
  park: CanvasTextureType;
  plaster: CanvasTextureType;
  brick: CanvasTextureType;
  stone: CanvasTextureType;
  stucco: CanvasTextureType;
  marble: CanvasTextureType;
  wood: CanvasTextureType;
  velvet: CanvasTextureType;
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

function grain(ctx: CanvasRenderingContext2D, size: number, rand: () => number, count: number, alpha = 0.35) {
  for (let i = 0; i < count; i++) {
    const n = Math.floor(rand() * 40);
    ctx.fillStyle = `rgba(${n},${n},${n},${alpha})`;
    ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 2, 1 + rand() * 2);
  }
}

/** Original procedural materials. Not photographs and not a scan of a real street. */
export function getDistrictTextures(seed: number): DistrictTextures {
  const key = seed >>> 0;
  const hit = cache.get(key);
  if (hit) return hit;
  const rand = mulberry32(key);
  const size = 256;

  const paving = makeCanvas(size);
  paving.ctx.fillStyle = '#2a2622';
  paving.ctx.fillRect(0, 0, size, size);
  const cols = 6;
  const rows = 8;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const shade = 42 + Math.floor(rand() * 22);
      paving.ctx.fillStyle = `rgb(${shade + 16},${shade + 8},${shade})`;
      const ox = (y % 2) * (size / cols / 2);
      paving.ctx.fillRect(ox + x * (size / cols) + 1, y * (size / rows) + 1, size / cols - 2, size / rows - 2);
    }
  }
  paving.ctx.strokeStyle = 'rgba(201,164,91,0.2)';
  paving.ctx.lineWidth = 2;
  paving.ctx.beginPath();
  paving.ctx.moveTo(size / 2, 0);
  paving.ctx.lineTo(size / 2, size);
  paving.ctx.stroke();

  const park = makeCanvas(size);
  park.ctx.fillStyle = '#141810';
  park.ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 700; i++) {
    const g = 28 + Math.floor(rand() * 36);
    park.ctx.fillStyle = `rgba(${g - 8},${g + 12},${g - 6},0.85)`;
    park.ctx.fillRect(rand() * size, rand() * size, 2 + rand() * 4, 1 + rand() * 2);
  }

  const plaster = makeCanvas(size);
  plaster.ctx.fillStyle = '#16130f';
  plaster.ctx.fillRect(0, 0, size, size);
  grain(plaster.ctx, size, rand, 1800, 0.45);

  const brick = makeCanvas(size);
  brick.ctx.fillStyle = '#1a1210';
  brick.ctx.fillRect(0, 0, size, size);
  const bw = 32;
  const bh = 14;
  for (let y = 0; y < size / bh; y++) {
    const ox = (y % 2) * (bw / 2);
    for (let x = -1; x < size / bw + 1; x++) {
      const r = 38 + Math.floor(rand() * 28);
      brick.ctx.fillStyle = `rgb(${r + 18},${r},${r - 6})`;
      brick.ctx.fillRect(ox + x * bw + 1, y * bh + 1, bw - 2, bh - 2);
    }
  }

  const stone = makeCanvas(size);
  stone.ctx.fillStyle = '#1c1b1f';
  stone.ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 6; x++) {
      const s = 36 + Math.floor(rand() * 28);
      stone.ctx.fillStyle = `rgb(${s},${s - 2},${s + 6})`;
      const ww = size / 6;
      const hh = size / 8;
      stone.ctx.fillRect(x * ww + 2, y * hh + 2, ww - 4, hh - 4);
      stone.ctx.strokeStyle = 'rgba(201,164,91,0.12)';
      stone.ctx.strokeRect(x * ww + 2, y * hh + 2, ww - 4, hh - 4);
    }
  }
  grain(stone.ctx, size, rand, 400, 0.25);

  const stucco = makeCanvas(size);
  stucco.ctx.fillStyle = '#1a1614';
  stucco.ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2400; i++) {
    const n = 22 + Math.floor(rand() * 28);
    stucco.ctx.fillStyle = `rgba(${n + 10},${n + 4},${n},0.55)`;
    stucco.ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 3, 1 + rand() * 3);
  }

  const marble = makeCanvas(size);
  marble.ctx.fillStyle = '#121115';
  marble.ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 9; i++) {
    marble.ctx.strokeStyle = `rgba(230,220,210,${0.08 + rand() * 0.12})`;
    marble.ctx.lineWidth = 1 + rand() * 2;
    marble.ctx.beginPath();
    marble.ctx.moveTo(rand() * size, 0);
    marble.ctx.bezierCurveTo(rand() * size, rand() * size, rand() * size, rand() * size, rand() * size, size);
    marble.ctx.stroke();
  }
  grain(marble.ctx, size, rand, 300, 0.2);

  const wood = makeCanvas(size);
  wood.ctx.fillStyle = '#2a1c14';
  wood.ctx.fillRect(0, 0, size, size);
  for (let x = 0; x < size; x += 28) {
    const s = 40 + Math.floor(rand() * 20);
    wood.ctx.fillStyle = `rgb(${s + 30},${s + 10},${s})`;
    wood.ctx.fillRect(x + 1, 0, 26, size);
    wood.ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    wood.ctx.strokeRect(x + 1, 0, 26, size);
  }
  grain(wood.ctx, size, rand, 500, 0.2);

  const velvet = makeCanvas(size);
  velvet.ctx.fillStyle = '#3A2433';
  velvet.ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    velvet.ctx.fillStyle = `rgba(200,140,160,${0.04 + rand() * 0.08})`;
    velvet.ctx.fillRect(rand() * size, rand() * size, 2, 6 + rand() * 8);
  }

  const textures = {
    paving: finish(paving.canvas, 6),
    park: finish(park.canvas, 4),
    plaster: finish(plaster.canvas, 2),
    brick: finish(brick.canvas, 3),
    stone: finish(stone.canvas, 2),
    stucco: finish(stucco.canvas, 2),
    marble: finish(marble.canvas, 2),
    wood: finish(wood.canvas, 3),
    velvet: finish(velvet.canvas, 2),
  };
  cache.set(key, textures);
  return textures;
}
