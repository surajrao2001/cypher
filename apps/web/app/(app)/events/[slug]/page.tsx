import { formatEventDate, formatMinorUnits, spotsLeft } from '@cypher/utils';
import { Calendar, MapPin, Users } from 'lucide-react';
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
import { EventPoster } from '@/features/discovery/EventPoster';
import { StickyRegisterBar } from '@/features/discovery/StickyRegisterBar';
import { mockEvents, spotsTone } from '@/features/discovery/mock-events';

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = mockEvents.find((item) => item.slug === slug);
  return { title: event?.title ?? 'Event' };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = mockEvents.find((item) => item.slug === slug);
  if (!event) notFound();

  const left = spotsLeft(event.spotsCapacity, event.spotsConfirmed);
  const tone = spotsTone(event.spotsConfirmed, event.spotsCapacity);
  const price = event.priceMinor === 0 ? 'Free entry' : formatMinorUnits(event.priceMinor);
  const categoryName = `${event.styles.join(' / ')} ${event.tags.includes('2v2') ? '2v2' : '1v1'}`;

  return (
    <div className="pb-28">
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

      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-4">
            <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-text-muted">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              Venue
            </dt>
            <dd className="mt-2 font-body text-sm text-text-primary">
              {event.venue}
              <span className="mt-1 block text-text-secondary">{event.city}</span>
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-text-muted">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              Doors
            </dt>
            <dd className="mt-2 font-body text-sm text-text-primary">{formatEventDate(event.startTime)}</dd>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <dt className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-text-muted">
              <Users className="h-3.5 w-3.5 text-accent" />
              Crew
            </dt>
            <dd className="mt-2 font-body text-sm text-text-primary">{event.crew}</dd>
          </div>
        </dl>

        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
          {event.organizer} hosts this {event.eventType} on a dark floor. Category capacity is{' '}
          <span className="text-text-primary">
            {event.spotsConfirmed} confirmed / {event.spotsCapacity} total
          </span>
          . Holds sit in a separate reserved bucket so a payment timeout cannot double-count the room.
        </p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Spots left read from confirmed vs capacity — the same counters the API will own.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                <TableRow>
                  <TableCell>{categoryName}</TableCell>
                  <TableCell>{price}</TableCell>
                  <TableCell>
                    {event.spotsConfirmed} / {event.spotsCapacity}
                  </TableCell>
                  <TableCell className={tone.className}>{left}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <StickyRegisterBar event={event} spotsLeft={left} />
    </div>
  );
}
