/** Demo paytable. Stake is 1. Every number here is what a spin can actually add. Not certified math. */
export const DEMO_STAKE = 1;
export const SYMBOL_IDS = ['seahorse', 'hmark', 'jewel', 'arch', 'medallion'] as const;
export type SymbolId = (typeof SYMBOL_IDS)[number];

export type PayLine = {
  id: SymbolId | 'stake';
  label: string;
  multiplier: number;
  note: string;
};

export const PAYTABLE: PayLine[] = [
  { id: 'hmark', label: 'H mark', multiplier: 10, note: 'Three H marks pay 10' },
  { id: 'jewel', label: 'Jewel', multiplier: 8, note: 'Three jewels pay 8' },
  { id: 'arch', label: 'Arch', multiplier: 6, note: 'Three arches pay 6' },
  { id: 'medallion', label: 'Medallion', multiplier: 4, note: 'Three medallions pay 4' },
  { id: 'seahorse', label: 'Seahorse', multiplier: 2, note: 'Two or three seahorses multiply that spin by 2' },
  { id: 'stake', label: 'Stake', multiplier: 1, note: 'Each spin spends 1 demo credit' },
];

const BASE_PAY: Record<Exclude<SymbolId, 'seahorse'>, number> = {
  hmark: 10,
  jewel: 8,
  arch: 6,
  medallion: 4,
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
  const seahorses = reels.filter((id) => id === 'seahorse').length;

  if (seahorses === 3) {
    const amount = cap(10 * 2);
    return { amount, feature: true, detail: `Three seahorses: 10 × 2 = ${amount} demo credits` };
  }

  if (seahorses === 2) {
    const other = reels.find((id) => id !== 'seahorse') as Exclude<SymbolId, 'seahorse'>;
    const base = BASE_PAY[other];
    const amount = cap(base * 2);
    const label = PAYTABLE.find((line) => line.id === other)?.label ?? 'Symbol';
    return {
      amount,
      feature: true,
      detail: amount > 0 ? `Seahorse feature: ${label} ${base} × 2 = ${amount} demo credits` : 'No win',
    };
  }

  if (a === b && b === c && a !== 'seahorse') {
    const amount = cap(BASE_PAY[a]);
    const label = PAYTABLE.find((line) => line.id === a)?.label ?? 'Symbol';
    return { amount, feature: false, detail: `Three ${label.toLowerCase()}s: ${amount} demo credits` };
  }

  return { amount: 0, feature: false, detail: 'No win' };
}

const BAG: SymbolId[] = [
  'medallion', 'medallion', 'medallion', 'medallion',
  'arch', 'arch', 'arch',
  'jewel', 'jewel',
  'hmark',
  'seahorse', 'seahorse',
];

export function drawSymbol(random: () => number = Math.random): SymbolId {
  const index = Math.min(BAG.length - 1, Math.floor(random() * BAG.length));
  return BAG[index];
}

export function drawReels(random: () => number = Math.random): [SymbolId, SymbolId, SymbolId] {
  return [drawSymbol(random), drawSymbol(random), drawSymbol(random)];
}
