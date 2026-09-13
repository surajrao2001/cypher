import { redirect } from 'next/navigation';

import { routes } from '@cypher/contracts';

/** Legacy new-event URL → V2 create flow (keeps slug host context). */
export default async function NewEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`${routes.organize}/create?host=${encodeURIComponent(slug)}`);
}
