import { formatEventDate, formatMinorUnits, spotsLeft } from '@cypher/utils';
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
import { RegisterCta } from '@/features/discovery/RegisterCta';
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <p className="kicker text-accent">{event.kicker}</p>
      <h1 className="display-title mt-2 text-5xl md:text-7xl">{event.title}</h1>
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
      <p className="mt-4 text-text-secondary">
        {event.venue} · {formatEventDate(event.startTime)} · {event.crew}
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Live confirmed counts against capacity. Holds sit in a separate reserved bucket on the API.
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
                <TableCell>
                  {event.styles.join(' / ')} {event.tags.includes('2v2') ? '2v2' : '1v1'}
                </TableCell>
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

      <div className="mt-6">
        <RegisterCta event={event} spotsLeft={left} />
      </div>
    </div>
  );
}
