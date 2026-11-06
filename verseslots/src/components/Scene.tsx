import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Text } from '@react-three/drei';
import { BUILDINGS } from '../lib/buildings';
import { moveInput } from '../lib/moveInput';
import { Avatar } from './Avatar';
import { SlotMachine } from './SlotMachine';
import type { Presence } from '../liveblocks';

export type Other = Presence & { id: number };
type Props = {
  me: Presence; setMe: (p: Partial<Presence>) => void; others: Other[];
  multipliers: Record<string, number>; credits: number; setCredits: (f: (c: number) => number) => void; onWin: (machine: string, amt: number) => void;
};

function useKeys() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const d = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const u = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    const clear = () => { keys.current = {}; };
    const onVis = () => { if (document.visibilityState === 'hidden') clear(); };
    addEventListener('keydown', d);
    addEventListener('keyup', u);
    addEventListener('blur', clear);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      removeEventListener('keydown', d);
      removeEventListener('keyup', u);
      removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  return keys;
}

function Mover({ me, setMe }: Pick<Props, 'me' | 'setMe'>) {
  const keys = useKeys();
  const pos = useRef({ x: me.x, z: me.z });
  const last = useRef(0);
  useFrame((_, dt) => {
    const k = keys.current;
    // Keyboard is digital; joystick is analog. Prefer stick when held, else WASD.
    let ax = moveInput.x, az = moveInput.z;
    if (ax === 0 && az === 0) {
      if (k.a || k.arrowleft) ax -= 1;
      if (k.d || k.arrowright) ax += 1;
      if (k.w || k.arrowup) az -= 1;
      if (k.s || k.arrowdown) az += 1;
      const len = Math.hypot(ax, az);
      if (len > 1) { ax /= len; az /= len; }
    }
    const speed = 5 * dt;
    const dx = ax * speed, dz = az * speed;
    const moving = dx !== 0 || dz !== 0;
    pos.current.x = Math.max(-14, Math.min(14, pos.current.x + dx));
    pos.current.z = Math.max(-4, Math.min(8, pos.current.z + dz));
    const now = performance.now();
    // Standing still must not flip an idle avatar back to active.
    if (moving && now - last.current > 50) {
      last.current = now; setMe({ ...pos.current, status: 'active' });
    }
  });
  return null;
}

export function Scene({ me, setMe, others, multipliers, credits, setCredits, onWin }: Props) {
  // "Hot machine" = how many avatars are standing near each storefront
  const crowd = (bx: number) => [me, ...others].filter((p) => p.status !== 'offline' && Math.abs(p.x - bx) < 2.5 && p.z < -1).length;
  const [, force] = useState(0);
  useEffect(() => { const t = setInterval(() => force((n) => n + 1), 1000); return () => clearInterval(t); }, []);
  return (
    <Canvas
      camera={{ position: [0, 9, 16], fov: 50 }}
      shadows
      style={{ touchAction: 'none', width: '100%', height: '100%' }}
      onPointerDown={(e) => { /* keep page from scrolling while orbiting */ e.preventDefault?.(); }}
    >
      <color attach="background" args={['#0b0b10']} />
      <ambientLight intensity={0.5} /><directionalLight position={[5, 10, 5]} intensity={1.2} />
      <mesh rotation-x={-Math.PI / 2}><planeGeometry args={[34, 20]} /><meshStandardMaterial color="#2a2a33" /></mesh>
      {BUILDINGS.map((b, i) => (
        <group key={b.id} position={[b.x, 0, b.z]}>
          <mesh position={[0, 2.5, 0]}><boxGeometry args={[5, 5, 3]} /><meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={crowd(b.x) > 1 ? 0.5 : 0.1} /></mesh>
          <Text position={[0, 5.4, 1.6]} fontSize={0.5} color="#fff">{`${b.name}${crowd(b.x) > 1 ? ' 🔥' : ''}`}</Text>
          {i === 0 ? (
            <Html position={[0, 2.4, 1.55]} transform distanceFactor={6} style={{ pointerEvents: 'auto' }}>
              <SlotMachine name={b.name} multiplier={multipliers[b.id] ?? 1} credits={credits} setCredits={setCredits} onWin={(a) => onWin(b.id, a)} />
            </Html>
          ) : (
            <mesh position={[0, 2.4, 1.51]}><planeGeometry args={[2.4, 2.4]} /><meshStandardMaterial color="#111" /></mesh>
          )}
        </group>
      ))}
      <Mover me={me} setMe={setMe} />
      <Avatar {...me} name={`${me.name} (you)`} />
      {others.map((o) => <Avatar key={o.id} {...o} />)}
      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.2} />
    </Canvas>
  );
}
