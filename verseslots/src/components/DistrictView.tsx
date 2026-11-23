import { useEffect, useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Color, MeshStandardMaterial, type Group, type Mesh, type PointLight } from 'three';
import type { District, Storefront } from '../lib/district';
import { BENCH, FOUNTAIN_RADIUS, hashString } from '../lib/district';
import { getDistrictTextures } from '../lib/textures';
import { theme } from '../lib/theme';
import { GOLDEN_HOUR_ID } from '../lib/shops';
import { NpcFigures } from './Npc';
import type { HomovRankId } from '../lib/homov';

function hashSeed(seed: string): number {
  return hashString(seed);
}

function StorefrontMesh({
  store,
  hot,
  mats,
}: {
  store: Storefront;
  hot: boolean;
  mats: Record<'brick' | 'stone' | 'stucco' | 'gold' | 'glass' | 'wood', MeshStandardMaterial>;
}) {
  const body = mats[store.material];
  const windowColor = hot ? theme.icyPink : theme.blush;
  return (
    <group position={[store.x, 0, store.z]} rotation={[0, store.rotY, 0]}>
      <mesh position={[0, store.h / 2, -store.d / 2]} material={body} castShadow receiveShadow>
        <boxGeometry args={[store.w, store.h, store.d]} />
      </mesh>
      {/* Cornice */}
      <mesh position={[0, store.h + 0.08, 0.08]} castShadow>
        <boxGeometry args={[store.w + 0.25, 0.16, 0.5]} />
        <meshStandardMaterial color={theme.gold} metalness={0.7} roughness={0.32} />
      </mesh>
      {/* Awning */}
      <mesh position={[0, store.h * 0.62, 0.62]} rotation={[-0.28, 0, 0]} castShadow>
        <boxGeometry args={[store.w * 0.92, 0.06, 1.15]} />
        <meshStandardMaterial color={store.awningColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, store.h * 0.62 - 0.18, 1.05]} castShadow>
        <boxGeometry args={[store.w * 0.92, 0.22, 0.06]} />
        <meshStandardMaterial color={store.awningColor} roughness={0.65} />
      </mesh>
      {/* Window */}
      <mesh position={[-store.w * 0.18, store.h * 0.42, 0.08]} material={mats.glass} castShadow>
        <boxGeometry args={[store.w * 0.42, store.h * 0.42, 0.08]} />
      </mesh>
      <mesh position={[-store.w * 0.18, store.h * 0.42, -0.2]}>
        <planeGeometry args={[store.w * 0.38, store.h * 0.38]} />
        <meshStandardMaterial color="#1a120e" emissive={windowColor} emissiveIntensity={hot ? 0.7 : 0.4} />
      </mesh>
      {/* Door frame */}
      <mesh position={[store.w * 0.28, 1.15, 0.1]} castShadow>
        <boxGeometry args={[0.9, 2.3, 0.12]} />
        <meshStandardMaterial color={theme.ink} metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[store.w * 0.28, 1.15, 0.16]}>
        <boxGeometry args={[0.7, 2.05, 0.06]} />
        <meshStandardMaterial color="#1c140f" metalness={0.15} roughness={0.4} emissive={theme.gold} emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[store.w * 0.18, 1.2, 0.22]}>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshStandardMaterial color={theme.gold} metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Sign band */}
      <mesh position={[0, store.h * 0.86, 0.18]} castShadow>
        <boxGeometry args={[store.w * 0.86, 0.42, 0.1]} />
        <meshStandardMaterial color={theme.black} metalness={0.2} roughness={0.4} />
      </mesh>
      <Text position={[0, store.h * 0.86, 0.26]} fontSize={0.22} color={store.signColor} anchorX="center" maxWidth={store.w * 0.8}>
        {store.name}
      </Text>
      {store.id === GOLDEN_HOUR_ID && (
        <Text position={[0, store.h * 0.74, 0.26]} fontSize={0.14} color={theme.ivory} anchorX="center">
          DEMO SLOT · GOLDEN HOUR
        </Text>
      )}
    </group>
  );
}

function Fountain() {
  const water = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (water.current) {
      water.current.rotation.y = t * 0.35;
      water.current.position.y = 0.55 + Math.sin(t * 1.6) * 0.04;
    }
    if (light.current) {
      light.current.intensity = 1.1 + Math.sin(t * 2.2) * 0.25;
    }
  });
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[FOUNTAIN_RADIUS, FOUNTAIN_RADIUS + 0.18, 0.44, 40]} />
        <meshStandardMaterial color={theme.marble} roughness={0.28} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.46, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[FOUNTAIN_RADIUS, 0.06, 12, 40]} />
        <meshStandardMaterial color={theme.gold} metalness={0.82} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.18, 1.15, 0.08]} />
        <meshStandardMaterial color={theme.gold} metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[0.16, 0.62, 0]} castShadow>
        <boxGeometry args={[0.18, 1.15, 0.08]} />
        <meshStandardMaterial color={theme.gold} metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[0.08, 0.62, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <boxGeometry args={[0.18, 0.42, 0.08]} />
        <meshStandardMaterial color={theme.gold} metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[0.08, 0.62, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <boxGeometry args={[0.16, 0.16, 0.06]} />
        <meshStandardMaterial color={theme.ivory} metalness={0.5} roughness={0.3} />
      </mesh>
      <group ref={water}>
        {[0.55, 0.75, 0.95].map((r, i) => (
          <mesh key={r} position={[0, 0.08 * i, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.05, 8, 28]} />
            <meshStandardMaterial color="#8ad4e0" transparent opacity={0.35} roughness={0.08} metalness={0.2} />
          </mesh>
        ))}
      </group>
      <pointLight ref={light} position={[0, 1.4, 0]} color={theme.gold} intensity={1.2} distance={8} />
      <pointLight position={[0, 1.1, 0]} color={theme.coolRose} intensity={0.35} distance={6} />
      <Text position={[0, 1.45, 0]} fontSize={0.16} color={theme.gold} anchorX="center">
        H
      </Text>
    </group>
  );
}

function Lamps({ spots }: { spots: District['lamps'] }) {
  const bulbs = useRef<Mesh[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    bulbs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as MeshStandardMaterial;
      mat.emissiveIntensity = 0.85 + Math.sin(t * 7 + i * 1.7) * 0.12 + Math.sin(t * 13 + i) * 0.05;
    });
  });
  return (
    <>
      {spots.map((lamp, i) => (
        <group key={`${lamp.x}:${lamp.z}`} position={[lamp.x, 0, lamp.z]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.05, 3, 12]} />
            <meshStandardMaterial color={theme.ink} metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh
            position={[0, 3.05, 0]}
            ref={(node) => { if (node) bulbs.current[i] = node; }}
          >
            <sphereGeometry args={[0.11, 16, 12]} />
            <meshStandardMaterial color="#f0d78c" emissive={theme.gold} emissiveIntensity={0.9} />
          </mesh>
          <mesh position={[0, 3.08, 0]}>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshStandardMaterial color={theme.coolRose} transparent opacity={0.12} emissive={theme.blush} emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Dust() {
  const pts = useMemo(() => {
    const count = 90;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const gold = new Color(theme.gold);
    const pink = new Color(theme.icyPink);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 8.2;
      positions[i * 3] = Math.sin(a) * r;
      positions[i * 3 + 1] = 0.3 + Math.random() * 3.4;
      positions[i * 3 + 2] = Math.cos(a) * r;
      const c = gold.clone().lerp(pink, Math.random());
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors, count };
  }, []);
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = Math.sin(clock.elapsedTime * 0.25) * 0.15;
  });
  return (
    <group ref={ref}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pts.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[pts.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} vertexColors transparent opacity={0.7} depthWrite={false} />
      </points>
    </group>
  );
}

function SkyParallax() {
  const group = useRef<Group>(null);
  useFrame(({ clock, camera }) => {
    if (!group.current) return;
    group.current.position.x = camera.position.x * 0.04;
    group.current.position.z = camera.position.z * 0.04;
    group.current.rotation.y = clock.elapsedTime * 0.01;
  });
  return (
    <group ref={group}>
      <mesh position={[0, 18, -16]}>
        <sphereGeometry args={[2.2, 20, 16]} />
        <meshBasicMaterial color="#f4efe2" />
      </mesh>
      <mesh position={[-10, 14, -20]} rotation={[0.2, 0.4, 0]}>
        <sphereGeometry args={[3.5, 16, 12]} />
        <meshBasicMaterial color={theme.mauve} transparent opacity={0.18} />
      </mesh>
      <mesh position={[12, 13, -18]} rotation={[0.1, -0.3, 0]}>
        <sphereGeometry args={[2.8, 16, 12]} />
        <meshBasicMaterial color={theme.blush} transparent opacity={0.14} />
      </mesh>
    </group>
  );
}

export function DistrictView({
  district,
  hotId,
  player,
  rank,
}: {
  district: District;
  hotId: string | null;
  player: { x: number; z: number };
  rank: HomovRankId;
}) {
  const textures = useMemo(() => getDistrictTextures(hashSeed(district.seed)), [district.seed]);
  const mats = useMemo(() => ({
    brick: new MeshStandardMaterial({ map: textures.brick, roughness: 0.9, metalness: 0.04 }),
    stone: new MeshStandardMaterial({ map: textures.stone, roughness: 0.82, metalness: 0.08 }),
    stucco: new MeshStandardMaterial({ map: textures.stucco, roughness: 0.88, metalness: 0.03 }),
    gold: new MeshStandardMaterial({ color: theme.gold, metalness: 0.72, roughness: 0.3, emissive: theme.goldTrim, emissiveIntensity: 0.12 }),
    glass: new MeshStandardMaterial({
      color: '#c8b0b8',
      metalness: 0.55,
      roughness: 0.08,
      transparent: true,
      opacity: 0.45,
      emissive: theme.icyPink,
      emissiveIntensity: 0.2,
    }),
    wood: new MeshStandardMaterial({ map: textures.wood, roughness: 0.8 }),
  }), [textures]);
  useEffect(() => () => {
    Object.values(mats).forEach((m) => m.dispose());
  }, [mats]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[22, 64]} />
        <meshStandardMaterial map={textures.park} roughness={1} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[9.2, 64]} />
        <meshStandardMaterial map={textures.paving} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[7.6, 8.9, 64]} />
        <meshStandardMaterial color={theme.gold} transparent opacity={0.12} />
      </mesh>
      <Fountain />
      <Lamps spots={district.lamps} />
      {district.trees.map((tree) => (
        <group key={`${tree.x}:${tree.z}`} position={[tree.x, 0, tree.z]} scale={tree.scale}>
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.14, 1.5, 12]} />
            <meshStandardMaterial color="#4a3428" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.85, 0]} castShadow>
            <sphereGeometry args={[0.78, 20, 14]} />
            <meshStandardMaterial color="#234232" roughness={0.82} />
          </mesh>
        </group>
      ))}
      <group position={[BENCH.x, 0, BENCH.z]} rotation={[0, BENCH.rotY, 0]}>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.08, 0.48]} />
          <meshStandardMaterial color={theme.ink} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.7, -0.2]} castShadow>
          <boxGeometry args={[1.6, 0.4, 0.08]} />
          <meshStandardMaterial color={theme.ink} roughness={0.5} />
        </mesh>
        <mesh position={[-0.7, 0.22, 0]} castShadow>
          <boxGeometry args={[0.08, 0.44, 0.48]} />
          <meshStandardMaterial color={theme.gold} metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0.7, 0.22, 0]} castShadow>
          <boxGeometry args={[0.08, 0.44, 0.48]} />
          <meshStandardMaterial color={theme.gold} metalness={0.6} roughness={0.35} />
        </mesh>
      </group>
      {district.storefronts.map((store) => (
        <StorefrontMesh key={store.id} store={store} hot={store.id === hotId} mats={mats} />
      ))}
      <Dust />
      <SkyParallax />
      <NpcFigures district={district} player={player} rank={rank} />
      <Text position={[0, 0.08, 2.4]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.28} color={theme.gold} anchorX="center">
        HOUSE OF HOMO
      </Text>
      <Text position={[0, 0.08, 2.9]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.14} color={theme.ivory} anchorX="center" maxWidth={8}>
        Not a real mall, map, or directions
      </Text>
    </group>
  );
}
