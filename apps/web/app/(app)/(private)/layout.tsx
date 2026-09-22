'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { RequireAuth } from '@/features/auth/AuthGates';

/** Routes that show guest empty states instead of hard-redirecting to login. */
const SOFT_AUTH_EXACT = new Set(['/profile', '/organize']);

export default function PrivateAppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const soft = SOFT_AUTH_EXACT.has(pathname);

  if (soft) {
    return <>{children}</>;
  }

  return <RequireAuth>{children}</RequireAuth>;
}
