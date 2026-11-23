import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BINGO_COLUMNS,
  BINGO_DEMO_REWARD,
  BINGO_NAME,
  BINGO_SIZE,
  CALL_POOL,
  DAUBER_DISCLAIMER,
  callerSpeech,
  cellAt,
  dauberPackSize,
  drawCall,
  generateCard,
  hasBingo,
  initialDaubed,
  tryDaub,
  usesGoldCoinSkin,
  type BingoCall,
  type BingoCell,
  type HomovCosmeticRank,
} from '../lib/bingo';
import { DAUBER_DISCLAIMER as DAUBER_COPY, readDaubers, refillDaubers, writeDaubers } from '../lib/daubers';
import { theme } from '../lib/theme';
import { demoAudio } from '../lib/audio';
import { SlotSymbol } from './slot/Symbols';
import type { SymbolId } from '../lib/slotMath';

type Props = {
  rank: HomovCosmeticRank;
  verified: boolean;
  onClose: () => void;
  onReward: (credits: number) => void;
};

function storage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function Coin({ goldSkin, size = 28 }: { goldSkin: boolean; size?: number }) {
  return (
    <span
      aria-hidden
      data-testid="dauber-coin"
      data-skin={goldSkin ? 'gold-coin' : 'classic'}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 800,
        letterSpacing: 0.2,
        color: theme.ink,
        background: goldSkin
          ? `radial-gradient(circle at 30% 30%, #fff6d0, ${theme.gold} 55%, #8a6a22)`
          : `radial-gradient(circle at 30% 30%, #f0e2b0, ${theme.goldTrim})`,
        border: `2px solid ${theme.ivory}`,
        boxShadow: `0 0 0 1px ${theme.blush}, 0 4px 8px #0008`,
      }}
    >
      H
    </span>
  );
}

function Confetti() {
  const bits = useMemo(() => Array.from({ length: 48 }, (_, i) => ({
    left: `${(i * 17) % 100}%`,
    delay: `${(i % 8) * 0.08}s`,
    color: i % 2 === 0 ? theme.gold : (i % 4 === 1 ? theme.blush : theme.icyPink),
    rot: i * 24,
  })), []);
  return (
    <div data-testid="bingo-confetti" aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`
        @keyframes hvFall { from { transform: translateY(-10%) rotate(0deg); opacity: 1; } to { transform: translateY(110vh) rotate(240deg); opacity: 0.2; } }
      `}</style>
      {bits.map((bit, i) => (
        <span key={i} style={{
          position: 'absolute',
          top: 0,
          left: bit.left,
          width: 8,
          height: 12,
          borderRadius: 2,
          background: bit.color,
          animation: `hvFall 1.8s linear ${bit.delay} forwards`,
          transform: `rotate(${bit.rot}deg)`,
        }} />
      ))}
    </div>
  );
}

export function Bingo({ rank, verified, onClose, onReward }: Props) {
  const pack = dauberPackSize(rank, verified);
  const goldSkin = usesGoldCoinSkin(rank, verified);
  const [card] = useState(() => generateCard(Date.now()));
  const [daubed, setDaubed] = useState(() => initialDaubed(card));
  const [daubers, setDaubers] = useState(() => readDaubers(storage(), rank, verified).count);
  const [remaining, setRemaining] = useState(() => [...CALL_POOL]);
  const [called, setCalled] = useState<BingoCall[]>([]);
  const [calledIds, setCalledIds] = useState<Set<string>>(new Set());
  const [caller, setCaller] = useState<'laurent' | 'jules'>('laurent');
  const [speech, setSpeech] = useState('Welcome to Homo Bingo. Demo play only.');
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('');
  const rewarded = useRef(false);
  const paused = won;

  useEffect(() => {
    writeDaubers(storage(), { ...readDaubers(storage(), rank, verified), count: daubers });
  }, [daubers, rank, verified]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setRemaining((pool) => {
        const drawn = drawCall(pool);
        if (!drawn) {
          setSpeech('That is the last call of the evening.');
          return pool;
        }
        const who = Math.random() < 0.5 ? 'laurent' : 'jules';
        setCaller(who);
        setSpeech(callerSpeech(drawn.call, who));
        setCalled((list) => [drawn.call, ...list].slice(0, 6));
        setCalledIds((set) => new Set(set).add(drawn.call.callId));
        demoAudio.bubble();
        return drawn.remaining;
      });
    }, 3500);
    return () => window.clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (!hasBingo(card, daubed) || rewarded.current) return;
    rewarded.current = true;
    setWon(true);
    setMessage(`BINGO! +${BINGO_DEMO_REWARD} demo credits. No real prize.`);
    onReward(BINGO_DEMO_REWARD);
    demoAudio.enter();
  }, [card, daubed, onReward]);

  const daub = (cell: BingoCell) => {
    const result = tryDaub({ card, daubed, cellId: cell.id, called: calledIds, daubers });
    if (!result.ok) {
      if (result.reason === 'no-daubers') setMessage('No demo daubers left. Refill is free.');
      else if (result.reason === 'not-called') setMessage('Not called yet.');
      return;
    }
    demoAudio.click();
    setDaubed(result.daubed);
    setDaubers(result.daubers);
    setMessage('');
  };

  const refill = () => {
    const next = refillDaubers(readDaubers(storage(), rank, verified), rank, verified);
    writeDaubers(storage(), next);
    setDaubers(next.count);
    setMessage(`Refilled ${next.count} demo daubers, free.`);
    demoAudio.click();
  };

  return (
    <div
      data-testid="bingo-sheet"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 62,
        background: `radial-gradient(80% 50% at 50% 0%, ${theme.dusk}, ${theme.black})`,
        color: theme.ivory,
        display: 'flex',
        flexDirection: 'column',
        padding: 'max(8px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom))',
        fontFamily: 'system-ui, sans-serif',
        overflow: 'auto',
      }}
    >
      {won && <Confetti />}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <strong style={{ color: theme.gold, letterSpacing: 1 }}>{BINGO_NAME}</strong>
        <button type="button" data-testid="close-bingo" onClick={onClose}>Back to the lounge</button>
      </div>
      <p data-testid="dauber-disclaimer" style={{ margin: '6px 0', fontSize: 12, color: theme.cream }}>{DAUBER_COPY}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', fontSize: 13 }}>
        <span data-testid="dauber-count" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Coin goldSkin={goldSkin} /> Demo HOMOV daubers: {daubers}
        </span>
        <button type="button" data-testid="refill-daubers" onClick={refill}>Refill free ({pack})</button>
      </div>
      <div
        data-testid="bingo-caller"
        data-caller={caller}
        style={{
          margin: '8px 0',
          background: theme.black,
          color: theme.gold,
          border: `1.5px solid ${theme.gold}`,
          boxShadow: `0 0 0 2px ${theme.blush}`,
          borderRadius: 14,
          padding: '8px 10px',
          fontSize: 13,
        }}
      >
        <b>{caller === 'laurent' ? 'Laurent' : 'Jules Wren'}</b>
        <div>{speech}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BINGO_SIZE}, minmax(0, 1fr))`, gap: 4, maxWidth: 520, width: '100%', margin: '0 auto' }}>
        {BINGO_COLUMNS.map((letter, i) => (
          <div key={`h-${i}`} style={{ textAlign: 'center', color: theme.gold, fontWeight: 800, letterSpacing: 1 }}>{letter}</div>
        ))}
        {Array.from({ length: BINGO_SIZE }, (_, row) => (
          Array.from({ length: BINGO_SIZE }, (_, col) => {
            const cell = cellAt(card, row, col)!;
            const marked = daubed.has(cell.id);
            const isSymbol = cell.kind === 'symbol' || cell.kind === 'free';
            const symbolId: SymbolId | null = cell.kind === 'free' || cell.label === 'Gold H'
              ? 'hmark'
              : cell.label === 'Crown' ? 'crown' : cell.label === 'Diamond' ? 'diamond' : cell.label === 'Champagne' ? 'champagne' : null;
            return (
              <button
                type="button"
                key={cell.id}
                data-testid={`bingo-cell-${row}-${col}`}
                data-kind={cell.kind}
                data-daubed={marked ? 'yes' : 'no'}
                onClick={() => daub(cell)}
                style={{
                  minHeight: 64,
                  padding: 4,
                  background: marked ? theme.charcoal : theme.ink,
                  color: theme.ivory,
                  border: `1px solid ${marked ? theme.gold : theme.gold + '88'}`,
                  borderRadius: 8,
                  position: 'relative',
                  fontSize: cell.kind === 'name' ? 10 : 13,
                  lineHeight: 1.15,
                }}
              >
                {isSymbol && symbolId && (
                  <span style={{ display: 'flex', justifyContent: 'center', height: 22, overflow: 'hidden' }}>
                    <SlotSymbol id={symbolId} size={22} />
                  </span>
                )}
                {!daubed && <span>{cell.kind === 'free' ? 'FREE' : cell.label}</span>}
                {marked && (
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', background: '#0005', borderRadius: 8 }}>
                    <Coin goldSkin={goldSkin} size={26} />
                  </span>
                )}
              </button>
            );
          })
        ))}
      </div>
      <div data-testid="bingo-result" role="status" style={{ minHeight: 2.2 * 16, marginTop: 8, color: won ? theme.gold : theme.ivory, fontWeight: won ? 800 : 400, letterSpacing: won ? 2 : 0 }}>
        {won ? 'BINGO!' : message}
        {won && <div style={{ fontWeight: 400, letterSpacing: 0, marginTop: 4 }}>{message}</div>}
      </div>
    </div>
  );
}
