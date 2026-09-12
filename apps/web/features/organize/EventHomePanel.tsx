'use client';

import { useEffect, useState } from 'react';
import type {
  EventUpdateDto,
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
} from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';
import Link from 'next/link';

import { ByndIcon, type ByndIconName } from '@/components/icons/bynd8';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  hasPaidEntry,
  isPastEvent,
  moneyFromRegistrations,
  statusLabel,
  type ControlDest,
} from '@/features/organize/event-control';
import { formatEventHomeWhen } from '@/features/organize/EventControlHeader';
import {
  entryCopyForType,
  eventTypeDisplayLabel,
  eventTypeGroup,
  hasAnyEntry,
} from '@/features/organize/event-type-copy';
import { EventReadiness } from '@/features/organize/EventReadiness';
import { cn } from '@/lib/utils';

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
  const paid = hasPaidEntry(event);
  const showMoney = paid;
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
  const spotsLeft =
    capacity > 0 ? Math.max(0, capacity - filled) : null;
  const money = moneyFromRegistrations(regs);
  const publicHref = `${routes.events}/${event.slug}`;
  const when = formatEventHomeWhen(event.startTime);
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

  const entrySub =
    audienceCats.length > 0
      ? `${String(audienceCats.length)} audience pass${audienceCats.length === 1 ? '' : 'es'}`
      : group === 'battle'
        ? 'No audience pass'
        : copy.emptyEntryHome;

  if (isDraft) {
    return (
      <div className="space-y-6">
        <EventReadiness org={org} event={event} onPublished={onPublished} />
        <HomeBody
          event={event}
          confirmed={confirmed}
          competeConfirmed={competeConfirmed}
          audienceConfirmed={audienceConfirmed}
          competeCount={compete.length}
          entryCount={compete.length + audienceCats.length}
          anyEntry={anyEntry}
          showMoney={showMoney}
          money={money}
          entrySub={entrySub}
          spotsLeft={spotsLeft}
          capacity={capacity}
          filled={filled}
          group={group}
          peopleHref={peopleHref}
          entryHref={entryHref}
          publicHref={publicHref}
          when={when}
          place={place}
          isLive={false}
          past={false}
          latestUpdate={latestUpdate}
          updateCount={updateCount}
          onNavigate={onNavigate}
          onEditEvent={onEditEvent}
          onPostUpdate={onPostUpdate}
          onViewAllUpdates={onViewAllUpdates}
        />
      </div>
    );
  }

  return (
    <HomeBody
      event={event}
      confirmed={confirmed}
      competeConfirmed={competeConfirmed}
      audienceConfirmed={audienceConfirmed}
      competeCount={compete.length}
      entryCount={compete.length + audienceCats.length}
      anyEntry={anyEntry}
      showMoney={showMoney}
      money={money}
      entrySub={entrySub}
      spotsLeft={spotsLeft}
      capacity={capacity}
      filled={filled}
      group={group}
      peopleHref={peopleHref}
      entryHref={entryHref}
      publicHref={publicHref}
      when={when}
      place={place}
      isLive={isLive}
      past={past}
      latestUpdate={latestUpdate}
      updateCount={updateCount}
      onNavigate={onNavigate}
      onEditEvent={onEditEvent}
      onPostUpdate={onPostUpdate}
      onViewAllUpdates={onViewAllUpdates}
    />
  );
}

function HomeBody({
  event,
  confirmed,
  competeConfirmed,
  audienceConfirmed,
  competeCount,
  entryCount,
  anyEntry,
  showMoney,
  money,
  entrySub,
  spotsLeft,
  capacity,
  filled,
  group,
  peopleHref,
  entryHref,
  publicHref,
  when,
  place,
  isLive,
  past,
  latestUpdate,
  updateCount,
  onNavigate,
  onEditEvent,
  onPostUpdate,
  onViewAllUpdates,
}: {
  event: OrganizerEventDetailDto;
  confirmed: number;
  competeConfirmed: number;
  audienceConfirmed: number;
  competeCount: number;
  entryCount: number;
  anyEntry: boolean;
  showMoney: boolean;
  money: { collectedMinor: number; pendingMinor: number; refundedMinor: number };
  entrySub: string;
  spotsLeft: number | null;
  capacity: number;
  filled: number;
  group: ReturnType<typeof eventTypeGroup>;
  peopleHref: string;
  entryHref: string;
  publicHref: string;
  when: string;
  place: string;
  isLive: boolean;
  past: boolean;
  latestUpdate: EventUpdateDto | null;
  updateCount: number;
  onNavigate: (dest: ControlDest) => void;
  onEditEvent: () => void;
  onPostUpdate?: () => void;
  onViewAllUpdates?: () => void;
}) {
  const registeredDetail =
    group === 'battle' && anyEntry
      ? `${String(competeConfirmed)} competitors · ${String(audienceConfirmed)} audience`
      : anyEntry
        ? `${String(confirmed)} confirmed`
        : 'No registration needed';

  return (
    <div className="space-y-6">
      {/* Metric squares */}
      <div
        className={cn(
          'grid gap-3',
          showMoney ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3',
        )}
      >
        <MetricCard
          icon="crew"
          iconClass="text-[#5B9DFF]"
          value={String(confirmed)}
          label="Registered"
          detail={registeredDetail}
        />
        <MetricCard
          icon="trophy"
          iconClass="text-[#E8B84A]"
          value={String(anyEntry ? (group === 'battle' ? competeCount : entryCount) : 0)}
          label={
            group === 'battle'
              ? Number(anyEntry ? competeCount : 0) === 1
                ? 'Competition'
                : 'Competitions'
              : group === 'workshop'
                ? Number(anyEntry ? entryCount : 0) === 1
                  ? 'Pass'
                  : 'Passes'
                : Number(anyEntry ? entryCount : 0) === 1
                  ? 'Entry'
                  : 'Entries'
          }
          detail={anyEntry ? entrySub : 'Add entry when ready'}
        />
        {showMoney ? (
          <MetricCard
            icon="wallet"
            iconClass="text-accent"
            value={formatMinorUnits(money.collectedMinor)}
            label="Collected"
            detail={
              money.pendingMinor > 0
                ? `${formatMinorUnits(money.pendingMinor)} pending`
                : 'No pending'
            }
          />
        ) : null}
        <MetricCard
          icon="tickets"
          iconClass="text-accent"
          value={spotsLeft == null ? '—' : String(spotsLeft)}
          label="Spots left"
          detail={
            capacity > 0
              ? `${String(filled)} / ${String(capacity)} filled`
              : anyEntry
                ? 'No capacity set'
                : 'Open'
          }
        />
      </div>

      {/* Destinations + Public page */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-stretch">
        <div className="flex flex-col gap-3">
          <DestRow
            icon="crew"
            iconWrap="bg-[#1a2740] text-[#5B9DFF]"
            title="People"
            body="View registrations, check-ins and manage attendees"
            href={peopleHref}
          />
          <DestRow
            icon="tickets"
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
              icon="wallet"
              iconWrap="bg-[#142418] text-[#6FCF97]"
              title="Money"
              body="View revenue, payouts and payment status"
              onClick={() => onNavigate('money')}
            />
          ) : null}
        </div>

        <PublicPageCard
          event={event}
          when={when}
          place={place}
          isLive={isLive}
          publicHref={publicHref}
          onEditEvent={onEditEvent}
        />
      </div>

      {/* Latest update */}
      {!past || latestUpdate ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
              <ByndIcon name="megaphone" className="size-4 text-accent" />
              Latest update
            </h2>
            {updateCount > 0 ? (
              <button
                type="button"
                onClick={() => onViewAllUpdates?.()}
                className="text-sm font-medium text-accent hover:underline"
              >
                View all →
              </button>
            ) : onPostUpdate ? (
              <button
                type="button"
                onClick={() => onPostUpdate()}
                className="text-sm font-medium text-accent hover:underline"
              >
                Post update →
              </button>
            ) : null}
          </div>
          {latestUpdate ? (
            <article className="flex gap-3.5 rounded-2xl border border-[#2a2a2a] bg-[#141414] p-3.5 sm:gap-4 sm:p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#1a1a1a] sm:h-20 sm:w-20">
                {latestUpdate.posterUrl || event.posterUrl ? (
                  <img
                    src={latestUpdate.posterUrl || event.posterUrl || ''}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ByndIcon name="megaphone" className="size-5 text-text-muted" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-semibold text-text-primary">
                  {latestUpdate.title?.trim() || 'Update'}
                </p>
                <p className="text-xs text-text-muted">{relativeTime(latestUpdate.publishedAt)}</p>
                <p className="line-clamp-2 text-sm text-text-secondary">{latestUpdate.body}</p>
              </div>
            </article>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#2a2a2a] bg-[#141414]/40 px-4 py-6 text-center">
              <p className="text-sm text-text-secondary">No updates yet</p>
              {onPostUpdate ? (
                <button
                  type="button"
                  onClick={onPostUpdate}
                  className="mt-2 text-sm font-semibold text-accent hover:underline"
                >
                  Post update
                </button>
              ) : null}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon,
  iconClass,
  value,
  label,
  detail,
}: {
  icon: ByndIconName;
  iconClass: string;
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-[7.5rem] flex-col rounded-2xl border border-[#2a2a2a] bg-[#141414] p-4">
      <ByndIcon name={icon} className={cn('size-5', iconClass)} />
      <div className="mt-auto space-y-1 pt-4">
        <p className="font-display text-[1.55rem] leading-none tracking-[0.02em] text-text-primary sm:text-[1.75rem]">
          {value}{' '}
          <span className="text-[0.92rem] font-semibold tracking-normal sm:text-[1rem]">{label}</span>
        </p>
        <p className="text-xs leading-snug text-text-secondary sm:text-[13px]">{detail}</p>
      </div>
    </div>
  );
}

function DestRow({
  icon,
  iconWrap,
  title,
  body,
  href,
  onClick,
}: {
  icon: ByndIconName;
  iconWrap: string;
  title: string;
  body: string;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    'flex w-full items-center gap-3.5 rounded-2xl border border-[#2a2a2a] bg-[#141414] px-4 py-4 text-left transition-colors hover:border-accent/40';
  const inner = (
    <>
      <span
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl',
          iconWrap,
        )}
      >
        <ByndIcon name={icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-text-primary">{title}</span>
        <span className="mt-0.5 block text-xs text-text-secondary sm:text-[13px]">{body}</span>
      </span>
      <ByndIcon name="chevronRight" className="size-4 shrink-0 text-text-muted" aria-hidden />
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
    <section className="flex h-full flex-col rounded-2xl border border-[#2a2a2a] bg-[#141414] p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
            <ByndIcon name="eye" className="size-4 text-[#E8B84A]" />
            Public Page
          </p>
          <p className="text-xs text-text-muted">This is what dancers see.</p>
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

      <div className="flex flex-1 gap-3 rounded-xl border border-[#2a2a2a] bg-[#101010] p-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a] sm:size-[4.5rem]">
          {event.posterUrl ? (
            <img src={event.posterUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ByndIcon name="poster" className="size-5 text-text-muted/50" />
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="truncate font-display text-lg tracking-[0.04em] text-text-primary">
            {event.title}
          </p>
          {when ? <p className="truncate text-xs text-text-secondary">{when}</p> : null}
          {place ? <p className="truncate text-xs text-text-muted">{place}</p> : null}
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
            {eventTypeDisplayLabel(event.eventType)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {isLive ? (
          <Link
            href={publicHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#2a2a2a] px-3 text-xs font-semibold uppercase tracking-[0.1em] text-text-primary transition-colors hover:border-accent/40"
          >
            View Event
            <ByndIcon name="external" className="size-3.5" />
          </Link>
        ) : (
          <span className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#2a2a2a] px-3 text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">
            Not live yet
          </span>
        )}
        <button
          type="button"
          onClick={onEditEvent}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#2a2a2a] px-3 text-xs font-semibold uppercase tracking-[0.1em] text-text-primary transition-colors hover:border-accent/40"
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
