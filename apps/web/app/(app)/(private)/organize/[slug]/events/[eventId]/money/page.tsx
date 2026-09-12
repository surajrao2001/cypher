import { EventMoneyView } from '@/features/organize/EventMoneyPanel';

export default async function EventMoneyPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  return <EventMoneyView slug={slug} eventId={eventId} />;
}
