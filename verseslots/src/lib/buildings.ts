// Known demo storefront identities. x/z/lat/lng are legacy placeholders.
// The walking district places these by id. Coordinates are not a map and do not pay a bonus.
export type Building = { id: string; name: string; color: string; x: number; z: number; lat: number; lng: number };
export const BUILDINGS: Building[] = [
  { id: 'gold', name: 'Gold Rush', color: '#d4af37', x: -9, z: -6, lat: 40.7128, lng: -74.006 },
  { id: 'neon', name: 'Neon Nights', color: '#ff3cac', x: -3, z: -6, lat: 40.7131, lng: -74.0055 },
  { id: 'lucky', name: 'Lucky 7s', color: '#3cf0ff', x: 3, z: -6, lat: 40.7134, lng: -74.005 },
  { id: 'cherry', name: 'Cherry Lane', color: '#ff5a3c', x: 9, z: -6, lat: 40.7137, lng: -74.0045 },
];
