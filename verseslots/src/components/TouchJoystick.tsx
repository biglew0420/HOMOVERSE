import { useCallback, useEffect, useRef, useState } from 'react';
import { moveInput } from '../lib/moveInput';

const SIZE = 112;
const KNOB = 48;
const MAX = (SIZE - KNOB) / 2;

/** Bottom-left on-screen stick. Analog x/z feeds the same moveInput WASD uses. */
export function TouchJoystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);

  const setVec = useCallback((dx: number, dy: number) => {
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, MAX);
    const nx = (dx / len) * clamped;
    const ny = (dy / len) * clamped;
    setKnob({ x: nx, y: ny });
    // screen up → -z (forward), screen right → +x
    moveInput.x = nx / MAX;
    moveInput.z = ny / MAX;
  }, []);

  const end = useCallback(() => {
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    moveInput.x = 0;
    moveInput.z = 0;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (pointerId.current !== e.pointerId || !base.current) return;
      const r = base.current.getBoundingClientRect();
      setVec(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
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
  }, [end, setVec]);

  return (
    <div
      ref={base}
      onPointerDown={(e) => {
        if (pointerId.current != null) return;
        e.preventDefault();
        pointerId.current = e.pointerId;
        base.current?.setPointerCapture?.(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        setVec(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      }}
      style={{
        position: 'fixed',
        left: 16,
        bottom: 16,
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.45)',
        border: '2px solid rgba(212,175,55,0.55)',
        touchAction: 'none',
        zIndex: 40,
        userSelect: 'none',
      }}
      aria-label="Move joystick"
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: KNOB,
          height: KNOB,
          marginLeft: -KNOB / 2 + knob.x,
          marginTop: -KNOB / 2 + knob.y,
          borderRadius: '50%',
          background: 'rgba(212,175,55,0.85)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
