import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, SoftShadows } from '@react-three/drei';
import { ACESFilmicToneMapping, AgXToneMapping, PCFSoftShadowMap, Vector3 } from 'three';
import { SceneEffects } from './SceneEffects';
import { hdriUrl } from '../lib/pbr';
import { type QualitySettings } from '../lib/quality';
import { Avatar } from './Avatar';
import { DistrictView } from './DistrictView';
import type { AvatarStyle } from '../lib/avatarStyle';
import { sanitizeAvatar } from '../lib/avatarStyle';
import {
  AVATAR_RADIUS,
  SPAWN,
  WALK_SPEED,
  blocked,
  frameStep,
  tryMove,
  wishVector,
  type District,
} from '../lib/district';
import { frameStats, tickFrameStats } from '../lib/frameStats';
import { lookInput } from '../lib/lookInput';
import { moveInput } from '../lib/moveInput';
import type { Presence } from '../liveblocks';
import { theme } from '../lib/theme';
import { GuestThought } from './Npc';
import type { HomovRankId } from '../lib/homov';

export type NavGoal = { x: number; z: number; mode: 'walk' | 'jump'; yaw: number } | null;

export type Other = Presence & { id: number };
type Sim = { x: number; z: number };

type Props = {
  me: Presence;
  setMe: (p: Partial<Presence>) => void;
  others: Other[];
  district: District;
  avatar: AvatarStyle;
  locked: boolean;
  hotId: string | null;
  nav: NavGoal;
  onArrived: () => void;
  memberBadge?: boolean;
  tagColor?: string;
  rank: HomovRankId;
  displayName: string;
  quality: QualitySettings;
};

function useKeys() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    const clear = () => { keys.current = {}; };
    const onVis = () => { if (document.visibilityState === 'hidden') clear(); };
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    addEventListener('blur', clear);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      removeEventListener('keydown', down);
      removeEventListener('keyup', up);
      removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  return keys;
}

function Mover({ setMe, sim, district, locked, nav, onArrived }: {
  setMe: Props['setMe'];
  sim: React.MutableRefObject<Sim>;
  district: District;
  locked: boolean;
  nav: NavGoal;
  onArrived: () => void;
}) {
  const keys = useKeys();
  const last = useRef(0);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  useEffect(() => {
    if (blocked(sim.current.x, sim.current.z, AVATAR_RADIUS, district.fountain)) {
      sim.current.x = SPAWN.x;
      sim.current.z = SPAWN.z;
      setMe({ x: SPAWN.x, z: SPAWN.z });
    }
  }, [district.seed, district.fountain, setMe, sim]);

  useFrame((_, dt) => {
    const stepDt = frameStep(dt);
    tickFrameStats(dt);
    frameStats.lastStep = stepDt;
    if (keys.current.q) lookInput.yaw += 1.5 * stepDt;
    if (keys.current.e) lookInput.yaw -= 1.5 * stepDt;

    if (!lockedRef.current && nav) {
      if (nav.mode === 'jump') {
        const landed = tryMove(nav.x, nav.z, 0, 0, district.fountain);
        sim.current.x = landed.x;
        sim.current.z = landed.z;
        lookInput.yaw = nav.yaw;
        setMe({ x: landed.x, z: landed.z, status: 'active' });
        onArrived();
        return;
      }
      const dx = nav.x - sim.current.x;
      const dz = nav.z - sim.current.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.18) {
        lookInput.yaw = nav.yaw;
        onArrived();
      } else {
        const step = Math.min(dist, WALK_SPEED * stepDt);
        const next = tryMove(sim.current.x, sim.current.z, (dx / dist) * step, (dz / dist) * step, district.fountain);
        sim.current.x = next.x;
        sim.current.z = next.z;
        lookInput.yaw = Math.atan2(-dx, -dz);
        setMe({ x: next.x, z: next.z, status: 'active' });
      }
      return;
    }

    let ax = 0;
    let az = 0;
    if (!lockedRef.current) {
      ax = moveInput.x;
      az = moveInput.z;
      if (ax === 0 && az === 0) {
        const k = keys.current;
        if (k.a || k.arrowleft) ax -= 1;
        if (k.d || k.arrowright) ax += 1;
        if (k.w || k.arrowup) az -= 1;
        if (k.s || k.arrowdown) az += 1;
        const len = Math.hypot(ax, az);
        if (len > 1) { ax /= len; az /= len; }
      }
    }
    const wish = wishVector(ax, az, lookInput.yaw);
    const next = tryMove(sim.current.x, sim.current.z, wish.dx * WALK_SPEED * stepDt, wish.dz * WALK_SPEED * stepDt, district.fountain);
    const moving = next.x !== sim.current.x || next.z !== sim.current.z;
    sim.current.x = next.x;
    sim.current.z = next.z;
    const now = performance.now();
    if (moving && now - last.current > 50) {
      last.current = now;
      setMe({ x: next.x, z: next.z, status: 'active' });
    }
  });
  return null;
}

function FollowCam({ sim }: { sim: React.MutableRefObject<Sim> }) {
  const desired = useRef(new Vector3());
  const lookAt = useRef(new Vector3());
  useFrame((state, dt) => {
    const { x, z } = sim.current;
    const yaw = lookInput.yaw;
    desired.current.set(x + Math.sin(yaw) * 4.8, 2.05, z + Math.cos(yaw) * 4.8);
    const blend = 1 - Math.exp(-4.2 * frameStep(dt || 0.016));
    state.camera.position.lerp(desired.current, blend);
    lookAt.current.set(x, 1.25, z);
    state.camera.lookAt(lookAt.current);
  });
  return null;
}

function IdleThought({ sim, locked }: { sim: React.MutableRefObject<Sim>; locked: boolean }) {
  const [show, setShow] = useState(false);
  const lastMove = useRef(0);
  useFrame(() => {
    const moving = Math.hypot(moveInput.x, moveInput.z) > 0.08;
    const now = performance.now();
    if (moving || locked) {
      lastMove.current = now;
      if (show) setShow(false);
      return;
    }
    if (!show && now - lastMove.current > 5000) setShow(true);
  });
  return <GuestThought visible={show && !locked} x={sim.current.x} z={sim.current.z} />;
}

function remoteStyle(color: string) {
  const n = color.length + color.charCodeAt(0);
  return sanitizeAvatar({ skin: n % 5, hair: 'short', hairColor: n % 5, outfit: 'night' });
}


function Lighting({ quality }: { quality: QualitySettings }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = quality.toneMapping === 'agx' ? AgXToneMapping : ACESFilmicToneMapping;
    gl.toneMappingExposure = quality.exposure;
    gl.shadowMap.enabled = quality.shadows;
    gl.shadowMap.type = PCFSoftShadowMap;
  }, [gl, quality]);
  return (
    <>
      <color attach="background" args={[theme.plum]} />
      <fog attach="fog" args={['#3d2830', quality.env ? 20 : 14, quality.env ? 58 : 40]} />
      <hemisphereLight args={['#f3d3b0', theme.plum, quality.env ? 0.32 : 0.7]} />
      <ambientLight intensity={quality.env ? 0.1 : 0.28} />
      <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[18, 26, 40]} />
        <meshBasicMaterial color={theme.gold} transparent opacity={0.12} />
      </mesh>
      <directionalLight
        position={[-16, 11, 8]}
        intensity={quality.env ? 0.8 : 1.3}
        color="#ffc396"
        castShadow={quality.shadows}
        shadow-mapSize-width={quality.shadowMap || 1024}
        shadow-mapSize-height={quality.shadowMap || 1024}
        shadow-camera-near={2}
        shadow-camera-far={48}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0006}
      />
      {quality.env && (
        <Environment files={hdriUrl()} background backgroundBlurriness={0.16} environmentIntensity={0.62} />
      )}
      {quality.softShadows && <SoftShadows size={14} samples={8} focus={0.45} />}
      <SceneEffects quality={quality} />
    </>
  );
}

export function Scene({ me, setMe, others, district, avatar, locked, hotId, nav, onArrived, memberBadge, tagColor, rank, displayName, quality }: Props) {
  const sim = useRef<Sim>({ x: me.x, z: me.z });
  useEffect(() => {
    lookInput.yaw = 0;
  }, []);
  const lockedRefScene = useRef(locked);
  useEffect(() => {
    if (lockedRefScene.current !== locked) {
      sim.current.x = me.x;
      sim.current.z = me.z;
    }
    lockedRefScene.current = locked;
  }, [locked, me.x, me.z]);
  return (
    <Canvas
      shadows={quality.shadows}
      dpr={quality.dpr}
      camera={{ position: [0, 2.05, SPAWN.z + 4.8], fov: 50, near: 0.08, far: 80 }}
      style={{ touchAction: 'none', width: '100%', height: '100%' }}
      gl={{ antialias: quality.antialias, powerPreference: 'high-performance', toneMappingExposure: quality.exposure }}
    >
      <Lighting quality={quality} />
      <DistrictView district={district} hotId={hotId} player={{ x: me.x, z: me.z }} rank={rank} quality={quality} />
      <Mover setMe={setMe} sim={sim} district={district} locked={locked} nav={nav} onArrived={onArrived} />
      <FollowCam sim={sim} />
      <IdleThought sim={sim} locked={locked} />
      <Avatar sim={sim} x={me.x} z={me.z} style={avatar} name={displayName} status={me.status} showLabel={Boolean(displayName)} memberBadge={memberBadge} tagColor={tagColor} />
      {others.map((other) => (
        <Avatar key={other.id} x={other.x} z={other.z} style={remoteStyle(other.color)} name={other.name} status={other.status} />
      ))}
    </Canvas>
  );
}
