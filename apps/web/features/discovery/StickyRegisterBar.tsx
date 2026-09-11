'use client';

import type { EventDetailDto } from '@cypher/contracts';
import { formatMinorUnits, spotsLeft } from '@cypher/utils';

import { RegisterCta } from '@/features/discovery/RegisterCta';

interface StickyRegisterBarProps {
  event: EventDetailDto;
  spotsLeft: number;
}

export function StickyRegisterBar({ event, spotsLeft: aggregateLeft }: StickyRegisterBarProps) {
  const soldOut = aggregateLeft === 0;
  const compete =
    event.competeCategories?.length > 0
      ? event.competeCategories
      : event.categories.filter((c) => c.entryType !== 'viewer');
  const viewers =
    event.viewerCategories?.length > 0
      ? event.viewerCategories
      : event.categories.filter((c) => c.entryType === 'viewer');
  const viewersOpen = viewers.length > 0 || event.audience?.enabled;

  let headline: string;
  let sub: string;

  if (soldOut) {
    headline = 'Sold out';
    sub = 'No spots left across categories';
  } else if (compete.length === 0 && viewersOpen) {
    headline = 'Viewers open';
    const price = event.audience?.enabled
      ? event.audience.priceMinor
      : (viewers[0]?.currentPriceMinor ?? viewers[0]?.priceMinor ?? 0);
    sub = price === 0 ? 'Free pass' : formatMinorUnits(price);
  } else if (compete.length === 1) {
    const c = compete[0]!;
    const sell = c.currentPriceMinor ?? c.priceMinor;
    headline = sell === 0 ? 'Free entry' : formatMinorUnits(sell);
    const left = spotsLeft(c.capacity, c.confirmedCount + c.reservedCount);
    sub = `${c.name} · ${left} left${viewersOpen ? ' · viewers too' : ''}`;
  } else {
    headline = `${compete.length} categories`;
    const parts = [`${aggregateLeft} spots left`];
    if (viewersOpen) parts.push('viewers open');
    sub = parts.join(' · ');
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md lg:left-64">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className="kicker text-text-muted">{soldOut ? 'Category full' : 'Get in'}</p>
          <p className="truncate font-display text-2xl uppercase tracking-[0.04em] text-text-primary md:text-3xl">
            {headline}
          </p>
          <p className="truncate text-xs text-text-secondary">{sub}</p>
        </div>
        <RegisterCta event={event} spotsLeft={aggregateLeft} />
      </div>
    </div>
  );
}
