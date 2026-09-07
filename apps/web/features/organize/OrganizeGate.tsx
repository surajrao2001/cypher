'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { routes } from '@cypher/contracts';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/features/shell/EmptyState';
import { useAuth } from '@/features/auth/AuthProvider';
import { loginUrl } from '@/lib/auth-routes';

export function OrganizeGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return <p className="px-6 py-16 text-sm text-text-muted">Loading session…</p>;
  }

  if (auth.status !== 'authenticated' || !auth.me) {
    return (
      <EmptyState
        kicker="Organize"
        title="Sign in to run the floor"
        body="Sign in with Google or email to create an organizer. Same account — membership comes from the org you create."
      >
        <Button asChild size="lg">
          <Link href={loginUrl(routes.organize)}>Sign in</Link>
        </Button>
      </EmptyState>
    );
  }

  if (auth.me.needsOnboarding) {
    return (
      <EmptyState
        kicker="Organize"
        title="Finish your dancer card first"
        body="Set a dancer name and city on Profile, then come back to create an organizer."
      >
        <Button asChild size="lg">
          <Link href={`${routes.profile}?next=${encodeURIComponent(routes.organize)}`}>Open profile</Link>
        </Button>
      </EmptyState>
    );
  }

  return <>{children}</>;
}
