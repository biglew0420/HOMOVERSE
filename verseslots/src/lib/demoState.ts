import { DEFAULT_LAYOUT, isLayoutKey, type LayoutKey } from './area';
import { DEFAULT_AVATAR, sanitizeAvatar, type AvatarStyle } from './avatarStyle';

export const DEMO_STORAGE_KEY = 'verseslots.demo.v1';
export const STARTING_CREDITS = 100;
export const MAX_STORED_CREDITS = 9999;

export type DemoState = {
  credits: number;
  layoutKey: LayoutKey;
  avatar: AvatarStyle;
};

export function defaultDemoState(): DemoState {
  return { credits: STARTING_CREDITS, layoutKey: DEFAULT_LAYOUT, avatar: { ...DEFAULT_AVATAR } };
}

function clampCredits(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return STARTING_CREDITS;
  return Math.max(0, Math.min(MAX_STORED_CREDITS, Math.round(n)));
}

/** Local prototype state only. Drops coordinates, tokens, and unknown fields. */
export function loadDemoState(raw: string | null): DemoState {
  if (!raw) return defaultDemoState();
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const layout = typeof parsed.layoutKey === 'string' && isLayoutKey(parsed.layoutKey) ? parsed.layoutKey : DEFAULT_LAYOUT;
    return {
      credits: clampCredits(parsed.credits),
      layoutKey: layout,
      avatar: sanitizeAvatar(parsed.avatar),
    };
  } catch {
    return defaultDemoState();
  }
}

export function serializeDemoState(state: DemoState): string {
  const safe = {
    v: 1,
    credits: clampCredits(state.credits),
    layoutKey: isLayoutKey(state.layoutKey) ? state.layoutKey : DEFAULT_LAYOUT,
    avatar: sanitizeAvatar(state.avatar),
  };
  return JSON.stringify(safe);
}

export function readDemoState(storage: Pick<Storage, 'getItem'> | null): DemoState {
  if (!storage) return defaultDemoState();
  try {
    return loadDemoState(storage.getItem(DEMO_STORAGE_KEY));
  } catch {
    return defaultDemoState();
  }
}

export function writeDemoState(storage: Pick<Storage, 'setItem'> | null, state: DemoState) {
  if (!storage) return;
  try {
    storage.setItem(DEMO_STORAGE_KEY, serializeDemoState(state));
  } catch {
    /* private mode or quota; the session still plays */
  }
}

export function clearDemoState(storage: Pick<Storage, 'removeItem'> | null) {
  if (!storage) return;
  try {
    storage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
