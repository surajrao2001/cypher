import { routes } from '@cypher/contracts';
import { formatMinorUnits, spotsLeft } from '@cypher/utils';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EventDetailMeta } from '@/features/discovery/EventDetailMeta';
import { EventMediaSection } from '@/features/discovery/EventMediaSection';
import { EventPoster } from '@/features/discovery/EventPoster';
import { StickyRegisterBar } from '@/features/discovery/StickyRegisterBar';
import { spotsTone } from '@/features/discovery/catalog';
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
    <Card>
      <CardHeader>
        <CardTitle>Updates</CardTitle>
        <CardDescription>Latest from the organizer.</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
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

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-6">
        <EventDetailMeta event={event} />

        <p className="max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
          {event.description ??
            `${event.organizerName} hosts this ${event.eventType} — show up and get on the floor.`}
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Compete</CardTitle>
            <CardDescription>
              Categories — 1v1, crew, prelims… How you enter the floor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {compete.length === 0 ? (
              <p className="text-sm text-text-muted">No compete categories yet.</p>
            ) : (
              <>
                <ul className="space-y-3 sm:hidden">
                  {compete.map((category) => {
                    const categoryLeft = spotsLeft(category.capacity, category.confirmedCount);
                    return (
                      <li
                        key={category.id}
                        className="rounded-md border border-border bg-elevated px-3 py-3"
                      >
                        <p className="font-semibold text-text-primary">{category.name}</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {categoryPriceLabel(category)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-text-muted">
                          {category.confirmedCount}/{category.capacity} confirmed · {categoryLeft}{' '}
                          left
                        </p>
                      </li>
                    );
                  })}
                </ul>
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Confirmed</TableHead>
                        <TableHead>Spots left</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compete.map((category) => {
                        const categoryLeft = spotsLeft(category.capacity, category.confirmedCount);
                        return (
                          <TableRow key={category.id}>
                            <TableCell>{category.name}</TableCell>
                            <TableCell>{categoryPriceLabel(category)}</TableCell>
                            <TableCell>
                              {category.confirmedCount} / {category.capacity}
                            </TableCell>
                            <TableCell>{categoryLeft}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {event.audience?.enabled || (event.viewerCategories?.length ?? 0) > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Viewers</CardTitle>
              <CardDescription>
                Pass for the crowd — presence without entering a category.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(event.viewerCategories?.length ?? 0) > 1 ? (
                <ul className="space-y-2">
                  {event.viewerCategories.map((v) => (
                    <li
                      key={v.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
                    >
                      <span className="font-medium text-text-primary">{v.name}</span>
                      <span className="text-text-secondary">
                        {categoryPriceLabel(v)} · {spotsLeft(v.capacity, v.confirmedCount)} left
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-text-primary">
                  {event.audience.priceMinor === 0
                    ? 'Free'
                    : formatMinorUnits(event.audience.priceMinor)}{' '}
                  · {event.audience.spotsLeft} left · {event.audience.confirmedCount}/
                  {event.audience.capacity} confirmed
                </p>
              )}
            </CardContent>
          </Card>
        ) : null}

        <EventMediaSection links={event.mediaLinks ?? []} />

        <EventUpdatesFeed updates={event.updates ?? []} />
      </div>

      <StickyRegisterBar event={event} spotsLeft={left} />
    </div>
  );
}
