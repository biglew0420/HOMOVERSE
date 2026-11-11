import { useEffect, useRef } from 'react';
import type { SymbolId } from '../../lib/slotMath';
import { litCanvas } from './relief';

const LABEL: Record<SymbolId, string> = {
  seahorse: 'Gold seahorse',
  hmark: 'Geometric H',
  jewel: 'Champagne jewel',
  arch: 'Promenade arch',
  medallion: 'Gold medallion',
};

export function SlotSymbol({ id }: { id: SymbolId; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const src = litCanvas(id);
    node.width = src.width;
    node.height = src.height;
    node.getContext('2d')?.drawImage(src, 0, 0);
  }, [id]);
  return <canvas ref={ref} className="lit-mark" role="img" aria-label={LABEL[id]} />;
}
