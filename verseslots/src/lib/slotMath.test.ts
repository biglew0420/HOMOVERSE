import { describe, expect, it } from 'vitest';
import { drawReels, resolveDemoSpin, type SymbolId } from './slotMath';

describe('demo slot math', () => {
  it('pays the printed three-of-a-kind lines', () => {
    expect(resolveDemoSpin(['hmark', 'hmark', 'hmark'])).toMatchObject({ amount: 10, feature: false });
    expect(resolveDemoSpin(['jewel', 'jewel', 'jewel']).amount).toBe(8);
    expect(resolveDemoSpin(['arch', 'arch', 'arch']).amount).toBe(6);
    expect(resolveDemoSpin(['medallion', 'medallion', 'medallion']).amount).toBe(4);
  });

  it('applies the seahorse multiplier that the panel shows', () => {
    expect(resolveDemoSpin(['seahorse', 'seahorse', 'seahorse'])).toMatchObject({ amount: 20, feature: true });
    const jewel = resolveDemoSpin(['seahorse', 'jewel', 'seahorse']);
    expect(jewel.feature).toBe(true);
    expect(jewel.amount).toBe(16);
    expect(jewel.detail).toContain('8 × 2 = 16');
  });

  it('pays nothing for a mixed line and stays inside the demo cap', () => {
    expect(resolveDemoSpin(['hmark', 'jewel', 'arch']).amount).toBe(0);
    expect(resolveDemoSpin(['seahorse', 'arch', 'medallion']).amount).toBe(0);
    const samples: Array<[SymbolId, SymbolId, SymbolId]> = [
      ['hmark', 'hmark', 'hmark'],
      ['seahorse', 'seahorse', 'seahorse'],
      ['seahorse', 'hmark', 'seahorse'],
      ['medallion', 'seahorse', 'seahorse'],
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
    expect([...seen].every((id) => ['seahorse', 'hmark', 'jewel', 'arch', 'medallion'].includes(id))).toBe(true);
  });
});

describe('release defaults', () => {
  it('uses the Gold Seahorse design as the default slot', async () => {
    const { DEFAULT_SLOT_DESIGN } = await import('./slotMath');
    expect(DEFAULT_SLOT_DESIGN).toBe('Gold Seahorse');
  });
});
