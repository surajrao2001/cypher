import type { Metadata } from 'next';

import { EventsBoard } from '@/features/discovery/EventsBoard';
import { loadEventList } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Events',
};

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const catalog = await loadEventList({ pageSize: 50 });
  return <EventsBoard catalog={catalog} />;
}
