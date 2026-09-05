import type { Metadata } from 'next';

import { SectionPlaceholder } from '@/features/navigation/SectionPlaceholder';

export const metadata: Metadata = { title: 'Videos' };

export default function VideosPage() {
  return (
    <SectionPlaceholder
      kicker="Archive"
      title="Videos"
      body="Organizers share YouTube, Instagram, or Drive links on each event. A curated archive is not live yet — start from Discover or an event page."
    />
  );
}
