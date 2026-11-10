import type { Building } from './buildings';
const R = 6371000; // Earth radius, meters
const rad = (d: number) => (d * Math.PI) / 180;
/** Haversine distance in meters. */
export function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
export const distanceToBuilding = (lat: number, lng: number, b: Building) => haversine(lat, lng, b.lat, b.lng);
/** Legacy stub. The walking prototype does not pay this bonus. */
export function proximityMultiplier(meters: number | null) {
  if (meters == null) return 1;
  if (meters <= 50) return 2;
  if (meters <= 200) return 1.5;
  return 1;
}
