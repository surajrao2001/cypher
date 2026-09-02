'use client';

import type { EventCardDto } from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';

import { RegisterCta } from '@/features/discovery/RegisterCta';

interface StickyRegisterBarProps {
  event: EventCardDto;
  spotsLeft: number;
}

export function StickyRegisterBar({ event, spotsLeft }: StickyRegisterBarProps) {
  const soldOut = spotsLeft === 0;
  const price = event.priceMinor === 0 ? 'Free entry' : formatMinorUnits(event.priceMinor);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md lg:left-64">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className="kicker text-text-muted">{soldOut ? 'Category full' : 'Register'}</p>
          <p className="truncate font-display text-2xl uppercase tracking-[0.04em] text-text-primary md:text-3xl">
            {soldOut ? 'Waitlist' : price}
          </p>
        </div>
        <RegisterCta event={event} spotsLeft={spotsLeft} />
      </div>
    </div>
  );
}
