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

function paintSeahorse(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  const s = Math.min(w, h) / 210;
  ctx.translate((w - 190 * s) / 2, (h - 210 * s) / 2);
  ctx.scale(s, s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const body = new Path2D('M156 62 C112 50 78 88 96 124 C114 162 86 196 54 184 C24 172 30 142 56 150');
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 40;
  ctx.stroke(body);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 16;
  ctx.stroke(body);
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.ellipse(132, 58, 26, 22, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(162, 66, 22, 9, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.moveTo(112, 36);
  ctx.lineTo(118, 14);
  ctx.moveTo(128, 32);
  ctx.lineTo(140, 10);
  ctx.moveTo(144, 34);
  ctx.lineTo(158, 16);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.ellipse(108, 112, 18, 11, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function finishSeahorse(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const s = Math.min(w, h) / 210;
  ctx.save();
  ctx.translate((w - 190 * s) / 2, (h - 210 * s) / 2);
  ctx.scale(s, s);
  ctx.fillStyle = '#120e08';
  ctx.beginPath();
  ctx.arc(140, 54, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fffaf0';
  ctx.beginPath();
  ctx.arc(142, 52, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function paintH(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.scale(w / 200, h / 200);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  roundRect(ctx, 36, 22, 36, 156, 12);
  roundRect(ctx, 128, 22, 36, 156, 12);
  roundRect(ctx, 58, 82, 84, 36, 10);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  roundRect(ctx, 46, 32, 16, 120, 8);
  roundRect(ctx, 138, 32, 16, 120, 8);
  roundRect(ctx, 70, 90, 60, 16, 8);
  ctx.fill();
  ctx.restore();
}

function paintJewel(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.scale(w / 200, h / 200);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(100, 18);
  ctx.lineTo(164, 62);
  ctx.lineTo(146, 168);
  ctx.lineTo(54, 168);
  ctx.lineTo(36, 62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(100, 36);
  ctx.lineTo(142, 70);
  ctx.lineTo(100, 92);
  ctx.lineTo(58, 70);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.moveTo(100, 92);
  ctx.lineTo(138, 154);
  ctx.lineTo(62, 154);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function paintArch(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.scale(w / 200, h / 200);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.62)';
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.moveTo(48, 168);
  ctx.lineTo(48, 96);
  ctx.bezierCurveTo(48, 36, 152, 36, 152, 96);
  ctx.lineTo(152, 168);
  ctx.stroke();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.fillStyle = 'white';
  ctx.fillRect(36, 158, 28, 16);
  ctx.fillRect(136, 158, 28, 16);
  ctx.restore();
}

function paintMedallion(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.scale(w / 200, h / 200);
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  ctx.beginPath();
  ctx.arc(100, 100, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(100, 100, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(100, 100, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'white';
  ctx.fillRect(78, 58, 14, 84);
  ctx.fillRect(108, 58, 14, 84);
  ctx.fillRect(84, 90, 32, 16);
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
  if (id === 'seahorse') paintSeahorse(ctx, canvas.width, canvas.height);
  else if (id === 'hmark') paintH(ctx, canvas.width, canvas.height);
  else if (id === 'jewel') paintJewel(ctx, canvas.width, canvas.height);
  else if (id === 'arch') paintArch(ctx, canvas.width, canvas.height);
  else paintMedallion(ctx, canvas.width, canvas.height);
  const lit = shade(canvas);
  if (id === 'seahorse') {
    const litCtx = lit.getContext('2d');
    if (litCtx) finishSeahorse(litCtx, lit.width, lit.height);
  }
  cache.set(id, lit);
  return lit;
}
