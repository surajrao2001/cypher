'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  EventUpdateDto,
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
} from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';
import Link from 'next/link';

import { ByndIcon } from '@/components/icons/bynd8';
import { useAuth } from '@/features/auth/AuthProvider';
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
  updatesRefreshKey = 0,
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
  updatesRefreshKey?: number;
}) {
  void _payoutReady;
  void _checkedInCount;
  const auth = useAuth();
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

  const [latestUpdate, setLatestUpdate] = useState<EventUpdateDto | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void auth.api
      .listEventUpdates(org.id, event.id)
      .then((res) => {
        if (cancelled) return;
        setUpdateCount(res.items.length);
        setLatestUpdate(res.items[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setLatestUpdate(null);
          setUpdateCount(0);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth.api, event.id, org.id, updatesRefreshKey]);

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(13.5rem,1fr))]">
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
        <section className="rounded-2xl border border-[#252525] bg-gradient-to-b from-[#171717]/90 to-[#121212] p-4 sm:p-5">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-[15px] font-semibold text-text-primary">
              <ByndIcon name="megaphone" className="size-4 text-accent" />
              Latest update
            </h2>
            {updateCount > 0 ? (
              <button
                type="button"
                onClick={() => onViewAllUpdates?.()}
                className="text-sm font-medium text-accent transition-colors hover:text-accent/80"
              >
                View all →
              </button>
            ) : onPostUpdate ? (
              <button
                type="button"
                onClick={() => onPostUpdate()}
                className="text-sm font-medium text-accent transition-colors hover:text-accent/80"
              >
                Post update →
              </button>
            ) : null}
          </div>
          {latestUpdate ? (
            <article className="flex gap-4 rounded-xl border border-[#2a2a2a] bg-[#0e0e0e] p-3.5 sm:p-4">
              <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-[#1a1a1a]">
                {latestUpdate.posterUrl ? (
                  <img src={latestUpdate.posterUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ByndIcon name="megaphone" className="size-5 text-text-muted" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[15px] font-semibold text-text-primary">
                  {latestUpdate.title?.trim() || 'Update'}
                </p>
                <p className="text-xs text-text-muted">{relativeTime(latestUpdate.publishedAt)}</p>
                <p className="line-clamp-2 text-sm leading-snug text-text-secondary">
                  {latestUpdate.body}
                </p>
              </div>
            </article>
          ) : (
            <p className="rounded-xl border border-dashed border-[#2a2a2a] px-4 py-5 text-sm text-text-muted">
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
    <div className="flex min-h-[5.75rem] items-center gap-4 rounded-2xl border border-[#252525] bg-gradient-to-b from-[#171717] to-[#121212] px-4 py-4 transition-[border-color] duration-150 hover:border-[#333] sm:min-h-[6.25rem] sm:gap-5 sm:px-5">
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] sm:size-12',
          iconClass,
        )}
      >
        <Icon className="size-5 sm:size-6" strokeWidth={1.85} absoluteStrokeWidth aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-display text-[1.85rem] leading-none tracking-[0.02em] text-text-primary sm:text-[2.05rem]">
          {value}
        </p>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-secondary">
          {label}
        </p>
        <p className="truncate text-[12px] leading-snug text-text-muted sm:text-[13px]">{detail}</p>
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
    'group flex w-full items-center gap-3.5 rounded-2xl border border-[#252525] bg-[#141414] px-3.5 py-3.5 text-left transition-[border-color,background-color,transform] duration-150 hover:border-accent/35 hover:bg-[#171717] sm:px-4 sm:py-3.5';
  const inner = (
    <>
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11',
          iconWrap,
        )}
      >
        <Icon className="size-5" strokeWidth={1.85} absoluteStrokeWidth aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-text-primary">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-text-secondary sm:text-[13px]">
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
    <section className="flex h-full flex-col rounded-2xl border border-[#252525] bg-gradient-to-b from-[#171717] to-[#121212] p-4 sm:p-5">
      <div className="mb-3.5 flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-[15px] font-semibold text-text-primary">
            <Eye className="size-4 text-[#E8B84A]" strokeWidth={1.85} absoluteStrokeWidth aria-hidden />
            Public Page
          </p>
          <p className="text-[12px] text-text-muted">This is what dancers see.</p>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]',
            isLive ? 'bg-accent-2 text-bg' : 'bg-[#1e1e1e] text-text-secondary',
          )}
        >
          {isLive ? 'Live' : statusLabel(event.status)}
        </span>
      </div>

      <div className="flex flex-1 gap-3.5 rounded-xl border border-[#2a2a2a] bg-[#0e0e0e] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="relative aspect-[3/4] w-[4.25rem] shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a] sm:w-[4.75rem]">
          {event.posterUrl ? (
            <img src={event.posterUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
              <span className="font-display text-sm text-text-muted/40">+</span>
              <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-text-muted/50">
                Poster
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
          <p className="truncate font-display text-xl leading-none tracking-[0.04em] text-text-primary">
            {event.title}
          </p>
          {when ? <p className="truncate text-[12px] text-text-secondary">{when}</p> : null}
          {place ? <p className="truncate text-[12px] text-text-muted">{place}</p> : null}
          <p className="pt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
            {eventTypeDisplayLabel(event.eventType)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {isLive ? (
          <Link
            href={publicHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#2a2a2a] bg-[#141414] px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-primary transition-colors duration-150 hover:border-accent/40"
          >
            View Event
            <ByndIcon name="external" className="size-3.5" />
          </Link>
        ) : (
          <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#2a2a2a] px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Not live yet
          </span>
        )}
        <button
          type="button"
          onClick={onEditEvent}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-accent/50 bg-accent/10 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-accent transition-colors duration-150 hover:border-accent hover:bg-accent/15"
        >
          <ByndIcon name="edit" className="size-3.5" />
          Edit Event
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
