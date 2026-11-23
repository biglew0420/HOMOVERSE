/** Shared house palette. Black-and-gold is the core; gold is the primary accent; cold pink is layered in, never a replacement. */

export const theme = {
  black: '#0B0B10',
  charcoal: '#14120E',
  ink: '#070605',
  ivory: '#F4EEE2',
  cream: '#F6EDD6',
  gold: '#C9A45B',
  goldBright: '#E0C36A',
  goldTrim: '#D4AF37',
  antiqueGold: '#C9A45B',
  icyPink: '#F4D9E4',
  blush: '#E8B8C8',
  mauve: '#B48A9E',
  coolRose: '#C98BA5',
  plum: '#2A1630',
  dusk: '#3A2040',
  horizon: '#C9A45B',
  marble: '#16141A',
  velvet: '#3A2433',
} as const;

export type ThemeColor = keyof typeof theme;

/** WCAG relative luminance for an #RRGGBB color. */
export function luminance(hex: string): number {
  const raw = hex.replace('#', '');
  const n = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const ch = (i: number) => {
    const v = parseInt(n.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4);
}

export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/** HUD body and label pairings that must meet AA (4.5:1 for small text, 3:1 for large). */
export const HUD_AA_PAIRS: Array<{ fg: string; bg: string; min: number; role: string }> = [
  { fg: theme.ivory, bg: theme.black, min: 4.5, role: 'HUD body text' },
  { fg: theme.cream, bg: theme.black, min: 4.5, role: 'HUD cream text' },
  { fg: theme.ivory, bg: theme.charcoal, min: 4.5, role: 'HUD button label' },
  { fg: theme.gold, bg: theme.black, min: 3, role: 'HUD gold title (large)' },
];

export function cssVars(): string {
  return [
    `--hv-black:${theme.black}`,
    `--hv-charcoal:${theme.charcoal}`,
    `--hv-ivory:${theme.ivory}`,
    `--hv-cream:${theme.cream}`,
    `--hv-gold:${theme.gold}`,
    `--hv-gold-trim:${theme.goldTrim}`,
    `--hv-icy:${theme.icyPink}`,
    `--hv-blush:${theme.blush}`,
    `--hv-mauve:${theme.mauve}`,
    `--hv-rose:${theme.coolRose}`,
    `--hv-plum:${theme.plum}`,
  ].join(';');
}
