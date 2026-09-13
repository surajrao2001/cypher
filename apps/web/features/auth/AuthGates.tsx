'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { loginUrl, requiresOnboardingComplete, safeNextPath } from '@/lib/auth-routes';

/** Soft placeholder — avoid full-screen takeover copy during redirects / sign-out. */
function GateQuiet() {
  return <PageLoading variant="page" className="min-h-[40vh]" label="Loading" />;
}

function currentNextPath(pathname: string): string {
  if (typeof window === 'undefined') return pathname;
  return `${window.location.pathname}${window.location.search}`;
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

  useEffect(() => {
    if (auth.status === 'loading') {
      return;
    }
    if (auth.status === 'unauthenticated') {
      // Avoid useSearchParams — it forces Suspense fallback flashes on soft navigations.
      router.replace(loginUrl(currentNextPath(pathname)));
      return;
    }
    const mustOnboard = requireOnboarded || requiresOnboardingComplete(pathname);
    if (mustOnboard && auth.me?.needsOnboarding) {
      router.replace(`/profile?next=${encodeURIComponent(pathname)}`);
    }
  }, [auth.me?.needsOnboarding, auth.status, pathname, requireOnboarded, router]);

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

  useEffect(() => {
    if (auth.status !== 'authenticated') {
      return;
    }
    const nextParam =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('next')
        : null;
    const next = safeNextPath(nextParam, auth.me?.needsOnboarding ? '/profile' : '/discover');
    router.replace(next);
  }, [auth.me?.needsOnboarding, auth.status, router]);

  if (auth.status === 'loading') {
    return <GateQuiet />;
  }
  if (auth.status === 'authenticated') {
    return <GateQuiet />;
  }
  return <>{children}</>;
}
