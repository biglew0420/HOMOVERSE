import { useId } from 'react';
import type { SymbolId } from '../../lib/slotMath';

function GoldDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff6d8" />
        <stop offset="0.28" stopColor="#f3d78a" />
        <stop offset="0.62" stopColor="#c8963a" />
        <stop offset="1" stopColor="#6e4e16" />
      </linearGradient>
      <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
        <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${id}-jewel`} cx="35%" cy="30%" r="70%">
        <stop offset="0" stopColor="#fffaf0" />
        <stop offset="0.35" stopColor="#e7c56a" />
        <stop offset="1" stopColor="#7a5414" />
      </radialGradient>
    </defs>
  );
}

export function SeahorseArt({ size = 120 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size * 1.28} viewBox="0 0 100 140" role="img" aria-label="Gold seahorse">
      <GoldDefs id={uid} />
      <path d="M38 22 C46 8 62 10 66 22 C70 12 78 16 76 26" fill="none" stroke={`url(#${uid}-g)`} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M62 34 C84 40 86 62 70 74 C80 86 74 108 58 116 C40 126 22 118 24 102 C26 90 40 92 38 104" fill="none" stroke={`url(#${uid}-g)`} strokeWidth="11" strokeLinecap="round" />
      <path d="M58 40 C66 48 64 60 56 66" fill="none" stroke="#5a3d10" strokeWidth="1.4" opacity="0.55" />
      <ellipse cx="74" cy="30" rx="14" ry="6.5" transform="rotate(-12 74 30)" fill={`url(#${uid}-g)`} />
      <circle cx="64" cy="30" r="13" fill={`url(#${uid}-g)`} />
      <path d="M48 24 L54 16 L58 26 L50 28 Z" fill="#fff1c2" />
      <path d="M58 18 L64 8 L66 22 Z" fill={`url(#${uid}-g)`} />
      <path d="M66 16 L74 10 L72 24 Z" fill="#e7c56a" />
      <path d="M46 48 C38 44 34 52 36 60 C30 58 26 66 32 72" fill={`url(#${uid}-jewel)`} opacity="0.95" />
      <path d="M70 46 L78 42 L76 52 Z M66 58 L76 56 L72 66 Z M60 70 L70 72 L62 80 Z" fill="#f8e7b4" />
      <circle cx="68" cy="28" r="3.4" fill="#1a1208" />
      <circle cx="69.1" cy="26.8" r="1.15" fill="#fff" />
      <circle cx="52" cy="78" r="2.1" fill="#fff6d4" />
      <circle cx="48" cy="90" r="1.7" fill="#f0d48a" />
      <circle cx="46" cy="100" r="1.4" fill="#fff6d4" />
      <path d="M40 112 C28 108 22 116 28 122" fill="none" stroke="#fff6d4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HMarkArt({ size = 96 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label="Geometric H">
      <GoldDefs id={uid} />
      <rect x="14" y="8" width="14" height="64" rx="4" fill={`url(#${uid}-g)`} />
      <rect x="52" y="8" width="14" height="64" rx="4" fill={`url(#${uid}-g)`} />
      <rect x="22" y="33" width="36" height="14" rx="4" fill={`url(#${uid}-g)`} />
      <rect x="16" y="10" width="4" height="40" rx="2" fill={`url(#${uid}-shine)`} />
      <polygon points="40,26 47,40 40,54 33,40" fill="#fff8e4" />
    </svg>
  );
}

export function JewelArt({ size = 96 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label="Champagne jewel">
      <GoldDefs id={uid} />
      <polygon points="40,6 66,24 58,66 22,66 14,24" fill={`url(#${uid}-jewel)`} />
      <polygon points="40,6 66,24 40,34" fill="#fff6d8" opacity="0.85" />
      <polygon points="14,24 40,34 22,66" fill="#8a6420" />
      <polygon points="40,34 58,66 22,66" fill="#c8963a" />
      <polygon points="40,18 48,30 40,28 32,30" fill="#fff" opacity="0.9" />
    </svg>
  );
}

export function ArchArt({ size = 96 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label="Promenade arch">
      <GoldDefs id={uid} />
      <path d="M18 68 V36 C18 16 62 16 62 36 V68" fill="#140f0a" stroke={`url(#${uid}-g)`} strokeWidth="7" />
      <rect x="12" y="64" width="12" height="8" rx="1" fill={`url(#${uid}-g)`} />
      <rect x="56" y="64" width="12" height="8" rx="1" fill={`url(#${uid}-g)`} />
      <path d="M28 68 V42 C28 30 52 30 52 42 V68" fill="none" stroke="#f0d78c" strokeWidth="2" />
    </svg>
  );
}

export function MedallionArt({ size = 96 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label="Gold medallion">
      <GoldDefs id={uid} />
      <circle cx="40" cy="40" r="30" fill={`url(#${uid}-g)`} />
      <circle cx="40" cy="40" r="22" fill="#140f0a" stroke="#fff1c4" strokeWidth="2" />
      <rect x="30" y="24" width="6" height="32" rx="1.5" fill={`url(#${uid}-g)`} />
      <rect x="44" y="24" width="6" height="32" rx="1.5" fill={`url(#${uid}-g)`} />
      <rect x="33" y="36" width="14" height="6" rx="1.5" fill={`url(#${uid}-g)`} />
    </svg>
  );
}

export function SlotSymbol({ id, size = 96 }: { id: SymbolId; size?: number }) {
  if (id === 'seahorse') return <SeahorseArt size={size} />;
  if (id === 'hmark') return <HMarkArt size={size} />;
  if (id === 'jewel') return <JewelArt size={size} />;
  if (id === 'arch') return <ArchArt size={size} />;
  return <MedallionArt size={size} />;
}
