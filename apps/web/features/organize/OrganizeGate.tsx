'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { routes } from '@cypher/contracts';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/features/shell/EmptyState';
import { PageLoading } from '@/features/shell/AsyncState';
import { useAuth } from '@/features/auth/AuthProvider';
import { loginUrl } from '@/lib/auth-routes';

export function OrganizeGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return <PageLoading variant="page" label="Loading session" />;
  }

  if (auth.status !== 'authenticated' || !auth.me) {
    return (
      <EmptyState
        kicker="Organize"
        title="Sign in to run the floor"
        body="Sign in with Google or email to create an organizer. Same account — membership comes from the org you create."
      >
        <Button asChild size="lg">
          <Link href={loginUrl(routes.organize)}>
            <ByndIcon name="signIn" />
            Sign in
          </Link>
        </Button>
      </EmptyState>
    );
  }

  if (auth.me.needsOnboarding) {
    return (
      <EmptyState
        kicker="Organize"
        title="Tell us what to call you first"
        body="Drop your name and city on Profile, then come back to run a crew."
      >
        <Button asChild size="lg">
          <Link href={`${routes.profile}?next=${encodeURIComponent(routes.organize)}`}>
            <ByndIcon name="profile" />
            Open profile
          </Link>
        </Button>
      </EmptyState>
    );
  }

  return <>{children}</>;
}
