'use client';

import { useParams } from 'next/navigation';

import { EventUpdatesView } from '@/features/organize/EventUpdatesPanel';

export default function EventUpdatesPage() {
  const params = useParams<{ slug: string; eventId: string }>();
  return <EventUpdatesView slug={params.slug} eventId={params.eventId} />;
}
