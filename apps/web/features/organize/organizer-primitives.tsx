'use client';

import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  Pencil,
  Search,
  SlidersHorizontal,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { formatEventHomeWhen } from '@/features/organize/EventControlHeader';
import { statusLabel } from '@/features/organize/event-control';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { cn } from '@/lib/utils';

/** Organizer V2 surfaces — scoped; do not change global theme. */
export const orgSurf = {
  page: 'bg-[#080908]',
  surface1: 'bg-[#111211]',
  surface2: 'bg-[#161716]',
  surfaceTranslucent: 'bg-[rgba(20,20,20,0.78)]',
  border: 'border-white/[0.09]',
  borderStrong: 'border-white/[0.12]',
  divider: 'border-white/[0.08]',
  live: '#B8FF00',
  orange: '#FF6500',
} as const;

export function OrganizerSurface({
  level = 2,
  className,
  children,
}: {
  level?: 1 | 2 | 3;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'border transition-[border-color,background-color] duration-150',
        level === 1 && 'rounded-[10px] border-white/[0.09] bg-[#141514]',
        level === 2 && 'rounded-lg border-white/[0.08] bg-white/[0.03]',
        level === 3 && 'rounded-md border-transparent bg-transparent',
        className,
      )}
    >
      {children}
    </div>
  );
}

export type OrganizerPillTone =
  | 'live'
  | 'confirmed'
  | 'success'
  | 'pending'
  | 'checked_in'
  | 'neutral'
  | 'announcement'
  | 'media'
  | 'schedule'
  | 'danger'
  | 'failed';

const PILL_TONE: Record<OrganizerPillTone, string> = {
  live: 'bg-[#B8FF00] text-[#0a0a0a]',
  confirmed: 'bg-[#B8FF00]/15 text-[#B8FF00]',
  success: 'bg-[#B8FF00]/15 text-[#B8FF00]',
  pending: 'bg-accent/15 text-accent',
  checked_in: 'bg-sky-400/15 text-sky-300',
  neutral: 'border border-white/12 bg-transparent text-text-secondary',
  announcement: 'bg-accent/15 text-accent',
  media: 'bg-sky-400/15 text-sky-300',
  schedule: 'bg-amber-400/15 text-amber-300',
  danger: 'bg-error/15 text-error',
  failed: 'bg-error/15 text-error',
};

export function OrganizerPill({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: OrganizerPillTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-5 max-w-full items-center truncate rounded-full px-2 text-[10px] font-bold uppercase tracking-[0.08em]',
        PILL_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function OrganizerTabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  items: Array<{ id: T; label: string; count?: number }>;
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        '-mx-1 flex gap-6 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative shrink-0 pb-2.5 pt-1 text-[13px] font-semibold tracking-wide transition-colors duration-150',
              active ? 'text-[#F4F4F1]' : 'text-white/42 hover:text-white/65',
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span className={cn('ml-1.5', active ? 'text-white/65' : 'text-white/28')}>
                ({item.count})
              </span>
            ) : null}
            {active ? (
              <span
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function OrganizerSearchRow({
  value,
  onChange,
  placeholder,
  onFilterClick,
  filterLabel = 'Filter',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onFilterClick?: () => void;
  filterLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-2.5', className)}>
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{placeholder}</span>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-[15px] -translate-y-1/2 text-white/28"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex h-11 w-full rounded-lg border border-white/[0.09] bg-[rgba(20,20,20,0.78)] py-2 pl-10 pr-3 text-[13px] text-[#F4F4F1] outline-none transition-colors placeholder:text-white/28 focus:border-accent/50"
        />
      </label>
      {onFilterClick ? (
        <Button
          type="button"
          variant="outline"
          onClick={onFilterClick}
          aria-label={filterLabel}
          className="h-11 shrink-0 gap-2 rounded-lg border-white/[0.09] bg-[#161716] px-4 text-[13px] text-[#F4F4F1] hover:border-white/20 hover:bg-[#1a1b1a]"
        >
          <SlidersHorizontal className="size-3.5" strokeWidth={1.75} aria-hidden />
          <span className="hidden sm:inline">{filterLabel}</span>
        </Button>
      ) : null}
    </div>
  );
}

export function OrganizerUserAvatar({
  seed,
  className,
}: {
  seed?: string;
  className?: string;
}) {
  const hue = seed
    ? Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360
    : 0;
  return (
    <span
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.06]',
        className,
      )}
      style={seed ? { boxShadow: `inset 0 0 0 1px hsla(${String(hue)},40%,50%,0.18)` } : undefined}
      aria-hidden
    >
      <UserRound className="size-4 text-white/45" strokeWidth={1.75} />
    </span>
  );
}

export function OrganizerIconTile({
  icon: Icon,
  label,
  className,
}: {
  icon: LucideIcon;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex aspect-[3/4] w-[4.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-white/[0.08] bg-[#161716] sm:w-20',
        className,
      )}
      aria-hidden
    >
      <Icon className="size-5 text-white/35" strokeWidth={1.75} />
      {label ? (
        <span className="px-1 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-white/28">
          {label}
        </span>
      ) : null}
    </div>
  );
}

/** Full-bleed orange stage wash — same language as Event Home, compact for sub-pages. */
export function OrganizerManageShell({
  children,
  className,
  glow = 'center',
}: {
  children: ReactNode;
  className?: string;
  /** Your Events uses a top-right wash to match the reference. */
  glow?: 'center' | 'top-right';
}) {
  const wash =
    glow === 'top-right'
      ? 'bg-[radial-gradient(ellipse_90%_70%_at_88%_-8%,rgba(255,104,0,0.34)_0%,rgba(255,104,0,0.14)_28%,rgba(255,104,0,0.04)_52%,transparent_72%)]'
      : 'bg-[radial-gradient(ellipse_120%_75%_at_50%_-12%,rgba(255,104,0,0.28)_0%,rgba(255,104,0,0.12)_30%,rgba(255,104,0,0.04)_52%,transparent_72%)]';

  return (
    <div className={cn('relative min-h-[70vh] overflow-hidden bg-[#080908]', className)}>
      <div
        aria-hidden
        className={cn('pointer-events-none absolute inset-x-0 top-0 h-[min(28rem,52vh)]', wash)}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[min(14rem,28vh)] h-40 bg-gradient-to-b from-transparent via-[#080908]/55 to-[#080908]"
      />
      {children}
    </div>
  );
}

export function OrganizerEventSubHeader({
  org,
  event,
  sectionLabel,
  onEditEvent,
  trailing,
  className,
}: {
  org: OrganizerDto;
  event: OrganizerEventDetailDto;
  sectionLabel: string;
  onEditEvent?: () => void;
  trailing?: ReactNode;
  className?: string;
}) {
  const isLive = event.status === 'published';
  const place = [event.venue, event.city].filter(Boolean).join(', ');
  const when = formatEventHomeWhen(event.startTime);
  const manageHref = `${routes.organize}/${org.slug}/events/${event.id}`;
  const publicHref = `${routes.events}/${event.slug}`;

  return (
    <header className={cn('relative space-y-4', className)}>
      <PageBreadcrumb
        className="mb-0"
        items={[
          { label: 'Your Events', href: routes.organize },
          { label: event.title, href: manageHref },
          { label: sectionLabel },
        ]}
      />

      {/* Open stage — no card chrome; sits on the page wash like Event Home / reference */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 lg:gap-8">
        <div className="flex min-w-0 flex-1 items-start gap-3.5 sm:items-center sm:gap-4">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[#111211] shadow-[0_12px_28px_-14px_rgba(0,0,0,0.85)] sm:h-[5.5rem] sm:w-[4.5rem]">
            {event.posterUrl ? (
              <img src={event.posterUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.14em] text-white/28">
                Poster
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="display-title text-[1.5rem] leading-[0.95] tracking-[0.03em] text-[#F4F4F1] sm:text-[2.1rem]">
                {event.title}
              </h1>
              <OrganizerPill tone={isLive ? 'live' : 'neutral'}>
                {isLive ? 'Live' : statusLabel(event.status)}
              </OrganizerPill>
            </div>
            <div className="space-y-1 text-[12px] text-white/65 sm:text-[13px]">
              {when ? (
                <p className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 shrink-0 text-white/35" strokeWidth={1.75} />
                  <span className="truncate">{when}</span>
                </p>
              ) : null}
              {place ? (
                <p className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0 text-white/35" strokeWidth={1.75} />
                  <span className="truncate">{place}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {isLive ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-10 gap-1.5 rounded-lg border-white/[0.12] bg-[#111211]/55 px-3.5 text-[12px] font-semibold tracking-[0.06em] text-[#F4F4F1] backdrop-blur-[6px] hover:border-white/20 hover:bg-[#111211]/80"
            >
              <Link href={publicHref} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" strokeWidth={1.75} aria-hidden />
                View event
              </Link>
            </Button>
          ) : null}
          {onEditEvent ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEditEvent}
              className="h-10 gap-1.5 rounded-lg border-white/[0.12] bg-[#111211]/55 px-3.5 text-[12px] font-semibold tracking-[0.06em] text-[#F4F4F1] backdrop-blur-[6px] hover:border-white/20 hover:bg-[#111211]/80"
            >
              <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
              Edit event
            </Button>
          ) : null}
          {trailing}
        </div>
      </div>
    </header>
  );
}

export function OrganizerEmptyBlock({
  title,
  body,
  children,
  className,
}: {
  title: string;
  body?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 sm:px-6',
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-[#F4F4F1]">{title}</p>
        {body ? <p className="max-w-md text-[13px] text-white/55">{body}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function OrganizerSkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <ul className="divide-y divide-white/[0.07]" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex h-14 items-center gap-3 px-1">
          <div className="size-8 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-3 flex-1 animate-pulse rounded bg-white/[0.06]" />
          <div className="hidden h-3 w-20 animate-pulse rounded bg-white/[0.05] sm:block" />
        </li>
      ))}
    </ul>
  );
}

export function relativeUpdateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${String(mins)} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${String(hrs)}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${String(days)} day${days === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
