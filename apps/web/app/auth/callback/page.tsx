'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { writeAccessToken } from '@/lib/auth-token';
import { safeNextPath } from '@/lib/auth-routes';
import { createBrowserSupabase } from '@/lib/supabase/browser';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Finishing sign-in…');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const supabase = createBrowserSupabase();
        const code = searchParams.get('code');
        const next = safeNextPath(searchParams.get('next') ?? window.sessionStorage.getItem('cypher.authNext'));
        window.sessionStorage.removeItem('cypher.authNext');

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
          throw new Error('No session returned from Supabase');
        }

        writeAccessToken(data.session.access_token);

        if (!cancelled) {
          // Full navigation so AuthProvider rehydrates cleanly (avoids race with soft router.replace).
          window.location.assign(next);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'Sign-in failed');
          router.replace('/login');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return <p className="px-6 py-16 text-sm text-text-muted">{message}</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-sm text-text-muted">Finishing sign-in…</p>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
