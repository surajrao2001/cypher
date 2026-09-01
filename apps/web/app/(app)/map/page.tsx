import type { Metadata } from 'next';

import { SectionPlaceholder } from '@/features/navigation/SectionPlaceholder';

export const metadata: Metadata = { title: 'Map' };

export default function MapPage() {
  return (
    <SectionPlaceholder
      kicker="PostGIS discovery"
      title="Map"
      body="City pins and proximity search land once the NestJS events module exposes geography. Until then, filter Discover by Mumbai, Delhi, Bengaluru, or Pune."
    />
  );
}
