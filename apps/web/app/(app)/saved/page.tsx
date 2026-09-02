import type { Metadata } from 'next';

import { SectionPlaceholder } from '@/features/navigation/SectionPlaceholder';

export const metadata: Metadata = { title: 'Saved' };

export default function SavedPage() {
  return (
    <SectionPlaceholder
      kicker="Watchlist"
      title="Saved"
      body="Bookmark a cypher to get capacity alerts when a category drops under eight spots left."
    />
  );
}
