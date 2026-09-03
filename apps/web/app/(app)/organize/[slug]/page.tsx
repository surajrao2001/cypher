import { OrganizerDashboard } from '@/features/organize/OrganizerDashboard';

export default async function OrganizerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <OrganizerDashboard slug={slug} />;
}
