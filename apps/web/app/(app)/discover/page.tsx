import type { Metadata } from 'next';

import { DiscoverBoard } from '@/features/discovery/DiscoverBoard';
import { loadEventList } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Find battles, jams, and cyphers across Mumbai, Delhi, Bengaluru, and Pune.',
};

export default async function DiscoverPage() {
  const catalog = await loadEventList({ pageSize: 50 });
  return <DiscoverBoard catalog={catalog} />;
}
