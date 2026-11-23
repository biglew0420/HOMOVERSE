// Shop identities for the walking mall. Coordinates are placed by the district ring.
// This file re-exports the canon shop list so win-event checks keep a stable import.
export { BUILDINGS, SHOPS, type ShopDef } from './shops';
export type Building = { id: string; name: string; color: string; x: number; z: number; lat: number; lng: number };
