'use client';

import { Suspense, type ReactNode } from 'react';

import { RequireAuth } from '@/features/auth/AuthGates';

export default function PrivateAppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-sm text-text-muted">Loading session…</p>}>
      <RequireAuth>{children}</RequireAuth>
    </Suspense>
  );
}
