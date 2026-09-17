'use client';

import type { EventCategoryPublicDto, EventDetailDto } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatEventDateRange, formatMinorUnits, spotsLeft } from '@cypher/utils';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { EventPoster } from '@/features/discovery/EventPoster';
import { RegisterCta } from '@/features/discovery/RegisterCta';
import { openEventRegister } from '@/features/discovery/register-events';
import { VenueMapView } from '@/features/discovery/VenueMapView';
import { eventDayMoment } from '@/features/shell/event-day';
import { cn } from '@/lib/utils';

type TabId = 'entry' | 'about' | 'updates' | 'location';

function categoryPrice(category: EventCategoryPublicDto): number {
  return category.currentPriceMinor ?? category.priceMinor;
}

function categorySubtitle(category: EventCategoryPublicDto): string {
  if (category.entryType === 'viewer') return 'Watch the floor';
  if (category.entryType === 'team' || (category.maxTeamSize ?? 1) > 1) {
    return `${category.minTeamSize}–${category.maxTeamSize} dancers`;
  }
  return 'Solo entry';
}

export function EventDetailView({ event }: { event: EventDetailDto }) {
  const [tab, setTab] = useState<TabId>('entry');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<Record<string, number>>({});
  const [savedHint, setSavedHint] = useState(false);

  const compete =
    event.competeCategories?.length > 0
      ? event.competeCategories
      : event.categories.filter((c) => c.entryType !== 'viewer');
  const viewers =
    event.viewerCategories?.length > 0
      ? event.viewerCategories
      : event.categories.filter((c) => c.entryType === 'viewer');
  const entryCategories = [...compete, ...viewers];
  const hasEntry = entryCategories.length > 0 || event.audience?.enabled;
  const hasPin = event.venueLatitude != null && event.venueLongitude != null;
  const day = event.status === 'published' ? eventDayMoment(event.startTime) : null;
  const live = day === 'tonight' || day === 'today';
  const place = [event.venue, event.city].filter(Boolean).join(', ') || event.city;
  const updates = event.updates ?? [];

  const cartLines = useMemo(() => {
    return Object.entries(cart)
      .filter(([, n]) => n > 0)
      .map(([categoryId, quantity]) => {
        const category = entryCategories.find((c) => c.id === categoryId);
        return category ? { category, quantity } : null;
      })
      .filter(Boolean) as Array<{ category: EventCategoryPublicDto; quantity: number }>;
  }, [cart, entryCategories]);

  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cartLines.reduce(
    (sum, line) => sum + categoryPrice(line.category) * line.quantity,
    0,
  );

  function getQty(categoryId: string): number {
    return qty[categoryId] ?? 1;
  }

  function setCategoryQty(categoryId: string, next: number) {
    setQty((prev) => ({ ...prev, [categoryId]: Math.max(1, Math.min(10, next)) }));
  }

  function addToCart(category: EventCategoryPublicDto) {
    const n = getQty(category.id);
    setCart((prev) => ({ ...prev, [category.id]: (prev[category.id] ?? 0) + n }));
  }

  function shareEvent() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      void navigator.share({ title: event.title, url }).catch(() => undefined);
      return;
    }
    void navigator.clipboard?.writeText(url);
  }

  function viewCart() {
    if (cartLines.length === 0) {
      setTab('entry');
      document.getElementById('entry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const first = cartLines[0]!;
    const mode = first.category.entryType === 'viewer' ? 'watch' : 'compete';
    openEventRegister({ mode, categoryId: first.category.id });
  }

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'entry', label: 'Entry' },
    { id: 'about', label: 'About' },
    {
      id: 'updates',
      label: updates.length > 0 ? `Updates (${updates.length})` : 'Updates',
    },
    { id: 'location', label: 'Location' },
  ];

  const mapHref =
    hasPin
      ? `https://www.google.com/maps?q=${event.venueLatitude},${event.venueLongitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

  return (
    <div className="pb-28">
      {/* Top actions */}
      <div className="flex items-center justify-between gap-3 px-3 pt-3 sm:px-5 lg:px-6">
        <Link
          href={routes.events}
          className="inline-flex items-center gap-1.5 text-[13px] text-white/70 hover:text-white"
        >
          <span aria-hidden>←</span> Back to events
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={shareEvent}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/15 px-3 text-[12px] text-white/80 hover:bg-white/5"
          >
            <ByndIcon name="external" className="size-3.5" />
            Share
          </button>
          <button
            type="button"
            aria-label="Save event"
            onClick={() => setSavedHint(true)}
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-md border border-white/15 text-white/70 hover:bg-white/5',
              savedHint && 'border-accent/50 text-accent',
            )}
          >
            ♥
          </button>
        </div>
      </div>

      {/* Hero: poster + meta */}
      <div className="mt-4 grid gap-5 px-3 sm:px-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-8 lg:px-6">
        <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-lg border border-white/[0.08] bg-[#0D0E0D] lg:mx-0 lg:max-w-none">
          <EventPoster title={event.title} src={event.posterUrl} priority sizes="400px" />
        </div>

        <div className="flex min-w-0 flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
              {event.eventType}
            </span>
            {live ? (
              <span className="rounded-full bg-accent-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-bg">
                Live
              </span>
            ) : null}
          </div>
          <h1 className="mt-2 font-display text-[2.2rem] uppercase leading-[0.92] tracking-[0.03em] text-white sm:text-[2.75rem] lg:text-[3.25rem]">
            {event.title}
          </h1>
          <p className="mt-3 flex items-start gap-1.5 text-[13px] text-white/55">
            <ByndIcon name="calendar" className="mt-0.5 size-3.5 shrink-0 opacity-70" />
            <span>{formatEventDateRange(event.startTime, event.endTime)}</span>
          </p>
          <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-accent">
            <ByndIcon name="pin" className="mt-0.5 size-3.5 shrink-0" />
            <span>{place}</span>
          </p>
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-sky-400 hover:underline"
          >
            <ByndIcon name="pin" className="size-3.5" />
            View on map
          </a>
          <p className="mt-4 max-w-xl text-[13px] leading-relaxed text-white/55 sm:text-sm">
            {event.description ??
              `${event.organizerName} hosts this ${event.eventType} — show up and get on the floor.`}
          </p>

          <div className="mt-5 flex flex-wrap gap-5 text-center">
            {[
              { icon: 'crew' as const, label: 'All are welcome' },
              { icon: 'floor' as const, label: 'Food & drinks' },
              { icon: 'media' as const, label: 'Photo & video allowed' },
            ].map((item) => (
              <div key={item.label} className="flex w-[5.5rem] flex-col items-center gap-1.5">
                <span className="flex size-9 items-center justify-center rounded-full border border-white/12 text-accent">
                  <ByndIcon name={item.icon} className="size-4" />
                </span>
                <span className="text-[10px] leading-tight text-white/50">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-white/[0.08] px-3 sm:px-5 lg:px-6">
        <div className="flex gap-5 overflow-x-auto">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={cn(
                'shrink-0 border-b-2 pb-2.5 text-[13px] font-medium transition-colors',
                tab === item.id
                  ? 'border-accent text-white'
                  : 'border-transparent text-white/45 hover:text-white/75',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-10 px-3 sm:px-5 lg:px-6">
        {tab === 'entry' ? (
          <section id="entry" className="space-y-4">
            <h2 className="text-[1.1rem] font-semibold text-white">Choose your category</h2>
            {!hasEntry ? (
              <p className="text-sm text-white/50">No registration needed — check the details and show up.</p>
            ) : (
              <ul className="space-y-2.5">
                {entryCategories.map((category) => {
                  const left = spotsLeft(
                    category.capacity,
                    category.confirmedCount + category.reservedCount,
                  );
                  const soldOut = category.capacity > 0 && left === 0;
                  const price = categoryPrice(category);
                  const q = getQty(category.id);
                  return (
                    <li
                      key={category.id}
                      className="flex flex-col gap-3 rounded-lg border border-white/[0.08] bg-[#121212] p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-3.5"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[#0D0E0D]">
                        <EventPoster
                          title={category.name}
                          src={category.posterUrl ?? event.posterUrl}
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-white">{category.name}</p>
                        <p className="text-[12px] text-white/45">{categorySubtitle(category)}</p>
                        <p className="mt-1 text-[13px] font-medium text-white">
                          {price === 0 ? 'Free' : formatMinorUnits(price)}
                          <span className="ml-2 text-[11px] font-normal text-white/40">
                            {soldOut ? 'Sold out' : category.capacity > 0 ? `${left} spots left` : 'Open'}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:shrink-0">
                        <div className="flex items-center rounded-md border border-white/15">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            disabled={soldOut}
                            className="flex size-9 items-center justify-center text-white/70 hover:bg-white/5 disabled:opacity-40"
                            onClick={() => setCategoryQty(category.id, q - 1)}
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-[13px] text-white">{q}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={soldOut}
                            className="flex size-9 items-center justify-center text-white/70 hover:bg-white/5 disabled:opacity-40"
                            onClick={() => setCategoryQty(category.id, q + 1)}
                          >
                            +
                          </button>
                        </div>
                        <Button
                          type="button"
                          disabled={soldOut || event.status === 'registration_closed'}
                          className="h-9 min-w-[4.5rem] rounded-md bg-accent px-4 text-[13px] font-semibold normal-case tracking-normal text-white hover:bg-accent/90"
                          onClick={() => addToCart(category)}
                        >
                          Add
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}

        {tab === 'about' ? (
          <section id="about" className="max-w-2xl space-y-3">
            <h2 className="text-[1.1rem] font-semibold text-white">About</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/55">
              {event.description ??
                `${event.organizerName} hosts this ${event.eventType} — show up and get on the floor.`}
            </p>
            <p className="text-[12px] text-white/40">Hosted by {event.organizerName}</p>
          </section>
        ) : null}

        {tab === 'updates' ? (
          <section id="updates" className="max-w-2xl space-y-4">
            <h2 className="text-[1.1rem] font-semibold text-white">Updates</h2>
            {updates.length === 0 ? (
              <p className="text-sm text-white/45">No updates yet.</p>
            ) : (
              <ul className="space-y-4">
                {updates.map((update) => (
                  <li key={update.id} className="border-b border-white/[0.08] pb-4 last:border-0">
                    {update.title ? (
                      <p className="font-semibold text-white">{update.title}</p>
                    ) : null}
                    {update.posterUrl ? (
                      <div className="mt-2 overflow-hidden rounded-lg border border-white/[0.08]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={update.posterUrl} alt="" className="max-h-80 w-full object-cover" />
                      </div>
                    ) : null}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-white/55">{update.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {tab === 'location' ? (
          <section id="location" className="space-y-3">
            <h2 className="text-[1.1rem] font-semibold text-white">Location</h2>
            <p className="text-sm text-white/55">{place}</p>
            {hasPin ? (
              <div className="overflow-hidden rounded-lg border border-white/[0.08]">
                <VenueMapView
                  lat={event.venueLatitude!}
                  lng={event.venueLongitude!}
                  venueLabel={event.venue}
                  mapClassName="h-56 rounded-none border-0 md:h-72"
                />
              </div>
            ) : (
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-[13px] text-sky-400 hover:underline"
              >
                Open in Google Maps
              </a>
            )}
          </section>
        ) : null}
      </div>

      {/* Sticky cart / register bar */}
      {hasEntry && event.status !== 'registration_closed' ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#0C0C0C]/95 backdrop-blur-md lg:left-[13.5rem] xl:left-[14.5rem]">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <ByndIcon name="tickets" className="size-5 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="truncate text-[13px] text-white">
                  {cartCount === 0 ? 'No items yet' : `${cartCount} item${cartCount === 1 ? '' : 's'}`}
                </p>
                <p className="text-[12px] text-white/50">
                  {cartCount === 0 ? 'Add a category to continue' : formatMinorUnits(cartTotal)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={viewCart}
              className="h-11 shrink-0 rounded-md bg-accent px-5 text-[13px] font-semibold normal-case tracking-normal text-white hover:bg-accent/90"
            >
              View cart
            </Button>
          </div>
        </div>
      ) : null}

      {/* Keep registration dialog listener mounted */}
      <div className="sr-only">
        <RegisterCta event={event} spotsLeft={spotsLeft(event.spotsCapacity, event.spotsConfirmed)} />
      </div>
    </div>
  );
}
