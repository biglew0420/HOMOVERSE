import { useCallback, useEffect, useRef, useState } from 'react';
import { moveInput } from '../lib/moveInput';

const KNOB = 48;

/** Bottom-left on-screen stick. Analog x/z feeds the same moveInput WASD uses. */
export function TouchJoystick({ disabled = false, size = 112 }: { disabled?: boolean; size?: number }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const pointerId = useRef<number | null>(null);
  const max = (size - KNOB) / 2;

  const setVec = useCallback((dx: number, dy: number) => {
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, max);
    const nx = (dx / len) * clamped;
    const ny = (dy / len) * clamped;
    setKnob({ x: nx, y: ny });
    // screen up → -z (forward), screen right → +x
    moveInput.x = nx / max;
    moveInput.z = ny / max;
  }, [max]);

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

  useEffect(() => {
    if (disabled) end();
  }, [disabled, end]);

  return (
    <div
      ref={base}
      onPointerDown={(e) => {
        if (disabled || pointerId.current != null) return;
        e.preventDefault();
        pointerId.current = e.pointerId;
        base.current?.setPointerCapture?.(e.pointerId);
        const r = e.currentTarget.getBoundingClientRect();
        setVec(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      }}
      style={{
        position: 'fixed',
        left: 'max(12px, env(safe-area-inset-left))',
        bottom: 'max(12px, env(safe-area-inset-bottom))',
        width: size,
        height: size,
        opacity: disabled ? 0.35 : 1,
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
