import { describe, expect, it } from 'vitest';
import { Box3, Vector3 } from 'three';
import { makeArchSlab, makeAwningGeometry, makeMonogramH, roundedBoxGeometry } from './smoothGeo';

function sizeOf(geometry: { computeBoundingBox: () => void; boundingBox: Box3 | null }) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const size = new Vector3();
  box.getSize(size);
  return size;
}

describe('smooth geometry', () => {
  it('rounds boxes and keeps a curved awning hanging forward and down', () => {
    const box = roundedBoxGeometry(2, 1, 0.4, 0.2, 2);
    expect(box.getAttribute('position').count).toBeGreaterThan(24);
    const awning = makeAwningGeometry(3, 1.1, 0.4);
    const size = sizeOf(awning);
    expect(size.x).toBeGreaterThan(2.5);
    expect(size.y).toBeGreaterThan(0.3);
    expect(size.z).toBeGreaterThan(0.8);
    expect(awning.boundingBox!.max.z).toBeGreaterThan(0.5);
    expect(awning.boundingBox!.min.y).toBeLessThan(-0.2);
  });

  it('builds an arched door and a centered monogram', () => {
    const door = makeArchSlab(0.8, 2.1, 0.08);
    expect(door.getAttribute('position').count).toBeGreaterThan(30);
    const mark = makeMonogramH();
    const size = sizeOf(mark);
    expect(size.x).toBeGreaterThan(0.5);
    expect(size.y).toBeGreaterThan(1);
    expect(Math.abs(mark.boundingBox!.max.y + mark.boundingBox!.min.y)).toBeLessThan(0.05);
  });
});
