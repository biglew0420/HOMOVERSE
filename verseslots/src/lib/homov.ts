/**
 * Read-only HomoVERSE (HOMOV) membership helper.
 * Never sends a transaction, never requests approval, never transfers or spends HOMOV.
 * Balance is read from public Base RPCs. The membership gate is a client-side check only.
 */

export const HOMOV_CONFIG = {
  name: 'HomoVERSE',
  symbol: 'HOMOV',
  chainId: 8453,
  chainName: 'Base',
  address: '0x1C9819c04C6d8Af322aAd71F56ABF51690173136',
  decimals: 18,
  /** Default membership threshold, in whole HOMOV. */
  memberThreshold: 1,
  rpcUrls: ['https://mainnet.base.org', 'https://base-rpc.publicnode.com'] as const,
  cacheMs: 5 * 60 * 1000,
  disclaimer: 'Read-only. We never move your tokens.',
  emblemCopy: 'HOMO is a membership emblem, not a financial product. This check promises no value, yield, or prize.',
} as const;

export const HOMOV_RANKS = [
  { id: 'guest', label: 'Guest', min: 0 },
  { id: 'member', label: 'Member', min: 1 },
  { id: 'gold', label: 'Gold', min: 1000 },
  { id: 'velvet', label: 'Velvet', min: 10000 },
] as const;

export type HomovRankId = (typeof HOMOV_RANKS)[number]['id'];

export type HomovRank = {
  id: HomovRankId;
  label: string;
  min: number;
};

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function isHexAddress(value: string): boolean {
  return ADDRESS_RE.test(value.trim());
}

export function normalizeAddress(value: string): string | null {
  const text = value.trim();
  if (!isHexAddress(text)) return null;
  return text.toLowerCase();
}

/** Parse an eth_call uint256 hex result into a decimal HOMOV amount. */
export function parseTokenBalance(hex: string, decimals = HOMOV_CONFIG.decimals): number {
  const raw = hex.trim().toLowerCase();
  if (!raw || raw === '0x' || raw === '0x0') return 0;
  const clean = raw.startsWith('0x') ? raw.slice(2) : raw;
  if (!/^[0-9a-f]+$/.test(clean)) throw new Error('Invalid balance hex');
  const wholeHex = clean.length <= decimals / 4 ? '0' : clean;
  // Use BigInt; split integer and fraction at `decimals`.
  const value = BigInt(`0x${clean}`);
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const frac = value % base;
  // Keep enough precision for thresholds (1 / 1000 / 10000) without float blowups.
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 8);
  return Number(whole) + Number(`0.${fracStr}`);
}

export function rankFromBalance(balance: number): HomovRank {
  let current: HomovRank = HOMOV_RANKS[0];
  for (const rank of HOMOV_RANKS) {
    if (balance >= rank.min) current = rank;
  }
  return current;
}

export function isMember(balance: number, threshold = HOMOV_CONFIG.memberThreshold): boolean {
  return balance >= threshold;
}

export function encodeBalanceOf(address: string): string {
  const normalized = normalizeAddress(address);
  if (!normalized) throw new Error('Invalid address');
  const method = '70a08231';
  const padded = normalized.slice(2).padStart(64, '0');
  return `0x${method}${padded}`;
}

export type RpcPost = (url: string, body: unknown) => Promise<unknown>;

const defaultPost: RpcPost = async (url, body) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  return response.json();
};

export async function readHomovBalance(
  address: string,
  options: { post?: RpcPost; urls?: readonly string[]; now?: number } = {},
): Promise<{ balance: number; source: string }> {
  const normalized = normalizeAddress(address);
  if (!normalized) throw new Error('Invalid address');
  const data = encodeBalanceOf(normalized);
  const urls = options.urls ?? HOMOV_CONFIG.rpcUrls;
  const post = options.post ?? defaultPost;
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const payload = await post(url, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          { to: HOMOV_CONFIG.address, data },
          'latest',
        ],
      });
      const result = (payload as { result?: unknown; error?: { message?: string } }).result;
      const error = (payload as { error?: { message?: string } }).error;
      if (error) throw new Error(error.message ?? 'RPC error');
      if (typeof result !== 'string') throw new Error('RPC returned no result');
      return { balance: parseTokenBalance(result), source: url };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError ?? new Error('All RPCs failed');
}

type CacheEntry = { balance: number; source: string; at: number };
const cache = new Map<string, CacheEntry>();

export function clearHomovCache() {
  cache.clear();
}

export async function readHomovBalanceCached(
  address: string,
  options: { post?: RpcPost; urls?: readonly string[]; now?: number; cacheMs?: number } = {},
): Promise<{ balance: number; source: string; cached: boolean }> {
  const normalized = normalizeAddress(address);
  if (!normalized) throw new Error('Invalid address');
  const now = options.now ?? Date.now();
  const ttl = options.cacheMs ?? HOMOV_CONFIG.cacheMs;
  const hit = cache.get(normalized);
  if (hit && now - hit.at < ttl) return { balance: hit.balance, source: hit.source, cached: true };
  const fresh = await readHomovBalance(normalized, options);
  cache.set(normalized, { ...fresh, at: now });
  return { ...fresh, cached: false };
}

const BASENAME_SUFFIX = '.base.eth';

export function normalizeBasename(input: string): string | null {
  const raw = input.trim().toLowerCase().replace(/^@/, '');
  if (!raw || isHexAddress(raw)) return null;
  if (raw.includes('://') || raw.includes(' ')) return null;
  if (raw.endsWith('.base.eth')) return raw;
  if (raw.endsWith('.base')) return `${raw}.eth`;
  if (raw.endsWith('.eth')) return raw.endsWith(BASENAME_SUFFIX) ? raw : raw.replace(/\.eth$/, BASENAME_SUFFIX);
  if (/^[a-z0-9-]+$/.test(raw)) return `${raw}${BASENAME_SUFFIX}`;
  return null;
}

/**
 * Best-effort, read-only basename resolution through public Base RPC.
 * Uses the Base L2 resolver's addr(bytes32) when a namehash can be formed.
 * Returns null when the name cannot be resolved client-side.
 */
export const BASE_L2_RESOLVER = '0xC6d566A56A1aFf6508b41f6C90ff131615583BCD';

export function namehash(name: string): string {
  let node: Uint8Array = new Uint8Array(32);
  const labels = name.split('.').filter(Boolean).reverse();
  const out = new Uint8Array(32);
  // Compute iteratively with a tiny sync sha3 via raw keccak is heavy without a lib.
  // We implement keccak-256 minimally below.
  for (const label of labels) {
    const labelHash = keccak256(Uint8Array.from(new TextEncoder().encode(label)));
    const packed = new Uint8Array(64);
    packed.set(node, 0);
    packed.set(labelHash, 32);
    node = keccak256(packed);
    void out;
  }
  return `0x${toHex(node)}`;
}

export function encodeAddr(node: string): string {
  const clean = node.startsWith('0x') ? node.slice(2) : node;
  return `0x3b3b57de${clean.padStart(64, '0')}`;
}

export async function resolveBasename(
  input: string,
  options: { post?: RpcPost; urls?: readonly string[] } = {},
): Promise<string | null> {
  const name = normalizeBasename(input);
  if (!name) return normalizeAddress(input);
  const node = namehash(name);
  const data = encodeAddr(node);
  const urls = options.urls ?? HOMOV_CONFIG.rpcUrls;
  const post = options.post ?? defaultPost;
  for (const url of urls) {
    try {
      const payload = await post(url, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: BASE_L2_RESOLVER, data }, 'latest'],
      });
      const result = (payload as { result?: unknown }).result;
      if (typeof result !== 'string' || result === '0x' || /^0x0+$/.test(result)) continue;
      const addr = `0x${result.slice(-40)}`;
      if (isHexAddress(addr) && !/^0x0+$/.test(addr)) return addr.toLowerCase();
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function resolveAddressOrName(
  input: string,
  options: { post?: RpcPost; urls?: readonly string[] } = {},
): Promise<string> {
  const direct = normalizeAddress(input);
  if (direct) return direct;
  const resolved = await resolveBasename(input, options);
  if (!resolved) throw new Error('Could not resolve that name. Paste a 0x address instead.');
  return resolved;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Minimal keccak-256 (public domain style implementation) for namehash only. */
function keccak256(data: Uint8Array): Uint8Array {
  const RC = [
    0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
    0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
    0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
    0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
    0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
    0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
  ];
  const st = new BigUint64Array(25);
  const block = new Uint8Array(136);
  let offset = 0;
  const absorb = () => {
    const view = new DataView(block.buffer);
    for (let i = 0; i < 17; i++) {
      st[i] ^= BigInt(view.getUint32(i * 8, true)) | (BigInt(view.getUint32(i * 8 + 4, true)) << 32n);
    }
    for (let round = 0; round < 24; round++) {
      const c = new BigUint64Array(5);
      for (let x = 0; x < 5; x++) c[x] = st[x] ^ st[x + 5] ^ st[x + 10] ^ st[x + 15] ^ st[x + 20];
      for (let x = 0; x < 5; x++) {
        const d = c[(x + 4) % 5] ^ rotl(c[(x + 1) % 5], 1);
        for (let y = 0; y < 5; y++) st[x + y * 5] ^= d;
      }
      let x = 1;
      let y = 0;
      let current = st[1];
      for (let t = 0; t < 24; t++) {
        const nx = y;
        const ny = (2 * x + 3 * y) % 5;
        const rot = ((t + 1) * (t + 2) / 2) % 64;
        const next = st[nx + ny * 5];
        st[nx + ny * 5] = rotl(current, rot);
        current = next;
        x = nx;
        y = ny;
      }
      for (let y2 = 0; y2 < 5; y2++) {
        const row = new BigUint64Array(5);
        for (let x2 = 0; x2 < 5; x2++) row[x2] = st[x2 + y2 * 5];
        for (let x2 = 0; x2 < 5; x2++) st[x2 + y2 * 5] = row[x2] ^ ((~row[(x2 + 1) % 5]) & row[(x2 + 2) % 5]);
      }
      st[0] ^= RC[round];
    }
  };
  for (const byte of data) {
    block[offset++] ^= byte;
    if (offset === 136) { absorb(); block.fill(0); offset = 0; }
  }
  block[offset] ^= 0x01;
  block[135] ^= 0x80;
  absorb();
  const out = new Uint8Array(32);
  const view = new DataView(out.buffer);
  for (let i = 0; i < 4; i++) {
    const v = st[i];
    view.setUint32(i * 8, Number(v & 0xffffffffn), true);
    view.setUint32(i * 8 + 4, Number((v >> 32n) & 0xffffffffn), true);
  }
  return out;
}

function rotl(value: bigint, n: number): bigint {
  const shift = BigInt(n);
  return ((value << shift) | (value >> (64n - shift))) & 0xffffffffffffffffn;
}
