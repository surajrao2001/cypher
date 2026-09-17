'use client';

import type { EventCardDto, EventListResponse, RegistrationDto } from '@cypher/contracts';
import { formatEventDate, partitionRegistrationsForTickets } from '@cypher/utils';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { BrandHeroBanner } from '@/components/brand/BrandHeroBanner';
import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { EventPoster } from '@/features/discovery/EventPoster';
import { DancerEmptyState } from '@/features/shell/DancerEmptyState';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type EventsTab = 'upcoming' | 'saved' | 'past';

function typeLabel(eventType: string | undefined): string {
  if (!eventType) return 'EVENT';
  const t = eventType.toLowerCase();
  if (t.includes('jam') || t.includes('cypher')) return 'JAM / CYPHER';
  if (t.includes('workshop')) return 'WORKSHOP';
  if (t.includes('session')) return 'SESSION';
  if (t.includes('battle')) return 'BATTLE';
  return eventType.toUpperCase();
}

function EventsHero() {
  /* Banner already bakes EVENTS / YOUR SCENE… — no HTML title overlay */
  return (
    <BrandHeroBanner
      desktopSrc="/bynd8/events-hero-desktop-v2.jpg"
      mobileSrc="/bynd8/events-hero-mobile-v2.jpg"
      priority
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-[#080808] via-[#080808]/70 to-transparent"
      />
    </BrandHeroBanner>
  );
}

type EnrichedRow = {
  registration: RegistrationDto;
  catalog?: EventCardDto;
};

function EventListRow({ row }: { row: EnrichedRow }) {
  const { registration: reg, catalog } = row;
  const place =
    [catalog?.venue, reg.event.city || catalog?.city].filter(Boolean).join(', ') || reg.event.city;
  const confirmed = reg.registrationStatus === 'confirmed';
  const statusLabel = confirmed
    ? 'CONFIRMED'
    : reg.registrationStatus === 'pending_payment'
      ? 'REGISTERED'
      : reg.registrationStatus.replaceAll('_', ' ').toUpperCase();
  const subtitle =
    reg.category.entryType === 'viewer'
      ? 'Audience Pass'
      : reg.category.name || reg.entryName || 'Entry';

  return (
    <article className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#121212]">
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-stretch sm:gap-4 sm:p-3.5">
        <Link
          href={`/events/${reg.event.slug}`}
          className="relative h-36 w-full shrink-0 overflow-hidden rounded-md bg-[#0D0E0D] sm:h-auto sm:w-[7.5rem] lg:w-[8.5rem]"
        >
          <EventPoster
            title={reg.event.title}
            src={catalog?.posterUrl}
            sizes="140px"
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
              {typeLabel(catalog?.eventType)}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]',
                confirmed ? 'bg-accent-2 text-bg' : 'bg-accent/20 text-accent',
              )}
            >
              {statusLabel}
            </span>
          </div>
          <h3 className="text-[1.15rem] font-semibold leading-tight text-white sm:text-[1.25rem]">
            <Link href={`/events/${reg.event.slug}`} className="hover:text-accent">
              {reg.event.title}
            </Link>
          </h3>
          <p className="text-[12px] text-white/50">{subtitle}</p>
          <p className="mt-0.5 flex items-start gap-1.5 text-[11px] text-white/55">
            <ByndIcon name="calendar" className="mt-0.5 size-3.5 shrink-0 opacity-70" />
            <span>{formatEventDate(reg.event.startTime)}</span>
          </p>
          <p className="flex items-start gap-1.5 text-[11px] text-accent">
            <ByndIcon name="pin" className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-1">{place}</span>
          </p>
        </div>

        <div className="flex shrink-0 flex-row gap-2 sm:w-[9.5rem] sm:flex-col sm:justify-center">
          {confirmed && reg.hasTicket ? (
            <Button
              asChild
              className="h-10 flex-1 rounded-md bg-accent text-[12px] font-semibold normal-case tracking-normal text-white hover:bg-accent/90 sm:flex-none"
            >
              <Link href={routes.tickets}>View Pass</Link>
            </Button>
          ) : (
            <Button
              asChild
              className="h-10 flex-1 rounded-md bg-accent text-[12px] font-semibold normal-case tracking-normal text-white hover:bg-accent/90 sm:flex-none"
            >
              <Link href={`/events/${reg.event.slug}`}>View Details</Link>
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            className="h-10 flex-1 rounded-md border-white/20 bg-transparent text-[12px] font-medium normal-case tracking-normal text-white hover:bg-white/5 sm:flex-none"
          >
            <Link href={`/events/${reg.event.slug}`}>View Event</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function EventsBoard({ catalog }: { catalog: EventListResponse }) {
  const { token, api, ready, status, refresh } = useAuth();
  const [items, setItems] = useState<RegistrationDto[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<EventsTab>('upcoming');

  const catalogByEventId = useMemo(() => {
    const map = new Map<string, EventCardDto>();
    for (const event of catalog.items) map.set(event.id, event);
    return map;
  }, [catalog.items]);

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.listMyRegistrations();
      setItems(res.items);
      setError(null);
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [api, token]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [load, ready]);

  const partitioned = partitionRegistrationsForTickets(items);
  const upcomingRows: EnrichedRow[] = partitioned.upcoming.map((registration) => ({
    registration,
    catalog: catalogByEventId.get(registration.eventId),
  }));
  const pastRows: EnrichedRow[] = partitioned.past.map((registration) => ({
    registration,
    catalog: catalogByEventId.get(registration.eventId),
  }));
  // Holds also surface under Upcoming for the Events board (registered / in progress)
  const holdRows: EnrichedRow[] = partitioned.needsAction.map((registration) => ({
    registration,
    catalog: catalogByEventId.get(registration.eventId),
  }));
  const upcomingAll = [...holdRows, ...upcomingRows];

  const tabs: Array<{ id: EventsTab; label: string; count: number }> = [
    { id: 'upcoming', label: 'Upcoming', count: upcomingAll.length },
    { id: 'saved', label: 'Saved', count: 0 },
    { id: 'past', label: 'Past', count: pastRows.length },
  ];

  const activeRows = tab === 'upcoming' ? upcomingAll : tab === 'past' ? pastRows : [];

  if (!ready || status === 'loading') {
    return (
      <div className="w-full px-3 pb-10 sm:px-5 lg:px-6">
        <PageLoading variant="list" label="Loading events" />
      </div>
    );
  }

  if (status !== 'authenticated' || !token) {
    return (
      <div className="w-full px-3 pb-10 sm:px-5 lg:px-6">
        <DancerEmptyState variant="eventsGuest" />
      </div>
    );
  }

  return (
    <div className="w-full px-3 pb-10 sm:px-5 lg:px-6">
      <div className="flex flex-col gap-5 py-4 sm:gap-6 sm:py-5">
        <EventsHero />

        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'rounded-md border px-3.5 py-2 text-[12px] font-medium transition-colors',
                  active
                    ? 'border-accent text-white'
                    : 'border-white/10 bg-[#121212] text-white/50 hover:border-white/20 hover:text-white/80',
                )}
              >
                {item.label}
                <span className={cn('ml-1.5', active ? 'text-white/70' : 'text-white/35')}>
                  ({item.count})
                </span>
              </button>
            );
          })}
        </div>

        <section className="space-y-3">
          <div>
            <h2 className="text-[1.05rem] font-semibold text-white sm:text-[1.15rem]">
              {tab === 'upcoming'
                ? 'Upcoming Events'
                : tab === 'saved'
                  ? 'Saved Events'
                  : 'Past Events'}
            </h2>
            <p className="mt-0.5 text-[12px] text-white/45">
              {tab === 'upcoming'
                ? "Events you're registered for or have tickets to."
                : tab === 'saved'
                  ? 'Events you’ve bookmarked to come back to.'
                  : 'Nights you’ve already been to.'}
            </p>
          </div>

          {token && loading ? (
            <PageLoading variant="list" label="Loading events" />
          ) : error ? (
            <SoftError
              title="Couldn’t load your events"
              error={error}
              onRetry={() => {
                void refresh().then(() => load());
              }}
            />
          ) : tab === 'saved' || activeRows.length === 0 ? (
            <DancerEmptyState variant="eventsSaved" className="min-h-[24rem] py-8" />
          ) : (
            <ul className="space-y-3">
              {activeRows.map((row) => (
                <li key={row.registration.id}>
                  <EventListRow row={row} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
