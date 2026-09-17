import { useId, type ReactNode, type SVGProps } from 'react';

import { cn } from '@/lib/utils';

/** Eight BYND8 empty scenes from the dancer empty-state reference. */
export type EmptyIllustrationKind =
  | 'discoverGuest'
  | 'eventsGuest'
  | 'organizeGuest'
  | 'profileGuest'
  | 'discoverLocation'
  | 'eventsSaved'
  | 'organizeCreate'
  | 'profileSetup'
  /** Legacy aliases used elsewhere */
  | 'discover'
  | 'filters'
  | 'location'
  | 'events'
  | 'saved'
  | 'passes'
  | 'profile'
  | 'organize'
  | 'signIn'
  | 'cancelled';

type Props = SVGProps<SVGSVGElement> & {
  kind: EmptyIllustrationKind;
};

const O = '#FF6500';
const L = '#B8FF00';
const W = '#F4F4F1';
const M = 'rgba(244,244,241,0.45)';

/**
 * Empty art with soft stage glow that dissolves into the page (no card/banner frame).
 */
export function EmptyIllustration({ kind, className, ...props }: Props) {
  const uid = useId().replace(/:/g, '');
  const glow = `${uid}-glow`;
  const floor = `${uid}-floor`;
  const haze = `${uid}-haze`;
  const resolved = resolveKind(kind);
  const Art = ART[resolved];

  return (
    <svg
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-auto w-full max-w-[18rem] sm:max-w-[20rem]', className)}
      aria-hidden
      {...props}
    >
      <defs>
        <radialGradient id={glow} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor={O} stopOpacity="0.28" />
          <stop offset="45%" stopColor={O} stopOpacity="0.1" />
          <stop offset="100%" stopColor={O} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={haze} cx="50%" cy="18%" r="48%">
          <stop offset="0%" stopColor={O} stopOpacity="0.2" />
          <stop offset="100%" stopColor={O} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={floor} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={O} stopOpacity="0.18" />
          <stop offset="55%" stopColor="#080808" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#080808" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Atmosphere merges into page bg — no opaque plate */}
      <ellipse cx="160" cy="118" rx="150" ry="108" fill={`url(#${glow})`} />
      <ellipse cx="160" cy="36" rx="100" ry="48" fill={`url(#${haze})`} />
      <ellipse
        cx="160"
        cy="208"
        rx="118"
        ry="28"
        fill={`url(#${floor})`}
        filter={`url(#${uid}-soft)`}
      />
      <path d="M118 8 L202 8 L248 200 L72 200 Z" fill={O} fillOpacity="0.06" />

      <Art />
    </svg>
  );
}

type CoreKind =
  | 'discoverGuest'
  | 'eventsGuest'
  | 'organizeGuest'
  | 'profileGuest'
  | 'discoverLocation'
  | 'eventsSaved'
  | 'organizeCreate'
  | 'profileSetup';

function resolveKind(kind: EmptyIllustrationKind): CoreKind {
  switch (kind) {
    case 'discoverGuest':
    case 'discover':
      return 'discoverGuest';
    case 'eventsGuest':
    case 'signIn':
      return 'eventsGuest';
    case 'organizeGuest':
    case 'organize':
      return 'organizeGuest';
    case 'profileGuest':
    case 'profile':
      return 'profileGuest';
    case 'discoverLocation':
    case 'location':
    case 'filters':
      return 'discoverLocation';
    case 'eventsSaved':
    case 'events':
    case 'saved':
    case 'passes':
    case 'cancelled':
      return 'eventsSaved';
    case 'organizeCreate':
      return 'organizeCreate';
    case 'profileSetup':
      return 'profileSetup';
    default:
      return 'discoverGuest';
  }
}

/** Spotlight floor + “GOOD EVENTS AHEAD” */
function DiscoverGuestArt() {
  return (
    <g>
      <ellipse cx="160" cy="200" rx="110" ry="18" fill={O} fillOpacity="0.12" />
      <path d="M120 20 L200 20 L250 200 L70 200 Z" fill={O} fillOpacity="0.08" />
      <ellipse cx="160" cy="28" rx="28" ry="10" fill={O} fillOpacity="0.35" />
      <path d="M148 38 L172 38 L190 120 L130 120 Z" fill={O} fillOpacity="0.2" />
      <text
        x="160"
        y="155"
        textAnchor="middle"
        fill={O}
        fontFamily="system-ui,sans-serif"
        fontSize="18"
        fontWeight="800"
        letterSpacing="0.06em"
      >
        GOOD EVENTS
      </text>
      <text
        x="160"
        y="178"
        textAnchor="middle"
        fill={O}
        fontFamily="system-ui,sans-serif"
        fontSize="18"
        fontWeight="800"
        letterSpacing="0.08em"
      >
        AHEAD
      </text>
      <path d="M160 95 L168 115 L160 110 L152 115 Z" fill={L} />
    </g>
  );
}

/** Locked poster stack */
function EventsGuestArt() {
  return (
    <g>
      <rect x="70" y="48" width="70" height="95" rx="6" fill="#1a1a1a" stroke={M} strokeWidth="2" transform="rotate(-12 105 95)" />
      <rect x="120" y="40" width="70" height="95" rx="6" fill="#222" stroke={M} strokeWidth="2" transform="rotate(8 155 87)" />
      <rect x="95" y="55" width="78" height="105" rx="6" fill="#161616" stroke={W} strokeWidth="2" />
      <rect x="105" y="68" width="58" height="36" rx="3" fill={M} opacity="0.35" />
      <circle cx="160" cy="130" r="28" fill={O} />
      <path
        d="M160 118 V124 M148 136 H172 M152 124 H168 V136 C168 142 164 146 160 146 C156 146 152 142 152 136 V124 Z"
        stroke="#080908"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
      />
      <circle cx="160" cy="136" r="2.5" fill="#080908" />
    </g>
  );
}

/** Gear trunk + IT STARTS WITH YOU */
function OrganizeGuestArt() {
  return (
    <g>
      <ellipse cx="160" cy="205" rx="90" ry="14" fill={O} fillOpacity="0.1" />
      <path d="M130 16 L190 16 L230 205 L90 205 Z" fill={O} fillOpacity="0.07" />
      <rect x="78" y="95" width="164" height="95" rx="8" fill="#1c1c1c" stroke={W} strokeWidth="2.5" />
      <rect x="78" y="95" width="164" height="22" fill="#2a2a2a" stroke={W} strokeWidth="2.5" />
      <circle cx="100" cy="106" r="4" fill={O} />
      <circle cx="220" cy="106" r="4" fill={O} />
      <rect x="98" y="130" width="50" height="40" rx="3" fill="#111" stroke={M} strokeWidth="1.5" />
      <rect x="172" y="130" width="50" height="40" rx="3" fill="#111" stroke={M} strokeWidth="1.5" />
      <text
        x="160"
        y="70"
        textAnchor="middle"
        fill={O}
        fontFamily="system-ui,sans-serif"
        fontSize="13"
        fontWeight="800"
        letterSpacing="0.1em"
      >
        IT STARTS WITH YOU
      </text>
      <path d="M150 148 L170 148 M160 138 V158" stroke={L} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

/** Hoodie silhouette + crown + DANCE CONNECT BELONG */
function ProfileGuestArt() {
  return (
    <g>
      <path
        d="M214 42 L220 30 L226 42 L236 34 L232 52 H208 L204 34 Z"
        stroke={O}
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      <circle cx="220" cy="28" r="2" fill={L} />
      <ellipse cx="160" cy="78" rx="28" ry="30" fill="#2a2a2a" />
      <path d="M120 100 C120 100 130 88 160 88 C190 88 200 100 200 100 L210 210 H110 Z" fill="#1a1a1a" />
      <path d="M132 78 H188 V92 C188 100 176 106 160 106 C144 106 132 100 132 92 Z" fill="#111" />
      <text
        x="160"
        y="145"
        textAnchor="middle"
        fill={W}
        fontFamily="system-ui,sans-serif"
        fontSize="9"
        fontWeight="700"
        letterSpacing="0.14em"
        opacity="0.85"
      >
        DANCE
      </text>
      <text
        x="160"
        y="158"
        textAnchor="middle"
        fill={W}
        fontFamily="system-ui,sans-serif"
        fontSize="9"
        fontWeight="700"
        letterSpacing="0.14em"
        opacity="0.85"
      >
        CONNECT
      </text>
      <text
        x="160"
        y="171"
        textAnchor="middle"
        fill={W}
        fontFamily="system-ui,sans-serif"
        fontSize="9"
        fontWeight="700"
        letterSpacing="0.14em"
        opacity="0.85"
      >
        BELONG
      </text>
    </g>
  );
}

/** Globe + pin */
function DiscoverLocationArt() {
  return (
    <g>
      <circle cx="160" cy="120" r="78" stroke={M} strokeWidth="2" fill="none" />
      <ellipse cx="160" cy="120" rx="32" ry="78" stroke={M} strokeWidth="1.5" fill="none" />
      <ellipse cx="160" cy="120" rx="78" ry="28" stroke={M} strokeWidth="1.5" fill="none" />
      <path d="M82 120 H238 M160 42 V198" stroke={M} strokeWidth="1.2" />
      <path
        d="M160 55 C142 55 128 69 128 87 C128 110 160 145 160 145 C160 145 192 110 192 87 C192 69 178 55 160 55 Z"
        fill={O}
      />
      <circle cx="160" cy="86" r="12" fill="#080908" />
    </g>
  );
}

/** Ticket + COLLECT EXPERIENCES */
function EventsSavedArt() {
  return (
    <g>
      <path d="M70 55 H95 M70 85 H95 M70 115 H95 M225 55 H250 M225 85 H250 M225 115 H250" stroke={O} strokeWidth="2" opacity="0.5" />
      <rect x="88" y="70" width="144" height="90" rx="10" fill="#161616" stroke={O} strokeWidth="2.5" />
      <path d="M140 70 V160" stroke={M} strokeWidth="2" strokeDasharray="5 5" />
      <circle cx="140" cy="70" r="8" fill="#080908" />
      <circle cx="140" cy="160" r="8" fill="#080908" />
      <rect x="100" y="90" width="28" height="18" rx="3" fill={O} />
      <rect x="100" y="118" width="28" height="8" rx="2" fill={M} />
      <rect x="100" y="132" width="22" height="8" rx="2" fill={M} />
      <rect x="156" y="92" width="58" height="46" rx="4" fill={W} fillOpacity="0.92" />
      <path d="M164 100 H206 V130 H164 Z" stroke="#080908" strokeWidth="2" />
      <text
        x="160"
        y="48"
        textAnchor="middle"
        fill={O}
        fontFamily="system-ui,sans-serif"
        fontSize="11"
        fontWeight="800"
        letterSpacing="0.12em"
      >
        COLLECT EXPERIENCES
      </text>
    </g>
  );
}

/** Clipboard + plus + IDEAS PEOPLE CULTURE */
function OrganizeCreateArt() {
  return (
    <g>
      <rect x="95" y="45" width="110" height="150" rx="8" fill="#1a1a1a" stroke={W} strokeWidth="2.5" />
      <rect x="125" y="35" width="50" height="22" rx="6" fill="#2a2a2a" stroke={W} strokeWidth="2" />
      <rect x="112" y="80" width="76" height="10" rx="2" fill={M} />
      <rect x="112" y="100" width="76" height="10" rx="2" fill={M} opacity="0.7" />
      <rect x="112" y="120" width="56" height="10" rx="2" fill={M} opacity="0.5" />
      <circle cx="210" cy="155" r="28" fill={O} />
      <path d="M210 140 V170 M195 155 H225" stroke="#080908" strokeWidth="3.5" strokeLinecap="round" />
      <text
        x="250"
        y="90"
        fill={O}
        fontFamily="system-ui,sans-serif"
        fontSize="11"
        fontWeight="800"
        letterSpacing="0.08em"
      >
        IDEAS
      </text>
      <text
        x="250"
        y="108"
        fill={O}
        fontFamily="system-ui,sans-serif"
        fontSize="11"
        fontWeight="800"
        letterSpacing="0.08em"
      >
        PEOPLE
      </text>
      <text
        x="250"
        y="126"
        fill={O}
        fontFamily="system-ui,sans-serif"
        fontSize="11"
        fontWeight="800"
        letterSpacing="0.08em"
      >
        CULTURE
      </text>
    </g>
  );
}

/** ID badge lanyard + MORE THAN A DANCER */
function ProfileSetupArt() {
  return (
    <g>
      <path d="M130 10 H190" stroke={M} strokeWidth="3" strokeLinecap="round" />
      <path d="M145 10 L130 55 M175 10 L190 55" stroke={M} strokeWidth="3" />
      <rect x="100" y="55" width="120" height="150" rx="10" fill="#1a1a1a" stroke={W} strokeWidth="2.5" />
      <rect x="100" y="55" width="120" height="28" fill={O} />
      <text
        x="160"
        y="74"
        textAnchor="middle"
        fill="#080908"
        fontFamily="system-ui,sans-serif"
        fontSize="12"
        fontWeight="900"
        letterSpacing="0.14em"
      >
        BYND8
      </text>
      <circle cx="160" cy="120" r="22" fill="#2a2a2a" stroke={M} strokeWidth="2" />
      <circle cx="160" cy="114" r="9" fill={W} opacity="0.85" />
      <path d="M145 138 C145 128 175 128 175 138" stroke={W} strokeWidth="2" fill="none" opacity="0.85" />
      <text
        x="160"
        y="170"
        textAnchor="middle"
        fill={O}
        fontFamily="system-ui,sans-serif"
        fontSize="9"
        fontWeight="800"
        letterSpacing="0.06em"
      >
        MORE THAN
      </text>
      <text
        x="160"
        y="184"
        textAnchor="middle"
        fill={O}
        fontFamily="system-ui,sans-serif"
        fontSize="9"
        fontWeight="800"
        letterSpacing="0.06em"
      >
        A DANCER
      </text>
    </g>
  );
}

const ART: Record<CoreKind, () => ReactNode> = {
  discoverGuest: DiscoverGuestArt,
  eventsGuest: EventsGuestArt,
  organizeGuest: OrganizeGuestArt,
  profileGuest: ProfileGuestArt,
  discoverLocation: DiscoverLocationArt,
  eventsSaved: EventsSavedArt,
  organizeCreate: OrganizeCreateArt,
  profileSetup: ProfileSetupArt,
};
