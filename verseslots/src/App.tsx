import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Scene, type NavGoal, type Other } from './components/Scene';
import { TouchJoystick } from './components/TouchJoystick';
import { LookPad } from './components/LookPad';
import { Hud, useLandscape } from './components/Hud';
import { Interior, MembersBooth, FadeVeil } from './components/Interior';
import { Bingo } from './components/Bingo';
import { BUILDINGS } from './lib/buildings';
import { GOLDEN_HOUR_ID } from './lib/shops';
import { acceptWinEvent, MAX_PLAY_PAYOUT, type SafeWin } from './lib/winEvent';
import { useGeolocation } from './hooks/useGeolocation';
import { DEFAULT_LAYOUT, isLayoutKey, layoutName, type AreaMode, type LayoutKey } from './lib/area';
import type { AvatarStyle } from './lib/avatarStyle';
import {
  DEMO_STORAGE_KEY,
  STARTING_CREDITS,
  clearDemoState,
  defaultDemoState,
  readDemoState,
  writeDemoState,
} from './lib/demoState';
import { buildDistrict, districtSignature, nearestEnterable, storeById, SPAWN } from './lib/district';
import { lookInput } from './lib/lookInput';
import { demoAudio } from './lib/audio';
import { QUALITY_STORAGE_KEY, browserHints, loadQualityId, qualitySettings, writeQualityId, type QualityId, type QualitySettings } from './lib/quality';
import { theme } from './lib/theme';
import { useHomov } from './hooks/useHomov';
import { MULTIPLAYER, RoomProvider, useBroadcastEvent, useEventListener, useMyPresence, useOthers, useStatus, type Presence } from './liveblocks';

const OFFLINE_HOLD_MS = 20_000;

const randomMe = (): Presence => ({
  x: SPAWN.x,
  z: SPAWN.z,
  color: `hsl(${Math.floor(Math.random() * 360)},70%,60%)`,
  name: `Guest${Math.floor(Math.random() * 1000)}`,
  status: 'active',
});
type Win = SafeWin & { t: number };

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
    x: Math.min(20, Math.max(-20, p.x)),
    z: Math.min(20, Math.max(-20, p.z)),
    color,
    name,
    status,
  };
}

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
    reset();
    addEventListener('keydown', reset);
    addEventListener('pointerdown', reset);
    return () => { clearTimeout(t); removeEventListener('keydown', reset); removeEventListener('pointerdown', reset); };
  }, [setMe]);
}

function useWins() {
  const [wins, setWins] = useState<Win[]>([]);
  const pushWin = useCallback((w: SafeWin) => setWins((p) => [{ ...w, t: Date.now() + Math.random() }, ...p].slice(0, 8)), []);
  return { wins, pushWin };
}

function Game({ me, setMe, others, broadcast, wins, pushWin, online }: {
  me: Presence;
  setMe: (p: Partial<Presence>) => void;
  others: Other[];
  broadcast: (w: SafeWin) => void;
  wins: Win[];
  pushWin: (w: SafeWin) => void;
  online: string;
}) {
  const boot = useRef(readDemoState(typeof localStorage === 'undefined' ? null : localStorage)).current;
  const geo = useGeolocation();
  const landscape = useLandscape();
  const [credits, setCredits] = useState(boot.credits);
  const [layoutKey, setLayoutKey] = useState<LayoutKey>(boot.layoutKey);
  const [avatar, setAvatar] = useState<AvatarStyle>(boot.avatar);
  const [openId, setOpenId] = useState<string | null>(null);
  const [slotOpen, setSlotOpen] = useState(false);
  const [boothOpen, setBoothOpen] = useState(false);
  const [bingoOpen, setBingoOpen] = useState(false);
  const [fading, setFading] = useState(false);
  const [displayName, setDisplayName] = useState(boot.displayName);
  const [muted, setMuted] = useState(demoAudio.muted);
  const [qualityId, setQualityId] = useState<QualityId>(() => loadQualityId(
    typeof localStorage === 'undefined' ? null : localStorage.getItem(QUALITY_STORAGE_KEY),
    browserHints(),
  ));
  const quality: QualitySettings = qualitySettings(qualityId, browserHints());
  const [nav, setNav] = useState<NavGoal>(null);
  const epoch = useRef(0);
  const [epochTick, setEpochTick] = useState(0);
  const homov = useHomov();
  useIdle(setMe);

  useEffect(() => {
    writeDemoState(typeof localStorage === 'undefined' ? null : localStorage, { credits, layoutKey, avatar, displayName });
  }, [credits, layoutKey, avatar, displayName]);

  useEffect(() => demoAudio.onMute(setMuted), []);
  useEffect(() => {
    const bootAudio = () => { void demoAudio.start(); };
    addEventListener('pointerdown', bootAudio, { once: true });
    addEventListener('keydown', bootAudio, { once: true });
    return () => {
      removeEventListener('pointerdown', bootAudio);
      removeEventListener('keydown', bootAudio);
    };
  }, []);
  useEffect(() => {
    if (displayName) setMe({ name: displayName.slice(0, 24) });
  }, [displayName, setMe]);

  const areaMode: AreaMode = geo.cell ? 'gps' : layoutKey === DEFAULT_LAYOUT ? 'default' : 'manual';
  const district = useMemo(
    () => buildDistrict(geo.cell ? geo.cell.seed : layoutKey, geo.cell ? 'Coarse-area procedural district' : layoutName(layoutKey)),
    [geo.cell, layoutKey],
  );
  const near = useMemo(() => nearestEnterable(me.x, me.z, district), [me.x, me.z, district]);
  const openStore = district.storefronts.find((store) => store.id === openId && store.enterable) ?? null;
  const memberUnlocked = homov.verified && homov.member;
  const rank = memberUnlocked ? homov.rank.id : 'guest';
  useEffect(() => {
    const lounge = storeById(district, GOLDEN_HOUR_ID);
    if (!lounge) return;
    const nearLounge = Math.hypot(me.x - lounge.interactX, me.z - lounge.interactZ) < 5;
    demoAudio.setNearLounge(nearLounge);
  }, [district, me.x, me.z]);

  useEffect(() => {
    setOpenId(null);
    setSlotOpen(false);
    setBoothOpen(false);
    setBingoOpen(false);
  }, [district.seed]);

  const fadeTo = (work: () => void) => {
    setFading(true);
    window.setTimeout(() => {
      work();
      window.setTimeout(() => setFading(false), 80);
    }, 420);
  };

  const goToStore = (id: string, mode: 'walk' | 'jump') => {
    const store = storeById(district, id);
    if (!store) return;
    const dx = store.x - store.interactX;
    const dz = store.z - store.interactZ;
    const yaw = Math.atan2(dx, dz);
    setNav({ x: store.interactX, z: store.interactZ, mode, yaw });
  };

  const onWin = (machineId: string, amount: number) => {
    const building = BUILDINGS.find((b) => b.id === machineId);
    if (!building || !Number.isInteger(amount) || amount < 1 || amount > MAX_PLAY_PAYOUT) return;
    const w = { name: me.name.slice(0, 24), machine: building.id, amount };
    pushWin(w);
    broadcast(w);
  };

  const spend = () => setCredits((c) => Math.max(0, c - 1));
  const payout = (amount: number) => {
    if (!Number.isInteger(amount) || amount < 1 || amount > MAX_PLAY_PAYOUT) return;
    setCredits((c) => c + amount);
    if (openStore?.playable) onWin(openStore.id, amount);
  };

  const reset = () => {
    epoch.current += 1;
    setEpochTick(epoch.current);
    clearDemoState(typeof localStorage === 'undefined' ? null : localStorage);
    geo.forget();
    const fresh = defaultDemoState();
    setCredits(fresh.credits);
    setAvatar(fresh.avatar);
    setLayoutKey(fresh.layoutKey);
    setOpenId(null);
    setSlotOpen(false);
    setBoothOpen(false);
    setBingoOpen(false);
    setDisplayName(fresh.displayName);
    setMe({ x: SPAWN.x, z: SPAWN.z, status: 'active', name: randomMe().name });
  };

  const chooseLayout = (key: LayoutKey) => {
    if (!isLayoutKey(key)) return;
    geo.forget();
    setLayoutKey(key);
    setOpenId(null);
    setSlotOpen(false);
    setBoothOpen(false);
    setBingoOpen(false);
  };

  const here = others.filter((o) => o.status !== 'offline').length + 1;
  const overlayOpen = openStore != null || slotOpen || boothOpen || bingoOpen || fading;

  const tagColor = !memberUnlocked ? undefined : rank === 'velvet' ? theme.mauve : rank === 'gold' ? theme.goldBright : theme.gold;

  return (
    <>
      <Scene
        me={me}
        setMe={setMe}
        others={others}
        district={district}
        avatar={avatar}
        locked={overlayOpen}
        hotId={openStore?.id ?? near?.id ?? null}
        nav={nav}
        onArrived={() => setNav(null)}
        memberBadge={memberUnlocked}
        tagColor={tagColor}
        rank={rank}
        displayName={displayName}
        quality={quality}
      />
      {!overlayOpen && <LookPad />}
      {!overlayOpen && <TouchJoystick disabled={false} size={landscape ? 92 : 112} />}
      <Hud
        online={online}
        here={here}
        credits={credits}
        pos={{ x: me.x, z: me.z }}
        layoutKey={layoutKey}
        onLayout={chooseLayout}
        areaMode={areaMode}
        geoStatus={geo.status}
        geoFailure={geo.failure}
        onLocate={geo.request}
        avatar={avatar}
        onAvatar={setAvatar}
        districtSignature={districtSignature(district)}
        movementLocked={overlayOpen}
        nearName={near?.name ?? null}
        nearEnterable={Boolean(near)}
        slotOpen={slotOpen}
        onEnterShop={() => { if (near) fadeTo(() => setOpenId(near.id)); }}
        onCloseSlot={() => setSlotOpen(false)}
        epoch={epochTick}
        onSpend={spend}
        onPayout={payout}
        wins={wins.map((w) => ({ ...w, machine: buildingName(w.machine) }))}
        onReset={reset}
        muted={muted}
        onMute={() => demoAudio.toggle()}
        displayName={displayName}
        onDisplayName={setDisplayName}
        onWalkTo={(id) => goToStore(id, 'walk')}
        onJumpTo={(id) => goToStore(id, 'jump')}
        homov={homov}
        quality={quality}
        onQuality={(id) => {
          setQualityId(id);
          writeQualityId(typeof localStorage === 'undefined' ? null : localStorage, id);
        }}
      />
      {openStore && !slotOpen && !boothOpen && !bingoOpen && (
        <Interior
          shopId={openStore.id}
          shopName={openStore.name}
          rank={rank}
          member={memberUnlocked}
          onExit={() => fadeTo(() => {
            const door = storeById(district, openStore.id);
            setOpenId(null);
            if (door) {
              setMe({ x: door.interactX, z: door.interactZ });
              lookInput.yaw = Math.atan2(door.x - door.interactX, door.z - door.interactZ);
            }
          })}
          onPlay={() => setSlotOpen(true)}
          onBooth={() => { if (memberUnlocked) setBoothOpen(true); }}
          onPlayBingo={() => setBingoOpen(true)}
        />
      )}
      {boothOpen && <MembersBooth rank={rank} onExit={() => setBoothOpen(false)} />}
      {bingoOpen && (
        <Bingo
          rank={rank}
          verified={memberUnlocked}
          onClose={() => setBingoOpen(false)}
          onReward={(amount) => {
            if (Number.isInteger(amount) && amount > 0) setCredits((c) => c + amount);
          }}
        />
      )}
      <FadeVeil on={fading} />
    </>
  );
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
  return <Game me={me} setMe={setMe} others={others} wins={wins} pushWin={pushWin} broadcast={(w) => broadcast({ type: 'win', ...w })} online={status === 'connected' ? 'online' : status} />;
}

function Solo() {
  const [me, set] = useState(randomMe);
  const setMe = useCallback((p: Partial<Presence>) => set((m) => ({ ...m, ...p })), []);
  const { wins, pushWin } = useWins();
  return <Game me={me} setMe={setMe} others={[]} wins={wins} pushWin={pushWin} broadcast={() => {}} online="solo, no Liveblocks key" />;
}

export default function App() {
  if (!MULTIPLAYER) return <Solo />;
  return <RoomProvider id="verseslots-mall-1" initialPresence={randomMe()}><Multiplayer /></RoomProvider>;
}

export { DEMO_STORAGE_KEY, STARTING_CREDITS };
