import type { ReactNode } from 'react';
import type { MeshStandardMaterial } from 'three';
import { roundedBoxGeometry } from '../lib/smoothGeo';

type Props = {
  size: [number, number, number];
  radius?: number;
  segments?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  material?: MeshStandardMaterial;
  color?: string;
  metalness?: number;
  roughness?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
  children?: ReactNode;
};

/** Shared beveled box. Same arguments reuse one geometry. */
export function SmoothBox({
  size,
  radius = 0.08,
  segments = 2,
  children,
  color,
  metalness,
  roughness,
  material,
  ...rest
}: Props) {
  const geometry = roundedBoxGeometry(size[0], size[1], size[2], radius, segments);
  return (
    <mesh geometry={geometry} material={material} {...rest}>
      {!material && (children ?? <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />)}
      {material && children}
    </mesh>
  );
}
