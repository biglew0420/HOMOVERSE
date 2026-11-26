import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import { DoubleSide, type MeshStandardMaterial } from 'three';
import type { Storefront } from '../lib/district';
import { GOLDEN_HOUR_ID } from '../lib/shops';
import { ensureUv2, type PlazaMaterials } from '../lib/pbr';
import { lodLevel, type QualitySettings } from '../lib/quality';
import { axleCylinder, makeArchSlab } from '../lib/smoothGeo';
import { makeArchGeometry } from '../lib/storefrontGeo';
import { theme } from '../lib/theme';
import { SmoothBox } from './SmoothBox';

function filletFor(quality: QualitySettings) {
  if (quality.id === 'high') return 3;
  if (quality.id === 'medium') return 2;
  return 1;
}

function BayAwning({
  width,
  y,
  color,
  material,
  segments,
}: {
  width: number;
  y: number;
  color: string;
  material?: MeshStandardMaterial;
  segments: number;
}) {
  const bays = 3;
  const bay = width / bays;
  const radius = 0.58;
  return (
    <group position={[0, y, 0.06]}>
      {Array.from({ length: bays }, (_, i) => (
        <mesh
          key={i}
          position={[(i - (bays - 1) / 2) * bay, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          material={material}
        >
          <cylinderGeometry args={[radius, radius, bay * 0.96, segments, 1, true, Math.PI * 1.5, Math.PI / 2]} />
          {!material && <meshStandardMaterial color={color} roughness={0.55} side={DoubleSide} />}
        </mesh>
      ))}
    </group>
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
  const near = lod === 'near';
  const mid = lod !== 'far';
  const fillet = filletFor(quality);
  const body = mats[store.material] as MeshStandardMaterial;
  const windowColor = hot ? theme.icyPink : theme.blush;
  const velvetAwning = store.id === GOLDEN_HOUR_ID || store.id === 'members';
  const lowerH = store.h * 0.6;
  const upperH = store.h * 0.32;
  const upperW = store.w * 0.9;
  const upperD = store.d * 0.76;
  const massZ = -store.d / 2;
  const upperZ = massZ - 0.16;
  const top = lowerH + upperH;
  const doorX = store.w * 0.28;

  const arch = useMemo(() => {
    if (!mid) return null;
    const geo = makeArchGeometry(store.w * 0.4, 2.15, 0.1);
    ensureUv2(geo);
    return geo;
  }, [mid, store.w]);
  const glow = useMemo(() => makeArchSlab(store.w * 0.3, 1.85, 0.04), [store.w]);
  const door = useMemo(() => makeArchSlab(0.86, 2.2, 0.08), []);
  const roof = useMemo(() => {
    if (!mid) return null;
    const segs = quality.id === 'low' ? 8 : quality.id === 'medium' ? 12 : 16;
    return axleCylinder(upperW * 1.02, Math.min(1.15, upperD * 0.5), segs);
  }, [mid, upperW, upperD, quality.id]);
  useMemo(() => {
    if (velvetAwning) mats.velvet.side = DoubleSide;
    return null;
  }, [velvetAwning, mats.velvet]);

  return (
    <group position={[store.x, 0, store.z]} rotation={[0, store.rotY, 0]}>
      <SmoothBox size={[store.w, lowerH, store.d]} radius={0.36} segments={fillet} position={[0, lowerH / 2, massZ]} material={body} castShadow receiveShadow />
      <SmoothBox size={[upperW, upperH, upperD]} radius={0.24} segments={fillet} position={[0, lowerH + upperH / 2, upperZ]} material={body} castShadow receiveShadow />
      <SmoothBox size={[store.w + 0.2, 0.28, store.d + 0.14]} radius={0.06} segments={Math.max(1, fillet - 1)} position={[0, 0.14, massZ + 0.02]} material={mats.stone} castShadow receiveShadow />

      {roof && (
        <mesh geometry={roof} position={[0, top + 0.2, upperZ]} castShadow>
          <meshStandardMaterial color="#121018" metalness={0.64} roughness={0.28} envMapIntensity={1} />
        </mesh>
      )}
      <SmoothBox size={[store.w + 0.22, 0.1, 0.36]} radius={0.04} segments={Math.max(1, fillet - 1)} position={[0, lowerH + 0.02, 0.06]} castShadow color={theme.gold} metalness={0.78} roughness={0.28} />

      {mid && (
        <>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * (store.w / 2 - 0.12), 0, 0.06]}>
              <mesh position={[0, lowerH * 0.52, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.11, lowerH * 0.92, quality.id === 'low' ? 8 : 12]} />
                <meshStandardMaterial color="#6e6860" roughness={0.72} metalness={0.08} />
              </mesh>
              <mesh position={[0, lowerH * 0.98, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.12, 0.035, 8, 14]} />
                <meshStandardMaterial color={theme.gold} metalness={0.8} roughness={0.26} />
              </mesh>
            </group>
          ))}
          {mid && (
            <BayAwning
              width={store.w * 0.86}
              y={lowerH * 0.72}
              color={store.awningColor}
              material={velvetAwning ? mats.velvet : undefined}
              segments={quality.id === 'low' ? 8 : 12}
            />
          )}
        </>
      )}

      {arch ? (
        <mesh position={[-store.w * 0.16, 0.42, 0.08]} material={mats.gold} geometry={arch} castShadow />
      ) : (
        <SmoothBox size={[store.w * 0.36, 1.5, 0.08]} radius={0.08} segments={fillet} position={[-store.w * 0.16, 1.25, 0.08]} material={mats.gold} />
      )}
      <mesh geometry={glow} position={[-store.w * 0.16, 0.55, 0.05]}>
        <meshStandardMaterial color="#c8b4ae" emissive={windowColor} emissiveIntensity={hot ? 0.8 : 0.42} metalness={0.35} roughness={0.16} transparent opacity={0.78} />
      </mesh>
      {near && (
        <>
          <mesh position={[-store.w * 0.16, 1.45, 0.1]} material={mats.glass}>
            <circleGeometry args={[0.22, 16]} />
          </mesh>
          <mesh position={[-store.w * 0.16, 1.35, 0.12]}>
            <cylinderGeometry args={[0.015, 0.015, 1.25, 6]} />
            <meshStandardMaterial color={theme.gold} metalness={0.75} roughness={0.3} />
          </mesh>
          <mesh position={[-store.w * 0.16, 1.35, 0.12]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, store.w * 0.28, 6]} />
            <meshStandardMaterial color={theme.gold} metalness={0.75} roughness={0.3} />
          </mesh>
          <mesh position={[-store.w * 0.24, 0.95, -0.02]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 0.28, 10]} />
            <meshStandardMaterial color={theme.gold} metalness={0.65} roughness={0.3} />
          </mesh>
          <mesh position={[-store.w * 0.24, 1.16, -0.02]}>
            <sphereGeometry args={[0.07, 12, 10]} />
            <meshStandardMaterial color={theme.blush} roughness={0.35} metalness={0.15} />
          </mesh>
        </>
      )}

      <mesh geometry={door} position={[doorX, 0.02, 0.12]} material={mats.wood} castShadow />
      <mesh position={[doorX - 0.28, 1.15, 0.18]}>
        <sphereGeometry args={[0.035, 12, 10]} />
        <meshStandardMaterial color={theme.gold} metalness={0.9} roughness={0.2} />
      </mesh>

      <SmoothBox size={[store.w * 0.78, 0.34, 0.08]} radius={0.08} segments={fillet} position={[0, lowerH + 0.16, 0.16]} material={mats.ink} castShadow />
      <Text position={[0, lowerH + 0.16, 0.24]} fontSize={0.18} color={store.signColor} anchorX="center" maxWidth={store.w * 0.74}>
        {store.name}
      </Text>
      {store.id === GOLDEN_HOUR_ID && (
        <Text position={[0, lowerH * 0.7 - 0.15, 0.42]} fontSize={0.11} color={theme.ivory} anchorX="center">
          DEMO SLOT · GOLDEN HOUR
        </Text>
      )}

      {near && (
        <group position={[store.w * 0.46, lowerH * 0.7, 0.55]}>
          <mesh scale={[0.22, 0.62, 0.08]}>
            <sphereGeometry args={[0.42, 16, 12]} />
            <meshStandardMaterial color={theme.black} metalness={0.35} roughness={0.4} />
          </mesh>
          <Text position={[0.06, 0, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.1} color={theme.gold} anchorX="center" maxWidth={0.7}>
            {store.id === GOLDEN_HOUR_ID ? 'GOLDEN HOUR' : store.name}
          </Text>
        </group>
      )}

      {near && (store.id === 'cafe' || store.id === GOLDEN_HOUR_ID) && (
        <group position={[-store.w * 0.38, 0, 0.85]}>
          <mesh position={[0, 0.16, 0]} castShadow receiveShadow material={mats.stone}>
            <cylinderGeometry args={[0.2, 0.16, 0.32, 12]} />
          </mesh>
          <mesh position={[0, 0.42, 0]} castShadow>
            <sphereGeometry args={[0.2, 12, 10]} />
            <meshStandardMaterial color="#234232" roughness={0.8} />
          </mesh>
          <mesh position={[0.12, 0.36, 0.08]} castShadow>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color="#2f5a40" roughness={0.82} />
          </mesh>
        </group>
      )}
    </group>
  );
}
