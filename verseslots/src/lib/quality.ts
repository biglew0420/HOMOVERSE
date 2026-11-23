/** Render quality tiers for the plaza. High/Medium/Low plus LOD and DPR caps. */

export const QUALITY_IDS = ['high', 'medium', 'low'] as const;
export type QualityId = (typeof QUALITY_IDS)[number];

export const QUALITY_STORAGE_KEY = 'verseslots.quality.v1';

export type QualitySettings = {
  id: QualityId;
  label: string;
  dpr: [number, number];
  shadows: boolean;
  shadowMap: number;
  softShadows: boolean;
  ao: boolean;
  bloom: boolean;
  env: boolean;
  anisotropy: number;
  lampLights: number;
  dust: boolean;
  lodNear: number;
  lodFar: number;
  toneMapping: 'agx' | 'aces';
  exposure: number;
  antialias: boolean;
  treeSegments: number;
  circleSegments: number;
};

export function isQualityId(value: string): value is QualityId {
  return (QUALITY_IDS as readonly string[]).includes(value);
}

export function isMobileUa(ua: string): boolean {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
}

export type QualityHints = {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  userAgent?: string;
  devicePixelRatio?: number;
};

export function detectDefaultQuality(hints: QualityHints = {}): QualityId {
  const mobile = isMobileUa(hints.userAgent ?? '');
  const mem = hints.deviceMemory;
  const cores = hints.hardwareConcurrency ?? 4;
  if ((mem != null && mem <= 2) || cores <= 2) return 'low';
  if (mobile || (mem != null && mem <= 4) || cores <= 4) return 'medium';
  return 'high';
}

export function dprRange(id: QualityId, deviceDpr: number, mobile: boolean): [number, number] {
  const cap = id === 'high' ? (mobile ? 1.5 : 2) : id === 'medium' ? (mobile ? 1.25 : 1.5) : 1;
  const max = Math.max(1, Math.min(deviceDpr || 1, cap));
  return [1, max];
}

export function qualitySettings(id: QualityId, hints: QualityHints = {}): QualitySettings {
  const mobile = isMobileUa(hints.userAgent ?? '');
  const dpr = dprRange(id, hints.devicePixelRatio ?? 1, mobile);
  if (id === 'high') {
    return {
      id, label: 'High', dpr, shadows: true, shadowMap: 2048, softShadows: true,
      ao: true, bloom: true, env: true, anisotropy: 8, lampLights: 4, dust: true,
      lodNear: 10, lodFar: 18, toneMapping: 'agx', exposure: 0.92, antialias: true,
      treeSegments: 16, circleSegments: 64,
    };
  }
  if (id === 'medium') {
    return {
      id, label: 'Medium', dpr, shadows: true, shadowMap: 1024, softShadows: false,
      ao: false, bloom: true, env: true, anisotropy: 4, lampLights: 2, dust: true,
      lodNear: 7, lodFar: 14, toneMapping: 'aces', exposure: 0.95, antialias: true,
      treeSegments: 12, circleSegments: 48,
    };
  }
  return {
    id, label: 'Low', dpr, shadows: false, shadowMap: 0, softShadows: false,
    ao: false, bloom: false, env: false, anisotropy: 1, lampLights: 0, dust: false,
    lodNear: 5, lodFar: 10, toneMapping: 'aces', exposure: 1, antialias: false,
    treeSegments: 8, circleSegments: 32,
  };
}

export function lodLevel(distance: number, settings: QualitySettings): 'near' | 'mid' | 'far' {
  if (distance > settings.lodFar) return 'far';
  if (distance > settings.lodNear) return 'mid';
  return 'near';
}

export function loadQualityId(raw: string | null, hints: QualityHints = {}): QualityId {
  if (raw && isQualityId(raw)) return raw;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { id?: unknown };
      if (typeof parsed.id === 'string' && isQualityId(parsed.id)) return parsed.id;
    } catch {
      /* ignore */
    }
  }
  return detectDefaultQuality(hints);
}

export function writeQualityId(storage: Pick<Storage, 'setItem'> | null, id: QualityId) {
  if (!storage) return;
  try {
    storage.setItem(QUALITY_STORAGE_KEY, JSON.stringify({ v: 1, id }));
  } catch {
    /* private mode */
  }
}

export function browserHints(): QualityHints {
  if (typeof navigator === 'undefined') return {};
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    userAgent: nav.userAgent,
    devicePixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1,
  };
}
