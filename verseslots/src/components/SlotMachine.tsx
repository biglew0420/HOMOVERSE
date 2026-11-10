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
    <div className={`cabinet ${feature !== 'off' ? 'feature' : ''}`} data-testid="slot-sheet" data-feature={feature} data-reduced={reduced ? 'yes' : 'no'} style={{ ['--mark' as string]: `${symbolSize}px` }}>
      <style>{`
        .cabinet {
          position: fixed; inset: 0; z-index: 60; box-sizing: border-box; color: #f6edd6;
          display: grid;
          grid-template-areas: "top" "brand" "pay" "reels" "feature" "result" "spin" "rules" "sample";
          grid-template-rows: auto auto auto minmax(140px, 1fr) auto auto auto auto auto;
          gap: 8px; padding: max(8px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
          background:
            radial-gradient(120% 90% at 50% 42%, transparent 46%, rgba(0,0,0,.55) 100%),
            linear-gradient(102deg, transparent 0 28%, rgba(255,236,200,.07) 46%, transparent 62%),
            radial-gradient(80% 24% at 18% 0%, rgba(255,244,214,.12), transparent 70%),
            #070605;
          overflow: auto;
        }
        .cabinet.feature { box-shadow: inset 0 0 0 2px #c9a35a, inset 0 0 70px rgba(201, 163, 90, 0.16); }
        .topbar { grid-area: top; } .brandrow { grid-area: brand; } .paytable { grid-area: pay; }
        .reels { grid-area: reels; } .feature-line { grid-area: feature; } .result { grid-area: result; }
        .spinwrap { grid-area: spin; } .rules { grid-area: rules; } .sample { grid-area: sample; }
        .topbar, .brandrow, .feature-line { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .brand { font-weight: 700; letter-spacing: 2px; color: #f0d78c; font-size: 18px; }
        .paytable { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
        .panel, .reel, .spin, .ghost {
          border: 1.5px solid transparent;
          background-origin: border-box;
          background-clip: padding-box, border-box;
        }
        .metal {
          background-image:
            linear-gradient(#100e0b, #100e0b),
            linear-gradient(128deg, #2a1c08 0%, #8d6a2a 16%, #fff6d4 34%, #a9782c 46%, #fff1c2 52%, #5c4012 68%, #e7c56a 82%, #24180a 100%);
        }
        .panel {
          position: relative;
          min-height: 58px; border-radius: 12px; padding: 8px 6px 7px; text-align: center;
          background-color: #0c0b09;
          background-image:
            linear-gradient(#12100c, #070605),
            linear-gradient(160deg, #4a3514, #f6e2a8 38%, #8a6420 52%, #fff6d0 68%, #3a280c);
          box-shadow: inset 0 -12px 14px rgba(0,0,0,.55), 0 6px 10px rgba(0,0,0,.4);
        }
        .panel .sheen {
          position: absolute; left: 12px; right: 42%; top: 5px; height: 4px; border-radius: 4px;
          background: linear-gradient(90deg, transparent, rgba(255,248,220,.75), transparent);
          pointer-events: none;
        }
        .panel strong, .panel span { position: relative; z-index: 1; text-shadow: 0 1px 1px #000; }
        .panel strong { display: block; font-size: 20px; line-height: 1.1; color: #fffaf0; }
        .panel span { display: block; font-size: 11px; letter-spacing: 0.4px; color: #f6edd6; }
        .panel.active { outline: 2px solid #fff6d8; outline-offset: 1px; }
        .reels { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; min-height: 0; }
        .reel {
          position: relative; min-height: 132px; border-radius: 18px; overflow: hidden;
          display: flex; padding: 7px;
          background-color: #14110c;
          background-image:
            linear-gradient(#14110c, #14110c),
            linear-gradient(128deg, #2a1c08 0%, #8d6a2a 16%, #fff6d4 34%, #a9782c 46%, #fff1c2 52%, #5c4012 68%, #e7c56a 82%, #24180a 100%);
          box-shadow: 0 12px 18px rgba(0,0,0,.55);
        }
        .well {
          position: relative; flex: 1; border-radius: 12px; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          background:
            linear-gradient(180deg, rgba(255,255,255,.05), transparent 18%),
            radial-gradient(ellipse at 50% 42%, #221c16, #070605 72%);
          box-shadow: inset 0 16px 22px rgba(0,0,0,.82), inset 0 -12px 16px rgba(0,0,0,.72), inset 0 0 0 1px rgba(0,0,0,.65);
        }
        .well .lit-mark { filter: drop-shadow(0 10px 5px rgba(0,0,0,.72)) drop-shadow(0 2px 1px rgba(0,0,0,.9)); height: var(--mark, 104px); width: auto; }
        .reel::after {
          content: ""; position: absolute; inset: 7px; border-radius: 12px; pointer-events: none;
          background: linear-gradient(180deg, rgba(255,255,255,.16), transparent 22%, transparent 70%, rgba(0,0,0,.35));
        }
        .spinwrap { display: flex; justify-content: center; }
        .spin {
          width: 128px; height: 128px; border-radius: 50%; padding: 0;
          color: #fff8e8; font-size: 18px; font-weight: 700; letter-spacing: 1px;
          background-color: #0c0b09;
          background-image:
            radial-gradient(circle at 50% 22%, rgba(255,248,230,.2), transparent 36%),
            radial-gradient(circle at 50% 30%, #2a2418, #070605 68%),
            linear-gradient(128deg, #2a1c08 0%, #8d6a2a 16%, #fff6d4 34%, #a9782c 46%, #fff1c2 52%, #5c4012 68%, #e7c56a 82%, #24180a 100%);
          background-origin: padding-box, padding-box, border-box;
          background-clip: padding-box, padding-box, border-box;
          border: 7px solid transparent;
          box-shadow: 0 10px 0 #3a2a10, 0 16px 22px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,248,230,.35);
          touch-action: manipulation;
        }
        .spin:active:not(:disabled), .spin[data-pressed="true"] {
          transform: translateY(8px);
          box-shadow: 0 2px 0 #3a2a10, 0 5px 8px rgba(0,0,0,.5);
        }
        .spin:disabled { opacity: 0.45; box-shadow: none; transform: none; }
        .well.spinning .lit-mark { animation: reelSlip 120ms linear infinite; }
        @keyframes reelSlip {
          from { transform: translateY(-14%); filter: blur(5px); }
          to { transform: translateY(16%); filter: blur(6px); }
        }
        .spin:focus-visible, .textbtn:focus-visible, .ghost:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
        .rules { display: block; font-size: 13px; line-height: 1.35; color: #f6edd6; }
        .result { min-height: 2.6em; font-size: 15px; color: #fff8e8; }
        .ghost, .textbtn {
          min-height: 44px; border-radius: 10px; border: 1px solid #e7c878;
          background: #14110c; color: #f6edd6; touch-action: manipulation;
        }
        .textbtn { background: transparent; border: none; color: #f0d78c; text-decoration: underline; min-height: 44px; }
        @media (prefers-reduced-motion: reduce) {
          .reel, .spin, .well.spinning .lit-mark { animation: none; transition: none; filter: none; }
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
          .reel .lit-mark { height: 76px; }
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
          .reel .lit-mark { height: 168px; }
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
            <i className="sheen" aria-hidden="true" />
            <strong>{line.multiplier}×</strong>
            <span>{line.label}</span>
          </div>
        ))}
      </div>
      <div className="reels" data-testid="spin-reels" data-symbols={reels.join(',')}>
        {reels.map((id, index) => (
          <div className="reel" key={`${id}-${index}`} aria-hidden={spinning}>
            <div className={`well ${spinning && !reduced ? 'spinning' : ''}`}><SlotSymbol id={id} size={symbolSize} /></div>
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
          data-pressed={spinning ? 'true' : 'false'}
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
