import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProfilePanel } from '@/features/auth/ProfilePanel';
import { PageLoading } from '@/features/shell/AsyncState';

export const metadata: Metadata = { title: 'Profile' };

export default function ProfilePage() {
  return (
    <div className="px-4 py-8 md:px-8 md:py-12">
      <Suspense fallback={<PageLoading variant="profile" label="Loading profile" />}>
        <ProfilePanel />
      </Suspense>
    </div>
  );
}
