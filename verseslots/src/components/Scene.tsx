import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
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
import { frameStats } from '../lib/frameStats';
import { lookInput } from '../lib/lookInput';
import { moveInput } from '../lib/moveInput';
import type { Presence } from '../liveblocks';

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

function Mover({ setMe, sim, district, locked }: {
  setMe: Props['setMe'];
  sim: React.MutableRefObject<Sim>;
  district: District;
  locked: boolean;
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
    frameStats.frames += 1;
    frameStats.maxDt = Math.max(frameStats.maxDt, dt);
    frameStats.lastStep = stepDt;
    if (keys.current.q) lookInput.yaw += 1.5 * stepDt;
    if (keys.current.e) lookInput.yaw -= 1.5 * stepDt;

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

function remoteStyle(color: string) {
  const n = color.length + color.charCodeAt(0);
  return sanitizeAvatar({ skin: n % 5, hair: 'short', hairColor: n % 5, outfit: 'night' });
}

export function Scene({ me, setMe, others, district, avatar, locked, hotId }: Props) {
  const sim = useRef<Sim>({ x: me.x, z: me.z });
  useEffect(() => {
    lookInput.yaw = Math.atan2(-5.35, -3.8);
  }, []);
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 2.05, 12.2], fov: 50, near: 0.08, far: 80 }}
      style={{ touchAction: 'none', width: '100%', height: '100%' }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#3a3158']} />
      <fog attach="fog" args={['#3a3158', 18, 52]} />
      <hemisphereLight args={['#f7ead0', '#243028', 0.72]} />
      <ambientLight intensity={0.28} />
      <directionalLight
        position={[14, 18, 8]}
        intensity={1.45}
        color="#ffe2b8"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={2}
        shadow-camera-far={48}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0006}
      />
      <mesh position={[18, 16, -10]}>
        <sphereGeometry args={[1.4, 24, 16]} />
        <meshBasicMaterial color="#f4efe2" />
      </mesh>
      <DistrictView district={district} hotId={hotId} />
      <Mover setMe={setMe} sim={sim} district={district} locked={locked} />
      <FollowCam sim={sim} />
      <Avatar sim={sim} x={me.x} z={me.z} style={avatar} name="" status={me.status} showLabel={false} />
      {others.map((other) => (
        <Avatar key={other.id} x={other.x} z={other.z} style={remoteStyle(other.color)} name={other.name} status={other.status} />
      ))}
    </Canvas>
  );
}
