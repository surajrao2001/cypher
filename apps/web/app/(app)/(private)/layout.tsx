'use client';

import type { ReactNode } from 'react';

import { RequireAuth } from '@/features/auth/AuthGates';

export default function PrivateAppLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
