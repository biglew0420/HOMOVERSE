/** Demo paytable. Stake is 1. Every number here is what a spin can actually add. Not certified math. */
export const DEMO_STAKE = 1;
/** Default (and currently only) slot cabinet design. */
export const DEFAULT_SLOT_DESIGN = 'Golden Hour';
export const SYMBOL_IDS = ['hmark', 'crown', 'diamond', 'champagne'] as const;
export type SymbolId = (typeof SYMBOL_IDS)[number];

export type PayLine = {
  id: SymbolId | 'stake';
  label: string;
  multiplier: number;
  note: string;
};

export const PAYTABLE: PayLine[] = [
  { id: 'hmark', label: 'Gold H', multiplier: 10, note: 'Three gold H marks pay 10' },
  { id: 'crown', label: 'Crown', multiplier: 8, note: 'Three crowns pay 8' },
  { id: 'diamond', label: 'Diamond', multiplier: 6, note: 'Three diamonds pay 6' },
  { id: 'champagne', label: 'Champagne', multiplier: 2, note: 'Two or three champagnes multiply that spin by 2' },
  { id: 'stake', label: 'Stake', multiplier: 1, note: 'Each spin spends 1 demo credit' },
];

const BASE_PAY: Record<Exclude<SymbolId, 'champagne'>, number> = {
  hmark: 10,
  crown: 8,
  diamond: 6,
};

export type SpinResolution = {
  amount: number;
  feature: boolean;
  detail: string;
};

function cap(amount: number): number {
  return Math.max(0, Math.min(20, Math.round(amount)));
}

/** Resolve three visible symbols. Amount is demo credits, never above 20. */
export function resolveDemoSpin(reels: readonly [SymbolId, SymbolId, SymbolId]): SpinResolution {
  const [a, b, c] = reels;
  const glasses = reels.filter((id) => id === 'champagne').length;

  if (glasses === 3) {
    const amount = cap(10 * 2);
    return { amount, feature: true, detail: `Three champagnes: 10 × 2 = ${amount} demo credits` };
  }

  if (glasses === 2) {
    const other = reels.find((id) => id !== 'champagne') as Exclude<SymbolId, 'champagne'>;
    const base = BASE_PAY[other];
    const amount = cap(base * 2);
    const label = PAYTABLE.find((line) => line.id === other)?.label ?? 'Symbol';
    return {
      amount,
      feature: true,
      detail: amount > 0 ? `Champagne feature: ${label} ${base} × 2 = ${amount} demo credits` : 'No win',
    };
  }

  if (a === b && b === c && a !== 'champagne') {
    const amount = cap(BASE_PAY[a]);
    const label = PAYTABLE.find((line) => line.id === a)?.label ?? 'Symbol';
    return { amount, feature: false, detail: `Three ${label.toLowerCase()}s: ${amount} demo credits` };
  }

  return { amount: 0, feature: false, detail: 'No win' };
}

const BAG: SymbolId[] = [
  'diamond', 'diamond', 'diamond', 'diamond',
  'crown', 'crown', 'crown',
  'hmark',
  'champagne', 'champagne',
];

export function drawSymbol(random: () => number = Math.random): SymbolId {
  const index = Math.min(BAG.length - 1, Math.floor(random() * BAG.length));
  return BAG[index];
}

export function drawReels(random: () => number = Math.random): [SymbolId, SymbolId, SymbolId] {
  return [drawSymbol(random), drawSymbol(random), drawSymbol(random)];
}
