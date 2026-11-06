import { BUILDINGS } from './buildings';

/** Placeholder 3-of-a-kind (10 credits) times the highest proximity multiplier (2). Play money only. */
export const MAX_PLAY_PAYOUT = 20;
const MAX_NAME_LEN = 24;
const MAX_MACHINE_LEN = 32;
const MIN_WIN_INTERVAL_MS = 1000;

export type SafeWin = { name: string; machine: string; amount: number };

function shortText(value: unknown, max: number): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'number' && !Number.isFinite(value)) return null;
  const text = String(value).trim().slice(0, max);
  return text.length > 0 ? text : null;
}

function payout(value: unknown): number | null {
  let n: number;
  if (typeof value === 'number') n = value;
  else if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim())) n = Number(value.trim());
  else return null;
  if (!Number.isFinite(n) || n < 1 || n > MAX_PLAY_PAYOUT) return null;
  return Math.round(n);
}

/**
 * Runtime check for a Liveblocks `win` broadcast.
 * Drops objects, unknown buildings, and payouts outside the play-money ceiling.
 * Allows at most one accepted win per connection per second.
 */
export function acceptWinEvent(
  event: unknown,
  connectionId: number,
  lastAcceptedAt: Map<number, number>,
  now = Date.now(),
): SafeWin | null {
  if (!event || typeof event !== 'object') return null;
  if (typeof connectionId !== 'number' || !Number.isInteger(connectionId)) return null;
  const raw = event as Record<string, unknown>;
  if (raw.type !== 'win') return null;

  const name = shortText(raw.name, MAX_NAME_LEN);
  const machineKey = shortText(raw.machine, MAX_MACHINE_LEN);
  const amount = payout(raw.amount);
  if (!name || !machineKey || amount == null) return null;

  const building = BUILDINGS.find((b) => b.id === machineKey || b.name === machineKey);
  if (!building) return null;

  const previous = lastAcceptedAt.get(connectionId) ?? 0;
  if (now - previous < MIN_WIN_INTERVAL_MS) return null;
  if (lastAcceptedAt.size > 200) {
    for (const [id, at] of lastAcceptedAt) {
      if (now - at > 60_000) lastAcceptedAt.delete(id);
    }
  }
  lastAcceptedAt.set(connectionId, now);
  return { name, machine: building.id, amount };
}
