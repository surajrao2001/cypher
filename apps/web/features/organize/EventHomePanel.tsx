'use client';

import { useMemo } from 'react';
import type {
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
} from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';
import Link from 'next/link';

import { ByndIcon } from '@/components/icons/bynd8';
import {
  hasPaidEntry,
  isPastEvent,
  moneyFromRegistrations,
  statusLabel,
  type ControlDest,
} from '@/features/organize/event-control';
import {
  formatEventHomeWhen,
  formatEventHomeWhenShort,
} from '@/features/organize/EventControlHeader';
import {
  entryCopyForType,
  eventTypeDisplayLabel,
  eventTypeGroup,
  hasAnyEntry,
  type EventTypeGroup,
} from '@/features/organize/event-type-copy';
import { EventReadiness } from '@/features/organize/EventReadiness';
import { useEventUpdatesQuery } from '@/features/organize/queries';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  Eye,
  IndianRupee,
  Ticket,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';

type Metric = {
  id: string;
  Icon: LucideIcon;
  iconClass: string;
  value: string;
  label: string;
  detail: string;
};

function buildHomeMetrics(args: {
  group: EventTypeGroup;
  anyEntry: boolean;
  showMoney: boolean;
  confirmed: number;
  competeConfirmed: number;
  audienceConfirmed: number;
  competeCount: number;
  audienceCount: number;
  spotsLeft: number | null;
  capacity: number;
  filled: number;
  money: { collectedMinor: number; pendingMinor: number };
}): Metric[] {
  const {
    group,
    anyEntry,
    showMoney,
    confirmed,
    competeConfirmed,
    audienceConfirmed,
    competeCount,
    audienceCount,
    spotsLeft,
    capacity,
    filled,
    money,
  } = args;

  // Jam / Session / Other with no Entry — no empty KPI strip
  if ((group === 'jam' || group === 'session' || group === 'other') && !anyEntry) {
    return [];
  }

  const metrics: Metric[] = [];

  if (group === 'workshop') {
    if (capacity > 0) {
      metrics.push({
        id: 'filled',
        Icon: Users,
        iconClass: 'text-[#5B9DFF]',
        value: String(filled),
        label: 'Spots filled',
        detail: `${String(filled)} / ${String(capacity)}`,
      });
    } else if (anyEntry) {
      metrics.push({
        id: 'registered',
        Icon: Users,
        iconClass: 'text-[#5B9DFF]',
        value: String(confirmed),
        label: 'Registered',
        detail: 'Workshop attendance',
      });
    }
    if (spotsLeft != null) {
      metrics.push({
        id: 'spots',
        Icon: Ticket,
        iconClass: 'text-accent',
        value: String(spotsLeft),
        label: 'Spots left',
        detail: `${String(filled)} / ${String(capacity)} filled`,
      });
    }
    if (showMoney) {
      metrics.push({
        id: 'money',
        Icon: IndianRupee,
        iconClass: 'text-accent',
        value: formatMinorUnits(money.collectedMinor),
        label: 'Collected',
        detail:
          money.pendingMinor > 0
            ? `${formatMinorUnits(money.pendingMinor)} pending`
            : 'No pending',
      });
    }
    return metrics;
  }

  if (group === 'battle') {
    metrics.push({
      id: 'registered',
      Icon: Users,
      iconClass: 'text-[#5B9DFF]',
      value: String(confirmed),
      label: 'Registered',
      detail: anyEntry
        ? `${String(competeConfirmed)} competitors · ${String(audienceConfirmed)} audience`
        : 'No entry yet',
    });
    metrics.push({
      id: 'compete',
      Icon: Trophy,
      iconClass: 'text-[#E8B84A]',
      value: String(competeCount),
      label: competeCount === 1 ? 'Competition' : 'Competitions',
      detail:
        audienceCount > 0
          ? `${String(audienceCount)} audience pass${audienceCount === 1 ? '' : 'es'}`
          : 'No audience pass',
    });
    if (showMoney) {
      metrics.push({
        id: 'money',
        Icon: IndianRupee,
        iconClass: 'text-accent',
        value: formatMinorUnits(money.collectedMinor),
        label: 'Collected',
        detail:
          money.pendingMinor > 0
            ? `${formatMinorUnits(money.pendingMinor)} pending`
            : 'No pending',
      });
    }
    if (spotsLeft != null || anyEntry) {
      metrics.push({
        id: 'spots',
        Icon: Ticket,
        iconClass: 'text-accent',
        value: spotsLeft == null ? '—' : String(spotsLeft),
        label: 'Spots left',
        detail:
          capacity > 0
            ? `${String(filled)} / ${String(capacity)} filled`
            : 'No capacity set',
      });
    }
    return metrics;
  }

  // Jam / Session / Other WITH entry — attendance/capacity only (not "1 Entry" KPI)
  metrics.push({
    id: 'registered',
    Icon: Users,
    iconClass: 'text-[#5B9DFF]',
    value: String(confirmed),
    label: 'Registered',
    detail: confirmed === 1 ? '1 person in' : `${String(confirmed)} people in`,
  });
  if (spotsLeft != null) {
    metrics.push({
      id: 'spots',
      Icon: Ticket,
      iconClass: 'text-accent',
      value: String(spotsLeft),
      label: 'Spots left',
      detail: `${String(filled)} / ${String(capacity)} filled`,
    });
  }
  if (showMoney) {
    metrics.push({
      id: 'money',
      Icon: IndianRupee,
      iconClass: 'text-accent',
      value: formatMinorUnits(money.collectedMinor),
      label: 'Collected',
      detail:
        money.pendingMinor > 0
          ? `${formatMinorUnits(money.pendingMinor)} pending`
          : 'No pending',
    });
  }
  return metrics;
}

export function EventHomePanel({
  org,
  event,
  regs,
  payoutReady: _payoutReady,
  checkedInCount: _checkedInCount,
  entryHref,
  peopleHref,
  onNavigate,
  onPublished,
  onEditEvent,
  onPostUpdate,
  onViewAllUpdates,
}: {
  org: OrganizerDto;
  event: OrganizerEventDetailDto;
  regs: OrganizerEventRegistrationsResponse | null;
  payoutReady: boolean | null;
  checkedInCount: number | null;
  entryHref: string;
  peopleHref: string;
  onNavigate: (dest: ControlDest) => void;
  onPublished: (next: OrganizerEventDetailDto) => void;
  onEditEvent: () => void;
  onPostUpdate?: () => void;
  onViewAllUpdates?: () => void;
}) {
  void _payoutReady;
  void _checkedInCount;
  const isDraft = event.status === 'draft';
  const isLive = event.status === 'published';
  const past = isPastEvent(event);
  const showMoney = hasPaidEntry(event);
  const copy = entryCopyForType(event.eventType);
  const group = eventTypeGroup(event.eventType);
  const anyEntry = hasAnyEntry(event);
  const compete =
    event.competeCategories ?? (event.categories ?? []).filter((c) => c.entryType !== 'viewer');
  const audienceCats =
    event.viewerCategories ?? (event.categories ?? []).filter((c) => c.entryType === 'viewer');
  const competeConfirmed = compete.reduce((n, c) => n + c.confirmedCount, 0);
  const audienceConfirmed = audienceCats.reduce((n, c) => n + c.confirmedCount, 0);
  const confirmed = regs?.totals.confirmed ?? competeConfirmed + audienceConfirmed;
  const capacity = (event.categories ?? []).reduce((n, c) => n + c.capacity, 0);
  const filled = (event.categories ?? []).reduce(
    (n, c) => n + c.confirmedCount + c.reservedCount,
    0,
  );
  const spotsLeft = capacity > 0 ? Math.max(0, capacity - filled) : null;
  const money = moneyFromRegistrations(regs);
  const publicHref = `${routes.events}/${event.slug}`;
  const when = formatEventHomeWhen(event.startTime);
  const whenShort = formatEventHomeWhenShort(event.startTime);
  const place = [event.venue, event.city].filter(Boolean).join(', ');

  const updatesQuery = useEventUpdatesQuery(org.id, event.id);
  const latestUpdate = updatesQuery.data?.[0] ?? null;
  const updateCount = updatesQuery.data?.length ?? 0;

  const metrics = useMemo(
    () =>
      buildHomeMetrics({
        group,
        anyEntry,
        showMoney,
        confirmed,
        competeConfirmed,
        audienceConfirmed,
        competeCount: compete.length,
        audienceCount: audienceCats.length,
        spotsLeft,
        capacity,
        filled,
        money,
      }),
    [
      group,
      anyEntry,
      showMoney,
      confirmed,
      competeConfirmed,
      audienceConfirmed,
      compete.length,
      audienceCats.length,
      spotsLeft,
      capacity,
      filled,
      money,
    ],
  );

  const noEntryBreath =
    !anyEntry && (group === 'jam' || group === 'session' || group === 'other') && !isDraft;

  const body = (
    <div className="space-y-7 md:space-y-8">
      {noEntryBreath ? (
        <p className="text-[15px] text-text-secondary">
          No registration needed.
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = entryHref;
            }}
            className="ml-2 font-semibold text-accent hover:underline"
          >
            Add entry
          </button>
          <span className="text-text-muted"> if you want capacity or payment.</span>
        </p>
      ) : null}

      {metrics.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-[repeat(auto-fit,minmax(13.5rem,1fr))]">
          {metrics.map((m) => (
            <MetricCard key={m.id} {...m} />
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          'grid items-stretch gap-4 lg:gap-5',
          showMoney
            ? 'lg:grid-cols-[minmax(0,1.05fr)_minmax(17rem,0.55fr)]'
            : 'lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.65fr)]',
        )}
      >
        <div className="flex flex-col gap-2.5">
          <DestRow
            Icon={Users}
            iconWrap="bg-[#1a2740] text-[#5B9DFF]"
            title="People"
            body="View registrations, check-ins and manage attendees"
            href={peopleHref}
          />
          <DestRow
            Icon={Ticket}
            iconWrap="bg-[#2a1a0e] text-accent"
            title="Entry"
            body={
              group === 'battle'
                ? 'Manage competitions and audience passes'
                : group === 'workshop'
                  ? 'Manage workshop passes'
                  : 'Manage how people get in'
            }
            href={entryHref}
          />
          {showMoney ? (
            <DestRow
              Icon={IndianRupee}
              iconWrap="bg-[#142418] text-[#6FCF97]"
              title="Money"
              body="View revenue, payouts and payment status"
              onClick={() => onNavigate('money')}
            />
          ) : null}
        </div>

        <PublicPageCard
          event={event}
          when={whenShort || when}
          place={place}
          isLive={isLive}
          publicHref={publicHref}
          onEditEvent={onEditEvent}
        />
      </div>

      {!past || latestUpdate ? (
        <section className="rounded-xl border border-[#252525] bg-gradient-to-b from-[#171717]/90 to-[#121212] p-3 sm:rounded-2xl sm:p-5">
          <div className="mb-2.5 flex items-center justify-between gap-3 sm:mb-3.5">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary sm:text-[15px]">
              <ByndIcon name="megaphone" className="size-3.5 text-accent sm:size-4" />
              Latest update
            </h2>
            {updateCount > 0 ? (
              <button
                type="button"
                onClick={() => onViewAllUpdates?.()}
                className="text-xs font-medium text-accent transition-colors hover:text-accent/80 sm:text-sm"
              >
                View all →
              </button>
            ) : onPostUpdate ? (
              <button
                type="button"
                onClick={() => onPostUpdate()}
                className="text-xs font-medium text-accent transition-colors hover:text-accent/80 sm:text-sm"
              >
                Post →
              </button>
            ) : null}
          </div>
          {latestUpdate ? (
            <article className="flex gap-3 rounded-lg border border-[#2a2a2a] bg-[#0e0e0e] p-2.5 sm:gap-4 sm:rounded-xl sm:p-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a] sm:h-[4.5rem] sm:w-[4.5rem] sm:rounded-xl">
                {latestUpdate.posterUrl ? (
                  <img src={latestUpdate.posterUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ByndIcon name="megaphone" className="size-4 text-text-muted sm:size-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                <p className="truncate text-sm font-semibold text-text-primary sm:text-[15px]">
                  {latestUpdate.title?.trim() || 'Update'}
                </p>
                <p className="text-[11px] text-text-muted sm:text-xs">
                  {relativeTime(latestUpdate.publishedAt)}
                </p>
                <p className="hidden line-clamp-2 text-sm leading-snug text-text-secondary sm:block">
                  {latestUpdate.body}
                </p>
              </div>
            </article>
          ) : (
            <p className="rounded-lg border border-dashed border-[#2a2a2a] px-3 py-3.5 text-sm text-text-muted sm:rounded-xl sm:px-4 sm:py-5">
              No updates yet.
              {onPostUpdate ? (
                <>
                  {' '}
                  <button
                    type="button"
                    onClick={onPostUpdate}
                    className="font-semibold text-accent hover:underline"
                  >
                    Post one
                  </button>
                </>
              ) : null}
            </p>
          )}
        </section>
      ) : null}

      {isDraft && copy.suggestEntryTitle && !anyEntry ? (
        <p className="text-sm text-text-secondary">
          {copy.suggestEntryBody}{' '}
          <Link href={entryHref} className="font-semibold text-accent hover:underline">
            {copy.addCompete}
          </Link>
        </p>
      ) : null}
    </div>
  );

  if (isDraft) {
    return (
      <div className="space-y-7">
        <EventReadiness org={org} event={event} onPublished={onPublished} />
        {body}
      </div>
    );
  }

  return body;
}

function MetricCard({
  Icon,
  iconClass,
  value,
  label,
  detail,
}: Metric) {
  return (
    <div className="flex min-h-0 items-center gap-2.5 rounded-xl border border-[#252525] bg-gradient-to-b from-[#171717] to-[#121212] px-2.5 py-2.5 transition-[border-color] duration-150 hover:border-[#333] sm:min-h-[6.25rem] sm:gap-5 sm:rounded-2xl sm:px-5 sm:py-4">
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] sm:size-12 sm:rounded-xl',
          iconClass,
        )}
      >
        <Icon className="size-4 sm:size-6" strokeWidth={1.85} absoluteStrokeWidth aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
        <p className="font-display text-xl leading-none tracking-[0.02em] text-text-primary sm:text-[2.05rem]">
          {value}
        </p>
        <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-text-secondary sm:text-[11px] sm:tracking-[0.14em]">
          {label}
        </p>
        <p className="hidden truncate text-[13px] leading-snug text-text-muted sm:block">{detail}</p>
      </div>
    </div>
  );
}

function DestRow({
  Icon,
  iconWrap,
  title,
  body,
  href,
  onClick,
}: {
  Icon: LucideIcon;
  iconWrap: string;
  title: string;
  body: string;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    'group flex w-full items-center gap-3 rounded-xl border border-[#252525] bg-[#141414] px-3 py-2.5 text-left transition-[border-color,background-color,transform] duration-150 hover:border-accent/35 hover:bg-[#171717] sm:gap-3.5 sm:rounded-2xl sm:px-4 sm:py-3.5';
  const inner = (
    <>
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-11 sm:rounded-xl',
          iconWrap,
        )}
      >
        <Icon className="size-4 sm:size-5" strokeWidth={1.85} absoluteStrokeWidth aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-text-primary sm:text-[15px]">{title}</span>
        <span className="mt-0.5 hidden text-[13px] leading-snug text-text-secondary sm:block">
          {body}
        </span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent"
        strokeWidth={2}
        aria-hidden
      />
    </>
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

function PublicPageCard({
  event,
  when,
  place,
  isLive,
  publicHref,
  onEditEvent,
}: {
  event: OrganizerEventDetailDto;
  when: string;
  place: string;
  isLive: boolean;
  publicHref: string;
  onEditEvent: () => void;
}) {
  return (
    <section className="flex h-full flex-col rounded-xl border border-[#252525] bg-gradient-to-b from-[#171717] to-[#121212] p-3 sm:rounded-2xl sm:p-5">
      <div className="mb-2.5 flex items-center justify-between gap-2 sm:mb-3.5 sm:items-start">
        <div className="space-y-0.5 sm:space-y-1">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary sm:text-[15px]">
            <Eye className="size-3.5 text-[#E8B84A] sm:size-4" strokeWidth={1.85} absoluteStrokeWidth aria-hidden />
            Public Page
          </p>
          <p className="hidden text-[12px] text-text-muted sm:block">This is what dancers see.</p>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] sm:px-2.5 sm:text-[10px] sm:tracking-[0.14em]',
            isLive ? 'bg-accent-2 text-bg' : 'bg-[#1e1e1e] text-text-secondary',
          )}
        >
          {isLive ? 'Live' : statusLabel(event.status)}
        </span>
      </div>

      <div className="flex flex-1 gap-3 rounded-lg border border-[#2a2a2a] bg-[#0e0e0e] p-2.5 sm:gap-3.5 sm:rounded-xl sm:p-3.5 sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-md bg-[#1a1a1a] sm:w-[4.75rem] sm:rounded-lg">
          {event.posterUrl ? (
            <img src={event.posterUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
              <span className="font-display text-sm text-text-muted/40">+</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-0.5 py-0 sm:space-y-1.5 sm:py-0.5">
          <p className="truncate font-display text-base leading-none tracking-[0.04em] text-text-primary sm:text-xl">
            {event.title}
          </p>
          {when ? <p className="truncate text-[11px] text-text-secondary sm:text-[12px]">{when}</p> : null}
          {place ? (
            <p className="hidden truncate text-[12px] text-text-muted sm:block">{place}</p>
          ) : null}
          <p className="hidden pt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted sm:block">
            {eventTypeDisplayLabel(event.eventType)}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-2.5">
        {isLive ? (
          <Link
            href={publicHref}
            target="_blank"
            rel="noreferrer"
            aria-label="View event"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[#2a2a2a] bg-[#141414] px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-primary transition-colors duration-150 hover:border-accent/40 sm:min-h-10 sm:px-3 sm:text-[11px] sm:tracking-[0.1em]"
          >
            <ByndIcon name="external" className="size-3.5" />
            <span>View</span>
          </Link>
        ) : (
          <span className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[#2a2a2a] px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted sm:min-h-10 sm:px-3 sm:text-[11px]">
            Not live
          </span>
        )}
        <button
          type="button"
          onClick={onEditEvent}
          aria-label="Edit event"
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-accent/50 bg-accent/10 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent transition-colors duration-150 hover:border-accent hover:bg-accent/15 sm:min-h-10 sm:px-3 sm:text-[11px] sm:tracking-[0.1em]"
        >
          <ByndIcon name="edit" className="size-3.5" />
          <span>Edit</span>
        </button>
      </div>
    </section>
  );
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${String(mins)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${String(hours)} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${String(days)} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
}
