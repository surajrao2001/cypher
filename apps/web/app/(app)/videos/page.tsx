import type { Metadata } from 'next';

import { SectionPlaceholder } from '@/features/navigation/SectionPlaceholder';

export const metadata: Metadata = { title: 'Videos' };

export default function VideosPage() {
  return (
    <SectionPlaceholder
      kicker="Archive"
      title="Videos"
      body="Unlisted YouTube recaps — highlights, battles, workshops, interviews — attach to each event after the floor closes."
    />
  );
}
