import { EventPageView } from '@/features/organize/EventPageView';

export default async function OrganizeEventPagePage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  return <EventPageView slug={slug} eventId={eventId} />;
}
