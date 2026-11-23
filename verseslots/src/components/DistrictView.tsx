import { useEffect, useMemo, useRef, useState } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Color, type Group, type Mesh, type MeshStandardMaterial, type PointLight } from 'three';
import type { District } from '../lib/district';
import { BENCH, FOUNTAIN_RADIUS, hashString } from '../lib/district';
import { disposePlazaMaterials, ensureUv2, loadPlazaMaterials, proceduralPlazaMaterials, type PlazaMaterials } from '../lib/pbr';
import { theme } from '../lib/theme';
import { NpcFigures } from './Npc';
import { StorefrontMesh } from './Storefront';
import type { HomovRankId } from '../lib/homov';
import type { QualitySettings } from '../lib/quality';

function hashSeed(seed: string): number {
  return hashString(seed);
}

function usePlazaMaterials(seed: number, anisotropy: number): PlazaMaterials {
  const [mats, setMats] = useState(() => proceduralPlazaMaterials(seed));
  useEffect(() => {
    let cancelled = false;
    const fallback = proceduralPlazaMaterials(seed);
    setMats(fallback);
    void loadPlazaMaterials(seed, anisotropy).then((next) => {
      if (cancelled) {
        disposePlazaMaterials(next);
        return;
      }
      setMats(next);
      if (next !== fallback) disposePlazaMaterials(fallback);
    });
    return () => {
      cancelled = true;
    };
  }, [seed, anisotropy]);
  return mats;
}

function Fountain({ mats, quality }: { mats: PlazaMaterials; quality: QualitySettings }) {
  const water = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (water.current) {
      water.current.rotation.y = t * 0.45;
      water.current.position.y = 0.58 + Math.sin(t * 1.8) * 0.035;
    }
    if (light.current) {
      light.current.intensity = 1.15 + Math.sin(t * 2.2) * 0.28;
    }
  });
  const segs = quality.circleSegments;
  return (
    <group>
      <mesh position={[0, 0.16, 0]} material={mats.marble} castShadow receiveShadow>
        <cylinderGeometry args={[FOUNTAIN_RADIUS + 0.35, FOUNTAIN_RADIUS + 0.5, 0.32, segs]} onUpdate={(g) => ensureUv2(g)} />
      </mesh>
      <mesh position={[0, 0.38, 0]} material={mats.marble} castShadow receiveShadow>
        <cylinderGeometry args={[FOUNTAIN_RADIUS, FOUNTAIN_RADIUS + 0.12, 0.36, segs]} onUpdate={(g) => ensureUv2(g)} />
      </mesh>
      <mesh position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[FOUNTAIN_RADIUS, 0.055, 10, segs]} />
        <meshStandardMaterial color={theme.gold} metalness={0.86} roughness={0.22} envMapIntensity={1.1} />
      </mesh>
      <mesh position={[0, 0.78, 0]} material={mats.marble} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.5, 0.28, 24]} onUpdate={(g) => ensureUv2(g)} />
      </mesh>
      {/* Gold H monogram, stacked from bars */}
      <mesh position={[-0.07, 1.15, 0]} castShadow>
        <boxGeometry args={[0.16, 1.05, 0.08]} />
        <meshStandardMaterial color={theme.gold} metalness={0.88} roughness={0.22} />
      </mesh>
      <mesh position={[0.15, 1.15, 0]} castShadow>
        <boxGeometry args={[0.16, 1.05, 0.08]} />
        <meshStandardMaterial color={theme.gold} metalness={0.88} roughness={0.22} />
      </mesh>
      <mesh position={[0.04, 1.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <boxGeometry args={[0.16, 0.38, 0.08]} />
        <meshStandardMaterial color={theme.gold} metalness={0.88} roughness={0.22} />
      </mesh>
      <group ref={water}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.85, segs]} />
          <meshStandardMaterial color="#7ecfe0" transparent opacity={0.55} roughness={0.08} metalness={0.25} envMapIntensity={1.2} />
        </mesh>
        {[0.5, 0.7, 0.9].map((r, i) => (
          <mesh key={r} position={[0, 0.06 * i, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.045, 8, 28]} />
            <meshStandardMaterial color="#8ad4e0" transparent opacity={0.32} roughness={0.08} metalness={0.2} />
          </mesh>
        ))}
      </group>
      <pointLight ref={light} position={[0, 1.45, 0]} color={theme.gold} intensity={1.2} distance={8} />
      <pointLight position={[0, 1.15, 0]} color={theme.coolRose} intensity={0.4} distance={6} />
      <Text position={[0, 1.78, 0]} fontSize={0.15} color={theme.gold} anchorX="center">
        H
      </Text>
    </group>
  );
}

function Lamps({ spots, quality, player }: { spots: District['lamps']; quality: QualitySettings; player: { x: number; z: number } }) {
  const bulbs = useRef<Mesh[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    bulbs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as MeshStandardMaterial;
      mat.emissiveIntensity = 0.85 + Math.sin(t * 7 + i * 1.7) * 0.12 + Math.sin(t * 13 + i) * 0.05;
    });
  });
  const lit = useMemo(() => {
    const ranked = [...spots].sort((a, b) => (
      Math.hypot(player.x - a.x, player.z - a.z) - Math.hypot(player.x - b.x, player.z - b.z)
    ));
    return new Set(ranked.slice(0, quality.lampLights).map((lamp) => `${lamp.x}:${lamp.z}`));
  }, [spots, player.x, player.z, quality.lampLights]);
  return (
    <>
      {spots.map((lamp, i) => (
        <group key={`${lamp.x}:${lamp.z}`} position={[lamp.x, 0, lamp.z]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.05, 3, quality.treeSegments]} />
            <meshStandardMaterial color={theme.ink} metalness={0.65} roughness={0.32} />
          </mesh>
          <mesh position={[0, 3.12, 0]} rotation={[Math.PI, 0, 0]} castShadow>
            <coneGeometry args={[0.22, 0.16, 12]} />
            <meshStandardMaterial color={theme.gold} metalness={0.8} roughness={0.28} />
          </mesh>
          <mesh
            position={[0, 3.0, 0]}
            ref={(node) => { if (node) bulbs.current[i] = node; }}
          >
            <sphereGeometry args={[0.11, 16, 12]} />
            <meshStandardMaterial color="#f0d78c" emissive={theme.gold} emissiveIntensity={0.9} />
          </mesh>
          <mesh position={[0, 3.02, 0]}>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshStandardMaterial color={theme.coolRose} transparent opacity={0.12} emissive={theme.blush} emissiveIntensity={0.3} />
          </mesh>
          {lit.has(`${lamp.x}:${lamp.z}`) && (
            <pointLight position={[0, 2.9, 0]} color="#ffd9a0" intensity={0.65} distance={6.5} />
          )}
        </group>
      ))}
    </>
  );
}

function Dust({ on }: { on: boolean }) {
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
  if (!on) return null;
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

function SkyParallax({ on }: { on: boolean }) {
  const group = useRef<Group>(null);
  useFrame(({ clock, camera }) => {
    if (!group.current) return;
    group.current.position.x = camera.position.x * 0.04;
    group.current.position.z = camera.position.z * 0.04;
    group.current.rotation.y = clock.elapsedTime * 0.01;
  });
  if (!on) return null;
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
  quality,
}: {
  district: District;
  hotId: string | null;
  player: { x: number; z: number };
  rank: HomovRankId;
  quality: QualitySettings;
}) {
  const mats = usePlazaMaterials(hashSeed(district.seed), quality.anisotropy);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} material={mats.park} receiveShadow>
        <circleGeometry args={[22, quality.circleSegments]} onUpdate={(g) => ensureUv2(g)} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} material={mats.paving} receiveShadow>
        <circleGeometry args={[9.2, quality.circleSegments]} onUpdate={(g) => ensureUv2(g)} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[7.6, 8.9, quality.circleSegments]} />
        <meshStandardMaterial color={theme.gold} transparent opacity={0.12} />
      </mesh>
      <Fountain mats={mats} quality={quality} />
      <Lamps spots={district.lamps} quality={quality} player={player} />
      {district.trees.map((tree) => (
        <group key={`${tree.x}:${tree.z}`} position={[tree.x, 0, tree.z]} scale={tree.scale}>
          <mesh position={[0, 0.85, 0]} material={mats.wood} castShadow>
            <cylinderGeometry args={[0.09, 0.14, 1.5, quality.treeSegments]} onUpdate={(g) => ensureUv2(g)} />
          </mesh>
          <mesh position={[0, 1.85, 0]} castShadow>
            <sphereGeometry args={[0.72, quality.treeSegments, Math.max(8, quality.treeSegments - 2)]} />
            <meshStandardMaterial color="#234232" roughness={0.82} />
          </mesh>
          <mesh position={[0.28, 1.7, 0.1]} castShadow>
            <sphereGeometry args={[0.4, quality.treeSegments, 8]} />
            <meshStandardMaterial color="#2b5540" roughness={0.82} />
          </mesh>
        </group>
      ))}
      <group position={[BENCH.x, 0, BENCH.z]} rotation={[0, BENCH.rotY, 0]}>
        <mesh position={[0, 0.42, 0]} material={mats.wood} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.08, 0.48]} onUpdate={(g) => ensureUv2(g)} />
        </mesh>
        <mesh position={[0, 0.7, -0.2]} material={mats.wood} castShadow>
          <boxGeometry args={[1.6, 0.4, 0.08]} onUpdate={(g) => ensureUv2(g)} />
        </mesh>
        <mesh position={[-0.7, 0.22, 0]} castShadow>
          <boxGeometry args={[0.08, 0.44, 0.48]} />
          <meshStandardMaterial color={theme.gold} metalness={0.7} roughness={0.32} />
        </mesh>
        <mesh position={[0.7, 0.22, 0]} castShadow>
          <boxGeometry args={[0.08, 0.44, 0.48]} />
          <meshStandardMaterial color={theme.gold} metalness={0.7} roughness={0.32} />
        </mesh>
      </group>
      {district.storefronts.map((store) => (
        <StorefrontMesh key={store.id} store={store} hot={store.id === hotId} mats={mats} quality={quality} player={player} />
      ))}
      {district.storefronts.filter((store) => store.id === 'members').map((store) => {
        const dx = store.interactX - store.x;
        const dz = store.interactZ - store.z;
        const len = Math.hypot(dx, dz) || 1;
        const x = store.interactX + (dx / len) * 0.9;
        const z = store.interactZ + (dz / len) * 0.9;
        return (
          <group key="homo-bingo-sign" position={[x, 0, z]} rotation={[0, store.rotY, 0]}>
            <mesh position={[0, 0.85, 0]} castShadow>
              <boxGeometry args={[0.06, 1.7, 0.06]} />
              <meshStandardMaterial color={theme.ink} metalness={0.4} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.72, 0.04]} castShadow>
              <boxGeometry args={[1.7, 0.55, 0.06]} />
              <meshStandardMaterial color={theme.black} />
            </mesh>
            <Text position={[0, 1.8, 0.08]} fontSize={0.16} color={theme.gold} anchorX="center">
              HOMO BINGO
            </Text>
            <Text position={[0, 1.58, 0.08]} fontSize={0.1} color={theme.blush} anchorX="center">
              Members' Lounge this way
            </Text>
          </group>
        );
      })}
      <Dust on={quality.dust} />
      <SkyParallax on={!quality.env} />
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
