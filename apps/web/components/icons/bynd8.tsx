import type { ReactElement, ReactNode, SVGProps } from 'react';

import { cn } from '@/lib/utils';

export type ByndIconName =
  | 'discover'
  | 'events'
  | 'organize'
  | 'tickets'
  | 'profile'
  | 'help'
  | 'menu'
  | 'close'
  | 'edit'
  | 'megaphone'
  | 'publish'
  | 'unpublish'
  | 'external'
  | 'checkIn'
  | 'media'
  | 'layers'
  | 'crew'
  | 'wallet'
  | 'filter'
  | 'poster'
  | 'search'
  | 'pin'
  | 'bell'
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronDown'
  | 'check'
  | 'link'
  | 'shield'
  | 'retry'
  | 'signIn'
  | 'floor'
  | 'trophy'
  | 'eye'
  | 'calendar';

type SvgProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

/** Shared stamped mark — filled, sharp, poster-cut. Not thin SaaS strokes. */
function Mark({ className, title, children, ...props }: SvgProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-4 shrink-0', className)}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Cypher ring + cross — Discover */
export function IconDiscover(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm0 3a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Z" />
      <path d="M11 7h2v4h4v2h-4v4h-2v-4H7v-2h4V7Z" />
    </Mark>
  );
}

/** Stamped date block — Events */
export function IconEvents(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M4 5h3V3h2v2h6V3h2v2h3v16H4V5Zm2 4v10h12V9H6Zm2 2h3v3H8v-3Zm5 0h3v3h-3v-3Zm-5 5h3v3H8v-3Zm5 0h3v3h-3v-3Z" />
    </Mark>
  );
}

/** Stage / floor bars — Organize */
export function IconOrganize(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M3 18h18v3H3v-3Zm2-3h14l-1.5-9H6.5L5 15Zm3.2-6h7.6l.7 4H7.5l.7-4Z" />
      <path d="M10 4h4v2h-4V4Z" />
    </Mark>
  );
}

/** Ticket stub — Tickets */
export function IconTickets(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M3 7h13a2 2 0 0 0 2 2 2 2 0 0 0 2-2h1v10h-1a2 2 0 0 0-2-2 2 2 0 0 0-2 2H3V7Zm2 2v6h9.1A3.99 3.99 0 0 1 18 13a3.99 3.99 0 0 1 3.9 2H20V9h-1.1A3.99 3.99 0 0 1 14.1 9H5Zm2 1.5h2v1H7v-1Zm0 2.5h4v1H7v-1Z" />
    </Mark>
  );
}

/** Block head — Profile (no dancer silhouette) */
export function IconProfile(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
      <path d="M4 20.5c0-4.2 3.6-6.5 8-6.5s8 2.3 8 6.5V21H4v-.5Zm2.1-.5h11.8c-.4-2.3-2.8-4-5.9-4s-5.5 1.7-5.9 4Z" />
    </Mark>
  );
}

/** ? stamp — Help */
export function IconHelp(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3.2c2.2 0 3.8 1.3 3.8 3.3 0 1.5-.7 2.3-1.8 3l-.7.5c-.5.3-.7.6-.7 1.2v.6h-2.2v-.8c0-1.2.5-1.9 1.4-2.5l.7-.5c.7-.5 1-1 1-1.6 0-.8-.6-1.3-1.5-1.3-.9 0-1.5.5-1.6 1.3H8.1C8.3 6.3 9.8 5.2 12 5.2ZM11 16.2h2.2V18H11v-1.8Z" />
    </Mark>
  );
}

export function IconMenu(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M3 6h18v2.2H3V6Zm0 4.9h18v2.2H3v-2.2Zm0 4.9h18V18H3v-2.2Z" />
    </Mark>
  );
}

export function IconClose(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M5.3 4.2 12 10.9l6.7-6.7 1.8 1.8L13.8 12l6.7 6.7-1.8 1.8L12 13.8l-6.7 6.7-1.8-1.8L10.2 12 3.5 5.3l1.8-1.8Z" />
    </Mark>
  );
}

export function IconEdit(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M14.8 3.2 20.8 9.2 9.5 20.5H3.5v-6L14.8 3.2Zm0 2.8L6.5 14.3v3.2h3.2l8.3-8.3-3.2-3.2Z" />
    </Mark>
  );
}

/** Blast megaphone — Post update */
export function IconMegaphone(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M3 10.5v3h3.2l7.3 3.8V6.7L6.2 10.5H3Zm12.5-2.2v7.4l3.2 1.6V7l-3.2 1.3ZM4.5 15.2h2.3l.7 3.3H5.2l-.7-3.3Z" />
      <path d="M19.2 8.2h2.3v1.8h-2.3V8.2Zm1 3h2.5v1.8H20.2v-1.8Zm-1 3h2.3v1.8h-2.3v-1.8Z" />
    </Mark>
  );
}

/** Lift arrow into frame — Publish */
export function IconPublish(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M11 15V7.8L8.2 10.6 6.8 9.2 12 4l5.2 5.2-1.4 1.4L13 7.8V15h-2Z" />
      <path d="M4 17h16v3H4v-3Z" />
    </Mark>
  );
}

export function IconUnpublish(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M11 9v7.2l-2.8-2.8-1.4 1.4L12 20l5.2-5.2-1.4-1.4L13 16.2V9h-2Z" />
      <path d="M4 4h16v3H4V4Z" />
    </Mark>
  );
}

export function IconExternal(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M5 5h7v2H7v10h10v-5h2v7H5V5Zm8 0h6v6h-2V8.4l-6.3 6.3-1.4-1.4L15.6 7H13V5Z" />
    </Mark>
  );
}

/** Door stamp / scan — Check-in */
export function IconCheckIn(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M4 4h6v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z" />
      <path d="M9 9h6v6H9V9Zm2 2v2h2v-2h-2Z" />
    </Mark>
  );
}

/** Linked frames — Media */
export function IconMedia(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M3 6h11v4h2V6h5v12h-5v-4h-2v4H3V6Zm2 2v8h7V8H5Zm11 4v4h3v-4h-3Z" />
    </Mark>
  );
}

export function IconLayers(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M12 3 2.5 8.5 12 14l9.5-5.5L12 3Zm0 3.2 4.8 2.8L12 11.8 7.2 9 12 6.2ZM2.5 12.2 12 17.7l9.5-5.5v2.4L12 20.5 2.5 14.6v-2.4Z" />
    </Mark>
  );
}

export function IconCrew(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M8.5 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm7 1.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3.5 18.5c0-2.8 2.4-4.5 5-4.5s5 1.7 5 4.5V20H3.5v-1.5Zm9.2-.2c.4-1.5 1.7-2.8 3.8-2.8 2.2 0 3.5 1.2 3.5 3.2V20h-7.3v-1.7Z" />
    </Mark>
  );
}

export function IconWallet(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M3 6h18v13H3V6Zm2 2v9h14V8H5Zm10 3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
    </Mark>
  );
}

export function IconFilter(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M3 5h18v2.5l-6.5 6.5V20h-5v-6L3 7.5V5Zm2.8 2.5 5.7 5.7V17.5h1V13.2l5.7-5.7H5.8Z" />
    </Mark>
  );
}

/** Poster frame — image drop */
export function IconPoster(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M4 3h16v18H4V3Zm2 2v14h12V5H6Zm2 9.5 2.5-3 2 2.4 1.5-1.7L16 15.5H8Z" />
      <path d="M9 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
    </Mark>
  );
}

export function IconSearch(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" />
      <path d="m15.2 14.1 5.5 5.5-1.6 1.6-5.5-5.5 1.6-1.6Z" />
    </Mark>
  );
}

export function IconPin(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M12 2c3.6 0 6.5 2.8 6.5 6.3 0 4.4-5.2 11.2-6.1 12.3L12 21l-.4-.4C10.7 19.5 5.5 12.7 5.5 8.3 5.5 4.8 8.4 2 12 2Zm0 2.2A4.2 4.2 0 0 0 7.8 8.3c0 2.6 2.6 7 4.2 9.2 1.6-2.2 4.2-6.6 4.2-9.2A4.2 4.2 0 0 0 12 4.2Zm0 2.3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
    </Mark>
  );
}

export function IconBell(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M12 2a2 2 0 0 1 2 2v.4A6 6 0 0 1 18 10v4.5l2 2V18H4v-1.5l2-2V10a6 6 0 0 1 4-5.6V4a2 2 0 0 1 2-2Zm0 2.2A4 4 0 0 0 8 10v5h8v-5a4 4 0 0 0-4-3.8ZM10 19h4a2 2 0 0 1-4 0Z" />
    </Mark>
  );
}

export function IconChevronLeft(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="m14.8 4.2 1.7 1.7L10.4 12l6.1 6.1-1.7 1.7L7 12l7.8-7.8Z" />
    </Mark>
  );
}

export function IconChevronRight(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M9.2 4.2 17 12l-7.8 7.8-1.7-1.7 6.1-6.1-6.1-6.1 1.7-1.7Z" />
    </Mark>
  );
}

export function IconChevronDown(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="m4.2 9.2 1.7-1.7L12 13.6l6.1-6.1 1.7 1.7L12 17 4.2 9.2Z" />
    </Mark>
  );
}

export function IconCheck(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="m9.2 16.4-4.5-4.5 1.8-1.8 2.7 2.7 8.3-8.3 1.8 1.8-10.1 10.1Z" />
    </Mark>
  );
}

export function IconLink(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M10.4 13.6a3.5 3.5 0 0 1 0-5l2.5-2.5a3.5 3.5 0 1 1 5 5l-1.2 1.2-1.4-1.4 1.2-1.2a1.5 1.5 0 0 0-2.1-2.1l-2.5 2.5a1.5 1.5 0 0 0 0 2.1l-1.5 1.4Zm3.2-3.2a3.5 3.5 0 0 1 0 5l-2.5 2.5a3.5 3.5 0 1 1-5-5l1.2-1.2 1.4 1.4-1.2 1.2a1.5 1.5 0 0 0 2.1 2.1l2.5-2.5a1.5 1.5 0 0 0 0-2.1l1.5-1.4Z" />
    </Mark>
  );
}

export function IconShield(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M12 2 4 5.5v6.2c0 5 3.4 8.6 8 10.3 4.6-1.7 8-5.3 8-10.3V5.5L12 2Zm0 2.3 6 2.5v4.9c0 3.7-2.5 6.5-6 7.9-3.5-1.4-6-4.2-6-7.9V6.8l6-2.5Z" />
    </Mark>
  );
}

export function IconRetry(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M12 4a8 8 0 1 1-7.5 5.2L6.2 10A6 6 0 1 0 12 6v3l4-4-4-4v3Z" />
    </Mark>
  );
}

/** Enter arrow — Sign in */
export function IconSignIn(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M3 4h8v2H5v12h6v2H3V4Zm9.5 4.5L17 12l-4.5 3.5v-2.5H8v-2h4.5V8.5Z" />
    </Mark>
  );
}

/** Cypher floor hash — ambient / empty */
export function IconFloor(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M3 8h18v2H3V8Zm0 6h18v2H3v-2ZM8 3h2v18H8V3Zm6 0h2v18h-2V3Z" />
    </Mark>
  );
}

export function IconTrophy(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M6 3h12v2.2h2.2A2.8 2.8 0 0 1 23 8c0 3.4-2.4 5.6-5.6 6.2-.7 1.4-1.9 2.4-3.4 2.9V19h3v2H7v-2h3v-1.9c-1.5-.5-2.7-1.5-3.4-2.9C3.4 13.6 1 11.4 1 8a2.8 2.8 0 0 1 2.8-2.8H6V3Zm0 2.2H3.8c-.4 0-.8.4-.8.8 0 2.5 1.7 4.1 4.2 4.5V5.2Zm12 0v4.3c2.5-.4 4.2-2 4.2-4.5 0-.4-.4-.8-.8-.8H18ZM10 5.2v4.5h4V5.2h-4Z" />
    </Mark>
  );
}

export function IconEye(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M12 5c5.2 0 9.4 3.4 10.8 7-1.4 3.6-5.6 7-10.8 7S2.6 15.6 1.2 12C2.6 8.4 6.8 5 12 5Zm0 2.2c-3.8 0-7 2.4-8.3 4.8 1.3 2.4 4.5 4.8 8.3 4.8s7-2.4 8.3-4.8c-1.3-2.4-4.5-4.8-8.3-4.8Zm0 1.8a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
    </Mark>
  );
}

export function IconCalendar(props: SvgProps) {
  return (
    <Mark {...props}>
      <path d="M8 2h2v2h4V2h2v2h3.5A1.5 1.5 0 0 1 21 5.5v14A1.5 1.5 0 0 1 19.5 21h-15A1.5 1.5 0 0 1 3 19.5v-14A1.5 1.5 0 0 1 4.5 4H8V2Zm11 7H5v10h14V9ZM7 11h3v3H7v-3Zm4 0h3v3h-3v-3Zm4 0h3v3h-3v-3Z" />
    </Mark>
  );
}

const ICONS: Record<ByndIconName, (props: SvgProps) => ReactElement> = {
  discover: IconDiscover,
  events: IconEvents,
  organize: IconOrganize,
  tickets: IconTickets,
  profile: IconProfile,
  help: IconHelp,
  menu: IconMenu,
  close: IconClose,
  edit: IconEdit,
  megaphone: IconMegaphone,
  publish: IconPublish,
  unpublish: IconUnpublish,
  external: IconExternal,
  checkIn: IconCheckIn,
  media: IconMedia,
  layers: IconLayers,
  crew: IconCrew,
  wallet: IconWallet,
  filter: IconFilter,
  poster: IconPoster,
  search: IconSearch,
  pin: IconPin,
  bell: IconBell,
  chevronLeft: IconChevronLeft,
  chevronRight: IconChevronRight,
  chevronDown: IconChevronDown,
  check: IconCheck,
  link: IconLink,
  shield: IconShield,
  retry: IconRetry,
  signIn: IconSignIn,
  floor: IconFloor,
  trophy: IconTrophy,
  eye: IconEye,
  calendar: IconCalendar,
};

export function ByndIcon({
  name,
  className,
  title,
  ...props
}: SvgProps & { name: ByndIconName }) {
  const Comp = ICONS[name];
  return <Comp className={className} title={title} {...props} />;
}
