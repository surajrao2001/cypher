import { EventPeopleView } from '@/features/organize/EventPeopleView';

export default async function EventPeoplePage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  return <EventPeopleView slug={slug} eventId={eventId} />;
}
