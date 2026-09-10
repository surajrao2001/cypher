'use client';

import { Suspense, type ReactNode } from 'react';

import { RequireAuth } from '@/features/auth/AuthGates';
import { PageLoading } from '@/features/shell/AsyncState';

export default function PrivateAppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageLoading variant="page" label="Loading session" />}>
      <RequireAuth>{children}</RequireAuth>
    </Suspense>
  );
}
