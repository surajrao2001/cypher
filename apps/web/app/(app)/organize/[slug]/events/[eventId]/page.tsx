import { EventEditor } from '@/features/organize/EventEditor';

export default async function EventEditPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  return <EventEditor slug={slug} eventId={eventId} />;
}
