import { EventUpdatesView } from '@/features/organize/EventUpdatesPanel';

export default async function EventUpdatesPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  return <EventUpdatesView slug={slug} eventId={eventId} />;
}
