import type { Metadata } from 'next';

import { SectionPlaceholder } from '@/features/navigation/SectionPlaceholder';

export const metadata: Metadata = { title: 'Profile' };

export default function ProfilePage() {
  return (
    <SectionPlaceholder
      kicker="Phone OTP"
      title="Profile"
      body="Dancer name, crew, city, and styles attach to the Supabase phone session. Sign-in is the next auth slice."
    />
  );
}
