import { OrganizerPayoutsView } from '@/features/organize/OrganizerPayoutsView';

export default async function OrganizerPayoutsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <OrganizerPayoutsView slug={slug} />;
}
