import { EventEntryView } from '@/features/organize/EventEntryView';

export default async function EventEntryPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  return <EventEntryView slug={slug} eventId={eventId} />;
}
