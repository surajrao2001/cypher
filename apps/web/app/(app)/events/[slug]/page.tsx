import { notFound } from 'next/navigation';

import { EventDetailView } from '@/features/discovery/EventDetailView';
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

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getServerApi().getEvent(slug).catch(() => null);
  if (!event) notFound();
  return <EventDetailView event={event} />;
}
