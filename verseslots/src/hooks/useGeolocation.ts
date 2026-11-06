import { useEffect, useState } from 'react';
export type GeoStatus = 'idle' | 'pending' | 'ok' | 'denied' | 'error' | 'unsupported';
export type GeoState = { lat: number | null; lng: number | null; status: GeoStatus; error: string | null };
export function useGeolocation(): GeoState {
  const [s, set] = useState<GeoState>({ lat: null, lng: null, status: 'idle', error: null });
  useEffect(() => {
    if (!('geolocation' in navigator)) { set((p) => ({ ...p, status: 'unsupported' })); return; }
    set((p) => ({ ...p, status: 'pending' }));
    const id = navigator.geolocation.watchPosition(
      (pos) => set({ lat: pos.coords.latitude, lng: pos.coords.longitude, status: 'ok', error: null }),
      (err) => set({
        lat: null,
        lng: null,
        status: err.code === err.PERMISSION_DENIED ? 'denied' : 'error',
        error: err.message,
      }),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  return s;
}
