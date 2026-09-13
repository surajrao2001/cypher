'use client';

import { useParams } from 'next/navigation';

import { EventEntryView } from '@/features/organize/EventEntryView';

export default function EventEntryPage() {
  const params = useParams<{ slug: string; eventId: string }>();
  return <EventEntryView slug={params.slug} eventId={params.eventId} />;
}
