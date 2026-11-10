import { useCallback, useRef, useState } from 'react';
import { classifyGeoError, type CoarseCell, type GeoFailure, stabilize } from '../lib/area';

export type GeoStatus = 'idle' | 'pending' | 'ok' | 'denied' | 'timeout' | 'error' | 'unsupported';

export type GeoState = {
  status: GeoStatus;
  failure: GeoFailure | null;
  /** In-memory coarse cell only. Never written to storage or the HUD. */
  cell: CoarseCell | null;
  request: () => void;
  /** Drop the in-memory coarse anchor. Does not call the location API. */
  forget: () => void;
};

/**
 * Location is opt-in. Nothing here runs until `request`.
 * A denial, timeout, or unavailable fix leaves `cell` as it was.
 */
export function useGeolocation(): GeoState {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [failure, setFailure] = useState<GeoFailure | null>(null);
  const [cell, setCell] = useState<CoarseCell | null>(null);
  const requestId = useRef(0);
  const cellRef = useRef<CoarseCell | null>(null);

  const forget = useCallback(() => {
    requestId.current += 1;
    cellRef.current = null;
    setCell(null);
    setStatus('idle');
    setFailure(null);
  }, []);

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unsupported');
      setFailure('error');
      return;
    }
    const id = ++requestId.current;
    setStatus('pending');
    setFailure(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (requestId.current !== id) return;
        const next = stabilize(pos.coords.latitude, pos.coords.longitude, cellRef.current);
        cellRef.current = next;
        setCell(next);
        setStatus('ok');
        setFailure(null);
      },
      (err) => {
        if (requestId.current !== id) return;
        const kind = classifyGeoError(err.code);
        setFailure(kind);
        setStatus(kind === 'denied' ? 'denied' : kind === 'timeout' ? 'timeout' : 'error');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 },
    );
  }, []);

  return { status, failure, cell, request, forget };
}
