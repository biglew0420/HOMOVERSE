import { useMemo, type ReactNode } from 'react';
import { Text } from '@react-three/drei';
import type { MeshStandardMaterial } from 'three';
import type { Storefront } from '../lib/district';
import { GOLDEN_HOUR_ID } from '../lib/shops';
import { makeArchGeometry } from '../lib/storefrontGeo';
import { ensureUv2, type PlazaMaterials } from '../lib/pbr';
import { lodLevel, type QualitySettings } from '../lib/quality';
import { theme } from '../lib/theme';

function UvBox({
  args,
  children,
  ...rest
}: {
  args: [number, number, number];
  children?: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
  material?: MeshStandardMaterial;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  return (
    <mesh {...rest}>
      <boxGeometry args={args} onUpdate={(g) => ensureUv2(g)} />
      {children}
    </mesh>
  );
}

export function StorefrontMesh({
  store,
  hot,
  mats,
  quality,
  player,
}: {
  store: Storefront;
  hot: boolean;
  mats: PlazaMaterials;
  quality: QualitySettings;
  player: { x: number; z: number };
}) {
  const dist = Math.hypot(player.x - store.x, player.z - store.z);
  const lod = lodLevel(dist, quality);
  const body = mats[store.material] as MeshStandardMaterial;
  const windowColor = hot ? theme.icyPink : theme.blush;
  const useArch = (store.id === GOLDEN_HOUR_ID || store.id === 'members') && lod !== 'far';
  const arch = useMemo(() => {
    if (!useArch) return null;
    const geo = makeArchGeometry(store.w * 0.52, store.h * 0.58, 0.18);
    ensureUv2(geo);
    return geo;
  }, [useArch, store.w, store.h]);
  const near = lod === 'near';
  const mid = lod !== 'far';

  return (
    <group position={[store.x, 0, store.z]} rotation={[0, store.rotY, 0]}>
      <UvBox args={[store.w, store.h, store.d]} position={[0, store.h / 2, -store.d / 2]} material={body} castShadow receiveShadow />
      {/* Plinth */}
      <UvBox args={[store.w + 0.22, 0.28, store.d + 0.16]} position={[0, 0.14, -store.d / 2 + 0.02]} material={mats.stone} castShadow receiveShadow />
      {/* Pilasters */}
      {mid && (
        <>
          <UvBox args={[0.2, store.h - 0.1, 0.22]} position={[-store.w / 2 + 0.08, store.h / 2, 0.02]} material={mats.stone} castShadow />
          <UvBox args={[0.2, store.h - 0.1, 0.22]} position={[store.w / 2 - 0.08, store.h / 2, 0.02]} material={mats.stone} castShadow />
        </>
      )}
      {/* Cornice + parapet */}
      <UvBox args={[store.w + 0.3, 0.16, 0.55]} position={[0, store.h + 0.08, 0.08]} castShadow>
        <meshStandardMaterial color={theme.gold} metalness={0.74} roughness={0.3} envMapIntensity={1} />
      </UvBox>
      {mid && <UvBox args={[store.w + 0.08, 0.42, 0.22]} position={[0, store.h + 0.34, -0.06]} material={body} castShadow />}
      {near && Array.from({ length: 7 }, (_, i) => (
        <mesh key={`dentil-${i}`} position={[-store.w * 0.38 + i * (store.w * 0.13), store.h + 0.2, 0.22]} castShadow>
          <boxGeometry args={[0.08, 0.1, 0.08]} />
          <meshStandardMaterial color={theme.goldTrim} metalness={0.7} roughness={0.32} />
        </mesh>
      ))}
      {/* Awning */}
      {mid && (
        <>
          <UvBox args={[store.w * 0.92, 0.06, 1.15]} position={[0, store.h * 0.62, 0.62]} rotation={[-0.28, 0, 0]} material={store.id === GOLDEN_HOUR_ID || store.id === 'members' ? mats.velvet : undefined} castShadow>
            {store.id !== GOLDEN_HOUR_ID && store.id !== 'members' && <meshStandardMaterial color={store.awningColor} roughness={0.7} />}
          </UvBox>
          <UvBox args={[store.w * 0.92, 0.22, 0.06]} position={[0, store.h * 0.62 - 0.18, 1.05]} castShadow>
            <meshStandardMaterial color={store.awningColor} roughness={0.65} />
          </UvBox>
        </>
      )}
      {/* Window */}
      {useArch && arch ? (
        <mesh position={[-store.w * 0.14, 0.28, 0.1]} material={mats.gold} castShadow>
          <primitive object={arch} attach="geometry" />
        </mesh>
      ) : (
        <UvBox args={[store.w * 0.44, store.h * 0.44, 0.08]} position={[-store.w * 0.18, store.h * 0.42, 0.08]} material={mats.gold} castShadow />
      )}
      <mesh position={[-store.w * 0.18, store.h * 0.42, -0.18]}>
        <planeGeometry args={[store.w * 0.38, store.h * 0.38]} />
        <meshStandardMaterial color="#1a120e" emissive={windowColor} emissiveIntensity={hot ? 0.75 : 0.4} />
      </mesh>
      {near && (
        <>
          <mesh position={[-store.w * 0.18, store.h * 0.42, 0.09]} material={mats.glass}>
            <boxGeometry args={[store.w * 0.36, store.h * 0.36, 0.02]} />
          </mesh>
          {/* Mullions */}
          <mesh position={[-store.w * 0.18, store.h * 0.42, 0.12]}>
            <boxGeometry args={[0.03, store.h * 0.36, 0.03]} />
            <meshStandardMaterial color={theme.gold} metalness={0.7} roughness={0.32} />
          </mesh>
          <mesh position={[-store.w * 0.18, store.h * 0.42, 0.12]}>
            <boxGeometry args={[store.w * 0.36, 0.03, 0.03]} />
            <meshStandardMaterial color={theme.gold} metalness={0.7} roughness={0.32} />
          </mesh>
          {/* Window display */}
          <UvBox args={[0.18, 0.28, 0.12]} position={[-store.w * 0.26, 0.85, -0.05]} material={store.id === 'homogap' ? mats.velvet : mats.wood} />
          <UvBox args={[0.16, 0.2, 0.1]} position={[-store.w * 0.1, 0.78, -0.05]} material={mats.gold} />
        </>
      )}
      {/* Door */}
      <UvBox args={[0.95, 2.35, 0.14]} position={[store.w * 0.28, 1.17, 0.1]} material={mats.ink} castShadow />
      <UvBox args={[0.72, 2.08, 0.06]} position={[store.w * 0.28, 1.17, 0.16]} material={mats.wood} />
      {mid && (
        <mesh position={[store.w * 0.28, 2.32, 0.18]}>
          <boxGeometry args={[0.62, 0.28, 0.04]} />
          <meshStandardMaterial color="#1a120e" emissive={theme.gold} emissiveIntensity={0.2} />
        </mesh>
      )}
      <mesh position={[store.w * 0.18, 1.2, 0.22]} castShadow>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshStandardMaterial color={theme.gold} metalness={0.9} roughness={0.22} />
      </mesh>
      {/* Sign band + hanging blade */}
      <UvBox args={[store.w * 0.86, 0.42, 0.1]} position={[0, store.h * 0.86, 0.18]} material={mats.ink} castShadow />
      <Text position={[0, store.h * 0.86, 0.26]} fontSize={0.2} color={store.signColor} anchorX="center" maxWidth={store.w * 0.8}>
        {store.name}
      </Text>
      {store.id === GOLDEN_HOUR_ID && (
        <Text position={[0, store.h * 0.74, 0.26]} fontSize={0.14} color={theme.ivory} anchorX="center">
          DEMO SLOT · GOLDEN HOUR
        </Text>
      )}
      {near && (
        <group position={[store.w * 0.48, store.h * 0.7, 0.35]}>
          <mesh>
            <boxGeometry args={[0.04, 0.5, 0.16]} />
            <meshStandardMaterial color={theme.black} metalness={0.3} roughness={0.4} />
          </mesh>
          <Text position={[0.05, 0, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.11} color={theme.gold} anchorX="center" maxWidth={0.7}>
            {store.id === GOLDEN_HOUR_ID ? 'GOLDEN HOUR' : store.name}
          </Text>
        </group>
      )}
      {near && (store.id === 'cafe' || store.id === GOLDEN_HOUR_ID) && (
        <group position={[-store.w * 0.35, 0, 0.7]}>
          <UvBox args={[0.32, 0.28, 0.32]} position={[0, 0.14, 0]} material={mats.stone} castShadow />
          <mesh position={[0, 0.42, 0]} castShadow>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshStandardMaterial color="#2a4a32" roughness={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}
