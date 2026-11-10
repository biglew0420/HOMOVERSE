import { useCallback, useEffect, useRef } from 'react';
import { lookInput } from '../lib/lookInput';

/** Drag anywhere that isn't a button or the joystick to look around. */
export function LookPad() {
  const pointerId = useRef<number | null>(null);
  const lastX = useRef(0);

  const end = useCallback(() => {
    pointerId.current = null;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (pointerId.current !== e.pointerId) return;
      lookInput.yaw -= (e.clientX - lastX.current) * 0.008;
      lastX.current = e.clientX;
    };
    const onUp = (e: PointerEvent) => {
      if (pointerId.current !== e.pointerId) return;
      end();
    };
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onUp);
    return () => {
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onUp);
    };
  }, [end]);

  return (
    <div
      data-testid="look-pad"
      aria-label="Drag to look"
      onPointerDown={(e) => {
        if (pointerId.current != null) return;
        pointerId.current = e.pointerId;
        lastX.current = e.clientX;
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 12,
        touchAction: 'none',
      }}
    />
  );
}
