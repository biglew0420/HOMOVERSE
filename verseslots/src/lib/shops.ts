import { theme } from './theme';

export type ShopKind = 'lounge' | 'tailor' | 'cafe' | 'members' | 'merch' | 'facade';
export type ShopMaterial = 'brick' | 'stone' | 'stucco';

export type ShopDef = {
  id: string;
  name: string;
  kind: ShopKind;
  enterable: boolean;
  playable: boolean;
  material: ShopMaterial;
  signColor: string;
  awningColor: string;
  href?: string;
  searchHint: string;
};

/** Canon shops of the ring. Golden Hour is the only demo slot. No token shop. */
export const SHOPS: ShopDef[] = [
  {
    id: 'golden',
    name: 'Golden Hour Lounge',
    kind: 'lounge',
    enterable: true,
    playable: true,
    material: 'stone',
    signColor: theme.goldTrim,
    awningColor: theme.blush,
    searchHint: 'Demo slot · Golden Hour',
  },
  {
    id: 'tailor',
    name: 'The Tailor',
    kind: 'tailor',
    enterable: true,
    playable: false,
    material: 'brick',
    signColor: theme.gold,
    awningColor: theme.blush,
    searchHint: 'Jackets, mirrors, find your fit',
  },
  {
    id: 'cafe',
    name: 'The Café',
    kind: 'cafe',
    enterable: true,
    playable: false,
    material: 'stucco',
    signColor: theme.ivory,
    awningColor: theme.coolRose,
    searchHint: 'Coffee at dusk',
  },
  {
    id: 'members',
    name: "Members' Lounge",
    kind: 'members',
    enterable: true,
    playable: false,
    material: 'stone',
    signColor: theme.goldTrim,
    awningColor: theme.mauve,
    searchHint: 'A quieter room, a kept seat',
  },
  {
    id: 'homogap',
    name: 'homoGAP',
    kind: 'merch',
    enterable: true,
    playable: false,
    material: 'brick',
    signColor: theme.goldTrim,
    awningColor: theme.icyPink,
    href: 'https://homogap-shop.fourthwall.com',
    searchHint: 'House merch · opens the real shop',
  },
  {
    id: 'ivory-row',
    name: 'Ivory Row',
    kind: 'facade',
    enterable: false,
    playable: false,
    material: 'stucco',
    signColor: theme.ivory,
    awningColor: theme.blush,
    searchHint: 'Window shopping only',
  },
  {
    id: 'dusk-atelier',
    name: 'Dusk Atelier',
    kind: 'facade',
    enterable: false,
    playable: false,
    material: 'brick',
    signColor: theme.coolRose,
    awningColor: theme.mauve,
    searchHint: 'Window shopping only',
  },
  {
    id: 'lamp-arcade',
    name: 'Lamp Arcade',
    kind: 'facade',
    enterable: false,
    playable: false,
    material: 'stone',
    signColor: theme.gold,
    awningColor: theme.blush,
    searchHint: 'Window shopping only',
  },
];

export const GOLDEN_HOUR_ID = 'golden';
export const HOMOGAP_SHOP_URL = 'https://homogap-shop.fourthwall.com';

/** Slot-machine identities accepted in multiplayer win events. Demo credits only. */
export const BUILDINGS = SHOPS.filter((shop) => shop.playable).map((shop) => ({
  id: shop.id,
  name: shop.name,
  color: shop.signColor,
  x: 0,
  z: 0,
  lat: 0,
  lng: 0,
}));

export function shopById(id: string): ShopDef | undefined {
  return SHOPS.find((shop) => shop.id === id);
}

export function searchShops(query: string): ShopDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return SHOPS;
  return SHOPS.filter((shop) => {
    const hay = `${shop.name} ${shop.searchHint} ${shop.kind} ${shop.enterable ? 'enter' : ''} ${shop.playable ? 'slot demo golden hour' : ''}`.toLowerCase();
    return hay.includes(q);
  });
}
