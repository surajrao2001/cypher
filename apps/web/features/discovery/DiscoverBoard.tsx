'use client';

import type { EventListResponse } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/features/discovery/EventCard';
import { EmptyState } from '@/features/shell/EmptyState';
import { EventTypeTabs } from '@/features/discovery/EventTypeTabs';
import { HeroCarousel } from '@/features/discovery/HeroCarousel';
import { SceneEmptyBoard } from '@/features/discovery/SceneEmptyBoard';
import { TrustBadgesFooter } from '@/features/discovery/TrustBadgesFooter';
import { CITIES } from '@/features/discovery/catalog';
import { applyDiscoverFilters, featuredForFilters } from '@/features/discovery/filter-events';
import { useDiscoverQuery } from '@/features/discovery/use-discover-query';
import { cn } from '@/lib/utils';

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
  const activeCity = filters.city && filters.city !== 'all' ? filters.city : null;

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

  const battles = filtered.filter((e) => e.eventType.toLowerCase().includes('battle'));
  const jams = filtered.filter((e) => {
    const t = e.eventType.toLowerCase();
    return t.includes('jam') || t.includes('cypher');
  });
  const battleIds = new Set(battles.map((e) => e.id));
  const jamIds = new Set(jams.map((e) => e.id));
  const rest = filtered.filter((e) => !battleIds.has(e.id) && !jamIds.has(e.id));

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:gap-10 md:px-6 md:py-8">
        <header className="space-y-5">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              The operating layer for the Indian dance scene
            </p>
            <h1 className="display-title mt-2 text-5xl md:text-7xl">Tonight starts here.</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setParams({ city: null })}
              className={cn(
                'rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
                !activeCity
                  ? 'border-accent bg-accent text-bg'
                  : 'border-border text-text-secondary hover:border-accent/40 hover:text-text-primary',
              )}
            >
              All cities
            </button>
            {CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setParams({ city })}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
                  activeCity === city
                    ? 'border-accent bg-accent text-bg'
                    : 'border-border text-text-secondary hover:border-accent/40 hover:text-text-primary',
                )}
              >
                <ByndIcon name="pin" className="size-3.5" />
                {city}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <EventTypeTabs />
          </div>
        </header>

        {featured.length > 0 ? <HeroCarousel events={featured} /> : null}

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
          <div className="space-y-10">
            {battles.length > 0 ? (
              <Section title="Battles" href={routes.events}>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {battles.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </Section>
            ) : null}
            {jams.length > 0 ? (
              <Section title="Jams & cyphers" href={routes.events}>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {jams.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </Section>
            ) : null}
            {rest.length > 0 || (battles.length === 0 && jams.length === 0) ? (
              <Section
                title={battles.length || jams.length ? 'More nights' : 'Happening soon'}
                href={routes.events}
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {(battles.length || jams.length ? rest : filtered).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </Section>
            ) : null}

            <aside className="flex flex-col gap-4 rounded-xl border border-border bg-surface px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-2xl uppercase tracking-[0.04em] text-text-primary">
                  You run the floor?
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Publish a night — registrations, passes, and door check-in in one place.
                </p>
              </div>
              <Button asChild className="rounded-full shrink-0">
                <Link href={routes.organize}>
                  Get started <span aria-hidden>→</span>
                </Link>
              </Button>
            </aside>
          </div>
        )}
      </div>
      <TrustBadgesFooter />
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
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="display-title text-3xl md:text-4xl">{title}</h2>
        <Link
          href={href}
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted hover:text-accent"
        >
          See all
        </Link>
      </div>
      {children}
    </section>
  );
}
