import type { EventDetailDto } from '@cypher/contracts';
import { formatEventDateRange, formatMinorUnits, spotsLeft } from '@cypher/utils';
import type { ReactNode } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { VenueMapView } from '@/features/discovery/VenueMapView';
import { spotsTone } from '@/features/discovery/catalog';

type Props = {
  event: EventDetailDto;
};

function InsightCell({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-4">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
        {icon}
        {label}
      </p>
      <div className="mt-2 text-sm text-text-primary">{children}</div>
    </div>
  );
}

/** When / where / floor pulse / ticket insights — map lives full-width below. */
export function EventDetailMeta({ event }: Props) {
  const compete =
    event.competeCategories?.length > 0
      ? event.competeCategories
      : event.categories.filter((c) => c.entryType !== 'viewer');
  const viewers =
    event.viewerCategories?.length > 0
      ? event.viewerCategories
      : event.categories.filter((c) => c.entryType === 'viewer');

  const left = spotsLeft(event.spotsCapacity, event.spotsConfirmed);
  const tone = spotsTone(event.spotsConfirmed, event.spotsCapacity);
  const earlyBird = compete.some((c) => c.activeTierName?.toLowerCase().includes('early'));
  const hasPin = event.venueLatitude != null && event.venueLongitude != null;

  let ticketLine: string;
  if (compete.length === 0 && viewers.length === 0) {
    ticketLine = 'Categories coming soon';
  } else {
    const parts: string[] = [];
    if (compete.length === 1) {
      const c = compete[0]!;
      const price = (c.currentPriceMinor ?? c.priceMinor) === 0
        ? 'Free'
        : formatMinorUnits(c.currentPriceMinor ?? c.priceMinor);
      parts.push(`1 category · ${price}`);
    } else if (compete.length > 1) {
      parts.push(`${compete.length} categories`);
    }
    if (viewers.length > 0 || event.audience?.enabled) {
      const vPrice = event.audience?.enabled
        ? event.audience.priceMinor
        : (viewers[0]?.currentPriceMinor ?? viewers[0]?.priceMinor ?? 0);
      parts.push(
        viewers.length > 1
          ? `${viewers.length} audience passes`
          : `Audience · ${vPrice === 0 ? 'Free' : formatMinorUnits(vPrice)}`,
      );
    }
    if (earlyBird) parts.push('Early bird on');
    ticketLine = parts.join(' · ');
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InsightCell icon={<ByndIcon name="events" className="size-3.5 text-accent" />} label="When">
          <p className="font-medium leading-snug">
            {formatEventDateRange(event.startTime, event.endTime)}
          </p>
          {event.days.length > 1 ? (
            <p className="mt-1 text-xs text-text-secondary">
              {event.days.map((d) => d.label).join(' · ')}
            </p>
          ) : null}
        </InsightCell>

        <InsightCell icon={<ByndIcon name="pin" className="size-3.5 text-accent" />} label="Where">
          <p className="font-medium leading-snug">{event.venue ?? event.city}</p>
          <p className="mt-1 text-xs text-text-secondary">{event.city}</p>
        </InsightCell>

        <InsightCell icon={<ByndIcon name="crew" className="size-3.5 text-accent" />} label="Floor">
          <p className={`font-medium ${tone.className}`}>{tone.label}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {event.spotsConfirmed} confirmed
            {event.spotsCapacity > 0 ? ` · ${left} left` : ''}
            {event.crew ? ` · ${event.crew}` : ''}
          </p>
        </InsightCell>

        <InsightCell icon={<ByndIcon name="tickets" className="size-3.5 text-accent" />} label="Entry">
          <p className="font-medium leading-snug">{ticketLine}</p>
          <p className="mt-1 text-xs text-text-secondary">Hosted by {event.organizerName}</p>
        </InsightCell>
      </div>

      {hasPin ? (
        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              Venue pin
            </p>
            <p className="mt-0.5 text-sm text-text-primary">
              {event.venue ?? event.city}
              <span className="text-text-secondary"> · {event.city}</span>
            </p>
          </div>
          <VenueMapView
            lat={event.venueLatitude!}
            lng={event.venueLongitude!}
            venueLabel={event.venue}
            mapClassName="h-56 rounded-none border-0 md:h-72"
          />
        </section>
      ) : null}
    </div>
  );
}
