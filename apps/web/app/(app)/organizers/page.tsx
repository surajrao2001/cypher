import type { Metadata } from 'next';

import { SectionPlaceholder } from '@/features/navigation/SectionPlaceholder';

export const metadata: Metadata = { title: 'Organizers' };

export default function OrganizersPage() {
  return (
    <SectionPlaceholder
      kicker="Verified crews"
      title="Organizers"
      body="Mumbai City Breakers, Namma Cypher, Old School Delhi, Deccan Rockers — organizer profiles and event creation come with the dashboard milestone."
    />
  );
}
