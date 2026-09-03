import { CreateEventForm } from '@/features/organize/CreateEventForm';

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CreateEventForm slug={slug} />;
}
