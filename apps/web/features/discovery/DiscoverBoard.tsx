'use client';

import type { EventListResponse } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { EventCard } from '@/features/discovery/EventCard';
import { applyDiscoverFilters } from '@/features/discovery/filter-events';
import { useDiscoverQuery } from '@/features/discovery/use-discover-query';
import { EmptyState } from '@/features/shell/EmptyState';
import { SceneEmptyBoard } from '@/features/discovery/SceneEmptyBoard';
import { cn } from '@/lib/utils';

const TYPE_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'battle', label: 'Battle' },
  { value: 'jam', label: 'Jam / Cypher' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'session', label: 'Session' },
] as const;

/** Full-bleed within the main pane (aligns with top bar padding). */
function DiscoverFrame({ children }: { children: ReactNode }) {
  return <div className="w-full px-3 sm:px-5 md:px-5 lg:px-6">{children}</div>;
}

function DiscoverHero() {
  /* Banner 1024×344 — short band; bottom fades into page bg so it merges */
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative h-[9.5rem] w-full sm:h-[11rem] lg:h-[12.5rem]">
        <Image
          src="/bynd8/discover-hero-banner.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1200px"
          className="object-cover object-center"
        />
        {/* Left scrim for copy */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent"
        />
        {/* Bottom dissolve into page */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[#080808] via-[#080808]/75 to-transparent"
        />
        <div className="absolute inset-0 flex flex-col items-start justify-center px-4 pb-2 pt-2 text-left sm:px-6 lg:px-8">
          <h1 className="font-display max-w-[14ch] text-[1.45rem] uppercase leading-[0.88] tracking-[0.02em] text-white sm:text-[1.85rem] lg:text-[2.15rem]">
            More than events
            <br />
            <span className="text-accent">A movement</span>
          </h1>
          <p className="mt-1 max-w-md text-left text-[11px] leading-snug text-white/75 sm:text-[12px]">
            Battles. Jams. Workshops. People. Culture.
          </p>
        </div>
      </div>
    </section>
  );
}

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
  const activeCity = filters.city && filters.city !== 'all' ? filters.city : null;
  const activeType = filters.type && filters.type !== 'all' ? filters.type : 'all';

  if (boardEmpty) {
    return (
      <DiscoverFrame>
        <div className="w-full py-6 md:py-8">
          <SceneEmptyBoard surface="discover" className="mx-0 max-w-none" />
        </div>
      </DiscoverFrame>
    );
  }

  const featured = filtered.slice(0, 6);
  const trending = filtered.slice(6, 12);
  const more = filtered.slice(12);

  return (
    <DiscoverFrame>
      <div className="flex flex-col gap-4 py-4 sm:gap-5 sm:py-5">
        <DiscoverHero />

        <div className="flex flex-wrap gap-2">
          {TYPE_CHIPS.map((chip) => {
            const selected = activeType === chip.value || (chip.value === 'all' && !filters.type);
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setParams({ type: chip.value === 'all' ? null : chip.value })}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[12px] font-medium tracking-[0.01em] transition-colors',
                  selected
                    ? 'border-accent text-accent'
                    : 'border-white/15 bg-transparent text-white/70 hover:border-white/30 hover:text-white',
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {activeCity ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
            Showing · {activeCity}
            <button
              type="button"
              className="ml-2 text-accent hover:underline"
              onClick={() => setParams({ city: null })}
            >
              Clear
            </button>
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState
            kicker="Filters"
            title="Nothing matches that cut"
            body="Widen the net — clear type, city, or tags and the floor comes back."
          >
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setParams({ q: null, city: null, tag: null, type: null })}
            >
              Clear filters
            </Button>
          </EmptyState>
        ) : (
          <div className="space-y-7 sm:space-y-8">
            <Section title="Featured events" href={routes.events}>
              <PosterGrid>
                {featured.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </PosterGrid>
            </Section>

            {trending.length > 0 ? (
              <Section title="Trending" href={routes.events}>
                <PosterGrid>
                  {trending.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </PosterGrid>
              </Section>
            ) : null}

            {more.length > 0 ? (
              <Section title="More nights" href={routes.events}>
                <PosterGrid>
                  {more.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </PosterGrid>
              </Section>
            ) : null}
          </div>
        )}
      </div>
    </DiscoverFrame>
  );
}

function PosterGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {children}
    </div>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-[1.05rem] font-semibold tracking-[-0.01em] text-white sm:text-[1.15rem]">
          {title}
        </h2>
        <Link href={href} className="text-[12px] font-medium text-accent hover:underline">
          View all →
        </Link>
      </div>
      {children}
    </section>
  );
}
