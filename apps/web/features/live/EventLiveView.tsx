'use client';

import type { EventDetailDto, EventLiveDto } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatEventDate } from '@cypher/utils';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { RequireAuth } from '@/features/auth/AuthGates';
import { useAuth } from '@/features/auth/AuthProvider';
import { EventPoster } from '@/features/discovery/EventPoster';
import {
  announcementTimeLabel,
  dancerOpsStatusLabel,
  deriveLivePrimary,
  earlyRewardPresentation,
  entryCheckInLabel,
  entryTypeLabel,
  livePrimaryActions,
  progressionPresentation,
} from '@/features/live/live-view-model';
import { friendlyError, PageLoading, SoftError } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

const LIVE_POLL_MS = 60_000;

export function EventLiveView({ event }: { event: EventDetailDto }) {
  return (
    <RequireAuth>
      <EventLiveViewInner event={event} />
    </RequireAuth>
  );
}

function EventLiveViewInner({ event }: { event: EventDetailDto }) {
  const { api, status } = useAuth();
  const reduceMotion = useReducedMotion();
  const liveQuery = useQuery({
    queryKey: ['me', 'events', event.id, 'live'],
    queryFn: () => api.getMyEventLive(event.id),
    enabled: status === 'authenticated',
    staleTime: 30_000,
    refetchInterval: LIVE_POLL_MS,
    refetchOnWindowFocus: true,
    placeholderData: (prev) => prev,
  });

  const live = liveQuery.data;
  const place = [event.venue, event.city].filter(Boolean).join(', ') || event.city;
  const when = formatEventDate(event.startTime);

  if (liveQuery.isPending && !live) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-8 sm:px-5 lg:px-6">
        <PageLoading variant="panel" label="Loading Live" />
      </div>
    );
  }

  if (liveQuery.isError && !live) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-8 sm:px-5 lg:px-6">
        <SoftError
          title="Couldn’t load Live"
          error={liveQuery.error}
          onRetry={() => void liveQuery.refetch()}
        />
      </div>
    );
  }

  if (!live) return null;

  return (
    <EventLiveContent
      event={event}
      live={live}
      place={place}
      when={when}
      reduceMotion={Boolean(reduceMotion)}
      refreshing={liveQuery.isFetching && !liveQuery.isPending}
      refreshError={liveQuery.isError ? friendlyError(liveQuery.error) : null}
      onRefresh={() => void liveQuery.refetch()}
    />
  );
}

function EventLiveContent({
  event,
  live,
  place,
  when,
  reduceMotion,
  refreshing,
  refreshError,
  onRefresh,
}: {
  event: EventDetailDto;
  live: EventLiveDto;
  place: string;
  when: string;
  reduceMotion: boolean;
  refreshing: boolean;
  refreshError: string | null;
  onRefresh: () => void;
}) {
  const primary = deriveLivePrimary(live);
  const actions = livePrimaryActions(primary);
  const progression = progressionPresentation(live);
  const early = earlyRewardPresentation(live);
  const announcements = live.announcements.slice(0, 3);
  const status = live.ops.status;
  const pulseLive = status === 'event_live' || status === 'check_in_open';

  return (
    <div className="mx-auto max-w-5xl px-3 pb-16 pt-4 sm:px-5 lg:px-6 lg:pb-20 lg:pt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-white/70 hover:text-white"
        >
          <span aria-hidden>←</span> Event
        </Link>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="text-[12px] font-medium text-white/50 hover:text-accent disabled:opacity-50"
          aria-label="Refresh Live"
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {refreshError ? (
        <p role="status" className="mb-3 text-[12px] text-accent">
          Couldn’t refresh — showing last loaded state. {refreshError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-8 lg:items-start">
        <div className="space-y-5 sm:space-y-6">
          {/* Identity */}
          <header className="flex gap-3.5 sm:gap-5">
            <div className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0D0E0D] sm:size-24">
              <EventPoster title={event.title} src={event.posterUrl} sizes="96px" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                  {event.eventType}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]',
                    pulseLive ? 'bg-accent-2 text-bg' : 'bg-[#1e1e1e] text-white/65',
                  )}
                >
                  {pulseLive && !reduceMotion ? (
                    <motion.span
                      aria-hidden
                      className="size-1.5 rounded-full bg-bg"
                      animate={{ opacity: [1, 0.35, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  ) : pulseLive ? (
                    <span aria-hidden className="size-1.5 rounded-full bg-bg" />
                  ) : null}
                  <span>{dancerOpsStatusLabel(status)}</span>
                </span>
              </div>
              <h1 className="font-display text-[1.65rem] uppercase leading-[0.92] tracking-[0.03em] text-white sm:text-4xl">
                {event.title}
              </h1>
              <p className="text-[12px] text-white/55 sm:text-[13px]">
                {when}
                {place ? <span className="text-white/35"> · </span> : null}
                {place ? <span className="text-accent">{place}</span> : null}
              </p>
            </div>
          </header>

          {/* Dominant state */}
          <section
            className={cn(
              'relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-[#171717] to-[#101110] px-4 py-5 sm:px-5 sm:py-6',
              primary.kind === 'checked_in' ||
                primary.kind === 'live_checked_in' ||
                primary.kind === 'completed'
                ? 'border-accent-2/25'
                : null,
            )}
            aria-live="polite"
          >
            {primary.showCheckInArt ? (
              <img
                src="/bynd8/illustrations/event-day/check-in.svg"
                alt=""
                aria-hidden
                className="pointer-events-none absolute -right-2 -top-2 h-auto w-[7.5rem] opacity-40 sm:w-36"
              />
            ) : null}
            <p className="relative text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
              BYND8 Live
            </p>
            <h2 className="relative mt-2 font-display text-3xl uppercase tracking-[0.04em] text-white sm:text-4xl">
              {primary.title}
            </h2>
            {primary.detail && primary.kind === 'before_open' ? (
              <p className="relative mt-2 font-display text-2xl text-accent-2 sm:text-3xl">
                {primary.detail}
              </p>
            ) : null}
            <p className="relative mt-2 max-w-md text-[14px] leading-snug text-white/60">
              {primary.body}
            </p>
            {primary.detail && primary.kind !== 'before_open' ? (
              <p className="relative mt-2 text-[13px] text-white/50">{primary.detail}</p>
            ) : null}

            {early.kind === 'active' ? (
              <p className="relative mt-3 inline-flex rounded-md border border-accent/35 bg-accent/10 px-2.5 py-1.5 text-[12px] font-semibold text-accent">
                {early.label}
                {early.detail ? <span className="ml-1.5 font-normal opacity-90">{early.detail}</span> : null}
              </p>
            ) : null}
            {early.kind === 'earned' && !progression ? (
              <p className="relative mt-3 text-[12px] font-semibold text-accent-2">
                Early check-in ✓{early.detail ? ` · ${early.detail}` : ''}
              </p>
            ) : null}

            <div className="relative mt-5 flex flex-wrap gap-2">
              {actions.includes('view_pass') ? (
                <Button asChild className="min-h-11 rounded-xl px-5 text-[13px] font-semibold normal-case tracking-normal">
                  <Link href={routes.tickets}>View pass</Link>
                </Button>
              ) : null}
              {actions.includes('view_event') ? (
                <Button
                  asChild
                  variant="outline"
                  className="min-h-11 rounded-xl border-white/15 bg-transparent px-5 text-[13px] font-semibold normal-case tracking-normal text-white hover:bg-white/5"
                >
                  <Link href={`/events/${event.slug}`}>View event</Link>
                </Button>
              ) : null}
            </div>
          </section>

          {/* My entries */}
          {live.checkIn.myEntries.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                My entries
              </h2>
              <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-[#121212]">
                {live.checkIn.myEntries.map((entry) => (
                  <li
                    key={entry.registrationId}
                    className="flex items-start justify-between gap-3 px-3.5 py-3 sm:px-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-white">
                        {entry.categoryName}
                      </p>
                      <p className="text-[12px] text-white/45">{entryTypeLabel(entry.entryType)}</p>
                    </div>
                    <p
                      className={cn(
                        'shrink-0 text-right text-[12px] font-medium',
                        entry.checkedIn ? 'text-accent-2' : 'text-white/45',
                      )}
                    >
                      {entry.checkedIn ? '✓ ' : ''}
                      {entryCheckInLabel(entry, live.ops.timezone)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Updates */}
          {announcements.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                  Latest updates
                </h2>
                {live.announcements.length > 3 ? (
                  <Link
                    href={`/events/${event.slug}`}
                    className="text-[12px] font-medium text-accent hover:underline"
                  >
                    View more
                  </Link>
                ) : null}
              </div>
              <ul className="space-y-3">
                {announcements.map((update) => (
                  <li
                    key={update.id}
                    className="rounded-xl border border-white/[0.08] bg-[#121212] px-3.5 py-3"
                  >
                    <p className="text-[11px] text-white/40">
                      {announcementTimeLabel(update, live.ops.timezone)}
                    </p>
                    {update.title ? (
                      <p className="mt-1 text-[14px] font-semibold text-white">{update.title}</p>
                    ) : null}
                    <p className="mt-1 line-clamp-3 text-[13px] leading-snug text-white/55">
                      {update.body}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Desktop / stacked aside */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          {progression ? (
            <section className="rounded-xl border border-white/[0.08] bg-[#121212] px-4 py-4">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                Event XP
              </h2>
              <p className="mt-2 font-display text-4xl tracking-[0.04em] text-accent-2">
                +{progression.total} XP
              </p>
              <ul className="mt-3 space-y-1.5">
                {progression.lines.map((line) => (
                  <li
                    key={line.label}
                    className="flex justify-between text-[13px] text-white/55"
                  >
                    <span>{line.label}</span>
                    <span className="font-medium text-white/80">+{line.xp}</span>
                  </li>
                ))}
              </ul>
              {early.kind === 'earned' ? (
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-2">
                  Early check-in ✓
                </p>
              ) : null}
            </section>
          ) : null}

          {primary.showViewPass ? (
            <section className="rounded-xl border border-white/[0.08] bg-[#121212] px-4 py-4">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                Pass
              </h2>
              <p className="mt-2 text-[13px] leading-snug text-white/55">
                Venue staff scan your BYND8 Pass QR. There is no self check-in.
              </p>
              <Button
                asChild
                className="mt-4 min-h-11 w-full rounded-xl text-[13px] font-semibold normal-case tracking-normal"
              >
                <Link href={routes.tickets}>View pass</Link>
              </Button>
            </section>
          ) : null}

          <section className="rounded-xl border border-white/[0.08] bg-[#0e0e0e] px-4 py-3.5">
            <p className="text-[11px] text-white/40">Timezone · {live.ops.timezone}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white/55">
              <ByndIcon name="pin" className="size-3.5 text-accent" />
              {place}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
