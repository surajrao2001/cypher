import type { ReactNode } from 'react';
import { routes } from '@cypher/contracts';
import { formatEventDateRange, formatMinorUnits, spotsLeft } from '@cypher/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ByndIcon } from '@/components/icons/bynd8';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EventMediaSection } from '@/features/discovery/EventMediaSection';
import { EventPoster } from '@/features/discovery/EventPoster';
import { StickyRegisterBar } from '@/features/discovery/StickyRegisterBar';
import { VenueMapView } from '@/features/discovery/VenueMapView';
import { spotsTone } from '@/features/discovery/catalog';
import { EmptyState } from '@/features/shell/EmptyState';
import { getServerApi } from '@/lib/api';

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: EventDetailPageProps) {
  const { slug } = await params;
  try {
    const event = await getServerApi().getEvent(slug);
    return { title: event?.title ?? 'Event' };
  } catch {
    return { title: 'Event' };
  }
}

function categoryPriceLabel(category: {
  priceMinor: number;
  currentPriceMinor: number;
  activeTierName: string | null;
}) {
  const sell = category.currentPriceMinor ?? category.priceMinor;
  const price = sell === 0 ? 'Free' : formatMinorUnits(sell);
  if (category.activeTierName) {
    return `${price} · ${category.activeTierName}`;
  }
  return price;
}

function EventUpdatesFeed({
  updates,
}: {
  updates: Array<{
    id: string;
    title: string | null;
    body: string;
    posterUrl: string | null;
  }>;
}) {
  if (updates.length === 0) return null;
  return (
    <section className="space-y-4" id="updates">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">Updates</p>
      <ul className="space-y-4">
        {updates.map((update) => (
          <li key={update.id} className="border-b border-border pb-4 last:border-0">
            {update.title ? <p className="font-semibold text-text-primary">{update.title}</p> : null}
            {update.posterUrl ? (
              <div className="mt-2 overflow-hidden rounded-xl border border-border bg-elevated">
                <img src={update.posterUrl} alt="" className="max-h-96 w-full object-cover" />
              </div>
            ) : null}
            <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">{update.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getServerApi().getEvent(slug).catch(() => null);
  if (!event) notFound();

  const left = spotsLeft(event.spotsCapacity, event.spotsConfirmed);
  const tone = spotsTone(event.spotsConfirmed, event.spotsCapacity);
  const compete =
    event.competeCategories?.length > 0
      ? event.competeCategories
      : event.categories.filter((c) => c.entryType !== 'viewer');
  const viewers =
    event.viewerCategories?.length > 0
      ? event.viewerCategories
      : event.categories.filter((c) => c.entryType === 'viewer');
  const viewersOpen = viewers.length > 0 || event.audience?.enabled;
  const hasPin = event.venueLatitude != null && event.venueLongitude != null;

  return (
    <div className="pb-28">
      <div className="relative min-h-[20rem] overflow-hidden border-b border-border md:min-h-[28rem]">
        <EventPoster title={event.title} src={event.posterUrl} priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-bg/20" />
        <div className="relative z-10 mx-auto flex min-h-[20rem] max-w-6xl flex-col justify-end px-4 py-8 md:min-h-[28rem] md:px-8">
          <Link
            href={routes.events}
            className="mb-4 inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-secondary hover:text-accent"
          >
            <span aria-hidden>←</span> Events
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-accent text-bg">{event.eventType}</Badge>
            {event.styles.slice(0, 3).map((style) => (
              <Badge key={style} variant="outline" className="rounded-full">
                {style}
              </Badge>
            ))}
            <span className={`text-xs font-semibold uppercase tracking-[0.14em] ${tone.className}`}>
              {tone.label}
            </span>
          </div>
          <h1 className="display-title mt-3 max-w-4xl text-5xl md:text-7xl">{event.title}</h1>
          <p className="mt-3 text-sm text-text-secondary">
            by {event.organizerName}
            <span className="text-text-muted"> · {event.city}</span>
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-10">
          <section className="space-y-3" id="details">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              About
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
              {event.description ??
                `${event.organizerName} hosts this ${event.eventType} — show up and get on the floor.`}
            </p>
          </section>

          <section className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              Compete
            </p>
            {compete.length === 0 ? (
              <EmptyState
                kicker="Categories"
                title="No compete categories yet"
                body={
                  viewersOpen
                    ? 'This night is watch-only for now — grab an audience pass below.'
                    : 'The organizer hasn’t opened compete entries yet.'
                }
                className="py-8 md:py-10"
              >
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={routes.discover}>Browse Discover</Link>
                </Button>
              </EmptyState>
            ) : (
              <ul className="space-y-2">
                {compete.map((category) => {
                  const categoryLeft = spotsLeft(category.capacity, category.confirmedCount);
                  return (
                    <li
                      key={category.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="font-display text-xl uppercase tracking-[0.04em] text-text-primary">
                          {category.name}
                        </p>
                        <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-text-muted">
                          {categoryPriceLabel(category)} · {categoryLeft} left
                        </p>
                      </div>
                      <Button asChild size="sm" className="rounded-full">
                        <a href="#get-in">Get in</a>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {viewersOpen ? (
            <section className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                Watch
              </p>
              <div className="rounded-xl border border-border border-l-accent-2 bg-surface px-4 py-4">
                <p className="font-display text-xl uppercase tracking-[0.04em] text-text-primary">
                  Audience pass
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Presence without entering a category — still a real pass at the door.
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-text-primary">
                    {viewers.length > 0
                      ? categoryPriceLabel(viewers[0]!)
                      : event.audience.priceMinor === 0
                        ? 'Free'
                        : formatMinorUnits(event.audience.priceMinor)}
                  </p>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <a href="#get-in">Watch the floor</a>
                  </Button>
                </div>
              </div>
            </section>
          ) : null}

          <EventMediaSection links={event.mediaLinks ?? []} />
          <EventUpdatesFeed updates={event.updates ?? []} />

          {hasPin ? (
            <section className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="border-b border-border px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                  Venue
                </p>
                <p className="mt-0.5 text-sm text-text-primary">
                  {event.venue ?? event.city}
                  <span className="text-text-secondary"> · {event.city}</span>
                </p>
              </div>
              <VenueMapView
                lat={event.venueLatitude!}
                lng={event.venueLongitude!}
                venueLabel={event.venue}
                mapClassName="h-56 rounded-none border-0 md:h-72"
              />
            </section>
          ) : null}
        </div>

        <aside className="h-fit space-y-4 rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-24">
          <MetaRow icon="events" label="Date">
            {formatEventDateRange(event.startTime, event.endTime)}
          </MetaRow>
          <MetaRow icon="pin" label="Venue">
            {event.venue ?? event.city}
            <span className="block text-text-secondary">{event.city}</span>
          </MetaRow>
          <MetaRow icon="crew" label="Organizer">
            {event.organizerName}
          </MetaRow>
          <MetaRow icon="tickets" label="Spots">
            <span className={tone.className}>{tone.label}</span>
            <span className="block text-text-secondary">
              {event.spotsConfirmed} confirmed
              {event.spotsCapacity > 0 ? ` · ${left} left` : ''}
            </span>
          </MetaRow>

          <div className="space-y-2 border-t border-border pt-4" id="get-in">
            <Button asChild size="lg" className="w-full rounded-full">
              <a href="#get-in-bar">
                Compete <span aria-hidden>→</span>
              </a>
            </Button>
            {viewersOpen ? (
              <Button asChild size="lg" variant="outline" className="w-full rounded-full">
                <a href="#get-in-bar">Watch the floor</a>
              </Button>
            ) : null}
            <p className="text-center text-[11px] text-text-muted">
              Free and paid entries both end in a pass + QR.
            </p>
          </div>
        </aside>
      </div>

      <div id="get-in-bar">
        <StickyRegisterBar event={event} spotsLeft={left} />
      </div>
    </div>
  );
}

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: 'events' | 'pin' | 'crew' | 'tickets';
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <ByndIcon name={icon} className="mt-0.5 size-4 shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted">{label}</p>
        <div className="mt-0.5 text-sm text-text-primary">{children}</div>
      </div>
    </div>
  );
}
