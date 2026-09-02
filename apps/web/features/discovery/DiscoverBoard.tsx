'use client';

import type { EventListResponse } from '@cypher/contracts';

import { Button } from '@/components/ui/button';
import { EventCard } from '@/features/discovery/EventCard';
import { EmptyState } from '@/features/shell/EmptyState';
import { EventTypeTabs } from '@/features/discovery/EventTypeTabs';
import { ForYouTags } from '@/features/discovery/ForYouTags';
import { HeroCarousel } from '@/features/discovery/HeroCarousel';
import { NextUpList } from '@/features/discovery/NextUpList';
import { TrustBadgesFooter } from '@/features/discovery/TrustBadgesFooter';
import { applyDiscoverFilters, featuredForFilters, nextUpForFilters } from '@/features/discovery/filter-events';
import { useDiscoverQuery } from '@/features/discovery/use-discover-query';

export function DiscoverBoard({ catalog }: { catalog: EventListResponse }) {
  const { searchParams, setParams } = useDiscoverQuery();
  const filters = {
    q: searchParams.get('q'),
    city: searchParams.get('city'),
    tag: searchParams.get('tag'),
    type: searchParams.get('type'),
  };
  const filtered = applyDiscoverFilters(catalog.items, filters);
  const featured = featuredForFilters(catalog.items, filters);
  const upcoming = nextUpForFilters(filtered);
  const cityLabel = filters.city && filters.city !== 'all' ? filters.city : 'India';

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
          <EventTypeTabs />
        </div>

        <HeroCarousel events={featured} />
        <ForYouTags />

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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setParams({ q: null, city: null, tag: null, type: null })}
                >
                  Clear filters
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
