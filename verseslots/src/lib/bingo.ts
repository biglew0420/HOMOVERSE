/** Homo Bingo: free local play in the Members' Lounge. Demo credits and demo daubers only. */

export const BINGO_NAME = 'Homo Bingo';
export const BINGO_COLUMNS = ['H', 'O', 'M', 'O', 'V'] as const;
export const BINGO_SIZE = 5;
export const FREE_CENTER = { row: 2, col: 2 } as const;
export const DAUBER_DISCLAIMER = 'Demo daubers. Your real HOMOV is never spent.';
export const BASE_DAUBERS_PER_CARD = 25;
export const BINGO_DEMO_REWARD = 5;

export type BingoSymbolId = 'hmark' | 'crown' | 'diamond' | 'champagne';

export const BINGO_SYMBOLS: Array<{ id: BingoSymbolId; label: string }> = [
  { id: 'hmark', label: 'Gold H' },
  { id: 'crown', label: 'Crown' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'champagne', label: 'Champagne' },
];

export const BINGO_NAMES = [
  'Golden Hour Lounge',
  'The Tailor',
  'The Café',
  'homoGAP',
  'Laurent',
  'Jules Wren',
  'Wes Holloway',
  "Members' Lounge",
] as const;

export type BingoCell = {
  id: string;
  row: number;
  col: number;
  kind: 'free' | 'symbol' | 'name' | 'number';
  label: string;
  /** Stable call identity, unique on a card. */
  callId: string;
};

export type BingoCall = {
  callId: string;
  column: (typeof BINGO_COLUMNS)[number];
  label: string;
  kind: BingoCell['kind'];
};

export type BingoLine = { type: 'row' | 'col' | 'diag'; index: number };

export type HomovCosmeticRank = 'guest' | 'member' | 'gold' | 'velvet';

/** Bigger free daily/card pack for verified holders. Still demo daubers, never on-chain. */
export function dauberPackSize(rank: HomovCosmeticRank = 'guest', verified = false): number {
  if (!verified || rank === 'guest') return BASE_DAUBERS_PER_CARD;
  if (rank === 'velvet') return 40;
  if (rank === 'gold') return 35;
  return 30;
}

export function usesGoldCoinSkin(rank: HomovCosmeticRank, verified: boolean): boolean {
  return verified && rank !== 'guest';
}

export function mulberry32(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Every callable square, including numbers mixed with house symbols and names. */
export function buildCallPool(): BingoCall[] {
  const pool: BingoCall[] = [];
  BINGO_COLUMNS.forEach((column, col) => {
    const start = col * 15 + 1;
    for (let n = start; n < start + 15; n++) {
      pool.push({ callId: `num-${n}`, column, label: String(n), kind: 'number' });
    }
  });
  BINGO_SYMBOLS.forEach((symbol, i) => {
    pool.push({
      callId: `sym-${symbol.id}`,
      column: BINGO_COLUMNS[i % 5],
      label: symbol.label,
      kind: 'symbol',
    });
  });
  BINGO_NAMES.forEach((name, i) => {
    pool.push({
      callId: `name-${name}`,
      column: BINGO_COLUMNS[i % 5],
      label: name,
      kind: 'name',
    });
  });
  return pool;
}

export const CALL_POOL = buildCallPool();

/** Numbers stay in their traditional 15-wide column band. Flavor can land in any column, once per card.
 *  The two "O" columns do not share a pool, so a callId is unique on the card.
 */
function picksForColumn(col: number, count: number, rand: () => number, used: Set<string>): BingoCall[] {
  const start = col * 15 + 1;
  const end = start + 15;
  const numeric = shuffle(
    CALL_POOL.filter((item) => item.kind === 'number' && Number(item.label) >= start && Number(item.label) < end && !used.has(item.callId)),
    rand,
  );
  const flavor = shuffle(
    CALL_POOL.filter((item) => item.kind !== 'number' && !used.has(item.callId)),
    rand,
  );
  const mixed: BingoCall[] = [];
  let n = 0;
  let f = 0;
  while (mixed.length < count && (n < numeric.length || f < flavor.length)) {
    const preferFlavor = flavor.length - f > 0 && (mixed.length < 1 ? rand() < 0.35 : rand() < 0.22);
    const next = preferFlavor && f < flavor.length ? flavor[f++] : numeric[n++] ?? flavor[f++];
    if (!next || used.has(next.callId)) continue;
    used.add(next.callId);
    mixed.push(next);
  }
  return mixed;
}

export function generateCard(seed = Date.now()): BingoCell[] {
  const rand = mulberry32(seed >>> 0);
  const used = new Set<string>(['free-center']);
  const cells: BingoCell[] = [];
  for (let col = 0; col < BINGO_SIZE; col++) {
    const needed = col === FREE_CENTER.col ? BINGO_SIZE - 1 : BINGO_SIZE;
    const picks = picksForColumn(col, needed, rand, used);
    let cursor = 0;
    for (let row = 0; row < BINGO_SIZE; row++) {
      if (row === FREE_CENTER.row && col === FREE_CENTER.col) {
        cells.push({
          id: 'free-center',
          row,
          col,
          kind: 'free',
          label: 'Gold H',
          callId: 'free-center',
        });
        continue;
      }
      const pick = picks[cursor++];
      if (!pick) throw new Error('Homo Bingo card pool exhausted');
      cells.push({
        id: `${row}:${col}`,
        row,
        col,
        kind: pick.kind,
        label: pick.label,
        callId: pick.callId,
      });
    }
  }
  return cells;
}

export function cellAt(card: BingoCell[], row: number, col: number): BingoCell | undefined {
  return card.find((cell) => cell.row === row && cell.col === col);
}

export function initialDaubed(card: BingoCell[]): Set<string> {
  return new Set(card.filter((cell) => cell.kind === 'free').map((cell) => cell.id));
}

/** Fresh card, clear daubs and calls. Dauber inventory is left alone (refill is separate and still free). */
export function resetBingoRound(seed = Date.now()): { card: BingoCell[]; daubed: Set<string> } {
  const card = generateCard(seed);
  return { card, daubed: initialDaubed(card) };
}

export function findWinningLines(card: BingoCell[], daubed: Set<string> | ReadonlySet<string>): BingoLine[] {
  const lines: BingoLine[] = [];
  const marked = (row: number, col: number) => {
    const cell = cellAt(card, row, col);
    return Boolean(cell && daubed.has(cell.id));
  };
  for (let row = 0; row < BINGO_SIZE; row++) {
    if (Array.from({ length: BINGO_SIZE }, (_, col) => marked(row, col)).every(Boolean)) {
      lines.push({ type: 'row', index: row });
    }
  }
  for (let col = 0; col < BINGO_SIZE; col++) {
    if (Array.from({ length: BINGO_SIZE }, (_, row) => marked(row, col)).every(Boolean)) {
      lines.push({ type: 'col', index: col });
    }
  }
  if (Array.from({ length: BINGO_SIZE }, (_, i) => marked(i, i)).every(Boolean)) {
    lines.push({ type: 'diag', index: 0 });
  }
  if (Array.from({ length: BINGO_SIZE }, (_, i) => marked(i, BINGO_SIZE - 1 - i)).every(Boolean)) {
    lines.push({ type: 'diag', index: 1 });
  }
  return lines;
}

export function hasBingo(card: BingoCell[], daubed: Set<string> | ReadonlySet<string>): boolean {
  return findWinningLines(card, daubed).length > 0;
}

/**
 * Spend one demo dauber to mark a called square.
 * The free center is already marked and never costs a dauber.
 * Returns the new state, or the old state if the daub is not allowed.
 */
export function tryDaub(options: {
  card: BingoCell[];
  daubed: Set<string>;
  cellId: string;
  called: Set<string>;
  daubers: number;
}): { daubed: Set<string>; daubers: number; ok: boolean; reason?: string } {
  const cell = options.card.find((item) => item.id === options.cellId);
  if (!cell) return { daubed: options.daubed, daubers: options.daubers, ok: false, reason: 'missing' };
  if (cell.kind === 'free' || options.daubed.has(cell.id)) {
    return { daubed: options.daubed, daubers: options.daubers, ok: false, reason: 'already' };
  }
  if (!options.called.has(cell.callId)) {
    return { daubed: options.daubed, daubers: options.daubers, ok: false, reason: 'not-called' };
  }
  if (options.daubers < 1) {
    return { daubed: options.daubed, daubers: options.daubers, ok: false, reason: 'no-daubers' };
  }
  const next = new Set(options.daubed);
  next.add(cell.id);
  return { daubed: next, daubers: options.daubers - 1, ok: true };
}

export function drawCall(remaining: BingoCall[], rand: () => number = Math.random): { call: BingoCall; remaining: BingoCall[] } | null {
  if (remaining.length === 0) return null;
  const index = Math.min(remaining.length - 1, Math.floor(rand() * remaining.length));
  const call = remaining[index];
  return { call, remaining: remaining.filter((_, i) => i !== index) };
}

export function callerSpeech(call: BingoCall, who: 'laurent' | 'jules'): string {
  const col = call.column;
  if (who === 'jules') {
    if (call.kind === 'name' && call.label === 'Jules Wren') return `O, that's me. Jules Wren. Mark it if you have it.`;
    if (call.kind === 'symbol') return `${col}: ${call.label}. A house mark, not a wager.`;
    return `${col}: ${call.label}. Daub it if it's on your card.`;
  }
  if (call.kind === 'name' && call.label === 'Laurent') return `The house calls my name. ${col}: Laurent. I'll be here either way.`;
  if (call.kind === 'symbol') return `The house calls ${col}: ${call.label}.`;
  return `${col}: ${call.label}. The evening keeps.`;
}
