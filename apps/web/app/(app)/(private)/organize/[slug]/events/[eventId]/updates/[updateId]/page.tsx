import { EventUpdateDetailView } from '@/features/organize/EventUpdatesPanel';

export default async function EventUpdateDetailPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string; updateId: string }>;
}) {
  const { slug, eventId, updateId } = await params;
  return <EventUpdateDetailView slug={slug} eventId={eventId} updateId={updateId} />;
}
