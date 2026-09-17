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

/** Match reference content width — do not stretch to ultra-wide. */
function DiscoverFrame({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-5 lg:px-6">{children}</div>;
}

function DiscoverHero() {
  return (
    <section className="relative overflow-hidden rounded-lg border border-white/[0.06]">
      {/* Banner is 1024×344 — keep that cinematic ratio; cover crops minimally */}
      <div className="relative aspect-[1024/344] w-full min-h-[160px] max-h-[280px] sm:min-h-[200px] sm:max-h-[300px] lg:max-h-[320px]">
        <Image
          src="/bynd8/discover-hero-banner.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover object-center"
        />
        {/* Soft left scrim so overlay copy stays readable without hiding the dancer */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent"
        />
        <div className="absolute inset-0 flex flex-col justify-end px-4 pb-4 pt-8 sm:px-6 sm:pb-5 lg:px-8 lg:pb-6">
          <h1 className="font-display max-w-[14ch] text-[1.85rem] uppercase leading-[0.88] tracking-[0.02em] text-white sm:text-[2.35rem] lg:text-[2.75rem]">
            More than events
            <br />
            <span className="text-accent">A movement</span>
          </h1>
          <p className="mt-1.5 max-w-md text-[12px] leading-snug text-white/75 sm:text-[13px]">
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
        <div className="py-6 md:py-8">
          <SceneEmptyBoard surface="discover" />
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
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
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
