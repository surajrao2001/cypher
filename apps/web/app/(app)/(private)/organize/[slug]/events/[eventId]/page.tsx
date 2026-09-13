'use client';

import { useParams } from 'next/navigation';

import { EventManageView } from '@/features/organize/EventManageView';

export default function EventManagePage() {
  const params = useParams<{ slug: string; eventId: string }>();
  return <EventManageView slug={params.slug} eventId={params.eventId} />;
}
