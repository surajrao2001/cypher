import { EventEditor } from '@/features/organize/EventEditor';

/** New night — same stepper as edit; draft is created on first save. */
export default async function NewEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <EventEditor slug={slug} />;
}
