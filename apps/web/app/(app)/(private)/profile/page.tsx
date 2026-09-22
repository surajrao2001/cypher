import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProfilePanel } from '@/features/auth/ProfilePanel';
import { PageLoading } from '@/features/shell/AsyncState';

export const metadata: Metadata = { title: 'Profile' };

export default function ProfilePage() {
  return (
    <div className="pb-8 pt-2 md:pb-12 md:pt-3">
      <Suspense fallback={<PageLoading variant="profile" label="Loading profile" />}>
        <ProfilePanel />
      </Suspense>
    </div>
  );
}
