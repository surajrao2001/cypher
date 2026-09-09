import { EventManageView } from '@/features/organize/EventManageView';

export default async function EventManagePage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  return <EventManageView slug={slug} eventId={eventId} />;
}
