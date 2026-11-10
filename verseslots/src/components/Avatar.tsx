import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import { hairColor, outfitColors, skinColor, type AvatarStyle } from '../lib/avatarStyle';
import { lookInput } from '../lib/lookInput';
import { moveInput } from '../lib/moveInput';

const STATUS = { active: '#3f3', idle: '#fc3', offline: '#777' } as const;

type Sim = { x: number; z: number };

export function Avatar({
  x,
  z,
  style,
  name,
  status,
  sim,
  showLabel = true,
}: {
  x: number;
  z: number;
  style: AvatarStyle;
  name: string;
  status: keyof typeof STATUS;
  sim?: React.MutableRefObject<Sim>;
  showLabel?: boolean;
}) {
  const group = useRef<Group>(null);
  const colors = outfitColors(style);
  const skin = skinColor(style);
  const hair = hairColor(style);

  useFrame((state) => {
    const body = group.current;
    if (!body) return;
    if (sim) {
      const moving = Math.hypot(moveInput.x, moveInput.z) > 0.08;
      body.position.set(sim.current.x, moving ? Math.sin(state.clock.elapsedTime * 8) * 0.025 : 0, sim.current.z);
      body.rotation.y = lookInput.yaw + Math.PI;
    } else {
      body.position.set(x, 0, z);
    }
  });

  return (
    <group ref={group} position={[x, 0, z]}>
      <mesh position={[-0.09, 0.46, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.075, 0.62, 8, 16]} />
        <meshStandardMaterial color={colors.pants} roughness={0.78} metalness={0.02} />
      </mesh>
      <mesh position={[0.09, 0.46, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.075, 0.62, 8, 16]} />
        <meshStandardMaterial color={colors.pants} roughness={0.78} metalness={0.02} />
      </mesh>
      <mesh position={[-0.09, 0.06, 0.02]} castShadow>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshStandardMaterial color={colors.shoes} roughness={0.55} />
      </mesh>
      <mesh position={[0.09, 0.06, 0.02]} castShadow>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshStandardMaterial color={colors.shoes} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.12, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.16, 0.42, 8, 18]} />
        <meshStandardMaterial color={colors.jacket} roughness={0.62} metalness={0.08} />
      </mesh>
      <mesh position={[0, 1.36, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.11, 0.018, 10, 20]} />
        <meshStandardMaterial color={colors.accent} metalness={0.85} roughness={0.28} />
      </mesh>
      <mesh position={[-0.22, 1.28, 0]} castShadow>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshStandardMaterial color={colors.jacket} roughness={0.62} />
      </mesh>
      <mesh position={[0.22, 1.28, 0]} castShadow>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshStandardMaterial color={colors.jacket} roughness={0.62} />
      </mesh>
      <mesh position={[-0.2, 0.98, 0.05]} rotation={[0.25, 0, Math.PI - 0.28]} castShadow>
        <capsuleGeometry args={[0.05, 0.4, 6, 14]} />
        <meshStandardMaterial color={colors.jacket} roughness={0.62} />
      </mesh>
      <mesh position={[0.2, 0.98, 0.05]} rotation={[0.25, 0, -Math.PI + 0.28]} castShadow>
        <capsuleGeometry args={[0.05, 0.4, 6, 14]} />
        <meshStandardMaterial color={colors.jacket} roughness={0.62} />
      </mesh>
      <mesh position={[-0.28, 0.74, 0.12]} castShadow>
        <sphereGeometry args={[0.045, 14, 12]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      <mesh position={[0.28, 0.74, 0.12]} castShadow>
        <sphereGeometry args={[0.045, 14, 12]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.135, 28, 22]} />
        <meshStandardMaterial color={skin} roughness={0.48} />
      </mesh>
      {style.hair !== 'none' && (
        <mesh position={[0, 1.69, style.hair === 'long' ? -0.02 : 0]} scale={[1, style.hair === 'long' ? 0.7 : 0.55, 1]} castShadow>
          <sphereGeometry args={[0.145, 24, 18]} />
          <meshStandardMaterial color={hair} roughness={0.7} />
        </mesh>
      )}
      {style.hair === 'long' && (
        <mesh position={[0, 1.42, -0.1]} castShadow>
          <capsuleGeometry args={[0.07, 0.28, 6, 12]} />
          <meshStandardMaterial color={hair} roughness={0.72} />
        </mesh>
      )}
      <mesh position={[0, 1.82, 0]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <meshBasicMaterial color={STATUS[status]} />
      </mesh>
      {showLabel && name && <Html position={[0, 1.98, 0]} center zIndexRange={[2, 0]} style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#f6edd6', textShadow: '0 1px 2px #000', pointerEvents: 'none' }}>{name}</Html>}
    </group>
  );
}
