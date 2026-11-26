import { CylinderGeometry, ExtrudeGeometry, Shape, type BufferGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { ensureUv2 } from './pbr';

const cache = new Map<string, BufferGeometry>();

function keep<T extends BufferGeometry>(key: string, geometry: T): T {
  ensureUv2(geometry);
  cache.set(key, geometry);
  return geometry;
}

/** Beveled box. Radius is clamped so the fillet cannot swallow a thin piece. */
export function roundedBoxGeometry(width: number, height: number, depth: number, radius: number, segments: number): RoundedBoxGeometry {
  const safeRadius = Math.max(0.001, Math.min(radius, width * 0.45, height * 0.45, depth * 0.45));
  const segs = Math.max(1, Math.round(segments));
  const key = `rb:${width.toFixed(3)}:${height.toFixed(3)}:${depth.toFixed(3)}:${safeRadius.toFixed(3)}:${segs}`;
  const hit = cache.get(key);
  if (hit) return hit as RoundedBoxGeometry;
  return keep(key, new RoundedBoxGeometry(width, height, depth, segs, safeRadius));
}

/**
 * Curved fabric awning. Profile sits in the YZ plane: attached at the origin,
 * falling toward +Z (toward the plaza) and down.
 */
export function makeAwningGeometry(width: number, depth: number, drop: number): ExtrudeGeometry {
  const key = `awn:${width.toFixed(2)}:${depth.toFixed(2)}:${drop.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit) return hit as ExtrudeGeometry;
  const shape = new Shape();
  shape.moveTo(0, 0.025);
  shape.lineTo(0, 0);
  shape.quadraticCurveTo(depth * 0.7, -drop * 0.22, depth, -drop);
  shape.lineTo(depth, -drop - 0.055);
  shape.quadraticCurveTo(depth * 0.68, -drop * 0.32, 0, -0.02);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 1,
    curveSegments: 12,
  });
  geometry.translate(0, 0, -width / 2);
  geometry.rotateY(-Math.PI / 2);
  geometry.computeVertexNormals();
  return keep(key, geometry);
}

/** Filled arch slab (door or window), centered on its depth. */
export function makeArchSlab(width: number, height: number, depth = 0.08): ExtrudeGeometry {
  const key = `slab:${width.toFixed(2)}:${height.toFixed(2)}:${depth.toFixed(3)}`;
  const hit = cache.get(key);
  if (hit) return hit as ExtrudeGeometry;
  const hw = width / 2;
  const rise = height * 0.46;
  const spring = height - rise;
  const shape = new Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, spring);
  shape.quadraticCurveTo(0, spring + rise * 1.28, hw, spring);
  shape.lineTo(hw, 0);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.016,
    bevelSegments: 2,
    curveSegments: 14,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return keep(key, geometry);
}

/** Beveled gold H, centered on its origin. */
export function makeMonogramH(width = 0.62, height = 1.12, depth = 0.1): ExtrudeGeometry {
  const key = `h:${width}:${height}:${depth}`;
  const hit = cache.get(key);
  if (hit) return hit as ExtrudeGeometry;
  const hw = width / 2;
  const hh = height / 2;
  const t = width * 0.24;
  const bar = t * 0.55;
  const shape = new Shape();
  shape.moveTo(-hw, -hh);
  shape.lineTo(-hw + t, -hh);
  shape.lineTo(-hw + t, -bar);
  shape.lineTo(hw - t, -bar);
  shape.lineTo(hw - t, -hh);
  shape.lineTo(hw, -hh);
  shape.lineTo(hw, hh);
  shape.lineTo(hw - t, hh);
  shape.lineTo(hw - t, bar);
  shape.lineTo(-hw + t, bar);
  shape.lineTo(-hw + t, hh);
  shape.lineTo(-hw, hh);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.028,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 2,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return keep(key, geometry);
}

/** Full cylinder with its axis along X, so a roof can bury the lower half. */
export function axleCylinder(length: number, radius: number, segments: number): CylinderGeometry {
  const segs = Math.max(6, Math.round(segments));
  const key = `cyl:${length.toFixed(2)}:${radius.toFixed(2)}:${segs}`;
  const hit = cache.get(key);
  if (hit) return hit as CylinderGeometry;
  const geometry = new CylinderGeometry(radius, radius, length, segs, 1, false);
  geometry.rotateZ(Math.PI / 2);
  geometry.computeVertexNormals();
  return keep(key, geometry);
}
