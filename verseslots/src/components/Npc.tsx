import { useEffect, useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import type { District } from '../lib/district';
import { BENCH } from '../lib/district';
import { GOLDEN_HOUR_ID } from '../lib/shops';
import { NPC_LINES, NPC_META, RANK_GREETINGS, type NpcId } from '../lib/npcLines';
import { theme } from '../lib/theme';
import { demoAudio } from '../lib/audio';
import type { HomovRankId } from '../lib/homov';

function useCycle(id: NpcId, near: boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!near) return;
    demoAudio.bubble();
    const t = window.setInterval(() => {
      setIndex((n) => n + 1);
      demoAudio.bubble();
    }, 7000);
    return () => window.clearInterval(t);
  }, [id, near]);
  return NPC_LINES[id][index % NPC_LINES[id].length];
}

function Bubble({ text, name }: { text: string; name: string }) {
  return (
    <Html position={[0, 2.15, 0]} center distanceFactor={8} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div
        data-testid={`bubble-${name.toLowerCase().split(' ')[0]}`}
        style={{
          background: theme.black,
          color: theme.gold,
          border: `1.5px solid ${theme.gold}`,
          boxShadow: `0 0 0 2px ${theme.blush}`,
          borderRadius: 14,
          padding: '8px 10px',
          fontSize: 12,
          lineHeight: 1.35,
          width: 200,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 2 }}>{name}</div>
        {text}
      </div>
    </Html>
  );
}

function Figure({
  position,
  rotationY,
  jacket,
  pants,
  sitting,
  pin,
}: {
  position: [number, number, number];
  rotationY: number;
  jacket: string;
  pants: string;
  sitting?: boolean;
  pin?: boolean;
}) {
  const y = sitting ? -0.15 : 0;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, sitting ? 0.7 : 1.12, 0]} castShadow>
        <capsuleGeometry args={[0.16, sitting ? 0.3 : 0.42, 8, 14]} />
        <meshStandardMaterial color={jacket} roughness={0.45} />
      </mesh>
      <mesh position={[-0.09, sitting ? 0.45 : 0.46, sitting ? 0.22 : 0]} rotation={[sitting ? Math.PI / 2.4 : 0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.5, 8, 12]} />
        <meshStandardMaterial color={pants} roughness={0.7} />
      </mesh>
      <mesh position={[0.09, sitting ? 0.45 : 0.46, sitting ? 0.22 : 0]} rotation={[sitting ? Math.PI / 2.4 : 0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.5, 8, 12]} />
        <meshStandardMaterial color={pants} roughness={0.7} />
      </mesh>
      <mesh position={[0, sitting ? 1.15 : 1.58, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial color="#c9a07a" roughness={0.6} />
      </mesh>
      {pin && (
        <mesh position={[0.12, sitting ? 0.95 : 1.28, 0.16]} castShadow>
          <boxGeometry args={[0.05, 0.06, 0.02]} />
          <meshStandardMaterial color={theme.gold} metalness={0.9} roughness={0.2} />
        </mesh>
      )}
      <group position={[0, y, 0]} />
    </group>
  );
}

export function NpcFigures({
  district,
  player,
  rank,
}: {
  district: District;
  player: { x: number; z: number };
  rank: HomovRankId;
}) {
  const golden = district.storefronts.find((s) => s.id === GOLDEN_HOUR_ID);
  const tailor = district.storefronts.find((s) => s.id === 'tailor');
  const laurentPos = useMemo<[number, number, number]>(() => {
    if (!golden) return [0, 0, -6];
    const dx = golden.interactX - golden.x;
    const dz = golden.interactZ - golden.z;
    const len = Math.hypot(dx, dz) || 1;
    const sideX = -dz / len * 0.7;
    const sideZ = dx / len * 0.7;
    return [golden.interactX + sideX, 0, golden.interactZ + sideZ];
  }, [golden]);
  const julesPos = useMemo<[number, number, number]>(() => {
    if (!tailor) return [4, 0, -4];
    return [tailor.interactX, 0, tailor.interactZ];
  }, [tailor]);
  const wesPos: [number, number, number] = [BENCH.x, 0, BENCH.z];

  const nearL = Math.hypot(player.x - laurentPos[0], player.z - laurentPos[2]) < 3.2;
  const nearJ = Math.hypot(player.x - julesPos[0], player.z - julesPos[2]) < 3.2;
  const nearW = Math.hypot(player.x - wesPos[0], player.z - wesPos[2]) < 3.2;

  const laurentLine = useCycle('laurent', nearL);
  const julesLine = useCycle('jules', nearJ);
  const wesLine = useCycle('wes', nearW);
  const shownLaurent = nearL && rank !== 'guest' ? RANK_GREETINGS[rank] : laurentLine;

  const laurentRot = golden ? golden.rotY + Math.PI : 0;
  const julesRot = tailor ? tailor.rotY + Math.PI : 0;

  return (
    <group>
      <group position={laurentPos} rotation={[0, laurentRot, 0]}>
        <Figure position={[0, 0, 0]} rotationY={0} jacket={theme.ink} pants={theme.ink} pin />
        {nearL && <Bubble text={shownLaurent} name={NPC_META.laurent.name} />}
      </group>
      <group position={julesPos}>
        <Figure position={[0, 0, 0]} rotationY={julesRot} jacket={theme.ivory} pants={theme.charcoal} />
        {nearJ && <Bubble text={julesLine} name={NPC_META.jules.name} />}
      </group>
      <group position={wesPos} rotation={[0, BENCH.rotY, 0]}>
        <Figure position={[0, 0, 0]} rotationY={0} jacket="#2a2430" pants="#1a1814" sitting />
        {nearW && <Bubble text={wesLine} name={NPC_META.wes.name} />}
      </group>
    </group>
  );
}

export function GuestThought({ visible, x, z }: { visible: boolean; x: number; z: number }) {
  const line = useCycle('guest', visible);
  if (!visible) return null;
  return (
    <group position={[x, 0, z]}>
      <Bubble text={line} name="You" />
    </group>
  );
}
