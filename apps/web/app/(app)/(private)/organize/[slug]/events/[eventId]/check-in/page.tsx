import { CheckInPanel } from '@/features/organize/CheckInPanel';

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  return <CheckInPanel slug={slug} eventId={eventId} />;
}
