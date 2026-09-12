import { redirect } from 'next/navigation';

/** Legacy Event Page route — Edit Event is the public-details surface now. */
export default async function OrganizeEventPageRedirect({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const { slug, eventId } = await params;
  redirect(`/organize/${slug}/events/${eventId}/edit`);
}
