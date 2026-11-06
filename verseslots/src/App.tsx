import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Scene, type Other } from './components/Scene';
import { TouchJoystick } from './components/TouchJoystick';
import { BUILDINGS } from './lib/buildings';
import { distanceToBuilding, proximityMultiplier } from './lib/geo';
import { acceptWinEvent, MAX_PLAY_PAYOUT, type SafeWin } from './lib/winEvent';
import { useGeolocation } from './hooks/useGeolocation';
import { MULTIPLAYER, RoomProvider, useBroadcastEvent, useEventListener, useMyPresence, useOthers, useStatus, type Presence } from './liveblocks';

const OFFLINE_HOLD_MS = 20_000;

const randomMe = (): Presence => ({ x: Math.random() * 6 - 3, z: 4, color: `hsl(${Math.floor(Math.random() * 360)},70%,60%)`, name: `Guest${Math.floor(Math.random() * 1000)}`, status: 'active' });
type Win = SafeWin & { t: number };

const panel: CSSProperties = {
  position: 'fixed', background: '#000a', padding: 8, borderRadius: 8, fontSize: 11, zIndex: 30,
  maxWidth: 'min(260px, calc(100vw - 24px))', boxSizing: 'border-box',
};

function buildingName(id: string) {
  return BUILDINGS.find((b) => b.id === id)?.name ?? id;
}

function coercePresence(raw: unknown): Presence | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.name !== 'string') return null;
  const name = p.name.trim().slice(0, 24);
  if (!name) return null;
  if (typeof p.x !== 'number' || !Number.isFinite(p.x)) return null;
  if (typeof p.z !== 'number' || !Number.isFinite(p.z)) return null;
  const status = p.status === 'idle' || p.status === 'offline' || p.status === 'active' ? p.status : 'active';
  const color = typeof p.color === 'string' && p.color.length > 0 ? p.color.slice(0, 32) : '#888';
  return {
    x: Math.min(14, Math.max(-14, p.x)),
    z: Math.min(8, Math.max(-4, p.z)),
    color,
    name,
    status,
  };
}

/** Connected players, plus people who just left, shown grey for a short time. */
function useRecentOthers(): Other[] {
  const connections = useOthers();
  const live = useMemo(() => {
    const list: Other[] = [];
    for (const o of connections) {
      const presence = coercePresence(o.presence);
      if (presence) list.push({ ...presence, id: o.connectionId });
    }
    return list;
  }, [connections]);

  const prev = useRef<Map<number, Presence>>(new Map());
  const [ghosts, setGhosts] = useState<Array<Other & { until: number }>>([]);

  useEffect(() => {
    const ids = new Set(live.map((o) => o.id));
    const now = Date.now();
    const previous = prev.current;
    const snapshot = new Map<number, Presence>();
    for (const o of live) snapshot.set(o.id, o);
    prev.current = snapshot;
    setGhosts((existing) => {
      let changed = false;
      const next = existing.filter((g) => {
        const keep = g.until > now && !ids.has(g.id);
        if (!keep) changed = true;
        return keep;
      });
      for (const [id, presence] of previous) {
        if (!ids.has(id) && !next.some((g) => g.id === id)) {
          next.push({ ...presence, id, status: 'offline', until: now + OFFLINE_HOLD_MS });
          changed = true;
        }
      }
      return changed ? next : existing;
    });
  }, [live]);

  useEffect(() => {
    if (ghosts.length === 0) return;
    const delay = Math.max(0, Math.min(...ghosts.map((g) => g.until)) - Date.now());
    const t = window.setTimeout(() => {
      const now = Date.now();
      setGhosts((existing) => existing.filter((g) => g.until > now));
    }, delay + 30);
    return () => clearTimeout(t);
  }, [ghosts]);

  return useMemo(() => {
    const ids = new Set(live.map((o) => o.id));
    return [
      ...live,
      ...ghosts.filter((g) => !ids.has(g.id)).map((g) => ({
        id: g.id, x: g.x, z: g.z, color: g.color, name: g.name, status: 'offline' as const,
      })),
    ];
  }, [live, ghosts]);
}

function useIdle(setMe: (p: Partial<Presence>) => void) {
  useEffect(() => {
    let t: number;
    const reset = () => { clearTimeout(t); t = window.setTimeout(() => setMe({ status: 'idle' }), 30000); };
    reset(); addEventListener('keydown', reset); addEventListener('pointerdown', reset);
    return () => { clearTimeout(t); removeEventListener('keydown', reset); removeEventListener('pointerdown', reset); };
  }, [setMe]);
}

function Game({ me, setMe, others, broadcast, wins, pushWin, online }: {
  me: Presence; setMe: (p: Partial<Presence>) => void; others: Other[]; broadcast: (w: SafeWin) => void; wins: Win[]; pushWin: (w: SafeWin) => void; online: string;
}) {
  const geo = useGeolocation();
  const [credits, setCredits] = useState(100);
  useIdle(setMe);
  const located = geo.status === 'ok' && geo.lat != null && geo.lng != null;
  const dist = useMemo(() => Object.fromEntries(BUILDINGS.map((b) => [b.id, located ? distanceToBuilding(geo.lat as number, geo.lng as number, b) : null])), [located, geo.lat, geo.lng]);
  const multipliers = useMemo(() => Object.fromEntries(BUILDINGS.map((b) => [b.id, proximityMultiplier(dist[b.id])])), [dist]);
  const onWin = (machineId: string, amount: number) => {
    const building = BUILDINGS.find((b) => b.id === machineId);
    if (!building || !Number.isInteger(amount) || amount < 1 || amount > MAX_PLAY_PAYOUT) return;
    const w = { name: me.name.slice(0, 24), machine: building.id, amount };
    pushWin(w);
    broadcast(w);
  };
  const here = others.filter((o) => o.status !== 'offline').length + 1;
  return (
    <>
      <Scene me={me} setMe={setMe} others={others} multipliers={multipliers} credits={credits} setCredits={setCredits} onWin={onWin} />
      <TouchJoystick />
      <div style={{ ...panel, top: 8, left: 8 }}>
        <b style={{ color: '#d4af37' }}>VerseSlots</b> · {online}<br />
        {here} player(s) · Credits (play money): {credits}<br />
        Stick / WASD to walk · drag to orbit<br />
        GPS: {geo.status}{located && ` (${geo.lat!.toFixed(4)}, ${geo.lng!.toFixed(4)})`}{geo.error && ` – ${geo.error}`}
        {BUILDINGS.map((b) => <div key={b.id}>{b.name}: {dist[b.id] != null ? `${Math.round(dist[b.id]!)}m` : 'remote'} → x{multipliers[b.id]}</div>)}
      </div>
      <div style={{ ...panel, top: 8, right: 8, width: 'min(180px, calc(50vw - 12px))', maxHeight: 140, overflow: 'auto' }}>
        <b>Win feed</b>
        {wins.length === 0 && <div style={{ opacity: 0.6 }}>No wins yet</div>}
        {wins.map((w) => <div key={w.t}>🎉 {w.name} +{w.amount} @ {buildingName(w.machine)}</div>)}
      </div>
    </>
  );
}

function useWins() {
  const [wins, setWins] = useState<Win[]>([]);
  const pushWin = useCallback((w: SafeWin) => setWins((p) => [{ ...w, t: Date.now() + Math.random() }, ...p].slice(0, 8)), []);
  return { wins, pushWin };
}

function Multiplayer() {
  const [me, update] = useMyPresence();
  const others = useRecentOthers();
  const broadcast = useBroadcastEvent();
  const status = useStatus();
  const { wins, pushWin } = useWins();
  const lastWinAt = useRef(new Map<number, number>());
  useEventListener(({ event, connectionId }) => {
    const win = acceptWinEvent(event, connectionId, lastWinAt.current);
    if (win) pushWin(win);
  });
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
