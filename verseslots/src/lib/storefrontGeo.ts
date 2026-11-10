import { ExtrudeGeometry, Path, Shape } from 'three';

/** Arched shopfront shell. Original geometry, not a scanned building. */
export function makeArchGeometry(width: number, height: number, depth = 0.2): ExtrudeGeometry {
  const hw = width / 2;
  const rise = height * 0.28;
  const spring = height - rise;
  const shape = new Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(-hw, spring);
  shape.quadraticCurveTo(0, spring + rise * 1.45, hw, spring);
  shape.lineTo(hw, 0);
  shape.closePath();

  const inset = Math.min(0.28, width * 0.08);
  const hole = new Path();
  const ih = hw - inset;
  const iSpring = spring - inset * 0.35;
  const iRise = rise * 0.72;
  hole.moveTo(-ih, 0.2);
  hole.lineTo(-ih, iSpring);
  hole.quadraticCurveTo(0, iSpring + iRise, ih, iSpring);
  hole.lineTo(ih, 0.2);
  hole.closePath();
  shape.holes.push(hole);

  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.028,
    bevelSegments: 2,
    curveSegments: 18,
  });
  geometry.translate(0, 0, -depth);
  geometry.computeVertexNormals();
  return geometry;
}

export function makeGlassGeometry(width: number, height: number): ExtrudeGeometry {
  const hw = width * 0.42;
  const rise = height * 0.2;
  const spring = height * 0.62;
  const shape = new Shape();
  shape.moveTo(-hw, 0.22);
  shape.lineTo(-hw, spring);
  shape.quadraticCurveTo(0, spring + rise, hw, spring);
  shape.lineTo(hw, 0.22);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.04,
    bevelEnabled: false,
    curveSegments: 16,
  });
  geometry.translate(0, 0, -0.02);
  geometry.computeVertexNormals();
  return geometry;
}
