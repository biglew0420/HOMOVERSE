import { useEffect, useState, type CSSProperties } from 'react';
import { LAYOUTS, areaNotice, geoFailureCopy, type AreaMode, type GeoFailure, type LayoutKey } from '../lib/area';
import { HAIR_COLORS, HAIR_STYLES, OUTFITS, SKIN_TONES, type AvatarStyle } from '../lib/avatarStyle';
import { frameStats } from '../lib/frameStats';
import { SlotMachine } from './SlotMachine';

export function useLandscape() {
  const [on, setOn] = useState(() => window.innerWidth > window.innerHeight);
  useEffect(() => {
    const apply = () => setOn(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    return () => {
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
    };
  }, []);
  return on;
}

const button: CSSProperties = { pointerEvents: 'auto', touchAction: 'manipulation' };
const field: CSSProperties = { ...button, minHeight: 44, maxWidth: '100%', background: '#14120e', color: '#f6edd6', border: '1px solid #d4af37', borderRadius: 8 };

type Props = {
  online: string;
  here: number;
  credits: number;
  pos: { x: number; z: number };
  layoutKey: LayoutKey;
  onLayout: (key: LayoutKey) => void;
  areaMode: AreaMode;
  geoStatus: string;
  geoFailure: GeoFailure | null;
  onLocate: () => void;
  avatar: AvatarStyle;
  onAvatar: (next: AvatarStyle) => void;
  districtSignature: string;
  movementLocked: boolean;
  nearName: string | null;
  slotName: string | null;
  onOpenSlot: () => void;
  onCloseSlot: () => void;
  epoch: number;
  onSpend: () => void;
  onPayout: (amount: number) => void;
  wins: { t: number; name: string; amount: number; machine: string }[];
  onReset: () => void;
};

export function Hud(props: Props) {
  const landscape = useLandscape();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [frames, setFrames] = useState(0);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setFrames(frameStats.frames);
      setStep(frameStats.lastStep);
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  const notice = props.geoFailure ? geoFailureCopy(props.geoFailure) : areaNotice(props.areaMode);
  if (props.slotName) {
    return (
      <>
        <span data-testid="player-pos" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>{props.pos.x.toFixed(2)},{props.pos.z.toFixed(2)}</span>
        <span data-testid="hud" data-movement-locked="yes" data-layout-mode={props.areaMode} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }} />
        <SlotMachine
          name={props.slotName}
          credits={props.credits}
          epoch={props.epoch}
          onSpend={props.onSpend}
          onPayout={props.onPayout}
          onClose={props.onCloseSlot}
        />
      </>
    );
  }
  const shell: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    pointerEvents: 'none',
    padding: 'max(6px, env(safe-area-inset-top)) 8px 6px',
    background: 'linear-gradient(#0b0b10f8, #0b0b10f0 86%, transparent)',
    color: '#f6edd6',
    fontSize: 12,
    lineHeight: 1.3,
  };

  return (
    <>
      <div
        style={shell}
        data-testid="hud"
        data-frames={frames}
        data-step={step.toFixed(4)}
        data-layout-mode={props.areaMode}
        data-movement-locked={props.movementLocked ? 'yes' : 'no'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
          <b style={{ color: '#d4af37', fontSize: 16, letterSpacing: 1 }}>HOMOVERSE</b>
          <span data-testid="credits">DEMO CREDITS: {props.credits}</span>
        </div>
        <div data-testid="disclaimer" style={{ color: '#f6edd6' }}>
          Demo credits are not HOMO tokens. No cash value, no prizes, no cashout. Not purchasable, transferable, or redeemable.
        </div>
        <div style={{ opacity: 0.9 }}>{props.online} · {props.here} here · synthetic, not photoreal</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          <select
            data-testid="layout-select"
            aria-label="Procedural district"
            style={field}
            value={props.layoutKey}
            onChange={(e) => props.onLayout(e.target.value as LayoutKey)}
          >
            {LAYOUTS.map((layout) => (
              <option key={layout.key} value={layout.key}>{layout.name}</option>
            ))}
          </select>
          <button type="button" style={button} data-testid="avatar-toggle" onClick={() => setAvatarOpen((open) => !open)}>Avatar</button>
          <button
            type="button"
            style={button}
            data-testid="locate"
            onClick={props.onLocate}
            disabled={props.geoStatus === 'pending' || props.geoStatus === 'unsupported'}
          >
            {props.geoStatus === 'pending' ? 'Checking location…' : 'Use my location'}
          </button>
          <button type="button" style={button} data-testid="reset-demo" onClick={props.onReset}>Reset local demo</button>
        </div>
        <div data-testid="area-notice" data-geo={props.geoStatus}>{notice}</div>
        <div style={{ opacity: 0.9 }}>On this device only. Not an account. {props.wins[0] ? `Last demo win +${props.wins[0].amount} demo credits` : 'No demo wins yet.'}</div>
        <span data-testid="player-pos" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>{props.pos.x.toFixed(2)},{props.pos.z.toFixed(2)}</span>
        <span data-testid="district-signature" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>{props.districtSignature}</span>
        <span data-testid="avatar-applied" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>{props.avatar.outfit}</span>
      </div>

      {avatarOpen && (
        <div
          data-testid="avatar-panel"
          style={{
            position: 'fixed',
            zIndex: 48,
            left: 8,
            right: 8,
            top: 'auto',
            bottom: landscape ? 12 : 128,
            width: 'auto',
            maxHeight: landscape ? '70vh' : '42vh',
            overflow: 'auto',
            background: '#0b0b10',
            color: '#f6edd6',
            border: '1px solid #d4af37',
            borderRadius: 12,
            padding: 10,
            display: 'grid',
            gap: 8,
          }}
        >
          <b style={{ color: '#d4af37' }}>Avatar</b>
          <span style={{ fontSize: 11 }}>Stylized mannequin. Not a scan of a real person. Applies immediately on this device.</span>
          <label>Skin
            <select data-testid="avatar-skin" style={{ ...field, width: '100%' }} value={props.avatar.skin} onChange={(e) => props.onAvatar({ ...props.avatar, skin: Number(e.target.value) })}>
              {SKIN_TONES.map((color, index) => <option key={color} value={index}>Tone {index + 1}</option>)}
            </select>
          </label>
          <label>Hair
            <select data-testid="avatar-hair" style={{ ...field, width: '100%' }} value={props.avatar.hair} onChange={(e) => props.onAvatar({ ...props.avatar, hair: e.target.value as AvatarStyle['hair'] })}>
              {HAIR_STYLES.map((hair) => <option key={hair} value={hair}>{hair}</option>)}
            </select>
          </label>
          <label>Hair color
            <select data-testid="avatar-hair-color" style={{ ...field, width: '100%' }} value={props.avatar.hairColor} onChange={(e) => props.onAvatar({ ...props.avatar, hairColor: Number(e.target.value) })}>
              {HAIR_COLORS.map((color, index) => <option key={color} value={index}>Color {index + 1}</option>)}
            </select>
          </label>
          <label>Outfit
            <select data-testid="avatar-outfit" style={{ ...field, width: '100%' }} value={props.avatar.outfit} onChange={(e) => props.onAvatar({ ...props.avatar, outfit: e.target.value as AvatarStyle['outfit'] })}>
              {OUTFITS.map((outfit) => <option key={outfit} value={outfit}>{outfit}</option>)}
            </select>
          </label>
        </div>
      )}

      {props.nearName && !props.slotName && (
        <button
          type="button"
          data-testid="open-slot"
          onClick={props.onOpenSlot}
          style={{
            position: 'fixed',
            zIndex: 34,
            left: '50%',
            bottom: landscape ? 16 : 132,
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
          }}
        >
          Demo slot · {props.nearName}
        </button>
      )}

    </>
  );
}
