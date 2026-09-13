'use client';

import { useParams } from 'next/navigation';

import { EventPeopleView } from '@/features/organize/EventPeopleView';

export default function EventPeoplePage() {
  const params = useParams<{ slug: string; eventId: string }>();
  return <EventPeopleView slug={params.slug} eventId={params.eventId} />;
}
