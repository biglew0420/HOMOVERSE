import { describe, expect, it } from 'vitest';
import {
  HOMOV_CONFIG,
  encodeBalanceOf,
  isHexAddress,
  isMember,
  normalizeAddress,
  normalizeBasename,
  parseTokenBalance,
  rankFromBalance,
  readHomovBalance,
  readHomovBalanceCached,
  clearHomovCache,
  resolveAddressOrName,
} from './homov';

describe('HOMOV config', () => {
  it('points at the Base HOMOV token and refuses write endpoints', () => {
    expect(HOMOV_CONFIG.address).toBe('0x1C9819c04C6d8Af322aAd71F56ABF51690173136');
    expect(HOMOV_CONFIG.chainId).toBe(8453);
    expect(HOMOV_CONFIG.decimals).toBe(18);
    expect(HOMOV_CONFIG.memberThreshold).toBe(1);
    expect(HOMOV_CONFIG.disclaimer).toBe('Read-only. We never move your tokens.');
    expect(HOMOV_CONFIG.rpcUrls[0]).toBe('https://mainnet.base.org');
  });
});

describe('balance parsing', () => {
  it('reads whole tokens from uint256 hex', () => {
    expect(parseTokenBalance('0x0')).toBe(0);
    expect(parseTokenBalance('0x')).toBe(0);
    const one = (10n ** 18n).toString(16);
    expect(parseTokenBalance(`0x${one}`)).toBe(1);
    const gold = (1000n * 10n ** 18n).toString(16);
    expect(parseTokenBalance(`0x${gold}`)).toBe(1000);
    const velvet = (10_000n * 10n ** 18n).toString(16);
    expect(parseTokenBalance(`0x${velvet}`)).toBe(10_000);
  });

  it('keeps fractional tokens below a whole unit', () => {
    const half = (5n * 10n ** 17n).toString(16);
    expect(parseTokenBalance(`0x${half}`)).toBeCloseTo(0.5, 6);
  });

  it('rejects non-hex', () => {
    expect(() => parseTokenBalance('nope')).toThrow();
  });
});

describe('rank thresholds', () => {
  it('maps balances to cosmetic ranks only', () => {
    expect(rankFromBalance(0).id).toBe('guest');
    expect(rankFromBalance(0.9).id).toBe('guest');
    expect(rankFromBalance(1).id).toBe('member');
    expect(rankFromBalance(999).id).toBe('member');
    expect(rankFromBalance(1000).id).toBe('gold');
    expect(rankFromBalance(9999).id).toBe('gold');
    expect(rankFromBalance(10_000).id).toBe('velvet');
    expect(isMember(0)).toBe(false);
    expect(isMember(1)).toBe(true);
  });
});

describe('address helpers', () => {
  it('normalizes 0x addresses and basenames', () => {
    expect(isHexAddress('0x1C9819c04C6d8Af322aAd71F56ABF51690173136')).toBe(true);
    expect(normalizeAddress('0x1C9819c04C6d8Af322aAd71F56ABF51690173136')).toBe(
      '0x1c9819c04c6d8af322aad71f56abf51690173136',
    );
    expect(normalizeAddress('not-an-address')).toBeNull();
    expect(normalizeBasename('lewis')).toBe('lewis.base.eth');
    expect(normalizeBasename('lewis.base')).toBe('lewis.base.eth');
    expect(normalizeBasename('lewis.base.eth')).toBe('lewis.base.eth');
    expect(encodeBalanceOf('0x1C9819c04C6d8Af322aAd71F56ABF51690173136')).toMatch(/^0x70a08231/);
  });
});

describe('mocked RPC reads', () => {
  const wallet = '0x1111111111111111111111111111111111111111';
  const oneToken = `0x${(10n ** 18n).toString(16).padStart(64, '0')}`;

  it('calls balanceOf via eth_call and falls back to the second RPC', async () => {
    const calls: string[] = [];
    const post = async (url: string) => {
      calls.push(url);
      if (url.includes('mainnet.base.org')) throw new Error('down');
      return { result: oneToken };
    };
    const read = await readHomovBalance(wallet, { post, urls: HOMOV_CONFIG.rpcUrls });
    expect(read.balance).toBe(1);
    expect(read.source).toBe('https://base-rpc.publicnode.com');
    expect(calls).toEqual(['https://mainnet.base.org', 'https://base-rpc.publicnode.com']);
  });

  it('caches a successful read for five minutes', async () => {
    clearHomovCache();
    let hits = 0;
    const post = async () => {
      hits += 1;
      return { result: oneToken };
    };
    const first = await readHomovBalanceCached(wallet, { post, now: 1_000, cacheMs: 5 * 60 * 1000 });
    const second = await readHomovBalanceCached(wallet, { post, now: 1_000 + 60_000, cacheMs: 5 * 60 * 1000 });
    const third = await readHomovBalanceCached(wallet, { post, now: 1_000 + 5 * 60 * 1000, cacheMs: 5 * 60 * 1000 });
    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(second.balance).toBe(1);
    expect(third.cached).toBe(false);
    expect(hits).toBe(2);
  });

  it('resolves a pasted 0x address without touching a wallet', async () => {
    const address = await resolveAddressOrName(wallet, { post: async () => ({ result: '0x' }) });
    expect(address).toBe(wallet);
  });
});
