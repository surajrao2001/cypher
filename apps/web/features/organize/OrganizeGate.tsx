'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { routes } from '@cypher/contracts';

import { Button } from '@/components/ui/button';
import { DancerEmptyState } from '@/features/shell/DancerEmptyState';
import { PageLoading } from '@/features/shell/AsyncState';
import { useAuth } from '@/features/auth/AuthProvider';

export function OrganizeGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return <PageLoading variant="page" label="Loading session" />;
  }

  if (auth.status !== 'authenticated' || !auth.me) {
    return <DancerEmptyState variant="organizeGuest" />;
  }

  if (auth.me.needsOnboarding) {
    return (
      <DancerEmptyState
        variant="profileSetup"
        actions={
          <Button
            asChild
            className="h-11 rounded-md bg-accent px-6 text-[13px] font-semibold normal-case tracking-normal text-white hover:bg-accent-hover"
          >
            <Link href={`${routes.profile}?next=${encodeURIComponent(routes.organize)}`}>
              Complete Profile
            </Link>
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
