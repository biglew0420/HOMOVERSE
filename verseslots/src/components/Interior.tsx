import type { CSSProperties, ReactNode } from 'react';
import { NPC_LINES, NPC_META } from '../lib/npcLines';
import { HOMOGAP_SHOP_URL } from '../lib/shops';
import { theme } from '../lib/theme';
import { HOMOV_CONFIG, type HomovRankId } from '../lib/homov';
import { demoAudio } from '../lib/audio';

const shell: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  flexDirection: 'column',
  color: theme.ivory,
  fontFamily: 'system-ui, sans-serif',
  background: `radial-gradient(80% 60% at 50% 0%, ${theme.dusk}, ${theme.black} 70%)`,
};

const room: CSSProperties = {
  flex: 1,
  margin: 12,
  border: `1.5px solid ${theme.gold}`,
  boxShadow: `inset 0 0 0 1px ${theme.blush}55`,
  borderRadius: 16,
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  padding: 16,
  gap: 10,
};

function Floor({ color, tex }: { color: string; tex?: string }) {
  const base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? './';
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: '-10%',
        right: '-10%',
        bottom: 0,
        height: '42%',
        background: tex
          ? `linear-gradient(180deg, transparent, ${color}cc), url(${base}${tex})`
          : `linear-gradient(180deg, transparent, ${color})`,
        backgroundSize: tex ? 'auto, 180px 180px' : undefined,
        transform: 'perspective(400px) rotateX(55deg)',
        transformOrigin: 'bottom',
        boxShadow: `inset 0 0 80px ${theme.black}`,
      }}
    />
  );
}

function Action({ children, onClick, testid, href }: { children: ReactNode; onClick?: () => void; testid: string; href?: string }) {
  const style: CSSProperties = {
    minHeight: 44,
    background: theme.charcoal,
    color: theme.ivory,
    border: `1px solid ${theme.gold}`,
    borderRadius: 8,
    padding: '8px 12px',
  };
  if (href) {
    return (
      <a data-testid={testid} href={href} target="_blank" rel="noopener noreferrer" style={{ ...style, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} onClick={() => demoAudio.click()}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" data-testid={testid} style={style} onClick={() => { demoAudio.click(); onClick?.(); }} onMouseEnter={() => demoAudio.hover()}>
      {children}
    </button>
  );
}

export function Interior({
  shopId,
  shopName,
  rank,
  member,
  onExit,
  onPlay,
  onBooth,
  onPlayBingo,
}: {
  shopId: string;
  shopName: string;
  rank: HomovRankId;
  member: boolean;
  onExit: () => void;
  onPlay: () => void;
  onBooth: () => void;
  onPlayBingo: () => void;
}) {
  const copy: Record<string, { mood: string; detail: string; floor: string }> = {
    golden: {
      mood: 'Black lacquer, gold trim, a cabinet waiting without hurry.',
      detail: 'Demo credits only. The slot is an amusement, not the point of the house.',
      floor: '#161218',
    },
    tailor: {
      mood: 'Mirrors, jackets, a careful eye for break and shoulder.',
      detail: 'Jules looks up from the counter. If it does not feel like you, you do not leave with it.',
      floor: '#1a1410',
    },
    cafe: {
      mood: 'Warm light, cool-rose linens, coffee at dusk.',
      detail: 'A place to pause. Night-out energy starts here as easily as a dressing room.',
      floor: '#201816',
    },
    members: {
      mood: 'Leather chairs, low gold lamps, mauve velvet, and a table for Homo Bingo.',
      detail: 'Free play with demo HOMOV daubers. Your real HOMOV is never spent.',
      floor: '#1a1016',
    },
    homogap: {
      mood: 'The cut, the cloth, the house mark on something you can wear out the door.',
      detail: 'The shop does not sell tokens. It points to the real house store.',
      floor: '#16120f',
    },
  };
  const roomCopy = copy[shopId] ?? copy.golden;
  return (
    <div style={shell} data-testid="interior" data-shop={shopId}>
      <div style={{ padding: 'max(8px, env(safe-area-inset-top)) 12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ color: theme.gold }}>{shopName}</strong>
        <Action testid="exit-interior" onClick={onExit}>Exit</Action>
      </div>
      <div style={room}>
        <Floor color={roomCopy.floor} tex={shopId === 'members' ? 'tex/velvet_diff.webp' : 'tex/wood_diff.webp'} />
        <div aria-hidden style={{ position: 'absolute', inset: 16, border: `1px solid ${theme.gold}55`, borderRadius: 12, pointerEvents: 'none', boxShadow: `inset 0 0 60px ${theme.mauve}33` }} />
        {shopId === 'tailor' && <div aria-hidden style={{ position: 'absolute', right: 28, top: 28, width: 70, height: 120, border: `2px solid ${theme.gold}`, background: '#2a2420aa' }} />}
        {shopId === 'cafe' && <div aria-hidden style={{ position: 'absolute', left: 24, bottom: 90, width: 80, height: 36, borderRadius: 18, background: theme.coolRose, opacity: 0.45 }} />}
        {shopId === 'members' && <div aria-hidden style={{ position: 'absolute', left: 30, top: 40, width: 90, height: 50, background: theme.velvet, border: `1px solid ${theme.gold}` }} />}
        {shopId === 'homogap' && <div aria-hidden style={{ position: 'absolute', right: 24, top: 36, width: 64, height: 80, background: theme.charcoal, border: `1px solid ${theme.gold}` }} />}
        {shopId === 'golden' && <div aria-hidden style={{ position: 'absolute', left: '50%', top: 36, transform: 'translateX(-50%)', width: 90, height: 110, background: theme.ink, border: `2px solid ${theme.gold}`, borderRadius: 8, boxShadow: `0 0 24px ${theme.gold}55` }} />}
        <p style={{ position: 'relative', margin: 0, maxWidth: 560 }}>{roomCopy.mood}</p>
        <p style={{ position: 'relative', margin: 0, maxWidth: 560, opacity: 0.9 }}>{roomCopy.detail}</p>
        {shopId === 'members' && <p style={{ position: 'relative', margin: 0 }}>{NPC_META.simon.name}: “{NPC_LINES.simon[0]}”</p>}
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {shopId === 'golden' && <Action testid="play-golden-hour" onClick={onPlay}>Play Golden Hour</Action>}
          {shopId === 'golden' && member && <Action testid="open-members-booth" onClick={onBooth}>Enter Members' Booth</Action>}
          {shopId === 'golden' && !member && (
            <span data-testid="members-booth-locked" style={{ alignSelf: 'center', fontSize: 13, color: theme.blush }}>
              Members' Booth · HOMO Member badge required (read-only balance check)
            </span>
          )}
          {shopId === 'members' && <Action testid="play-homo-bingo" onClick={onPlayBingo}>Play Homo Bingo</Action>}
          {shopId === 'homogap' && <Action testid="homogap-shop-link" href={HOMOGAP_SHOP_URL}>Shop homoGAP (opens in a new tab)</Action>}
        </div>
        {member && shopId === 'golden' && (
          <p style={{ position: 'relative', margin: 0, fontSize: 13, color: theme.gold }}>HOMO Member · {rank}</p>
        )}
        <p style={{ position: 'relative', margin: 0, fontSize: 12, color: theme.cream }}>{HOMOV_CONFIG.disclaimer}</p>
      </div>
    </div>
  );
}

export function MembersBooth({ rank, onExit }: { rank: HomovRankId; onExit: () => void }) {
  return (
    <div style={shell} data-testid="members-booth">
      <div style={{ padding: 'max(8px, env(safe-area-inset-top)) 12px 0', display: 'flex', justifyContent: 'space-between' }}>
        <strong style={{ color: theme.gold }}>Members' Booth</strong>
        <Action testid="exit-booth" onClick={onExit}>Back to the lounge</Action>
      </div>
      <div style={{ ...room, background: `linear-gradient(180deg, ${theme.velvet}, ${theme.black})` }}>
        <Floor color={theme.velvet} tex="tex/velvet_diff.webp" />
        <p style={{ position: 'relative' }}>A quieter corner of Golden Hour. Mauve velvet, a low gold lamp, no ledger.</p>
        <p style={{ position: 'relative' }}>{NPC_META.simon.name}: “{NPC_LINES.simon[4]}”</p>
        <p style={{ position: 'relative', color: theme.gold }}>Cosmetic rank: {rank}</p>
        <p style={{ position: 'relative', fontSize: 13 }}>{HOMOV_CONFIG.emblemCopy}</p>
        <p style={{ position: 'relative', fontSize: 12 }}>{HOMOV_CONFIG.disclaimer}</p>
      </div>
    </div>
  );
}

export function FadeVeil({ on }: { on: boolean }) {
  return (
    <div
      data-testid="fade-veil"
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: theme.black,
        opacity: on ? 1 : 0,
        pointerEvents: on ? 'auto' : 'none',
        transition: 'opacity 0.55s ease',
      }}
    />
  );
}
