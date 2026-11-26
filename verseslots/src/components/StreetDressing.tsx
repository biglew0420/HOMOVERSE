import { useMemo } from 'react';
import { DoubleSide, type MeshStandardMaterial } from 'three';
import type { PlazaMaterials } from '../lib/pbr';
import { ensureUv2 } from '../lib/pbr';
import type { QualitySettings } from '../lib/quality';
import { theme } from '../lib/theme';
import { SmoothBox } from './SmoothBox';

const CAR_COLORS = ['#14120e', '#2c1a24', '#1a1c24', '#3a2416'];

function ParkedCar({
  position,
  rotationY,
  color,
  segments,
  fillet,
}: {
  position: [number, number, number];
  rotationY: number;
  color: string;
  segments: number;
  fillet: number;
}) {
  const wheel = Math.max(8, segments);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <SmoothBox size={[1.85, 0.38, 0.82]} radius={0.14} segments={fillet} position={[0, 0.4, 0]} castShadow receiveShadow color={color} metalness={0.72} roughness={0.28} />
      <SmoothBox size={[0.92, 0.34, 0.74]} radius={0.12} segments={fillet} position={[-0.06, 0.72, 0]} castShadow color="#100e12" metalness={0.35} roughness={0.18} />
      <mesh position={[0.72, 0.42, 0.42]}>
        <sphereGeometry args={[0.06, 10, 8]} />
        <meshStandardMaterial color="#f4e2b0" emissive={theme.gold} emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[0.72, 0.42, -0.42]}>
        <sphereGeometry args={[0.06, 10, 8]} />
        <meshStandardMaterial color="#f4e2b0" emissive={theme.gold} emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[-0.84, 0.4, 0.3]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshStandardMaterial color="#6a1c1c" emissive="#ff3a3a" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[-0.84, 0.4, -0.3]}>
        <sphereGeometry args={[0.045, 8, 6]} />
        <meshStandardMaterial color="#6a1c1c" emissive="#ff3a3a" emissiveIntensity={0.4} />
      </mesh>
      {[[-0.55, 0.38], [-0.55, -0.38], [0.55, 0.38], [0.55, -0.38]].map(([x, z]) => (
        <group key={`${x}:${z}`} position={[x, 0.2, z]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, 0.14, wheel]} />
            <meshStandardMaterial color="#12110f" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.15, Math.max(6, wheel - 4)]} />
            <meshStandardMaterial color={theme.goldTrim} metalness={0.8} roughness={0.28} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function StreetDressing({ mats, quality }: { mats: PlazaMaterials; quality: QualitySettings }) {
  const fillet = quality.id === 'high' ? 3 : quality.id === 'medium' ? 2 : 1;
  const segs = quality.circleSegments;
  const cars = useMemo(() => CAR_COLORS.map((color, index) => {
    const slot = index * 2 + 0.5;
    const angle = (slot / 8) * Math.PI * 2;
    const radius = 12.55;
    return {
      color,
      position: [Math.sin(angle) * radius, 0, -Math.cos(angle) * radius] as [number, number, number],
      rotationY: -angle,
    };
  }), []);
  return (
    <group>
      <mesh position={[0, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.stone} receiveShadow>
        <ringGeometry args={[8.15, 10.85, segs]} onUpdate={(g) => ensureUv2(g)} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[8.12, 0.055, 8, segs]} />
        <meshStandardMaterial color="#1a1814" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[8.12, 0.012, 6, segs]} />
        <meshStandardMaterial color={theme.gold} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[10.95, 0.05, 6, segs]} />
        <meshStandardMaterial color={theme.ink} metalness={0.25} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[14.2, 18.4, segs]} />
        <meshStandardMaterial color="#2a2620" roughness={0.96} metalness={0.02} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[14.25, 0.045, 6, Math.max(24, Math.round(segs / 1.2))]} />
        <meshStandardMaterial color="#1c1a16" roughness={0.7} />
      </mesh>
      {cars.map((car) => (
        <ParkedCar
          key={car.color}
          position={car.position}
          rotationY={car.rotationY}
          color={car.color}
          segments={quality.treeSegments}
          fillet={fillet}
        />
      ))}
    </group>
  );
}
