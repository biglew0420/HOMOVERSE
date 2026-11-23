import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { LAYOUTS, areaNotice, geoFailureCopy, type AreaMode, type GeoFailure, type LayoutKey } from '../lib/area';
import { HAIR_COLORS, HAIR_STYLES, OUTFITS, OUTFIT_LABELS, SKIN_TONES, type AvatarStyle } from '../lib/avatarStyle';
import { frameStats } from '../lib/frameStats';
import { SlotMachine } from './SlotMachine';
import { searchShops } from '../lib/shops';
import { theme, cssVars } from '../lib/theme';
import { HOMOV_CONFIG, type HomovRank } from '../lib/homov';
import { demoAudio } from '../lib/audio';
import type { HomovState } from '../hooks/useHomov';
import { QUALITY_IDS, type QualityId, type QualitySettings } from '../lib/quality';

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

const button: CSSProperties = {
  pointerEvents: 'auto',
  touchAction: 'manipulation',
  background: theme.charcoal,
  color: theme.ivory,
  border: `1px solid ${theme.gold}`,
  borderRadius: 8,
  minHeight: 44,
};
const field: CSSProperties = { ...button, minHeight: 44, maxWidth: '100%' };

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
  nearEnterable: boolean;
  slotOpen: boolean;
  onEnterShop: () => void;
  onCloseSlot: () => void;
  epoch: number;
  onSpend: () => void;
  onPayout: (amount: number) => void;
  wins: { t: number; name: string; amount: number; machine: string }[];
  onReset: () => void;
  muted: boolean;
  onMute: () => void;
  displayName: string;
  onDisplayName: (name: string) => void;
  onWalkTo: (id: string) => void;
  onJumpTo: (id: string) => void;
  homov: HomovState & {
    connectWallet: () => Promise<void>;
    pasteAddress: (value: string) => Promise<void>;
    proveOwnership: () => Promise<void>;
    disconnect: () => void;
  };
  quality: QualitySettings;
  onQuality: (id: QualityId) => void;
};

export function Hud(props: Props) {
  const landscape = useLandscape();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [paste, setPaste] = useState('');
  const [frames, setFrames] = useState(0);
  const [step, setStep] = useState(0);
  const [fps, setFps] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setFrames(frameStats.frames);
      setStep(frameStats.lastStep);
      setFps(frameStats.fps);
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  const results = useMemo(() => searchShops(query), [query]);
  const notice = props.geoFailure ? geoFailureCopy(props.geoFailure) : areaNotice(props.areaMode);

  if (props.slotOpen) {
    return (
      <>
        <span data-testid="player-pos" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>{props.pos.x.toFixed(2)},{props.pos.z.toFixed(2)}</span>
        <span data-testid="hud" data-movement-locked="yes" data-layout-mode={props.areaMode} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }} />
        <SlotMachine
          name="Golden Hour Lounge"
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
    background: `linear-gradient(${theme.black}f8, ${theme.black}f0 86%, transparent)`,
    color: theme.ivory,
    fontSize: 12,
    lineHeight: 1.3,
  };

  const panel: CSSProperties = {
    position: 'fixed',
    zIndex: 48,
    left: 8,
    right: 8,
    bottom: landscape ? 12 : 128,
    maxHeight: landscape ? '70vh' : '42vh',
    overflow: 'auto',
    background: theme.black,
    color: theme.ivory,
    border: `1px solid ${theme.gold}`,
    boxShadow: `0 0 0 1px ${theme.blush}66`,
    borderRadius: 12,
    padding: 10,
    display: 'grid',
    gap: 8,
    pointerEvents: 'auto',
  };

  return (
    <>
      <div style={{ ['--x' as string]: 0, ...{ } }} />
      <div
        style={{ ...shell, ...Object.fromEntries(cssVars().split(';').map((pair) => {
          const [k, v] = pair.split(':');
          return [k, v];
        })) }}
        data-testid="hud"
        data-frames={frames}
        data-step={step.toFixed(4)}
        data-quality={props.quality.id}
        data-fps={fps.toFixed(1)}
        data-layout-mode={props.areaMode}
        data-movement-locked={props.movementLocked ? 'yes' : 'no'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
          <b style={{ color: theme.gold, fontSize: 16, letterSpacing: 1 }}>HOMOVERSE</b>
          <span data-testid="credits">DEMO CREDITS: {props.credits}</span>
        </div>
        <div data-testid="disclaimer" style={{ color: theme.ivory }}>
          Demo credits are not HOMO tokens. No cash value, no prizes, no cashout. Not purchasable, transferable, or redeemable.
        </div>
        <div style={{ opacity: 0.9 }}>{props.online} · {props.here} here · stylized, not photoreal · <span data-testid="fps">{fps ? `${Math.round(fps)} fps` : '… fps'}</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, pointerEvents: 'auto' }}>
          <select data-testid="layout-select" aria-label="Procedural district" style={field} value={props.layoutKey} onChange={(e) => props.onLayout(e.target.value as LayoutKey)}>
            {LAYOUTS.map((layout) => (
              <option key={layout.key} value={layout.key}>{layout.name}</option>
            ))}
          </select>
          <button type="button" style={button} data-testid="search-toggle" onClick={() => { setSearchOpen((o) => !o); setUserOpen(false); setAvatarOpen(false); demoAudio.click(); }}>Search</button>
          <button type="button" style={button} data-testid="user-toggle" onClick={() => { setUserOpen((o) => !o); setSearchOpen(false); demoAudio.click(); }}>User</button>
          <button type="button" style={button} data-testid="avatar-toggle" onClick={() => { setAvatarOpen((o) => !o); setSearchOpen(false); demoAudio.click(); }}>Avatar</button>
          <button type="button" style={button} data-testid="locate" onClick={props.onLocate} disabled={props.geoStatus === 'pending' || props.geoStatus === 'unsupported'}>
            {props.geoStatus === 'pending' ? 'Checking location…' : 'Use my location'}
          </button>
          <select data-testid="quality-select" aria-label="Quality" style={field} value={props.quality.id} onChange={(e) => props.onQuality(e.target.value as QualityId)}>
            {QUALITY_IDS.map((id) => (
              <option key={id} value={id}>{id[0].toUpperCase() + id.slice(1)}</option>
            ))}
          </select>
          <button type="button" style={button} data-testid="mute-toggle" aria-pressed={props.muted} onClick={props.onMute}>
            {props.muted ? 'Sound off' : 'Sound on'}
          </button>
          <button type="button" style={button} data-testid="reset-demo" onClick={props.onReset}>Reset local demo</button>
        </div>
        <div data-testid="area-notice" data-geo={props.geoStatus}>{notice}</div>
        <div style={{ opacity: 0.9 }}>On this device only. Not an account. {props.wins[0] ? `Last demo win +${props.wins[0].amount} demo credits` : 'No demo wins yet.'}</div>
        <span data-testid="player-pos" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>{props.pos.x.toFixed(2)},{props.pos.z.toFixed(2)}</span>
        <span data-testid="district-signature" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>{props.districtSignature}</span>
        <span data-testid="avatar-applied" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>{props.avatar.outfit}</span>
      </div>

      {searchOpen && (
        <div data-testid="search-panel" style={panel}>
          <b style={{ color: theme.gold }}>Search the ring</b>
          <input data-testid="search-input" aria-label="Search stores" placeholder="Golden Hour, tailor, café…" value={query} onChange={(e) => setQuery(e.target.value)} style={field} />
          {results.map((shop) => (
            <div key={shop.id} data-testid={`search-result-${shop.id}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${theme.gold}33`, paddingTop: 6 }}>
              <span>
                <strong>{shop.name}</strong>
                <span style={{ display: 'block', fontSize: 11, color: theme.blush }}>{shop.searchHint}{shop.enterable ? ' · enterable' : ' · facade only'}</span>
              </span>
              <span style={{ display: 'flex', gap: 6 }}>
                <button type="button" style={button} onClick={() => { demoAudio.click(); props.onWalkTo(shop.id); setSearchOpen(false); }}>Walk</button>
                <button type="button" style={button} onClick={() => { demoAudio.click(); props.onJumpTo(shop.id); setSearchOpen(false); }}>Jump</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {userOpen && (
        <UserPanel
          style={panel}
          displayName={props.displayName}
          onDisplayName={props.onDisplayName}
          credits={props.credits}
          avatarOpen={() => { setAvatarOpen(true); setUserOpen(false); }}
          field={field}
          button={button}
          homov={props.homov}
          paste={paste}
          setPaste={setPaste}
        />
      )}

      {avatarOpen && (
        <div data-testid="avatar-panel" style={panel}>
          <b style={{ color: theme.gold }}>Avatar</b>
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
              {OUTFITS.map((outfit) => <option key={outfit} value={outfit}>{OUTFIT_LABELS[outfit]}</option>)}
            </select>
          </label>
        </div>
      )}

      {props.nearName && props.nearEnterable && (
        <button
          type="button"
          data-testid="enter-shop"
          onClick={() => { demoAudio.enter(); props.onEnterShop(); }}
          style={{
            position: 'fixed',
            zIndex: 34,
            left: '50%',
            bottom: landscape ? 16 : 132,
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
            ...button,
            boxShadow: `0 0 12px ${theme.blush}55`,
          }}
        >
          Enter {props.nearName}
        </button>
      )}
    </>
  );
}

function UserPanel({
  style,
  displayName,
  onDisplayName,
  credits,
  avatarOpen,
  field,
  button,
  homov,
  paste,
  setPaste,
}: {
  style: CSSProperties;
  displayName: string;
  onDisplayName: (name: string) => void;
  credits: number;
  avatarOpen: () => void;
  field: CSSProperties;
  button: CSSProperties;
  homov: Props['homov'];
  paste: string;
  setPaste: (v: string) => void;
}) {
  const rank: HomovRank = homov.rank;
  const chainNote = homov.chainId && parseInt(homov.chainId, 16) !== HOMOV_CONFIG.chainId
    ? `Wallet chain ${homov.chainId}. Balance is still read from Base, not from that chain.`
    : null;
  return (
    <div data-testid="user-panel" style={style}>
      <b style={{ color: theme.gold }}>User</b>
      <label>Local name
        <input data-testid="display-name" style={{ ...field, width: '100%' }} value={displayName} maxLength={24} placeholder="Guest" onChange={(e) => onDisplayName(e.target.value)} />
      </label>
      <div data-testid="user-credits">Demo balance: {credits} demo credits</div>
      <button type="button" style={button} onClick={avatarOpen}>Avatar</button>
      <div style={{ fontSize: 13 }}>Accounts coming soon</div>
      <hr style={{ borderColor: `${theme.gold}55`, width: '100%' }} />
      <b style={{ color: theme.gold }}>HOMOV membership (read-only)</b>
      <p style={{ margin: 0, fontSize: 12 }}>{HOMOV_CONFIG.emblemCopy}</p>
      <p data-testid="homov-disclaimer" style={{ margin: 0, fontSize: 12 }}>{HOMOV_CONFIG.disclaimer}</p>
      {homov.address && (
        <div data-testid="homov-status">
          <div style={{ wordBreak: 'break-all' }}>{homov.address}{homov.source === 'paste' ? ' (pasted preview)' : ''}</div>
          <div data-testid="homov-balance">{homov.balance == null ? '…' : `${homov.balance} HOMOV`}</div>
          <div data-testid="homov-rank">Rank: {rank.label}</div>
          {homov.verified && homov.member && <div data-testid="homo-member-badge">HOMO Member</div>}
          {homov.source === 'paste' && <div>Pasted addresses are a preview. Connect a wallet to wear the badge and enter the Members' Booth.</div>}
        </div>
      )}
      {chainNote && <div>{chainNote}</div>}
      {homov.error && <div data-testid="homov-error">{homov.error}</div>}
      <button type="button" style={button} data-testid="connect-wallet" onClick={() => { demoAudio.click(); void homov.connectWallet(); }} disabled={homov.status === 'working'}>
        Connect wallet
      </button>
      <form
        onSubmit={(e) => { e.preventDefault(); demoAudio.click(); void homov.pasteAddress(paste); }}
        style={{ display: 'grid', gap: 6 }}
      >
        <input data-testid="paste-address" style={field} placeholder="Paste address or basename" value={paste} onChange={(e) => setPaste(e.target.value)} />
        <button type="submit" style={button} data-testid="paste-address-go">Look up (read-only)</button>
      </form>
      {homov.address && !homov.verified && (
        <button type="button" style={button} data-testid="prove-wallet" onClick={() => void homov.proveOwnership()}>
          Prove wallet (free signature, no gas)
        </button>
      )}
      {homov.address && <button type="button" style={button} onClick={homov.disconnect}>Disconnect</button>}
    </div>
  );
}
