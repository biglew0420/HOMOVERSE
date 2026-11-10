import { useEffect, useRef, useState } from 'react';
import {
  DEMO_STAKE,
  PAYTABLE,
  drawReels,
  resolveDemoSpin,
  type SymbolId,
} from '../lib/slotMath';
import { SlotSymbol } from './slot/Symbols';

const SAMPLE: [SymbolId, SymbolId, SymbolId] = ['seahorse', 'jewel', 'seahorse'];

function prefersReducedMotion() {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function SlotMachine({ name, credits, epoch, onSpend, onPayout, onClose }: {
  name: string;
  credits: number;
  epoch: number;
  onSpend: () => void;
  onPayout: (amount: number) => void;
  onClose: () => void;
}) {
  const [reels, setReels] = useState<[SymbolId, SymbolId, SymbolId]>(['hmark', 'jewel', 'arch']);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState('Press spin. Stake is 1 demo credit.');
  const [feature, setFeature] = useState<'off' | 'sample' | 'live'>('off');
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const epochRef = useRef(epoch);
  const busy = useRef(false);
  epochRef.current = epoch;

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const show = (next: [SymbolId, SymbolId, SymbolId], kind: 'live' | 'sample') => {
    const resolved = resolveDemoSpin(next);
    setReels(next);
    setFeature(kind === 'sample' ? 'sample' : resolved.feature ? 'live' : 'off');
    if (kind === 'sample') {
      setResult(`Sample only. Balance unchanged. ${resolved.detail}`);
      return;
    }
    setResult(resolved.amount > 0 ? `Demo win +${resolved.amount}. ${resolved.detail}` : 'No win');
    if (resolved.amount > 0) onPayout(resolved.amount);
  };

  const spin = () => {
    if (busy.current || spinning || credits < DEMO_STAKE) return;
    busy.current = true;
    const seen = epochRef.current;
    onSpend();
    setSpinning(true);
    setFeature('off');
    setResult('Spinning…');
    const final = drawReels();
    const delay = reduced ? 160 : 1100;
    const ticker = reduced ? 0 : window.setInterval(() => setReels(drawReels()), 90);
    window.setTimeout(() => {
      if (ticker) window.clearInterval(ticker);
      setSpinning(false);
      busy.current = false;
      if (epochRef.current !== seen) {
        setResult('Reset. That spin was discarded.');
        setFeature('off');
        return;
      }
      show(final, 'live');
    }, delay);
  };

  const symbolSize = reduced ? 88 : 104;

  return (
    <div className={`cabinet ${feature !== 'off' ? 'feature' : ''}`} data-testid="slot-sheet" data-feature={feature} data-reduced={reduced ? 'yes' : 'no'}>
      <style>{`
        .cabinet {
          position: fixed; inset: 0; z-index: 60; box-sizing: border-box; color: #f6edd6;
          display: grid;
          grid-template-areas: "top" "brand" "pay" "reels" "feature" "result" "spin" "rules" "sample";
          grid-template-rows: auto auto auto minmax(140px, 1fr) auto auto auto auto auto;
          gap: 8px; padding: max(8px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
          background:
            radial-gradient(120% 80% at 50% 0%, #3a301c 0%, #0c0b09 42%, #050504 100%);
          overflow: auto;
        }
        .cabinet.feature { box-shadow: inset 0 0 0 3px #e7c878, inset 0 0 80px rgba(231, 200, 120, 0.18); }
        .topbar { grid-area: top; } .brandrow { grid-area: brand; } .paytable { grid-area: pay; }
        .reels { grid-area: reels; } .feature-line { grid-area: feature; } .result { grid-area: result; }
        .spinwrap { grid-area: spin; } .rules { grid-area: rules; } .sample { grid-area: sample; }
        .topbar, .brandrow, .feature-line { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .brand { font-weight: 700; letter-spacing: 2px; color: #f0d78c; font-size: 18px; }
        .paytable { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
        .panel {
          min-height: 58px; border-radius: 12px; padding: 6px 6px 7px; text-align: center;
          background: linear-gradient(180deg, #3a3120, #100e0b 48%, #1c1812);
          border: 1px solid #e7c878;
          box-shadow: inset 0 1px 0 #fff4d0, inset 0 -10px 14px #000, 0 3px 0 #5c4516;
        }
        .panel strong { display: block; font-size: 20px; line-height: 1.1; color: #fff6d8; }
        .panel span { display: block; font-size: 11px; letter-spacing: 0.4px; color: #f6edd6; }
        .panel.active { outline: 2px solid #fff6d8; box-shadow: inset 0 0 18px rgba(240, 215, 140, 0.45), 0 0 16px rgba(231, 200, 120, 0.35); }
        .reels { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; min-height: 0; }
        .reel {
          position: relative; min-height: 132px; border-radius: 18px; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          background: radial-gradient(circle at 50% 18%, #4a3e28, #090807 70%);
          border: 2px solid #e7c878;
          box-shadow: inset 0 1px 0 #fff1c9, inset 0 -16px 22px #000, 0 8px 14px #000;
        }
        .reel::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(180deg, rgba(255,255,255,.28), transparent 36%, rgba(0,0,0,.4));
        }
        .spinwrap { display: flex; justify-content: center; }
        .spin {
          width: 128px; height: 128px; border-radius: 50%; padding: 0;
          border: 6px solid #e7c878; color: #fff8e8; font-size: 18px; font-weight: 700; letter-spacing: 1px;
          background: radial-gradient(circle at 50% 28%, #4a3d24, #0b0a08 68%);
          box-shadow: 0 10px 0 #5a4316, inset 0 2px 0 #fff1c9, 0 14px 22px #000;
          touch-action: manipulation;
        }
        .spin:disabled { opacity: 0.45; box-shadow: none; }
        .spin:focus-visible, .textbtn:focus-visible, .ghost:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
        .rules { display: block; font-size: 13px; line-height: 1.35; color: #f6edd6; }
        .result { min-height: 2.6em; font-size: 15px; color: #fff8e8; }
        .ghost, .textbtn {
          min-height: 44px; border-radius: 10px; border: 1px solid #e7c878;
          background: #14110c; color: #f6edd6; touch-action: manipulation;
        }
        .textbtn { background: transparent; border: none; color: #f0d78c; text-decoration: underline; min-height: 44px; }
        @media (prefers-reduced-motion: reduce) {
          .reel, .spin { transition: none; }
        }
        @media (orientation: landscape) and (max-height: 520px) {
          .cabinet {
            width: min(1040px, 100%); height: 100%; margin: 0 auto;
            grid-template-columns: 200px minmax(0, 1fr) 150px;
            grid-template-areas:
              "top top top"
              "brand brand brand"
              "pay reels spin"
              "feature feature feature"
              "result result result"
              "rules rules rules"
              "sample sample sample";
            grid-template-rows: auto auto auto auto auto auto auto;
          }
          .paytable { grid-template-columns: 1fr 1fr; align-content: start; }
          .panel { min-height: 34px; padding: 2px 4px; }
          .panel strong { font-size: 15px; }
          .spin { width: 88px; height: 88px; }
          .reel { min-height: 0; }
          .reel svg { width: auto; height: 76px; max-height: none; }
          .rules, .feature-line, .result { font-size: 12px; line-height: 1.25; }
          .sample { min-height: 32px; }
        }
        @media (min-width: 900px) and (min-height: 640px) {
          .cabinet {
            width: min(1100px, 100%);
            grid-template-columns: 280px minmax(0, 1fr) 200px;
            grid-template-areas:
              "top top top"
              "brand brand brand"
              "pay reels spin"
              "feature feature feature"
              "result result result"
              "rules rules rules"
              "sample sample sample";
            grid-template-rows: auto auto minmax(0, 1fr) auto auto auto auto;
          }
          .paytable { grid-template-columns: 1fr 1fr; }
          .reel svg { height: 168px; }
          .spin { width: 148px; height: 148px; font-size: 20px; }
          .panel strong { font-size: 26px; }
        }
      `}</style>
      <div className="topbar">
        <button type="button" className="ghost" data-testid="close-slot" onClick={onClose}>Close and walk</button>
        <span data-testid="credits">Demo credits: {credits}</span>
      </div>
      <div className="brandrow">
        <span className="brand">HOMO</span>
        <span>{name}</span>
        <span>Stake {DEMO_STAKE}</span>
      </div>
      <div className="paytable" data-testid="paytable" aria-label="Demo paytable">
        {PAYTABLE.map((line) => (
          <div key={line.id} className={`panel ${feature !== 'off' && line.id === 'seahorse' ? 'active' : ''}`}>
            <strong>{line.multiplier}×</strong>
            <span>{line.label}</span>
          </div>
        ))}
      </div>
      <div className="reels" data-testid="spin-reels" data-symbols={reels.join(',')}>
        {reels.map((id, index) => (
          <div className="reel" key={`${id}-${index}`} aria-hidden={spinning}>
            <SlotSymbol id={id} size={symbolSize} />
          </div>
        ))}
      </div>
      <div className="feature-line" aria-live="polite">
        {feature === 'live' && 'Seahorse feature ×2 applied to this spin.'}
        {feature === 'sample' && 'Sample feature. The balance did not change.'}
        {feature === 'off' && 'Demo paytable only. These multipliers are what a spin can pay.'}
      </div>
      <div className="result" data-testid="spin-result" role="status">{result}</div>
      <div className="spinwrap">
        <button
          type="button"
          className="spin"
          data-testid="spin-button"
          onClick={spin}
          disabled={spinning || credits < DEMO_STAKE}
          aria-label={credits < DEMO_STAKE ? 'Spin unavailable, no demo credits' : 'Spin one demo credit'}
        >
          {spinning ? '…' : credits < DEMO_STAKE ? 'Empty' : 'SPIN'}
        </button>
      </div>
      <p className="rules" data-testid="disclaimer">
        Demo credits are not HOMO tokens. No cash value. Not purchasable, transferable, or redeemable.
        {credits < DEMO_STAKE ? ' No demo credits left. Reset the local demo for another free grant.' : ' Odds are a placeholder, not certified math.'}
        <span data-testid="low-balance" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>{credits < DEMO_STAKE ? 'empty' : 'ok'}</span>
      </p>
      <button
        type="button"
        className="textbtn sample"
        data-testid="sample-feature"
        onClick={() => { if (!busy.current && !spinning) show(SAMPLE, 'sample'); }}
      >
        Sample feature, balance unchanged
      </button>
    </div>
  );
}
