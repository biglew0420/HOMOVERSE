/** Coarse area anchor. Raw coordinates never leave `stabilize`. */

export const CELL_DEG = 0.05;
const HYSTERESIS_DEG = CELL_DEG * 0.2;

export type CoarseCell = { lat: number; lng: number; seed: string };

export const LAYOUTS = [
  { key: 'demo-default', name: 'Default promenade' },
  { key: 'layout-harbor', name: 'Harbor walk' },
  { key: 'layout-park', name: 'Park edge' },
  { key: 'layout-market', name: 'Night market' },
] as const;

export type LayoutKey = (typeof LAYOUTS)[number]['key'];
export const DEFAULT_LAYOUT: LayoutKey = 'demo-default';

export function isLayoutKey(value: string): value is LayoutKey {
  return LAYOUTS.some((layout) => layout.key === value);
}

export function layoutName(key: string): string {
  return LAYOUTS.find((layout) => layout.key === key)?.name ?? 'Default promenade';
}

function snap(value: number): number {
  const steps = Math.round(value / CELL_DEG);
  return Math.round(steps * CELL_DEG * 1000) / 1000;
}

/** Quantize to a ~5 km cell. The seed is for layout only and must not be shown. */
export function quantize(lat: number, lng: number): CoarseCell {
  const latR = snap(lat);
  const lngR = snap(lng);
  return { lat: latR, lng: lngR, seed: `area:${latR.toFixed(2)}:${lngR.toFixed(2)}` };
}

/**
 * Keep the locked cell when a new reading is only drifting across the border.
 * Returns a cell, never the raw sample.
 */
export function stabilize(lat: number, lng: number, locked: CoarseCell | null): CoarseCell {
  const nearest = quantize(lat, lng);
  if (!locked || nearest.seed === locked.seed) return locked ?? nearest;
  const half = CELL_DEG / 2;
  const nearLat = Math.abs(lat - locked.lat) <= half + HYSTERESIS_DEG;
  const nearLng = Math.abs(lng - locked.lng) <= half + HYSTERESIS_DEG;
  return nearLat && nearLng ? locked : nearest;
}

export type AreaMode = 'default' | 'manual' | 'gps';

export function areaNotice(mode: AreaMode): string {
  if (mode === 'gps') {
    return 'Procedural district from a coarse area sample. Not a map, not directions, and not your exact position.';
  }
  if (mode === 'manual') {
    return 'Hand-picked procedural district. Location was not used.';
  }
  return 'Default procedural district. Location is off.';
}

export type GeoFailure = 'denied' | 'timeout' | 'error';

export function classifyGeoError(code: number): GeoFailure {
  if (code === 1) return 'denied';
  if (code === 3) return 'timeout';
  return 'error';
}

export function geoFailureCopy(kind: GeoFailure): string {
  if (kind === 'denied') return 'Location denied. Still on this synthetic district.';
  if (kind === 'timeout') return 'Location timed out. Still on this synthetic district.';
  return 'Location unavailable. Still on this synthetic district.';
}
