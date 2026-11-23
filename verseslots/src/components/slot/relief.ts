import type { SymbolId } from '../../lib/slotMath';

const cache = new Map<SymbolId, HTMLCanvasElement>();

function blurHeight(src: Float32Array, w: number, h: number, radius: number): Float32Array {
  const pass = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const span = radius * 2 + 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) acc += src[y * w + Math.min(w - 1, Math.max(0, x + k))];
      pass[y * w + x] = acc / span;
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let acc = 0;
      for (let k = -radius; k <= radius; k++) acc += pass[Math.min(h - 1, Math.max(0, y + k)) * w + x];
      out[y * w + x] = acc / span;
    }
  }
  return out;
}

function shade(source: HTMLCanvasElement): HTMLCanvasElement {
  const w = source.width;
  const h = source.height;
  const srcCtx = source.getContext('2d');
  if (!srcCtx) return source;
  const img = srcCtx.getImageData(0, 0, w, h);
  const height = new Float32Array(w * h);
  for (let i = 0; i < height.length; i++) height[i] = img.data[i * 4 + 3] / 255;
  const field = blurHeight(height, w, h, 2);
  const out = srcCtx.createImageData(w, h);
  const lx = -0.42;
  const ly = -0.62;
  const lz = 0.66;
  const llen = Math.hypot(lx, ly, lz);
  const Lx = lx / llen;
  const Ly = ly / llen;
  const Lz = lz / llen;
  const hx = Lx;
  const hy = Ly;
  const hz = Lz + 1;
  const hlen = Math.hypot(hx, hy, hz);
  const Hx = hx / hlen;
  const Hy = hy / hlen;
  const Hz = hz / hlen;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const cover = field[i];
      if (cover < 0.04) continue;
      const nx = field[i - 1] - field[i + 1];
      const ny = field[i - w] - field[i + w];
      const nz = 0.42;
      const nlen = Math.hypot(nx, ny, nz) || 1;
      const Nx = nx / nlen;
      const Ny = ny / nlen;
      const Nz = nz / nlen;
      const ndotl = Math.max(0, Nx * Lx + Ny * Ly + Nz * Lz);
      const ndoth = Math.max(0, Nx * Hx + Ny * Hy + Nz * Hz);
      const spec = ndoth ** 52;
      const spec2 = Math.max(0, Nx * 0.35 + Ny * 0.15 + Nz * 0.9) ** 28;
      const rim = (1 - Nz) ** 1.7;
      const shadeAmt = 0.16 + ndotl * 0.72;
      let r = 0.55 * shadeAmt + spec * 1.05 + spec2 * 0.35 + rim * 0.22;
      let g = 0.38 * shadeAmt + spec * 0.9 + spec2 * 0.28 + rim * 0.16;
      let b = 0.12 * shadeAmt + spec * 0.52 + spec2 * 0.16 + rim * 0.08;
      if (Ny > 0.15) {
        const occ = Math.min(0.45, Ny * 0.55);
        r *= 1 - occ;
        g *= 1 - occ;
        b *= 1 - occ;
      }
      const a = Math.min(1, cover * 1.35);
      const o = i * 4;
      out.data[o] = Math.max(0, Math.min(255, r * 255));
      out.data[o + 1] = Math.max(0, Math.min(255, g * 255));
      out.data[o + 2] = Math.max(0, Math.min(255, b * 255));
      out.data[o + 3] = Math.max(0, Math.min(255, a * 255));
    }
  }
  const lit = document.createElement('canvas');
  lit.width = w;
  lit.height = h;
  lit.getContext('2d')?.putImageData(out, 0, 0);
  return lit;
}


function paintH(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.scale(w / 200, h / 200);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  roundRect(ctx, 36, 22, 36, 156, 12);
  roundRect(ctx, 128, 22, 36, 156, 12);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  roundRect(ctx, 46, 32, 16, 120, 8);
  roundRect(ctx, 138, 32, 16, 120, 8);
  ctx.fill();
  // Diamond-lozenge crossbar
  ctx.beginPath();
  ctx.moveTo(100, 78);
  ctx.lineTo(148, 100);
  ctx.lineTo(100, 122);
  ctx.lineTo(52, 100);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(100, 86);
  ctx.lineTo(136, 100);
  ctx.lineTo(100, 114);
  ctx.lineTo(64, 100);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.restore();
}

function paintCrown(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.scale(w / 200, h / 200);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(30, 150);
  ctx.lineTo(40, 70);
  ctx.lineTo(70, 110);
  ctx.lineTo(100, 44);
  ctx.lineTo(130, 110);
  ctx.lineTo(160, 70);
  ctx.lineTo(170, 150);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(42, 140);
  ctx.lineTo(50, 84);
  ctx.lineTo(74, 116);
  ctx.lineTo(100, 62);
  ctx.lineTo(126, 116);
  ctx.lineTo(150, 84);
  ctx.lineTo(158, 140);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(36, 148, 128, 22);
  ctx.beginPath();
  ctx.arc(100, 50, 10, 0, Math.PI * 2);
  ctx.arc(46, 74, 7, 0, Math.PI * 2);
  ctx.arc(154, 74, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function paintDiamond(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.scale(w / 200, h / 200);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(100, 18);
  ctx.lineTo(164, 80);
  ctx.lineTo(100, 182);
  ctx.lineTo(36, 80);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(100, 32);
  ctx.lineTo(148, 80);
  ctx.lineTo(100, 96);
  ctx.lineTo(52, 80);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.moveTo(100, 96);
  ctx.lineTo(148, 80);
  ctx.lineTo(100, 168);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function paintChampagne(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.scale(w / 200, h / 200);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.moveTo(70, 36);
  ctx.quadraticCurveTo(100, 8, 130, 36);
  ctx.lineTo(118, 86);
  ctx.quadraticCurveTo(100, 108, 82, 86);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(78, 40);
  ctx.quadraticCurveTo(100, 20, 122, 40);
  ctx.lineTo(112, 80);
  ctx.quadraticCurveTo(100, 94, 88, 80);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(94, 100, 12, 58);
  ctx.beginPath();
  ctx.ellipse(100, 168, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(86, 34, 5, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(118, 30, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, rw: number, rh: number, r: number) {
  ctx.roundRect(x, y, rw, rh, r);
}

function blank(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d canvas unavailable');
  return { canvas, ctx };
}

export function litCanvas(id: SymbolId): HTMLCanvasElement {
  const hit = cache.get(id);
  if (hit) return hit;
  const made = blank(360, 360);
  const { canvas, ctx } = made;
  if (id === 'hmark') paintH(ctx, canvas.width, canvas.height);
  else if (id === 'crown') paintCrown(ctx, canvas.width, canvas.height);
  else if (id === 'diamond') paintDiamond(ctx, canvas.width, canvas.height);
  else paintChampagne(ctx, canvas.width, canvas.height);
  const lit = shade(canvas);
  cache.set(id, lit);
  return lit;
}
