import { useState } from 'react';
// PLACEHOLDER ODDS, play money only. Not real slot math / RTP.
const SYMBOLS = ['🍒', '🍋', '⭐', '7️⃣', '💎'];
const WIN_PAYOUT = 10; // 3-of-a-kind pays 10 credits * multiplier
export function SlotMachine({ name, multiplier, credits, setCredits, onWin }: {
  name: string; multiplier: number; credits: number; setCredits: (f: (c: number) => number) => void; onWin: (amount: number) => void;
}) {
  const [reels, setReels] = useState(['❔', '❔', '❔']);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState('');
  const spin = () => {
    if (spinning || credits < 1) return;
    setCredits((c) => c - 1); setSpinning(true); setResult('');
    const rand = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const t = setInterval(() => setReels([rand(), rand(), rand()]), 80);
    setTimeout(() => {
      clearInterval(t);
      const final = [rand(), rand(), rand()];
      setReels(final); setSpinning(false);
      if (final[0] === final[1] && final[1] === final[2]) {
        const amt = Math.round(WIN_PAYOUT * multiplier);
        setCredits((c) => c + amt); setResult(`WIN +${amt}`); onWin(amt);
      } else setResult('No win');
    }, 1200);
  };
  return (
    <div style={{ background: '#111c', border: '2px solid #d4af37', borderRadius: 8, padding: 8, width: 170, textAlign: 'center', color: '#fff', fontSize: 12 }}>
      <b>{name}</b> <span style={{ color: '#d4af37' }}>x{multiplier}</span>
      <div style={{ fontSize: 28, margin: '6px 0' }}>{reels.join(' ')}</div>
      <button type="button" onClick={spin} disabled={spinning || credits < 1} style={{ minHeight: 40, width: '100%', fontSize: 14, touchAction: 'manipulation' }}>{spinning ? 'Spinning…' : 'Spin (1 credit)'}</button>
      <div style={{ minHeight: 16 }}>{result}</div>
      <div style={{ opacity: 0.6, fontSize: 10 }}>Play money · placeholder odds (~4% 3-of-a-kind)</div>
    </div>
  );
}
