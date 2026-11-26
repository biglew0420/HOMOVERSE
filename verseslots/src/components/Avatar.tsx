import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { DoubleSide, type Group } from 'three';
import { hairColor, outfitColors, skinColor, type AvatarStyle } from '../lib/avatarStyle';
import { lookInput } from '../lib/lookInput';
import { Collar, GoldHPin, Head } from './CharacterBits';
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
  memberBadge = false,
  tagColor,
}: {
  x: number;
  z: number;
  style: AvatarStyle;
  name: string;
  status: keyof typeof STATUS;
  sim?: React.MutableRefObject<Sim>;
  showLabel?: boolean;
  memberBadge?: boolean;
  tagColor?: string;
}) {
  const group = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const colors = outfitColors(style);
  const skin = skinColor(style);
  const hair = hairColor(style);
  const armor = Boolean(colors.armor);
  const metal = armor ? 0.9 : 0.08;
  const rough = armor ? 0.25 : 0.62;

  useFrame((state) => {
    const body = group.current;
    if (!body) return;
    if (sim) {
      const moving = Math.hypot(moveInput.x, moveInput.z) > 0.08;
      const breathe = Math.sin(state.clock.elapsedTime * 1.7) * 0.015;
      const swing = moving ? Math.sin(state.clock.elapsedTime * 8) : 0;
      body.position.set(sim.current.x, moving ? Math.abs(Math.sin(state.clock.elapsedTime * 8)) * 0.03 : breathe, sim.current.z);
      body.rotation.y = lookInput.yaw + Math.PI;
      if (legL.current) legL.current.rotation.x = swing * 0.7;
      if (legR.current) legR.current.rotation.x = -swing * 0.7;
      if (armL.current) armL.current.rotation.x = -swing * 0.55;
      if (armR.current) armR.current.rotation.x = swing * 0.55;
    } else {
      body.position.set(x, 0, z);
    }
  });

  return (
    <group ref={group} position={[x, 0, z]}>
      <group ref={legL} position={[-0.09, 0.82, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.072, 0.5, 6, 12]} />
          <meshStandardMaterial color={colors.pants} roughness={armor ? 0.3 : 0.78} metalness={armor ? 0.85 : 0.02} />
        </mesh>
        <mesh position={[0, -0.72, 0.04]} castShadow>
          <capsuleGeometry args={[0.045, 0.12, 4, 8]} />
          <meshStandardMaterial color={colors.shoes} roughness={armor ? 0.3 : 0.55} metalness={armor ? 0.85 : 0} />
        </mesh>
      </group>
      <group ref={legR} position={[0.09, 0.82, 0]}>
        <mesh position={[0, -0.34, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.072, 0.5, 6, 12]} />
          <meshStandardMaterial color={colors.pants} roughness={armor ? 0.3 : 0.78} metalness={armor ? 0.85 : 0.02} />
        </mesh>
        <mesh position={[0, -0.72, 0.04]} castShadow>
          <capsuleGeometry args={[0.045, 0.12, 4, 8]} />
          <meshStandardMaterial color={colors.shoes} roughness={armor ? 0.3 : 0.55} metalness={armor ? 0.85 : 0} />
        </mesh>
      </group>
      <mesh position={[0, 1.12, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.16, 0.42, 8, 18]} />
        <meshStandardMaterial color={colors.jacket} roughness={rough} metalness={metal} />
      </mesh>
      <Collar color={colors.jacket} y={1.34} />
      <mesh position={[0, 1.36, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.11, 0.018, 10, 20]} />
        <meshStandardMaterial color={colors.accent} metalness={0.85} roughness={0.28} />
      </mesh>
      <mesh position={[-0.22, 1.28, 0]} castShadow>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshStandardMaterial color={colors.jacket} roughness={rough} metalness={metal} />
      </mesh>
      <mesh position={[0.22, 1.28, 0]} castShadow>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshStandardMaterial color={colors.jacket} roughness={rough} metalness={metal} />
      </mesh>
      <group ref={armL} position={[-0.2, 1.28, 0]}>
        <mesh position={[0, -0.22, 0.04]} rotation={[0.2, 0, 0.15]} castShadow>
          <capsuleGeometry args={[0.05, 0.34, 6, 12]} />
          <meshStandardMaterial color={colors.jacket} roughness={rough} metalness={metal} />
        </mesh>
        <mesh position={[0.02, -0.46, 0.1]} castShadow>
          <sphereGeometry args={[0.045, 12, 10]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
      </group>
      <group ref={armR} position={[0.2, 1.28, 0]}>
        <mesh position={[0, -0.22, 0.04]} rotation={[0.2, 0, -0.15]} castShadow>
          <capsuleGeometry args={[0.05, 0.34, 6, 12]} />
          <meshStandardMaterial color={colors.jacket} roughness={rough} metalness={metal} />
        </mesh>
        <mesh position={[-0.02, -0.46, 0.1]} castShadow>
          <sphereGeometry args={[0.045, 12, 10]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
      </group>
      <mesh position={[0, 1.12, -0.155]}>
        <capsuleGeometry args={[0.012, 0.34, 3, 6]} />
        <meshStandardMaterial color={colors.accent} metalness={0.82} roughness={0.28} />
      </mesh>
      <Head skin={skin} y={1.6} />
      {!armor && style.hair !== 'none' && (
        <group>
          <mesh position={[0, 1.64, -0.03]} scale={[1.08, 0.86, 1.12]} castShadow>
            <sphereGeometry args={[0.15, 22, 16]} />
            <meshStandardMaterial color={hair} roughness={0.68} />
          </mesh>
          <mesh position={[0, 1.5, -0.08]} scale={[0.85, 0.55, 0.7]} castShadow>
            <sphereGeometry args={[0.12, 14, 12]} />
            <meshStandardMaterial color={hair} roughness={0.7} />
          </mesh>
          {style.hair === 'short' && (
            <mesh position={[0, 1.62, 0.08]} scale={[0.95, 0.32, 0.55]} castShadow>
              <sphereGeometry args={[0.12, 12, 10]} />
              <meshStandardMaterial color={hair} roughness={0.68} />
            </mesh>
          )}
        </group>
      )}
      {!armor && style.hair === 'long' && (
        <mesh position={[0, 1.42, -0.1]} castShadow>
          <capsuleGeometry args={[0.07, 0.28, 6, 12]} />
          <meshStandardMaterial color={hair} roughness={0.72} />
        </mesh>
      )}
      {armor && (
        <group>
          {/* helmet: open-face steel dome with gold crest, face stays visible */}
          <mesh position={[0, 1.66, -0.01]} scale={[1, 0.85, 1]} castShadow>
            <sphereGeometry args={[0.152, 28, 20, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <meshStandardMaterial color={colors.jacket} metalness={0.92} roughness={0.22} />
          </mesh>
          <mesh position={[0, 1.79, -0.01]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <boxGeometry args={[0.26, 0.05, 0.025]} />
            <meshStandardMaterial color={colors.accent} metalness={0.9} roughness={0.25} />
          </mesh>
          {/* gold chest cross */}
          <mesh position={[0, 1.16, 0.165]}>
            <boxGeometry args={[0.035, 0.2, 0.012]} />
            <meshStandardMaterial color={colors.accent} metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0, 1.2, 0.165]}>
            <boxGeometry args={[0.13, 0.035, 0.012]} />
            <meshStandardMaterial color={colors.accent} metalness={0.9} roughness={0.25} />
          </mesh>
          {/* pauldrons */}
          <mesh position={[-0.23, 1.3, 0]} scale={[1.15, 0.7, 1.1]} castShadow>
            <sphereGeometry args={[0.1, 18, 12]} />
            <meshStandardMaterial color={colors.jacket} metalness={0.92} roughness={0.22} />
          </mesh>
          <mesh position={[0.23, 1.3, 0]} scale={[1.15, 0.7, 1.1]} castShadow>
            <sphereGeometry args={[0.1, 18, 12]} />
            <meshStandardMaterial color={colors.jacket} metalness={0.92} roughness={0.22} />
          </mesh>
          {/* gold belt */}
          <mesh position={[0, 0.86, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.165, 0.018, 10, 28]} />
            <meshStandardMaterial color={colors.accent} metalness={0.9} roughness={0.25} />
          </mesh>
          {/* black cape */}
          <mesh position={[0, 1.05, -0.16]} rotation={[0.15, Math.PI, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.28, 0.78, 14, 1, true, Math.PI * 0.15, Math.PI * 0.75]} />
            <meshStandardMaterial color={colors.cape ?? '#0e0d0c'} roughness={0.85} side={DoubleSide} />
          </mesh>
        </group>
      )}
      {memberBadge && <GoldHPin position={[0.18, 1.42, 0.17]} />}
      <mesh position={[0, 1.82, 0]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <meshBasicMaterial color={tagColor ?? STATUS[status]} />
      </mesh>
      {showLabel && name && <Html position={[0, 1.98, 0]} center zIndexRange={[2, 0]} style={{ fontSize: 11, whiteSpace: 'nowrap', color: '#f6edd6', textShadow: '0 1px 2px #000', pointerEvents: 'none' }}>{name}</Html>}
    </group>
  );
}
