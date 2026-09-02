import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { EventCard } from '@/features/discovery/EventCard';
import { EmptyState } from '@/features/shell/EmptyState';
import { EventTypeTabs } from '@/features/discovery/EventTypeTabs';
import { ForYouTags } from '@/features/discovery/ForYouTags';
import { HeroCarousel } from '@/features/discovery/HeroCarousel';
import { NextUpList } from '@/features/discovery/NextUpList';
import { TrustBadgesFooter } from '@/features/discovery/TrustBadgesFooter';
import { loadEventList } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Find battles, jams, and cyphers across Mumbai, Delhi, Bengaluru, and Pune.',
};

export const dynamic = 'force-dynamic';

interface DiscoverPageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    tag?: string;
    type?: string;
  }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams;
  const catalog = await loadEventList({
    q: params.q,
    city: params.city,
    tag: params.tag,
    type: params.type,
    pageSize: 50,
  });
  const filtered = catalog.items;
  const featured = catalog.featured.length > 0 ? catalog.featured : filtered.slice(0, 3);
  const upcoming = catalog.nextUp;
  const cityLabel = params.city && params.city !== 'all' ? params.city : 'India';

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker text-accent">Cypher season ’26 · {cityLabel}</p>
            <h1 className="display-title mt-2 text-5xl md:text-7xl">Find the cipher.</h1>
            <p className="mt-3 max-w-xl text-sm text-text-secondary md:text-base">
              Battles, jams, and labs from Mumbai City Breakers, Namma Cypher, Old School Delhi, and
              Deccan Rockers. Spots are live — confirmed vs capacity, not a vanity counter.
            </p>
          </div>
          <Suspense fallback={<div className="h-10 w-80 rounded-md border border-border bg-surface" />}>
            <EventTypeTabs />
          </Suspense>
        </div>

        <HeroCarousel events={featured} />

        <Suspense fallback={<div className="h-8 rounded-md bg-surface" />}>
          <ForYouTags />
        </Suspense>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="kicker">On the floor</p>
                <h2 className="display-title mt-1 text-3xl">Upcoming battles</h2>
              </div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
              </p>
            </div>
            {filtered.length === 0 ? (
              <EmptyState
                kicker="Filters"
                title="Floor’s empty"
                body="No events match that city, tag, or search. Clear filters or pick another crew city."
              >
                <Button asChild variant="outline">
                  <Link href="/discover">Clear filters</Link>
                </Button>
              </EmptyState>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {filtered.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>
          <NextUpList events={upcoming} />
        </div>
      </div>
      <TrustBadgesFooter />
    </div>
  );
}
