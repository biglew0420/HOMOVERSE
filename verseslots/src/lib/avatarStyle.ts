export const SKIN_TONES = ['#f3d2b5', '#e0b08a', '#c68642', '#8d5524', '#4a312c'] as const;
export const HAIR_STYLES = ['none', 'short', 'long'] as const;
export const HAIR_COLORS = ['#1c1c1c', '#4a3428', '#c4a574', '#d4af37', '#6b2d2d'] as const;
export const OUTFITS = ['black-gold', 'gold-trim', 'night', 'ivory', 'knight'] as const;

export const OUTFIT_LABELS: Record<(typeof OUTFITS)[number], string> = {
  'black-gold': 'Black & Gold',
  'gold-trim': 'Gold Trim',
  night: 'Night',
  ivory: 'Ivory',
  knight: 'Knight Armor',
};

export type HairStyle = (typeof HAIR_STYLES)[number];
export type OutfitId = (typeof OUTFITS)[number];

export type AvatarStyle = {
  skin: number;
  hair: HairStyle;
  hairColor: number;
  outfit: OutfitId;
};

export type OutfitColors = { jacket: string; pants: string; accent: string; shoes: string; armor?: boolean; cape?: string };

const OUTFIT_COLORS: Record<OutfitId, OutfitColors> = {
  'black-gold': { jacket: '#141210', pants: '#0e0e0e', accent: '#d4af37', shoes: '#1a1a1a' },
  'gold-trim': { jacket: '#2a2418', pants: '#12100e', accent: '#f0d78c', shoes: '#1a140c' },
  night: { jacket: '#1b2430', pants: '#12141a', accent: '#d4af37', shoes: '#0e1014' },
  ivory: { jacket: '#e7d8c4', pants: '#2a2622', accent: '#d4af37', shoes: '#1a1612' },
  knight: { jacket: '#a9adb3', pants: '#7d8187', accent: '#d4af37', shoes: '#5c6066', armor: true, cape: '#0e0d0c' },
};

export const DEFAULT_AVATAR: AvatarStyle = { skin: 1, hair: 'short', hairColor: 0, outfit: 'black-gold' };

function clampIndex(value: unknown, length: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n < 0 || n >= length) return 0;
  return n;
}

export function sanitizeAvatar(value: unknown): AvatarStyle {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const hair = HAIR_STYLES.includes(raw.hair as HairStyle) ? (raw.hair as HairStyle) : DEFAULT_AVATAR.hair;
  const outfit = OUTFITS.includes(raw.outfit as OutfitId) ? (raw.outfit as OutfitId) : DEFAULT_AVATAR.outfit;
  return {
    skin: clampIndex(raw.skin, SKIN_TONES.length),
    hair,
    hairColor: clampIndex(raw.hairColor, HAIR_COLORS.length),
    outfit,
  };
}

export function outfitColors(style: AvatarStyle): OutfitColors {
  return OUTFIT_COLORS[style.outfit];
}

export function skinColor(style: AvatarStyle): string {
  return SKIN_TONES[style.skin] ?? SKIN_TONES[0];
}

export function hairColor(style: AvatarStyle): string {
  return HAIR_COLORS[style.hairColor] ?? HAIR_COLORS[0];
}
