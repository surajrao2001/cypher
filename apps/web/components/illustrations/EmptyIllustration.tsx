import { useId, type ReactNode, type SVGProps } from 'react';

import { cn } from '@/lib/utils';

export type EmptyIllustrationKind =
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

const ORANGE = '#FF6500';
const LIME = '#B8FF00';
const INK = '#F4F4F1';
const MUTED = 'rgba(244,244,241,0.35)';
const STAGE = '#121212';
const DEEP = '#080908';

/** Shared stage + spotlight frame for all empties. */
function StageShell({
  children,
  className,
  uid,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode; uid: string }) {
  const glow = `${uid}-glow`;
  const cone = `${uid}-cone`;
  const floor = `${uid}-floor`;

  return (
    <svg
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-auto w-full max-w-[17.5rem]', className)}
      aria-hidden
      {...props}
    >
      <defs>
        <radialGradient id={glow} cx="50%" cy="18%" r="55%">
          <stop offset="0%" stopColor={ORANGE} stopOpacity="0.45" />
          <stop offset="55%" stopColor={ORANGE} stopOpacity="0.08" />
          <stop offset="100%" stopColor={DEEP} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={cone} x1="140" y1="8" x2="140" y2="150">
          <stop offset="0%" stopColor={ORANGE} stopOpacity="0.35" />
          <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={floor} x1="40" y1="160" x2="240" y2="190">
          <stop offset="0%" stopColor={STAGE} />
          <stop offset="50%" stopColor="#1a1410" />
          <stop offset="100%" stopColor={STAGE} />
        </linearGradient>
      </defs>

      <rect width="280" height="200" rx="16" fill={DEEP} />
      <ellipse cx="140" cy="36" rx="90" ry="34" fill={`url(#${glow})`} />
      <path d="M110 10 L170 10 L230 158 L50 158 Z" fill={`url(#${cone})`} />
      <ellipse cx="140" cy="168" rx="98" ry="18" fill={`url(#${floor})`} />
      <ellipse cx="140" cy="168" rx="72" ry="10" fill={ORANGE} fillOpacity="0.12" />

      <path
        d="M214 28 L220 18 L226 28 L234 22 L232 36 H206 L204 22 Z"
        stroke={ORANGE}
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="220" cy="16" r="1.6" fill={LIME} />

      {children}
    </svg>
  );
}

function DiscoverArt() {
  return (
    <g>
      <circle cx="140" cy="108" r="42" stroke={INK} strokeWidth="3" fill="none" opacity="0.9" />
      <circle cx="140" cy="108" r="26" stroke={ORANGE} strokeWidth="2.5" fill="none" />
      <path d="M140 78 V94 M140 122 V138 M110 108 H126 M154 108 H170" stroke={LIME} strokeWidth="2.5" strokeLinecap="square" />
      <path d="M128 118 L140 98 L152 118" stroke={INK} strokeWidth="2" fill="none" opacity="0.5" />
    </g>
  );
}

function FiltersArt() {
  return (
    <g>
      <rect x="88" y="78" width="104" height="14" rx="3" fill={MUTED} />
      <rect x="100" y="102" width="80" height="14" rx="3" fill={MUTED} opacity="0.7" />
      <rect x="112" y="126" width="56" height="14" rx="3" fill={MUTED} opacity="0.45" />
      <circle cx="178" cy="85" r="10" fill={ORANGE} />
      <path d="M174 85 H182 M178 81 V89" stroke={DEEP} strokeWidth="2" strokeLinecap="round" />
      <path d="M96 148 L184 148" stroke={ORANGE} strokeWidth="2" strokeDasharray="4 6" opacity="0.7" />
    </g>
  );
}

function LocationArt() {
  return (
    <g>
      <path
        d="M140 70 C122 70 108 84 108 102 C108 124 140 154 140 154 C140 154 172 124 172 102 C172 84 158 70 140 70 Z"
        fill={ORANGE}
        fillOpacity="0.18"
        stroke={ORANGE}
        strokeWidth="2.5"
      />
      <circle cx="140" cy="100" r="12" fill={INK} />
      <circle cx="140" cy="100" r="5" fill={DEEP} />
      <path d="M92 158 H188" stroke={MUTED} strokeWidth="2" strokeDasharray="3 5" />
    </g>
  );
}

function EventsArt() {
  return (
    <g>
      <rect x="96" y="72" width="88" height="84" rx="6" fill={STAGE} stroke={INK} strokeWidth="2" opacity="0.95" />
      <rect x="96" y="72" width="88" height="22" fill={ORANGE} />
      <rect x="108" y="66" width="8" height="14" rx="2" fill={INK} />
      <rect x="164" y="66" width="8" height="14" rx="2" fill={INK} />
      <rect x="110" y="106" width="18" height="14" rx="2" fill={MUTED} />
      <rect x="134" y="106" width="18" height="14" rx="2" fill={MUTED} />
      <rect x="158" y="106" width="14" height="14" rx="2" fill={MUTED} />
      <rect x="110" y="128" width="18" height="14" rx="2" fill={MUTED} />
      <rect x="134" y="128" width="18" height="14" rx="2" fill={LIME} fillOpacity="0.85" />
      <rect x="158" y="128" width="14" height="14" rx="2" fill={MUTED} />
    </g>
  );
}

function SavedArt() {
  return (
    <g>
      <path
        d="M140 148 L108 118 C98 108 98 92 110 84 C120 77 132 80 140 90 C148 80 160 77 170 84 C182 92 182 108 172 118 Z"
        fill={ORANGE}
        fillOpacity="0.15"
        stroke={ORANGE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M128 102 H152 M140 90 V114" stroke={MUTED} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function PassesArt() {
  return (
    <g>
      <rect x="78" y="88" width="124" height="64" rx="8" fill={STAGE} stroke={INK} strokeWidth="2" />
      <path d="M118 88 V152" stroke={MUTED} strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="118" cy="88" r="6" fill={DEEP} />
      <circle cx="118" cy="152" r="6" fill={DEEP} />
      <rect x="88" y="100" width="20" height="12" rx="2" fill={ORANGE} />
      <rect x="88" y="118" width="22" height="6" rx="1" fill={MUTED} />
      <rect x="88" y="128" width="16" height="6" rx="1" fill={MUTED} />
      <rect x="136" y="100" width="50" height="40" rx="3" fill={INK} fillOpacity="0.92" />
      <path
        d="M144 108 H178 V132 H144 Z M152 116 H162 M168 116 H174 M152 124 H174"
        stroke={DEEP}
        strokeWidth="2"
      />
      <circle cx="198" cy="80" r="3" fill={LIME} />
    </g>
  );
}

function ProfileArt() {
  return (
    <g>
      <rect x="100" y="70" width="80" height="96" rx="8" fill={STAGE} stroke={INK} strokeWidth="2" />
      <circle cx="140" cy="100" r="18" fill={ORANGE} fillOpacity="0.25" stroke={ORANGE} strokeWidth="2" />
      <circle cx="140" cy="96" r="8" fill={INK} />
      <path d="M126 116 C126 108 154 108 154 116" stroke={INK} strokeWidth="2" fill="none" />
      <rect x="114" y="130" width="52" height="6" rx="2" fill={MUTED} />
      <rect x="122" y="142" width="36" height="6" rx="2" fill={MUTED} opacity="0.7" />
      <rect x="130" y="154" width="20" height="4" rx="1" fill={LIME} fillOpacity="0.8" />
    </g>
  );
}

function OrganizeArt() {
  return (
    <g>
      <path
        d="M92 130 L140 78 L188 130 Z"
        fill={ORANGE}
        fillOpacity="0.12"
        stroke={ORANGE}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="128" y="118" width="24" height="36" rx="2" fill={INK} opacity="0.85" />
      <circle cx="140" cy="102" r="10" fill={LIME} />
      <path d="M140 96 V108 M134 102 H146" stroke={DEEP} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M108 148 H172" stroke={MUTED} strokeWidth="2" />
    </g>
  );
}

function SignInArt() {
  return (
    <g>
      <rect x="108" y="72" width="64" height="88" rx="6" fill={STAGE} stroke={INK} strokeWidth="2" />
      <rect x="118" y="86" width="44" height="28" rx="3" fill={MUTED} opacity="0.35" />
      <circle cx="156" cy="128" r="5" fill={ORANGE} />
      <path
        d="M78 112 H104 M96 104 L104 112 L96 120"
        stroke={LIME}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M72 148 H208" stroke={MUTED} strokeWidth="2" strokeDasharray="3 5" />
    </g>
  );
}

function CancelledArt() {
  return (
    <g>
      <rect
        x="78"
        y="92"
        width="124"
        height="56"
        rx="8"
        fill={STAGE}
        stroke={MUTED}
        strokeWidth="2"
        transform="rotate(-6 140 120)"
      />
      <path
        d="M110 100 L170 140 M170 100 L110 140"
        stroke={ORANGE}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.9"
      />
      <rect x="92" y="108" width="28" height="8" rx="2" fill={MUTED} transform="rotate(-6 106 112)" />
    </g>
  );
}

const ART: Record<EmptyIllustrationKind, () => ReactNode> = {
  discover: DiscoverArt,
  filters: FiltersArt,
  location: LocationArt,
  events: EventsArt,
  saved: SavedArt,
  passes: PassesArt,
  profile: ProfileArt,
  organize: OrganizeArt,
  signIn: SignInArt,
  cancelled: CancelledArt,
};

/**
 * BYND8 empty-state stage art — orange spotlight, lime accents, stamped shapes.
 */
export function EmptyIllustration({ kind, className, ...props }: Props) {
  const uid = useId().replace(/:/g, '');
  const Art = ART[kind];
  return (
    <StageShell className={className} uid={uid} {...props}>
      <Art />
    </StageShell>
  );
}
