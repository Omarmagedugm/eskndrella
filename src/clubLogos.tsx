import React from 'react';
import { safeCover } from './coverImage';

// Official Alexandria clubs SVG crests as data URIs and vector renderers
export const ALEX_CLUB_LOGOS: Record<string, { name: string; short: string; color: string; bg: string; svg: string }> = {
  ittihad: {
    name: 'الاتحاد السكندري',
    short: 'الاتحاد',
    color: '#1b7a42',
    bg: '#e8f5e9',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ittihadGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1b7a42"/>
          <stop offset="100%" stop-color="#0f4a27"/>
        </linearGradient>
      </defs>
      <!-- Shield Shape -->
      <path d="M50 4 C76 4 92 18 92 46 C92 74 65 92 50 96 C35 92 8 74 8 46 C8 18 24 4 50 4 Z" fill="url(#ittihadGrad)" stroke="#FAF6EE" stroke-width="4"/>
      <!-- Inner White Border -->
      <path d="M50 10 C72 10 85 22 85 46 C85 68 62 84 50 88 C38 84 15 68 15 46 C15 22 28 10 50 10 Z" fill="none" stroke="#FAF6EE" stroke-width="2" opacity="0.6"/>
      <!-- Laurel Wreath -->
      <path d="M26 50 C24 38 32 26 50 26 C68 26 76 38 74 50 C72 64 62 72 50 72 C38 72 28 64 26 50 Z" fill="none" stroke="#F0C64A" stroke-width="2.5" stroke-dasharray="3,3"/>
      <!-- Text / Emblem -->
      <text x="50" y="47" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#FAF6EE" text-anchor="middle">ASC</text>
      <text x="50" y="63" font-family="Arial, sans-serif" font-weight="bold" font-size="11" fill="#F0C64A" text-anchor="middle">1914</text>
    </svg>`
  },
  smouha: {
    name: 'سموحة',
    short: 'سموحة',
    color: '#1d6bb3',
    bg: '#e3f2fd',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="smouhaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2196f3"/>
          <stop offset="100%" stop-color="#0d47a1"/>
        </linearGradient>
      </defs>
      <!-- Circular Modern Shield -->
      <circle cx="50" cy="50" r="45" fill="url(#smouhaGrad)" stroke="#FAF6EE" stroke-width="4"/>
      <circle cx="50" cy="50" r="39" fill="none" stroke="#FAF6EE" stroke-width="2" opacity="0.5"/>
      <!-- Waves -->
      <path d="M20 54 Q35 44 50 54 T80 54 Q65 64 50 54 T20 54" fill="#FAF6EE"/>
      <path d="M25 66 Q37 58 50 66 T75 66" fill="none" stroke="#FAF6EE" stroke-width="3" stroke-linecap="round"/>
      <text x="50" y="42" font-family="Arial, sans-serif" font-weight="900" font-size="14" fill="#FAF6EE" text-anchor="middle">SMOUHA</text>
      <text x="50" y="80" font-family="Arial, sans-serif" font-weight="bold" font-size="10" fill="#F0C64A" text-anchor="middle">1949</text>
    </svg>`
  },
  haras: {
    name: 'حرس الحدود',
    short: 'الحرس',
    color: '#c0392b',
    bg: '#fbe9e7',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="harasGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#c0392b"/>
          <stop offset="100%" stop-color="#102A43"/>
        </linearGradient>
      </defs>
      <!-- Military Crest Shield -->
      <path d="M50 4 L90 20 L90 54 C90 76 68 92 50 96 C32 92 10 76 10 54 L10 20 Z" fill="url(#harasGrad)" stroke="#F0C64A" stroke-width="4"/>
      <!-- Anchor / Star Symbol -->
      <path d="M50 24 L54 36 L66 36 L56 44 L60 56 L50 48 L40 56 L44 44 L34 36 L46 36 Z" fill="#F0C64A"/>
      <text x="50" y="70" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#FAF6EE" text-anchor="middle">HARAS</text>
      <text x="50" y="84" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#F0C64A" text-anchor="middle">1932</text>
    </svg>`
  },
  pharco: {
    name: 'فاركو',
    short: 'فاركو',
    color: '#d97706',
    bg: '#fef3c7',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pharcoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="84" height="84" rx="24" fill="url(#pharcoGrad)" stroke="#102A43" stroke-width="4"/>
      <circle cx="50" cy="50" r="32" fill="#102A43"/>
      <!-- Flame / Medical Cross stylized -->
      <path d="M50 26 C58 38 66 48 58 60 C54 66 46 66 42 60 C34 48 42 38 50 26 Z" fill="#F0C64A"/>
      <text x="50" y="76" font-family="Arial, sans-serif" font-weight="900" font-size="10" fill="#FAF6EE" text-anchor="middle">PHARCO</text>
    </svg>`
  },
  olympic: {
    name: 'الأوليمبي',
    short: 'الأوليمبي',
    color: '#b91c1c',
    bg: '#fee2e2',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="olympicGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </linearGradient>
      </defs>
      <path d="M50 4 C76 4 92 18 92 46 C92 74 65 92 50 96 C35 92 8 74 8 46 C8 18 24 4 50 4 Z" fill="url(#olympicGrad)" stroke="#FAF6EE" stroke-width="4"/>
      <!-- Olympic Torch -->
      <path d="M46 64 L54 64 L52 42 L48 42 Z" fill="#F0C64A"/>
      <path d="M50 22 C55 30 60 36 50 42 C40 36 45 30 50 22 Z" fill="#FAF6EE"/>
      <text x="50" y="78" font-family="Arial, sans-serif" font-weight="900" font-size="10" fill="#FAF6EE" text-anchor="middle">OLYMPIC</text>
      <text x="50" y="89" font-family="Arial, sans-serif" font-weight="bold" font-size="9" fill="#F0C64A" text-anchor="middle">1905</text>
    </svg>`
  },
  sporting: {
    name: 'سبورتنج',
    short: 'سبورتنج',
    color: '#b45309',
    bg: '#fef3c7',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sportingGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#d97706"/>
          <stop offset="100%" stop-color="#78350f"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#sportingGrad)" stroke="#FAF6EE" stroke-width="4"/>
      <!-- Crown / Jockey laurel -->
      <path d="M30 42 L40 54 L50 36 L60 54 L70 42 L66 64 L34 64 Z" fill="#FAF6EE"/>
      <text x="50" y="78" font-family="Arial, sans-serif" font-weight="900" font-size="10" fill="#F0C64A" text-anchor="middle">SPORTING</text>
      <text x="50" y="89" font-family="Arial, sans-serif" font-weight="bold" font-size="8" fill="#FAF6EE" text-anchor="middle">1890</text>
    </svg>`
  },
  abuqir: {
    name: 'أبو قير للأسمدة',
    short: 'أبو قير',
    color: '#0f766e',
    bg: '#ccfbf1',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="abuqirGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#14b8a6"/>
          <stop offset="100%" stop-color="#0f766e"/>
        </linearGradient>
      </defs>
      <path d="M50 6 L88 24 L88 58 C88 78 66 92 50 96 C34 92 12 78 12 58 L12 24 Z" fill="url(#abuqirGrad)" stroke="#FAF6EE" stroke-width="4"/>
      <!-- Industrial / Lighthouse beacon -->
      <path d="M44 60 L56 60 L53 38 L47 38 Z" fill="#FAF6EE"/>
      <circle cx="50" cy="32" r="5" fill="#F0C64A"/>
      <text x="50" y="76" font-family="Arial, sans-serif" font-weight="900" font-size="10" fill="#FAF6EE" text-anchor="middle">ABU QIR</text>
    </svg>`
  }
};

// Generic opposition clubs badges
export const OPPOSITION_BADGES: Record<string, { color: string; short: string; bg: string }> = {
  'الأهلي': { color: '#c0392b', short: 'الأهلي', bg: '#fee2e2' },
  'الزمالك': { color: '#e11d48', short: 'الزمالك', bg: '#ffe4e6' },
  'بيراميدز': { color: '#1e3a8a', short: 'بيراميدز', bg: '#dbeafe' },
  'الإسماعيلي': { color: '#ca8a04', short: 'الإسماعيلي', bg: '#fef9c3' },
  'غزل المحلة': { color: '#0284c7', short: 'المحلة', bg: '#e0f2fe' },
  'سيراميكا كليوباترا': { color: '#7f1d1d', short: 'سيراميكا', bg: '#fee2e2' },
  'وادي دجلة': { color: '#d97706', short: 'دجلة', bg: '#fef3c7' },
  'إنبي': { color: '#155e75', short: 'إنبي', bg: '#cffafe' },
  'البنك الأهلي': { color: '#ea580c', short: 'البنك', bg: '#ffedd5' },
  'زد إف سي': { color: '#18181b', short: 'زد', bg: '#f4f4f5' },
  'بلدية المحلة': { color: '#0369a1', short: 'البلدية', bg: '#e0f2fe' },
  'النصر القاهرة': { color: '#4338ca', short: 'النصر', bg: '#e0e7ff' },
  'الإنتاج الحربي': { color: '#475569', short: 'الإنتاج', bg: '#f1f5f9' },
  'كهرباء الإسماعيلية': { color: '#2563eb', short: 'الكهرباء', bg: '#dbeafe' }
};

// Resolve club key from string name or id
export function matchAlexClubKey(nameOrId: string): string | null {
  if (!nameOrId) return null;
  const s = nameOrId.toLowerCase().trim();
  if (s.includes('ittihad') || s.includes('اتحاد')) return 'ittihad';
  if (s.includes('smouha') || s.includes('سموحة')) return 'smouha';
  if (s.includes('haras') || s.includes('حرس الحدود') || s.includes('الحرس')) return 'haras';
  if (s.includes('pharco') || s.includes('فاركو')) return 'pharco';
  if (s.includes('olympic') || s.includes('أوليمبي') || s.includes('اوليمبي')) return 'olympic';
  if (s.includes('sporting') || s.includes('سبورتنج') || s.includes('سبورتينج')) return 'sporting';
  if (s.includes('abuqir') || s.includes('أبو قير') || s.includes('ابو قير')) return 'abuqir';
  return null;
}

// Convert SVG string to data URI
export function getClubSvgDataUri(clubKey: string): string | null {
  const c = ALEX_CLUB_LOGOS[clubKey];
  if (!c) return null;
  return `data:image/svg+xml;utf8,${encodeURIComponent(c.svg)}`;
}
export const getAlexClubVectorDataUri = getClubSvgDataUri;

// Dynamic registry of custom club logos uploaded from admin dashboard (PNG / WebP / SVG)
export const customClubLogosMap: Record<string, string> = {};

export function registerCustomClubLogos(
  clubs: Array<{ id?: string; name?: string; shortName?: string; imageUrl?: string | null }>
) {
  if (!Array.isArray(clubs)) return;
  for (const c of clubs) {
    if (!c) continue;
    const url = c.imageUrl;
    if (url && safeCover(url)) {
      if (c.id) customClubLogosMap[c.id.toLowerCase()] = url;
      if (c.name) customClubLogosMap[c.name.trim()] = url;
      if (c.shortName) customClubLogosMap[c.shortName.trim()] = url;
      const alexKey = matchAlexClubKey(c.id || c.name || '');
      if (alexKey) customClubLogosMap[alexKey] = url;
    } else if (url === '') {
      // If cleared, remove from registry
      if (c.id) delete customClubLogosMap[c.id.toLowerCase()];
      if (c.name) delete customClubLogosMap[c.name.trim()];
      if (c.shortName) delete customClubLogosMap[c.shortName.trim()];
      const alexKey = matchAlexClubKey(c.id || c.name || '');
      if (alexKey) delete customClubLogosMap[alexKey];
    }
  }
}

export function getClubCustomLogo(idOrName?: string | null): string | null {
  if (!idOrName) return null;
  const raw = idOrName.trim();
  if (customClubLogosMap[raw]) return customClubLogosMap[raw];
  if (customClubLogosMap[raw.toLowerCase()]) return customClubLogosMap[raw.toLowerCase()];
  const alexKey = matchAlexClubKey(raw);
  if (alexKey && customClubLogosMap[alexKey]) return customClubLogosMap[alexKey];
  return null;
}

export interface ClubLogoProps {
  name: string;
  id?: string;
  customUrl?: string | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function ClubLogo({ name, id, customUrl, size = 32, className = '', style }: ClubLogoProps) {
  // If custom URL uploaded in admin, or registered globally for this club, prioritize it
  const resolved = customUrl || getClubCustomLogo(id || name);
  const validCover = safeCover(resolved);
  if (validCover) {
    return (
      <img
        src={validCover}
        alt={name}
        className={`club-logo-img ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          objectFit: 'contain',
          background: 'transparent',
          flexShrink: 0,
          ...style
        }}
      />
    );
  }

  // Alexandria club fixed vector crest
  const alexKey = matchAlexClubKey(id || name);
  if (alexKey && ALEX_CLUB_LOGOS[alexKey]) {
    const club = ALEX_CLUB_LOGOS[alexKey];
    return (
      <div
        className={`club-logo-crest ${className}`}
        title={club.name}
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
        dangerouslySetInnerHTML={{ __html: club.svg }}
      />
    );
  }

  // Opposition club badge
  const oppEntry = Object.entries(OPPOSITION_BADGES).find(([k]) => name.includes(k));
  if (oppEntry) {
    const opp = oppEntry[1];
    return (
      <div
        className={`club-logo-opp ${className}`}
        title={name}
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
          background: `linear-gradient(135deg, ${opp.color}, #102a43)`,
          color: '#FAF6EE',
          fontWeight: 900,
          fontSize: Math.max(9, Math.round(size * 0.32)),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          ...style
        }}
      >
        {opp.short.slice(0, 2)}
      </div>
    );
  }

  // Generic fallback badge
  return (
    <div
      className={`club-logo-generic ${className}`}
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: '#102A43',
        color: '#F0C64A',
        fontWeight: 900,
        fontSize: Math.max(9, Math.round(size * 0.35)),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style
      }}
    >
      {name.trim().slice(0, 2)}
    </div>
  );
}

// Display club name with its official fixed badge beside it
export function ClubNameWithBadge({
  name,
  id,
  customUrl,
  size = 20,
  className = '',
  bold = true
}: {
  name: string;
  id?: string;
  customUrl?: string | null;
  size?: number;
  className?: string;
  bold?: boolean;
}) {
  return (
    <span
      className={`club-name-with-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: bold ? 800 : 500,
        whiteSpace: 'nowrap'
      }}
    >
      <ClubLogo name={name} id={id} customUrl={customUrl} size={size} />
      <span>{name}</span>
    </span>
  );
}
