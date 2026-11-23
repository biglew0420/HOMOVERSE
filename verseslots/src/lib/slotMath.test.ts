import { describe, expect, it } from 'vitest';
import { DEFAULT_SLOT_DESIGN, SYMBOL_IDS, drawReels, resolveDemoSpin, type SymbolId } from './slotMath';

describe('demo slot math', () => {
  it('pays the printed three-of-a-kind lines', () => {
    expect(resolveDemoSpin(['hmark', 'hmark', 'hmark'])).toMatchObject({ amount: 10, feature: false });
    expect(resolveDemoSpin(['crown', 'crown', 'crown']).amount).toBe(8);
    expect(resolveDemoSpin(['diamond', 'diamond', 'diamond']).amount).toBe(6);
  });

  it('applies the champagne multiplier that the panel shows', () => {
    expect(resolveDemoSpin(['champagne', 'champagne', 'champagne'])).toMatchObject({ amount: 20, feature: true });
    const crown = resolveDemoSpin(['champagne', 'crown', 'champagne']);
    expect(crown.feature).toBe(true);
    expect(crown.amount).toBe(16);
    expect(crown.detail).toContain('8 × 2 = 16');
  });

  it('pays nothing for a mixed line and stays inside the demo cap', () => {
    expect(resolveDemoSpin(['hmark', 'crown', 'diamond']).amount).toBe(0);
    expect(resolveDemoSpin(['champagne', 'diamond', 'hmark']).amount).toBe(0);
    const samples: Array<[SymbolId, SymbolId, SymbolId]> = [
      ['hmark', 'hmark', 'hmark'],
      ['champagne', 'champagne', 'champagne'],
      ['champagne', 'hmark', 'champagne'],
      ['diamond', 'champagne', 'champagne'],
    ];
    for (const reels of samples) {
      const resolved = resolveDemoSpin(reels);
      expect(resolved.amount).toBeGreaterThanOrEqual(0);
      expect(resolved.amount).toBeLessThanOrEqual(20);
      expect(Number.isInteger(resolved.amount)).toBe(true);
    }
  });

  it('draws only known symbols', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) drawReels(() => i / 40).forEach((id) => seen.add(id));
    expect([...seen].every((id) => (SYMBOL_IDS as readonly string[]).includes(id))).toBe(true);
  });
});

describe('release defaults', () => {
  it('uses Golden Hour as the default slot', () => {
    expect(DEFAULT_SLOT_DESIGN).toBe('Golden Hour');
    expect(SYMBOL_IDS).toEqual(['hmark', 'crown', 'diamond', 'champagne']);
  });
});
