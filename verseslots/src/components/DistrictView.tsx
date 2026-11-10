import { useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import { MeshStandardMaterial } from 'three';
import type { District } from '../lib/district';
import { getDistrictTextures } from '../lib/textures';
import { makeArchGeometry, makeGlassGeometry } from '../lib/storefrontGeo';

function hashSeedLocal(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function StorefrontMesh({ store, hot, materials }: {
  store: District['storefronts'][number];
  hot: boolean;
  materials: { plaster: MeshStandardMaterial; glass: MeshStandardMaterial; gold: MeshStandardMaterial };
}) {
  const arch = useMemo(() => makeArchGeometry(store.w, store.h), [store.w, store.h]);
  const pane = useMemo(() => makeGlassGeometry(store.w, store.h), [store.w, store.h]);
  useEffect(() => () => {
    arch.dispose();
    pane.dispose();
  }, [arch, pane]);

  return (
    <group position={[store.x, 0, store.z]} rotation={[0, store.rotY, 0]}>
      <mesh geometry={arch} material={hot ? materials.gold : materials.plaster} castShadow receiveShadow />
      <mesh geometry={pane} position={[0, 0, 0.04]} material={materials.glass} />
      <mesh position={[0, store.h * 0.38, -0.42]} receiveShadow>
        <planeGeometry args={[store.w * 0.78, store.h * 0.62]} />
        <meshStandardMaterial color="#1a120e" emissive={store.signColor} emissiveIntensity={hot ? 0.85 : 0.45} roughness={0.8} />
      </mesh>
      <mesh position={[-store.w / 2 + 0.02, store.h * 0.42, 0.02]} castShadow>
        <cylinderGeometry args={[0.065, 0.075, store.h * 0.82, 16]} />
        <meshStandardMaterial color="#1c1814" metalness={0.25} roughness={0.45} />
      </mesh>
      <mesh position={[store.w / 2 - 0.02, store.h * 0.42, 0.02]} castShadow>
        <cylinderGeometry args={[0.065, 0.075, store.h * 0.82, 16]} />
        <meshStandardMaterial color="#1c1814" metalness={0.25} roughness={0.45} />
      </mesh>
      <mesh position={[0, store.h * 0.78, 0.12]} rotation={[0.35, 0, 0]} castShadow>
        <torusGeometry args={[store.w * 0.42, 0.055, 10, 28, Math.PI]} />
        <meshStandardMaterial color={store.playable ? '#d4af37' : '#6a5a3a'} roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.06, 0.08]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[0.05, 0.05, store.w * 0.92, 12]} />
        <meshStandardMaterial color="#d4af37" metalness={0.7} roughness={0.35} />
      </mesh>
      <Text position={[0, store.h + 0.28, 0.05]} fontSize={0.28} color={store.signColor} anchorX="center" maxWidth={store.w + 0.6}>
        {store.name}
      </Text>
    </group>
  );
}

export function DistrictView({ district, hotId }: { district: District; hotId: string | null }) {
  const textures = useMemo(() => getDistrictTextures(hashSeedLocal(district.seed)), [district.seed]);
  const materials = useMemo(() => ({
    plaster: new MeshStandardMaterial({ map: textures.plaster, roughness: 0.88, metalness: 0.04 }),
    gold: new MeshStandardMaterial({ color: '#e0c36a', metalness: 0.72, roughness: 0.3, emissive: '#d4af37', emissiveIntensity: 0.18 }),
    glass: new MeshStandardMaterial({
      color: '#b7c9d4',
      metalness: 0.62,
      roughness: 0.07,
      transparent: true,
      opacity: 0.62,
      emissive: '#c9864a',
      emissiveIntensity: 0.16,
    }),
  }), [textures]);
  useEffect(() => () => {
    materials.plaster.dispose();
    materials.gold.dispose();
    materials.glass.dispose();
  }, [materials]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[56, 56]} />
        <meshStandardMaterial map={textures.park} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[12, 40]} />
        <meshStandardMaterial map={textures.paving} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[40, 12]} />
        <meshStandardMaterial map={textures.paving} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.045, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[5.2, 40]} />
        <meshStandardMaterial color="#4a4338" roughness={0.95} />
      </mesh>
      {district.fountain ? (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.15, 1.28, 0.38, 28]} />
            <meshStandardMaterial color="#2a261f" roughness={0.55} metalness={0.12} />
          </mesh>
          <mesh position={[0, 0.42, 0]} receiveShadow>
            <cylinderGeometry args={[0.92, 0.92, 0.06, 28]} />
            <meshStandardMaterial color="#1d4c58" metalness={0.45} roughness={0.12} />
          </mesh>
          <mesh position={[0, 0.46, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.16, 0.045, 10, 32]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.28} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.4, 0.05, 8, 40]} />
          <meshStandardMaterial color="#d4af37" metalness={0.75} roughness={0.3} />
        </mesh>
      )}
      {[
        [-6.45, -13, 0], [6.45, -13, 0], [-6.45, 13, 0], [6.45, 13, 0],
      ].map(([x, z]) => (
        <mesh key={`hz-${x}-${z}`} position={[x, 0.32, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.26, 11.2, 6, 12]} />
          <meshStandardMaterial color="#1c2a1c" roughness={0.9} />
        </mesh>
      ))}
      {[
        [-13, -6.45], [13, -6.45], [-13, 6.45], [13, 6.45],
      ].map(([x, z]) => (
        <mesh key={`hx-${x}-${z}`} position={[x, 0.32, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.26, 11.2, 6, 12]} />
          <meshStandardMaterial color="#1c2a1c" roughness={0.9} />
        </mesh>
      ))}
      {district.trees.map((tree) => (
        <group key={`${tree.x}:${tree.z}`} position={[tree.x, 0, tree.z]} scale={tree.scale}>
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.14, 1.5, 12]} />
            <meshStandardMaterial color="#4a3428" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.85, 0]} castShadow>
            <sphereGeometry args={[0.78, 24, 16]} />
            <meshStandardMaterial color="#234232" roughness={0.82} />
          </mesh>
          <mesh position={[0.28, 2.05, 0.12]} castShadow>
            <sphereGeometry args={[0.48, 20, 14]} />
            <meshStandardMaterial color="#2c5340" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {district.lamps.map((lamp) => (
        <group key={`${lamp.x}:${lamp.z}`} position={[lamp.x, 0, lamp.z]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.05, 3, 12]} />
            <meshStandardMaterial color="#1a1814" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 3.05, 0]}>
            <sphereGeometry args={[0.11, 16, 12]} />
            <meshStandardMaterial color="#f0d78c" emissive="#d4af37" emissiveIntensity={0.9} />
          </mesh>
        </group>
      ))}
      {district.storefronts.map((store) => (
        <StorefrontMesh key={store.id + store.x + store.z} store={store} hot={store.id === hotId} materials={materials} />
      ))}
      <Text position={[0, 0.08, 3.4]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.38} color="#d4af37" anchorX="center">
        SYNTHETIC DEMO DISTRICT
      </Text>
      <Text position={[0, 0.08, 4.05]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.2} color="#f6edd6" anchorX="center" maxWidth={8}>
        Not a real mall, map, or directions
      </Text>
    </group>
  );
}
