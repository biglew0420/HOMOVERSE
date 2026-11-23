import { describe, expect, it } from 'vitest';
import { acceptWinEvent, MAX_PLAY_PAYOUT } from './winEvent';
import { areaNotice, classifyGeoError, geoFailureCopy, isLayoutKey, quantize, stabilize } from './area';
import { buildDistrict, blocked, districtSignature, frameStep, nearestEnterable, nearestPlayable, SPAWN, tryMove, wishVector, WALK_SPEED, MAX_FRAME_DT, WALK_RADIUS } from './district';
import { GOLDEN_HOUR_ID } from './shops';
import { loadDemoState, serializeDemoState, STARTING_CREDITS } from './demoState';
import { HUD_AA_PAIRS, contrastRatio } from './theme';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

describe('district', () => {
  it('is deterministic and walkable at spawn, with Golden Hour ahead', () => {
    const a = buildDistrict('demo-default', 'Default promenade');
    const b = buildDistrict('demo-default', 'Default promenade');
    expect(districtSignature(a)).toBe(districtSignature(b));
    expect(a.fountain).toBe(true);
    expect(blocked(SPAWN.x, SPAWN.z, 0.32, a.fountain)).toBe(false);
    const golden = a.storefronts.find((s) => s.id === GOLDEN_HOUR_ID);
    expect(golden).toBeTruthy();
    expect(golden!.padIndex).toBe(0);
    expect(golden!.z).toBeLessThan(0);
    expect(blocked(golden!.interactX, golden!.interactZ, 0.32, a.fountain)).toBe(false);
    for (const store of a.storefronts.filter((s) => s.enterable)) {
      expect(blocked(store.interactX, store.interactZ, 0.32, a.fountain)).toBe(false);
    }
  });

  it('changes with a different seed and keeps the plaza paths', () => {
    const a = buildDistrict('demo-default', 'Default promenade');
    const b = buildDistrict('layout-harbor', 'Harbor walk');
    expect(districtSignature(a)).not.toBe(districtSignature(b));
    expect(a.storefronts.find((s) => s.id === GOLDEN_HOUR_ID)?.padIndex).toBe(0);
    expect(b.storefronts.find((s) => s.id === GOLDEN_HOUR_ID)?.padIndex).toBe(0);
    expect(blocked(SPAWN.x, SPAWN.z, 0.32, false)).toBe(false);
    expect(blocked(-12, -12, 0.32, false)).toBe(true);
  });

  it('slides along the walk ring instead of leaving the plaza', () => {
    const next = tryMove(0, WALK_RADIUS - 0.5, 0, 3, false);
    expect(next.z).toBeLessThan(WALK_RADIUS);
    expect(blocked(next.x, next.z, 0.32, false)).toBe(false);
  });

  it('does not tunnel on a huge step', () => {
    const next = tryMove(SPAWN.x, SPAWN.z, -30, -30, true);
    expect(blocked(next.x, next.z, 0.32, true)).toBe(false);
    expect(Math.hypot(next.x, next.z)).toBeLessThan(WALK_RADIUS);
  });

  it('caps a frame step below a human stride', () => {
    expect(frameStep(0.5)).toBe(MAX_FRAME_DT);
    expect(frameStep(0.016)).toBeCloseTo(0.016);
    expect(WALK_SPEED * frameStep(1)).toBeLessThan(0.2);
  });

  it('maps stick-up at yaw 0 to north', () => {
    const wish = wishVector(0, -1, 0);
    expect(wish.dx).toBeCloseTo(0);
    expect(wish.dz).toBeCloseTo(-1);
  });

  it('finds an enterable door only from the walkway point', () => {
    const district = buildDistrict('demo-default', 'Default promenade');
    const store = district.storefronts.find((s) => s.id === GOLDEN_HOUR_ID)!;
    expect(nearestPlayable(store.interactX, store.interactZ, district)?.id).toBe(GOLDEN_HOUR_ID);
    expect(nearestEnterable(store.interactX, store.interactZ, district)?.id).toBe(GOLDEN_HOUR_ID);
    expect(nearestPlayable(SPAWN.x, SPAWN.z, district)).toBeNull();
    expect(nearestEnterable(0, 0, district)).toBeNull();
  });
});

describe('coarse area', () => {
  it('quantizes nearby samples onto one cell', () => {
    const a = quantize(40.712, -74.006);
    const b = quantize(40.724, -74.02);
    expect(a.seed).toBe(b.seed);
    expect(a.seed.includes('40.712')).toBe(false);
  });

  it('keeps a locked cell across border jitter and switches when clearly farther', () => {
    const locked = quantize(40.7128, -74.006);
    const jitter = stabilize(locked.lat + 0.026, locked.lng, locked);
    expect(jitter.seed).toBe(locked.seed);
    const far = stabilize(locked.lat + 0.2, locked.lng, locked);
    expect(far.seed).not.toBe(locked.seed);
  });

  it('does not put coordinates in player-facing copy', () => {
    for (const mode of ['default', 'manual', 'gps'] as const) {
      const text = `${areaNotice(mode)} ${geoFailureCopy(classifyGeoError(1))} ${geoFailureCopy(classifyGeoError(3))} ${geoFailureCopy(classifyGeoError(2))}`;
      expect(text).not.toMatch(/\d{1,3}\.\d{3,}/);
      expect(text.toLowerCase()).not.toContain('turn left');
    }
    expect(areaNotice('gps').toLowerCase()).toContain('not directions');
    expect(areaNotice('gps').toLowerCase()).toContain('not a map');
    expect(classifyGeoError(1)).toBe('denied');
    expect(classifyGeoError(3)).toBe('timeout');
    expect(classifyGeoError(2)).toBe('error');
  });

  it('only accepts known manual layouts', () => {
    expect(isLayoutKey('demo-default')).toBe(true);
    expect(isLayoutKey('area:40.70:-74.00')).toBe(false);
  });
});

describe('local demo state', () => {
  it('drops coordinates and token fields and clamps credits', () => {
    const raw = JSON.stringify({
      credits: 40.4,
      layoutKey: 'layout-park',
      avatar: { skin: 2, hair: 'long', hairColor: 3, outfit: 'ivory' },
      displayName: 'Lewis',
      lat: 40.7128,
      lng: -74.006,
      token: 'homo',
      wallet: '0xabc',
    });
    const state = loadDemoState(raw);
    expect(state.credits).toBe(40);
    expect(state.layoutKey).toBe('layout-park');
    expect(state.avatar.outfit).toBe('ivory');
    expect(state.displayName).toBe('Lewis');
    const saved = serializeDemoState(state);
    expect(saved).not.toMatch(/40\.71|latitude|wallet|token|lng/i);
  });

  it('rejects a gps seed stored as a layout', () => {
    const state = loadDemoState(JSON.stringify({ credits: 10, layoutKey: 'area:40.70:-74.00' }));
    expect(state.layoutKey).toBe('demo-default');
    expect(state.credits).toBe(10);
  });

  it('starts at the free grant', () => {
    expect(loadDemoState(null).credits).toBe(STARTING_CREDITS);
  });
});

describe('win checks still hold', () => {
  it('drops malformed and out-of-range payouts', () => {
    const map = new Map<number, number>();
    expect(acceptWinEvent({ type: 'win', name: 'A', machine: 'golden', amount: 10 }, 1, map, 1000)?.amount).toBe(10);
    expect(acceptWinEvent({ type: 'win', name: { bad: true }, machine: 'golden', amount: 10 }, 2, map, 1000)).toBeNull();
    expect(acceptWinEvent({ type: 'win', name: 'A', machine: 'golden', amount: MAX_PLAY_PAYOUT + 1 }, 3, map, 1000)).toBeNull();
    expect(acceptWinEvent({ type: 'win', name: 'A', machine: 'facade-0', amount: 10 }, 4, map, 1000)).toBeNull();
  });
});

import { OUTFITS as _OUTFITS, OUTFIT_LABELS as _LABELS, outfitColors as _oc, sanitizeAvatar as _san } from './avatarStyle';
import { describe as _d, it as _it, expect as _e } from 'vitest';
_d('knight and ivory outfits', () => {
  _it('are selectable, labeled and survive sanitize', () => {
    _e(_OUTFITS).toContain('knight');
    _e(_OUTFITS).toContain('ivory');
    _e(_LABELS.knight).toBe('Knight Armor');
    const k = _san({ skin: 0, hair: 'short', hairColor: 0, outfit: 'knight' });
    _e(k.outfit).toBe('knight');
    _e(_oc(k).armor).toBe(true);
    _e(_oc(_san({ outfit: 'ivory' })).armor).toBeFalsy();
  });
});

describe('HUD contrast', () => {
  it('meets WCAG AA for the documented HUD pairings', () => {
    for (const pair of HUD_AA_PAIRS) {
      expect(contrastRatio(pair.fg, pair.bg), pair.role).toBeGreaterThanOrEqual(pair.min);
    }
  });
});

describe('branding', () => {
  it('does not mention the retired cabinet motif in shipped source', () => {
    const banned = ['sea', 'horse'].join('');
    const root = join(__dirname, '..');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name === 'dist') continue;
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(ts|tsx|js|css|html|md)$/.test(name)) files.push(path);
      }
    };
    walk(root);
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      expect(text, file).not.toMatch(new RegExp(banned, 'i'));
    }
  });
});
