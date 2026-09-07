import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProfilePanel } from '@/features/auth/ProfilePanel';

export const metadata: Metadata = { title: 'Profile' };

export default function ProfilePage() {
  return (
    <div className="px-4 py-8 md:px-8 md:py-12">
      <Suspense fallback={<p className="text-sm text-text-muted">Loading profile…</p>}>
        <ProfilePanel />
      </Suspense>
    </div>
  );
}
