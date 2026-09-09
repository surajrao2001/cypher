'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { writeAccessToken } from '@/lib/auth-token';
import { safeNextPath } from '@/lib/auth-routes';
import { postOAuthPopupResult } from '@/lib/oauth-popup';
import { createBrowserSupabase } from '@/lib/supabase/browser';

function AuthCallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-5 overflow-hidden bg-bg px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,104,0,0.12),transparent_55%)]"
      />
      <BrandLogo variant="mark" size="lg" href={null} priority />
      <p className="relative z-10 text-sm text-text-muted">{children}</p>
    </div>
  );
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const code = searchParams.get('code');
        const asPopup = searchParams.get('popup') === '1' || Boolean(window.opener);
        const next = safeNextPath(
          searchParams.get('next') ?? window.sessionStorage.getItem('cypher.authNext'),
        );
        window.sessionStorage.removeItem('cypher.authNext');

        // Popup flow: send code to opener so PKCE verifier stays in the parent tab.
        if (asPopup && code && window.opener && !window.opener.closed) {
          postOAuthPopupResult({ type: 'bynd8:oauth', ok: true, code, next });
          if (!cancelled) {
            setMessage('You can close this window.');
          }
          window.setTimeout(() => {
            try {
              window.close();
            } catch {
              // Browser may block; parent closes it after exchange.
            }
          }, 50);
          return;
        }

        const supabase = createBrowserSupabase();

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          throw error;
        }
        if (!data.session?.access_token) {
          throw new Error('Sign-in did not complete. Try again from the sign-in page.');
        }

        writeAccessToken(data.session.access_token);

        if (!cancelled) {
          window.location.assign(next);
        }
      } catch (error) {
        const friendly =
          error instanceof Error && !/pkce|verifier|code challenge/i.test(error.message)
            ? error.message
            : 'Sign-in did not complete. Try again.';

        if (searchParams.get('popup') === '1' || window.opener) {
          postOAuthPopupResult({ type: 'bynd8:oauth', ok: false, error: friendly });
          try {
            window.close();
          } catch {
            // ignore
          }
        }

        if (!cancelled) {
          setMessage(friendly);
          router.replace('/login');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return <AuthCallbackShell>{message}</AuthCallbackShell>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackShell>Signing you in…</AuthCallbackShell>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
