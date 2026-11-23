import { BASE_DAUBERS_PER_CARD, DAUBER_DISCLAIMER, dauberPackSize, type HomovCosmeticRank } from './bingo';

export const DAUBER_STORAGE_KEY = 'verseslots.demo.daubers.v1';
export { DAUBER_DISCLAIMER };

export type DauberState = {
  count: number;
  day: string;
  /** Local calendar date of the last free daily pack. */
  lastDaily: string;
  /** Pack size already granted today, so a rank upgrade only adds the difference. */
  packGranted?: number;
};

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function defaultDauberState(rank: HomovCosmeticRank = 'guest', verified = false): DauberState {
  const day = today();
  const pack = dauberPackSize(rank, verified);
  return { count: pack, day, lastDaily: day, packGranted: pack };
}

/** Local demo inventory only. Never reads or writes an on-chain balance. */
export function loadDauberState(raw: string | null, rank: HomovCosmeticRank = 'guest', verified = false): DauberState {
  const fallback = defaultDauberState(rank, verified);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const count = typeof parsed.count === 'number' && Number.isFinite(parsed.count)
      ? Math.max(0, Math.min(999, Math.round(parsed.count)))
      : fallback.count;
    const lastDaily = typeof parsed.lastDaily === 'string' ? parsed.lastDaily : '';
    const packGranted = typeof parsed.packGranted === 'number' && Number.isFinite(parsed.packGranted)
      ? Math.max(0, Math.round(parsed.packGranted))
      : BASE_DAUBERS_PER_CARD;
    const day = today();
    if (lastDaily !== day) {
      const pack = dauberPackSize(rank, verified);
      return { count: pack, day, lastDaily: day, packGranted: pack };
    }
    return applyRankPack({ count, day, lastDaily, packGranted }, rank, verified);
  } catch {
    return fallback;
  }
}

export function serializeDauberState(state: DauberState): string {
  return JSON.stringify({
    v: 1,
    count: state.count,
    lastDaily: state.lastDaily,
    packGranted: state.packGranted,
    kind: 'demo-daubers',
    disclaimer: DAUBER_DISCLAIMER,
  });
}

export function readDaubers(storage: Pick<Storage, 'getItem'> | null, rank: HomovCosmeticRank = 'guest', verified = false): DauberState {
  if (!storage) return defaultDauberState(rank, verified);
  try {
    return loadDauberState(storage.getItem(DAUBER_STORAGE_KEY), rank, verified);
  } catch {
    return defaultDauberState(rank, verified);
  }
}

export function writeDaubers(storage: Pick<Storage, 'setItem'> | null, state: DauberState) {
  if (!storage) return;
  try {
    storage.setItem(DAUBER_STORAGE_KEY, serializeDauberState(state));
  } catch {
    /* private mode */
  }
}

/** Free refill to the pack size. Never touches HOMOV. */
export function refillDaubers(state: DauberState, rank: HomovCosmeticRank = 'guest', verified = false): DauberState {
  const pack = dauberPackSize(rank, verified);
  const day = today();
  return { ...state, count: pack, day, lastDaily: day, packGranted: pack };
}

/**
 * If a verified holder ranks up today, grant only the pack-size difference.
 * Never reads an on-chain balance; rank/verified are cosmetic flags from the client-side check.
 */
export function applyRankPack(state: DauberState, rank: HomovCosmeticRank = 'guest', verified = false): DauberState {
  const pack = dauberPackSize(rank, verified);
  const granted = state.packGranted ?? BASE_DAUBERS_PER_CARD;
  if (pack <= granted) return { ...state, packGranted: granted };
  return { ...state, count: state.count + (pack - granted), packGranted: pack };
}

export function spendDauber(state: DauberState): DauberState | null {
  if (state.count < 1) return null;
  return { ...state, count: state.count - 1 };
}
