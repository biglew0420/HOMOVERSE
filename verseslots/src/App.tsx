import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Scene, type Other } from './components/Scene';
import { TouchJoystick } from './components/TouchJoystick';
import { BUILDINGS } from './lib/buildings';
import { distanceToBuilding, proximityMultiplier } from './lib/geo';
import { useGeolocation } from './hooks/useGeolocation';
import { MULTIPLAYER, RoomProvider, useBroadcastEvent, useEventListener, useMyPresence, useOthers, useStatus, type Presence } from './liveblocks';

const randomMe = (): Presence => ({ x: Math.random() * 6 - 3, z: 4, color: `hsl(${Math.floor(Math.random() * 360)},70%,60%)`, name: `Guest${Math.floor(Math.random() * 1000)}`, status: 'active' });
type Win = { name: string; machine: string; amount: number; t: number };

const panel: CSSProperties = {
  position: 'fixed', background: '#000a', padding: 8, borderRadius: 8, fontSize: 11, zIndex: 30,
  maxWidth: 'min(260px, calc(100vw - 24px))', boxSizing: 'border-box',
};

function useIdle(setMe: (p: Partial<Presence>) => void) {
  useEffect(() => {
    let t: number;
    const reset = () => { clearTimeout(t); t = window.setTimeout(() => setMe({ status: 'idle' }), 30000); };
    reset(); addEventListener('keydown', reset); addEventListener('pointerdown', reset);
    return () => { clearTimeout(t); removeEventListener('keydown', reset); removeEventListener('pointerdown', reset); };
  }, [setMe]);
}

function Game({ me, setMe, others, broadcast, wins, pushWin, online }: {
  me: Presence; setMe: (p: Partial<Presence>) => void; others: Other[]; broadcast: (w: Omit<Win, 't'>) => void; wins: Win[]; pushWin: (w: Omit<Win, 't'>) => void; online: string;
}) {
  const geo = useGeolocation();
  const [credits, setCredits] = useState(100);
  useIdle(setMe);
  const dist = useMemo(() => Object.fromEntries(BUILDINGS.map((b) => [b.id, geo.lat != null && geo.lng != null ? distanceToBuilding(geo.lat, geo.lng, b) : null])), [geo.lat, geo.lng]);
  const multipliers = useMemo(() => Object.fromEntries(BUILDINGS.map((b) => [b.id, proximityMultiplier(dist[b.id])])), [dist]);
  const onWin = (machine: string, amount: number) => { const w = { name: me.name, machine, amount }; pushWin(w); broadcast(w); };
  return (
    <>
      <Scene me={me} setMe={setMe} others={others} multipliers={multipliers} credits={credits} setCredits={setCredits} onWin={onWin} />
      <TouchJoystick />
      <div style={{ ...panel, top: 8, left: 8 }}>
        <b style={{ color: '#d4af37' }}>VerseSlots</b> · {online}<br />
        {others.length + 1} player(s) · Credits (play money): {credits}<br />
        Stick / WASD to walk · drag to orbit<br />
        GPS: {geo.status}{geo.lat != null && ` (${geo.lat.toFixed(4)}, ${geo.lng!.toFixed(4)})`}{geo.error && ` – ${geo.error}`}
        {BUILDINGS.map((b) => <div key={b.id}>{b.name}: {dist[b.id] != null ? `${Math.round(dist[b.id]!)}m` : 'remote'} → x{multipliers[b.id]}</div>)}
      </div>
      <div style={{ ...panel, top: 8, right: 8, width: 'min(180px, calc(50vw - 12px))', maxHeight: 140, overflow: 'auto' }}>
        <b>Win feed</b>
        {wins.length === 0 && <div style={{ opacity: 0.6 }}>No wins yet</div>}
        {wins.map((w) => <div key={w.t}>🎉 {w.name} +{w.amount} @ {w.machine}</div>)}
      </div>
    </>
  );
}

function useWins() {
  const [wins, setWins] = useState<Win[]>([]);
  const pushWin = useCallback((w: Omit<Win, 't'>) => setWins((p) => [{ ...w, t: Date.now() + Math.random() }, ...p].slice(0, 8)), []);
  return { wins, pushWin };
}

function Multiplayer() {
  const [me, update] = useMyPresence();
  const others = useOthers().filter((o) => o.presence?.name).map((o) => ({ ...o.presence, id: o.connectionId }));
  const broadcast = useBroadcastEvent();
  const status = useStatus();
  const { wins, pushWin } = useWins();
  useEventListener(({ event }) => { if (event.type === 'win') pushWin(event); });
  const setMe = useCallback((p: Partial<Presence>) => update(p), [update]);
  return <Game me={me} setMe={setMe} others={others} wins={wins} pushWin={pushWin} broadcast={(w) => broadcast({ type: 'win', ...w })} online={status === 'connected' ? '🟢 online' : `🟡 ${status}`} />;
}

function Solo() {
  const [me, set] = useState(randomMe);
  const setMe = useCallback((p: Partial<Presence>) => set((m) => ({ ...m, ...p })), []);
  const { wins, pushWin } = useWins();
  return <Game me={me} setMe={setMe} others={[]} wins={wins} pushWin={pushWin} broadcast={() => {}} online="⚪ solo mode (no Liveblocks key)" />;
}

export default function App() {
  if (!MULTIPLAYER) return <Solo />;
  return <RoomProvider id="verseslots-mall-1" initialPresence={randomMe()}><Multiplayer /></RoomProvider>;
}
