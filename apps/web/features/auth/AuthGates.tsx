'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { loginUrl, requiresOnboardingComplete, safeNextPath } from '@/lib/auth-routes';

function GateMessage({ children }: { children: ReactNode }) {
  return <p className="px-6 py-16 text-sm text-text-muted">{children}</p>;
}

/** Blocks children until session is known; redirects anonymous users to login. */
export function RequireAuth({
  children,
  requireOnboarded = false,
}: {
  children: ReactNode;
  /** When true, send users who still need dancer onboarding to /profile. */
  requireOnboarded?: boolean;
}) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (auth.status === 'loading') {
      return;
    }
    if (auth.status === 'unauthenticated') {
      const qs = searchParams.toString();
      const next = qs ? `${pathname}?${qs}` : pathname;
      router.replace(loginUrl(next));
      return;
    }
    const mustOnboard = requireOnboarded || requiresOnboardingComplete(pathname);
    if (mustOnboard && auth.me?.needsOnboarding) {
      router.replace(`/profile?next=${encodeURIComponent(pathname)}`);
    }
  }, [auth.me?.needsOnboarding, auth.status, pathname, requireOnboarded, router, searchParams]);

  if (auth.status === 'loading') {
    return <GateMessage>Loading session…</GateMessage>;
  }
  if (auth.status === 'unauthenticated') {
    return <GateMessage>Redirecting to sign in…</GateMessage>;
  }
  if (!auth.me) {
    return (
      <GateMessage>
        {auth.error ? `Signed in, but profile failed to load: ${auth.error}` : 'Loading your account…'}
      </GateMessage>
    );
  }
  const mustOnboard = requireOnboarded || requiresOnboardingComplete(pathname);
  if (mustOnboard && auth.me.needsOnboarding) {
    return <GateMessage>Finish your dancer card first…</GateMessage>;
  }
  return <>{children}</>;
}

/** For /login — bounce signed-in users into the app. */
export function RequireGuest({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (auth.status !== 'authenticated') {
      return;
    }
    const next = safeNextPath(searchParams.get('next'), auth.me?.needsOnboarding ? '/profile' : '/discover');
    router.replace(next);
  }, [auth.me?.needsOnboarding, auth.status, router, searchParams]);

  if (auth.status === 'loading') {
    return <GateMessage>Loading session…</GateMessage>;
  }
  if (auth.status === 'authenticated') {
    return <GateMessage>Already signed in…</GateMessage>;
  }
  return <>{children}</>;
}
