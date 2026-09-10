'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { loginUrl, requiresOnboardingComplete, safeNextPath } from '@/lib/auth-routes';

/** Soft placeholder — avoid full-screen takeover copy during redirects / sign-out. */
function GateQuiet() {
  return <PageLoading variant="page" className="min-h-[40vh]" label="Loading" />;
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
    return <GateQuiet />;
  }
  if (auth.status === 'unauthenticated') {
    return <GateQuiet />;
  }
  if (!auth.me) {
    if (auth.error) {
      return (
        <div className="px-4 py-8 md:px-8">
          <SoftError
            title="Couldn’t load your account"
            error={auth.error}
            onRetry={() => void auth.refresh()}
          />
        </div>
      );
    }
    return <PageLoading variant="profile" label="Loading your account" />;
  }
  const mustOnboard = requireOnboarded || requiresOnboardingComplete(pathname);
  if (mustOnboard && auth.me.needsOnboarding) {
    return <GateQuiet />;
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
    return <GateQuiet />;
  }
  if (auth.status === 'authenticated') {
    return <GateQuiet />;
  }
  return <>{children}</>;
}
