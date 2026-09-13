'use client';

import type { EventDetailDto } from '@cypher/contracts';
import { formatMinorUnits, spotsLeft } from '@cypher/utils';

import { RegisterCta } from '@/features/discovery/RegisterCta';

interface StickyRegisterBarProps {
  event: EventDetailDto;
  spotsLeft: number;
}

export function StickyRegisterBar({ event, spotsLeft: aggregateLeft }: StickyRegisterBarProps) {
  const compete =
    event.competeCategories?.length > 0
      ? event.competeCategories
      : event.categories.filter((c) => c.entryType !== 'viewer');
  const viewers =
    event.viewerCategories?.length > 0
      ? event.viewerCategories
      : event.categories.filter((c) => c.entryType === 'viewer');
  const audienceOpen = viewers.length > 0 || event.audience?.enabled;
  const hasEntry = compete.length > 0 || audienceOpen;

  // Zero Entry: no sticky registration bar (not “Registration closed”).
  if (!hasEntry) {
    return null;
  }

  if (event.status === 'registration_closed') {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md lg:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <p className="kicker text-text-muted">Get in</p>
            <p className="truncate font-display text-2xl uppercase tracking-[0.04em] text-text-primary md:text-3xl">
              Registration closed
            </p>
            <p className="truncate text-xs text-text-secondary">Entries are no longer open</p>
          </div>
        </div>
      </div>
    );
  }

  const soldOut = aggregateLeft === 0;
  let headline: string;
  let sub: string;

  if (soldOut) {
    headline = 'Sold out';
    sub = 'No spots left';
  } else if (compete.length === 0 && audienceOpen) {
    headline = 'Watch the floor';
    const price = event.audience?.enabled
      ? event.audience.priceMinor
      : (viewers[0]?.currentPriceMinor ?? viewers[0]?.priceMinor ?? 0);
    sub = price === 0 ? 'Free audience pass' : formatMinorUnits(price);
  } else if (compete.length === 1) {
    const c = compete[0]!;
    const sell = c.currentPriceMinor ?? c.priceMinor;
    headline = sell === 0 ? 'Free entry' : formatMinorUnits(sell);
    const left = spotsLeft(c.capacity, c.confirmedCount + c.reservedCount);
    sub = `${c.name} · ${left} left${audienceOpen ? ' · audience open' : ''}`;
  } else {
    headline = `${compete.length} entries`;
    const parts = [`${aggregateLeft} spots left`];
    if (audienceOpen) parts.push('audience open');
    sub = parts.join(' · ');
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md lg:left-64">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className="kicker text-text-muted">{soldOut ? 'Full' : 'Get in'}</p>
          <p className="truncate font-display text-2xl uppercase tracking-[0.04em] text-text-primary md:text-3xl">
            {headline}
          </p>
          <p className="truncate text-xs text-text-secondary">{sub}</p>
        </div>
        <div className="shrink-0 [&_button]:rounded-full [&_a]:rounded-full">
          <RegisterCta event={event} spotsLeft={aggregateLeft} />
        </div>
      </div>
    </div>
  );
}
