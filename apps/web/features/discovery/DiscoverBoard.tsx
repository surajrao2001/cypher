'use client';

import type { EventListResponse } from '@cypher/contracts';

import { Button } from '@/components/ui/button';
import { EventCard } from '@/features/discovery/EventCard';
import { EmptyState } from '@/features/shell/EmptyState';
import { EventTypeTabs } from '@/features/discovery/EventTypeTabs';
import { ForYouTags } from '@/features/discovery/ForYouTags';
import { HeroCarousel } from '@/features/discovery/HeroCarousel';
import { NextUpList } from '@/features/discovery/NextUpList';
import { SceneEmptyBoard } from '@/features/discovery/SceneEmptyBoard';
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
  const boardEmpty = catalog.items.length === 0;
  const filtered = applyDiscoverFilters(catalog.items, filters);
  const featured = featuredForFilters(catalog.items, filters);
  const upcoming = nextUpForFilters(filtered);
  const cityLabel = filters.city && filters.city !== 'all' ? filters.city : 'India';

  if (boardEmpty) {
    return (
      <div className="flex min-h-full flex-col">
        <div className="flex flex-1 flex-col px-4 py-6 md:px-6 md:py-8">
          <SceneEmptyBoard surface="discover" />
        </div>
        <TrustBadgesFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker text-accent">Cypher season · {cityLabel}</p>
            <h1 className="display-title mt-2 text-5xl md:text-7xl">Find the cipher.</h1>
            <p className="mt-3 max-w-xl text-sm text-text-secondary md:text-base">
              Battles, jams, and labs with live confirmed spots — not a vanity counter.
            </p>
          </div>
          <EventTypeTabs />
        </div>

        {featured.length > 0 ? <HeroCarousel events={featured} /> : null}
        <ForYouTags />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="kicker">On the floor</p>
                <h2 className="display-title mt-1 text-3xl">Upcoming battles & cyphers</h2>
              </div>
              <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
              </p>
            </div>
            {filtered.length === 0 ? (
              <EmptyState
                kicker="Filters"
                title="Nothing matches that cut"
                body="Widen the net — clear type, city, or tags and the floor comes back."
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
          {upcoming.length > 0 ? <NextUpList events={upcoming} /> : null}
        </div>
      </div>
      <TrustBadgesFooter />
    </div>
  );
}
