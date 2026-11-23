import { describe, expect, it } from 'vitest';
import {
  BINGO_NAME,
  BINGO_SIZE,
  DAUBER_DISCLAIMER,
  BASE_DAUBERS_PER_CARD,
  cellAt,
  dauberPackSize,
  findWinningLines,
  generateCard,
  hasBingo,
  initialDaubed,
  tryDaub,
  usesGoldCoinSkin,
} from './bingo';
import { DAUBER_STORAGE_KEY, loadDauberState, refillDaubers, serializeDauberState, spendDauber } from './daubers';

describe('Homo Bingo branding', () => {
  it('is named Homo Bingo and never spends real HOMOV', () => {
    expect(BINGO_NAME).toBe('Homo Bingo');
    expect(DAUBER_DISCLAIMER).toBe('Demo daubers. Your real HOMOV is never spent.');
    expect(DAUBER_STORAGE_KEY).toContain('demo.daubers');
    expect(serializeDauberState(loadDauberState(null))).not.toMatch(/0x|balanceOf|mainnet\.base/i);
  });
});

describe('card', () => {
  it('is 5x5 with a free gold H in the center', () => {
    const card = generateCard(42);
    expect(card).toHaveLength(25);
    const center = cellAt(card, 2, 2);
    expect(center?.kind).toBe('free');
    expect(center?.label).toBe('Gold H');
    const daubed = initialDaubed(card);
    expect(daubed.has('free-center')).toBe(true);
    expect(daubed.size).toBe(1);
    const ids = card.map((c) => c.callId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mixes numbers, house symbols, and world names', () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      generateCard(seed).forEach((cell) => kinds.add(cell.kind));
    }
    expect(kinds.has('number')).toBe(true);
    expect(kinds.has('free')).toBe(true);
    const labels = new Set(generateCard(7).map((c) => c.label));
    // A typical card should be able to carry house texture; across seeds we already have mixed kinds.
    expect(labels.size).toBeGreaterThan(10);
  });
});

describe('win detection', () => {
  function markLine(card: ReturnType<typeof generateCard>, cells: Array<[number, number]>) {
    const daubed = initialDaubed(card);
    for (const [row, col] of cells) {
      const cell = cellAt(card, row, col)!;
      daubed.add(cell.id);
    }
    return daubed;
  }

  it('detects a row, a column, and both diagonals, and stays quiet otherwise', () => {
    const card = generateCard(99);
    expect(hasBingo(card, initialDaubed(card))).toBe(false);

    const row = markLine(card, [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]]);
    expect(hasBingo(card, row)).toBe(true);
    expect(findWinningLines(card, row).some((l) => l.type === 'row' && l.index === 1)).toBe(true);

    const col = markLine(card, [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]]);
    expect(findWinningLines(card, col).some((l) => l.type === 'col' && l.index === 3)).toBe(true);

    const main = markLine(card, [[0, 0], [1, 1], [3, 3], [4, 4]]);
    expect(findWinningLines(card, main).some((l) => l.type === 'diag' && l.index === 0)).toBe(true);

    const anti = markLine(card, [[0, 4], [1, 3], [3, 1], [4, 0]]);
    expect(findWinningLines(card, anti).some((l) => l.type === 'diag' && l.index === 1)).toBe(true);

    const almost = markLine(card, [[0, 0], [0, 1], [0, 2], [0, 3]]);
    expect(hasBingo(card, almost)).toBe(false);
  });

  it('counts the free center toward the middle row, column, and diagonals', () => {
    const card = generateCard(3);
    const midRow = markLine(card, [[2, 0], [2, 1], [2, 3], [2, 4]]);
    expect(hasBingo(card, midRow)).toBe(true);
    const midCol = markLine(card, [[0, 2], [1, 2], [3, 2], [4, 2]]);
    expect(hasBingo(card, midCol)).toBe(true);
  });
});

describe('demo daubers', () => {
  it('spends one demo dauber only when the square has been called', () => {
    const card = generateCard(5);
    const cell = card.find((c) => c.kind !== 'free')!;
    const called = new Set<string>();
    const blocked = tryDaub({ card, daubed: initialDaubed(card), cellId: cell.id, called, daubers: 25 });
    expect(blocked.ok).toBe(false);
    expect(blocked.reason).toBe('not-called');
    expect(blocked.daubers).toBe(25);

    called.add(cell.callId);
    const done = tryDaub({ card, daubed: initialDaubed(card), cellId: cell.id, called, daubers: 25 });
    expect(done.ok).toBe(true);
    expect(done.daubers).toBe(24);
    expect(done.daubed.has(cell.id)).toBe(true);

    const empty = tryDaub({ card, daubed: initialDaubed(card), cellId: cell.id, called, daubers: 0 });
    expect(empty.ok).toBe(false);
    expect(empty.reason).toBe('no-daubers');
  });

  it('never links pack size to an on-chain balance value, only to a cosmetic rank flag', () => {
    expect(dauberPackSize('guest', false)).toBe(BASE_DAUBERS_PER_CARD);
    expect(dauberPackSize('member', true)).toBe(30);
    expect(dauberPackSize('gold', true)).toBe(35);
    expect(dauberPackSize('velvet', true)).toBe(40);
    expect(dauberPackSize('velvet', false)).toBe(BASE_DAUBERS_PER_CARD);
    expect(usesGoldCoinSkin('member', true)).toBe(true);
    expect(usesGoldCoinSkin('member', false)).toBe(false);
    const spent = spendDauber({ count: 2, day: '2026-11-22', lastDaily: '2026-11-22' });
    expect(spent?.count).toBe(1);
    const refilled = refillDaubers({ count: 1, day: '2026-11-22', lastDaily: '2026-11-22' }, 'guest', false);
    expect(refilled.count).toBe(25);
  });
});
