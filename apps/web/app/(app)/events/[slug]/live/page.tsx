import { notFound } from 'next/navigation';

import { EventLiveView } from '@/features/live/EventLiveView';
import { getServerApi } from '@/lib/api';

interface EventLivePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: EventLivePageProps) {
  const { slug } = await params;
  try {
    const event = await getServerApi().getEvent(slug);
    return { title: event ? `${event.title} · Live` : 'Live' };
  } catch {
    return { title: 'Live' };
  }
}

export default async function EventLivePage({ params }: EventLivePageProps) {
  const { slug } = await params;
  const event = await getServerApi().getEvent(slug).catch(() => null);
  if (!event) notFound();
  return <EventLiveView event={event} />;
}
