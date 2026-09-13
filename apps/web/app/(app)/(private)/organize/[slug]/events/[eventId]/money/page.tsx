'use client';

import { useParams } from 'next/navigation';

import { EventMoneyView } from '@/features/organize/EventMoneyPanel';

export default function EventMoneyPage() {
  const params = useParams<{ slug: string; eventId: string }>();
  return <EventMoneyView slug={params.slug} eventId={params.eventId} />;
}
