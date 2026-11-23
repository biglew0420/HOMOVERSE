import { useCallback, useEffect, useState } from 'react';
import {
  HOMOV_CONFIG,
  isMember,
  rankFromBalance,
  readHomovBalanceCached,
  resolveAddressOrName,
  type HomovRank,
} from '../lib/homov';

type EIP1193 = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};

function injected(): EIP1193 | null {
  const eth = (window as unknown as { ethereum?: EIP1193 }).ethereum;
  return eth ?? null;
}

export type HomovState = {
  address: string | null;
  balance: number | null;
  rank: HomovRank;
  member: boolean;
  verified: boolean;
  source: 'wallet' | 'paste' | null;
  chainId: string | null;
  status: 'idle' | 'working' | 'error';
  error: string | null;
  disclaimer: string;
};

const idle: HomovState = {
  address: null,
  balance: null,
  rank: rankFromBalance(0),
  member: false,
  verified: false,
  source: null,
  chainId: null,
  status: 'idle',
  error: null,
  disclaimer: HOMOV_CONFIG.disclaimer,
};

export function useHomov(): HomovState & {
  connectWallet: () => Promise<void>;
  pasteAddress: (value: string) => Promise<void>;
  proveOwnership: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<HomovState>(idle);

  const load = useCallback(async (address: string, source: 'wallet' | 'paste', verified: boolean, chainId: string | null) => {
    setState((s) => ({ ...s, status: 'working', error: null, address, source, verified, chainId }));
    try {
      const read = await readHomovBalanceCached(address);
      const rank = rankFromBalance(read.balance);
      setState({
        address,
        balance: read.balance,
        rank,
        member: isMember(read.balance),
        verified,
        source,
        chainId,
        status: 'idle',
        error: null,
        disclaimer: HOMOV_CONFIG.disclaimer,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: err instanceof Error ? err.message : 'Could not read balance',
        balance: null,
        rank: rankFromBalance(0),
        member: false,
      }));
    }
  }, []);

  const connectWallet = useCallback(async () => {
    const eth = injected();
    if (!eth) {
      setState((s) => ({ ...s, status: 'error', error: 'No wallet found. Paste an address or basename, or open this page in a wallet browser.' }));
      return;
    }
    setState((s) => ({ ...s, status: 'working', error: null }));
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      const list = Array.isArray(accounts) ? accounts : [];
      const address = typeof list[0] === 'string' ? list[0] : '';
      if (!address) throw new Error('Wallet returned no account');
      let chainId: string | null = null;
      try {
        const id = await eth.request({ method: 'eth_chainId' });
        chainId = typeof id === 'string' ? id : null;
      } catch {
        chainId = null;
      }
      await load(address, 'wallet', true, chainId);
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err instanceof Error ? err.message : 'Wallet request was rejected' }));
    }
  }, [load]);

  const pasteAddress = useCallback(async (value: string) => {
    setState((s) => ({ ...s, status: 'working', error: null }));
    try {
      const address = await resolveAddressOrName(value);
      await load(address, 'paste', false, null);
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err instanceof Error ? err.message : 'Could not use that address' }));
    }
  }, [load]);

  const proveOwnership = useCallback(async () => {
    const eth = injected();
    if (!eth || !state.address) {
      setState((s) => ({ ...s, error: 'Connect a wallet first to sign a free proof. Pasted addresses stay a preview.' }));
      return;
    }
    try {
      await eth.request({
        method: 'personal_sign',
        params: [
          `HOMOVERSE membership check for ${state.address}. ${HOMOV_CONFIG.disclaimer} This signature spends no gas and does not move tokens.`,
          state.address,
        ],
      });
      setState((s) => ({ ...s, verified: true, error: null }));
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : 'Signature was skipped' }));
    }
  }, [state.address]);

  const disconnect = useCallback(() => setState(idle), []);

  const refresh = useCallback(async () => {
    if (!state.address || !state.source) return;
    await load(state.address, state.source, state.verified, state.chainId);
  }, [load, state.address, state.source, state.verified, state.chainId]);

  useEffect(() => {
    // never auto-prompt a wallet
  }, []);

  return { ...state, connectWallet, pasteAddress, proveOwnership, disconnect, refresh };
}
