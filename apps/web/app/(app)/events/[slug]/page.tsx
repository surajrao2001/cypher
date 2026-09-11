import { routes } from '@cypher/contracts';
import { formatMinorUnits, spotsLeft } from '@cypher/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EventDetailMeta } from '@/features/discovery/EventDetailMeta';
import { EventMediaSection } from '@/features/discovery/EventMediaSection';
import { EventPoster } from '@/features/discovery/EventPoster';
import { StickyRegisterBar } from '@/features/discovery/StickyRegisterBar';
import { spotsTone } from '@/features/discovery/catalog';
import { EmptyState } from '@/features/shell/EmptyState';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { getServerApi } from '@/lib/api';

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: EventDetailPageProps) {
  const { slug } = await params;
  try {
    const event = await getServerApi().getEvent(slug);
    return { title: event?.title ?? 'Event' };
  } catch {
    return { title: 'Event' };
  }
}

function categoryPriceLabel(category: {
  priceMinor: number;
  currentPriceMinor: number;
  activeTierName: string | null;
}) {
  const sell = category.currentPriceMinor ?? category.priceMinor;
  const price = sell === 0 ? 'Free' : formatMinorUnits(sell);
  if (category.activeTierName) {
    return `${price} · ${category.activeTierName}`;
  }
  return price;
}

function EventUpdatesFeed({
  updates,
}: {
  updates: Array<{
    id: string;
    title: string | null;
    body: string;
    posterUrl: string | null;
  }>;
}) {
  if (updates.length === 0) return null;
  return (
    <section className="space-y-4">
      <div>
        <p className="kicker text-accent">From the floor</p>
        <h2 className="display-title mt-1 text-3xl">Updates</h2>
      </div>
      <ul className="space-y-4">
        {updates.map((update) => (
          <li key={update.id} className="border-b border-border pb-4 last:border-0">
            {update.title ? <p className="font-semibold text-text-primary">{update.title}</p> : null}
            {update.posterUrl ? (
              <div className="mt-2 overflow-hidden rounded-md border border-border bg-elevated">
                <img src={update.posterUrl} alt="" className="max-h-96 w-full object-cover" />
              </div>
            ) : null}
            <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">{update.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategoryRow({
  name,
  price,
  confirmed,
  capacity,
}: {
  name: string;
  price: string;
  confirmed: number;
  capacity: number;
}) {
  const left = spotsLeft(capacity, confirmed);
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-3 last:border-0">
      <div className="min-w-0">
        <p className="font-display text-xl uppercase tracking-[0.04em] text-text-primary">{name}</p>
        <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-text-muted">
          {confirmed}/{capacity} confirmed · {left} left
        </p>
      </div>
      <p className="text-sm font-semibold text-text-primary">{price}</p>
    </li>
  );
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getServerApi().getEvent(slug).catch(() => null);
  if (!event) notFound();

  const left = spotsLeft(event.spotsCapacity, event.spotsConfirmed);
  const tone = spotsTone(event.spotsConfirmed, event.spotsCapacity);
  const compete =
    event.competeCategories?.length > 0
      ? event.competeCategories
      : event.categories.filter((c) => c.entryType !== 'viewer');
  const viewers =
    event.viewerCategories?.length > 0
      ? event.viewerCategories
      : event.categories.filter((c) => c.entryType === 'viewer');
  const viewersOpen = viewers.length > 0 || event.audience?.enabled;

  return (
    <div className="pb-28">
      <div className="mx-auto max-w-4xl px-4 pt-4 md:px-6">
        <PageBreadcrumb
          items={[
            { label: 'Discover', href: routes.discover },
            { label: event.title },
          ]}
        />
      </div>
      <div className="relative min-h-[18rem] overflow-hidden border-b border-border md:min-h-[26rem]">
        <EventPoster title={event.title} src={event.posterUrl} priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[18rem] max-w-4xl flex-col justify-end px-4 py-8 md:min-h-[26rem] md:px-6">
          <p className="kicker text-accent">{event.kicker}</p>
          <h1 className="display-title mt-2 max-w-3xl text-5xl md:text-7xl">{event.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {event.styles.map((style) => (
              <Badge key={style} variant="lime">
                {style}
              </Badge>
            ))}
            <Badge variant="outline">{event.city}</Badge>
            <span className={`text-xs font-semibold uppercase tracking-[0.14em] ${tone.className}`}>
              {tone.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 md:px-6">
        <EventDetailMeta event={event} />

        <p className="max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
          {event.description ??
            `${event.organizerName} hosts this ${event.eventType} — show up and get on the floor.`}
        </p>

        <section className="space-y-3">
          <div>
            <p className="kicker text-accent">Compete</p>
            <h2 className="display-title mt-1 text-3xl">Enter the floor</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Pick a category — 1v1, crew, open… Use Register below to lock a spot.
            </p>
          </div>
          {compete.length === 0 ? (
            <EmptyState
              kicker="Categories"
              title="No compete categories yet"
              body={
                viewersOpen
                  ? 'This night is watch-only for now — grab an audience pass below.'
                  : 'The organizer hasn’t opened compete entries. Check back, or browse other nights.'
              }
              className="py-8 md:py-10"
            >
              <Button asChild variant="outline">
                <Link href={routes.discover}>Browse Discover</Link>
              </Button>
            </EmptyState>
          ) : (
            <ul className="rounded-lg border border-border bg-surface px-4">
              {compete.map((category) => (
                <CategoryRow
                  key={category.id}
                  name={category.name}
                  price={categoryPriceLabel(category)}
                  confirmed={category.confirmedCount}
                  capacity={category.capacity}
                />
              ))}
            </ul>
          )}
        </section>

        {viewersOpen ? (
          <section className="space-y-3">
            <div>
              <p className="kicker text-accent">Watch</p>
              <h2 className="display-title mt-1 text-3xl">Audience pass</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Presence without entering a category — still a real pass at the door.
              </p>
            </div>
            <ul className="rounded-lg border border-border bg-surface px-4">
              {(viewers.length > 0
                ? viewers
                : [
                    {
                      id: 'audience',
                      name: event.audience.name || 'Audience',
                      priceMinor: event.audience.priceMinor,
                      currentPriceMinor: event.audience.priceMinor,
                      activeTierName: null as string | null,
                      confirmedCount: event.audience.confirmedCount,
                      capacity: event.audience.capacity,
                    },
                  ]
              ).map((v) => (
                <CategoryRow
                  key={v.id}
                  name={v.name}
                  price={categoryPriceLabel(v)}
                  confirmed={v.confirmedCount}
                  capacity={v.capacity}
                />
              ))}
            </ul>
          </section>
        ) : null}

        <EventMediaSection links={event.mediaLinks ?? []} />

        <EventUpdatesFeed updates={event.updates ?? []} />
      </div>

      <StickyRegisterBar event={event} spotsLeft={left} />
    </div>
  );
}
