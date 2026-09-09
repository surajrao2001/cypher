'use client';

import { createApiClient } from '@cypher/api-client';
import type { CurrentUserDto } from '@cypher/contracts';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { readAccessToken, writeAccessToken } from '@/lib/auth-token';
import { openOAuthPopup, waitForOAuthPopupCode } from '@/lib/oauth-popup';
import { createBrowserSupabase, type SocialProvider } from '@/lib/supabase/browser';

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  ready: boolean;
  token: string | null;
  me: CurrentUserDto | null;
  error: string | null;
  api: ReturnType<typeof createApiClient>;
  signInWithProvider: (provider: SocialProvider) => Promise<void>;
  /** Passwordless magic link — enable Email provider in Supabase Auth. */
  signInWithEmail: (email: string) => Promise<void>;
  completeOnboarding: (input: {
    dancerName: string;
    city: string;
    crew?: string;
    styles?: string[];
    instagram?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readSupabaseAccessToken(): Promise<string | null> {
  try {
    const supabase = createBrowserSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? null;
    if (token) {
      writeAccessToken(token);
    }
    return token ?? readAccessToken();
  } catch {
    return readAccessToken();
  }
}

async function refreshSupabaseAccessToken(): Promise<string | null> {
  try {
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      return null;
    }
    const token = data.session?.access_token ?? null;
    writeAccessToken(token);
    return token;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<CurrentUserDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl(),
        getAccessToken: readAccessToken,
        refreshAccessToken: refreshSupabaseAccessToken,
      }),
    [],
  );

  const applySession = useCallback(
    async (accessToken: string | null) => {
      if (!accessToken) {
        writeAccessToken(null);
        setToken(null);
        setMe(null);
        setStatus('unauthenticated');
        return;
      }

      writeAccessToken(accessToken);
      setToken(accessToken);
      try {
        const user = await client.me();
        setMe(user);
        setError(null);
        setStatus('authenticated');
      } catch (firstError) {
        const refreshed = await refreshSupabaseAccessToken();
        if (refreshed && refreshed !== accessToken) {
          writeAccessToken(refreshed);
          setToken(refreshed);
          try {
            const user = await client.me();
            setMe(user);
            setError(null);
            setStatus('authenticated');
            return;
          } catch {
            // fall through
          }
        }
        // Keep session; show error but do not bounce to login.
        setError(firstError instanceof Error ? firstError.message : 'Could not load profile');
        setMe(null);
        setStatus('authenticated');
      }
    },
    [client],
  );

  const refresh = useCallback(async () => {
    const accessToken = await readSupabaseAccessToken();
    await applySession(accessToken);
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const supabase = createBrowserSupabase();

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
          if (cancelled) {
            return;
          }
          // INITIAL_SESSION must be applied — getSession alone can race empty on cold start.
          if (event === 'SIGNED_OUT') {
            void applySession(null);
            return;
          }
          if (session?.access_token) {
            writeAccessToken(session.access_token);
            void applySession(session.access_token);
            return;
          }
          if (event === 'INITIAL_SESSION') {
            void applySession(null);
          }
        });
        unsubscribe = () => listener.subscription.unsubscribe();

        const { data } = await supabase.auth.getSession();
        if (!cancelled) {
          await applySession(data.session?.access_token ?? readAccessToken());
        }
      } catch {
        if (!cancelled) {
          await applySession(readAccessToken());
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      ready: status !== 'loading',
      token,
      me,
      error,
      api: client,
      signInWithProvider: async (provider) => {
        setError(null);
        const supabase = createBrowserSupabase();
        const next =
          typeof window !== 'undefined' ? window.sessionStorage.getItem('cypher.authNext') : null;
        const redirectTo = new URL(`${window.location.origin}/auth/callback`);
        redirectTo.searchParams.set('popup', '1');
        if (next?.startsWith('/')) {
          redirectTo.searchParams.set('next', next);
        }

        const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectTo.toString(),
            skipBrowserRedirect: true,
            queryParams: {
              prompt: 'select_account',
            },
          },
        });
        if (oauthError) {
          setError(oauthError.message);
          throw oauthError;
        }
        if (!data.url) {
          const err = new Error('No OAuth URL returned');
          setError(err.message);
          throw err;
        }

        const popup = openOAuthPopup(data.url);
        if (!popup) {
          // Popup blocked — fall back to full-tab OAuth.
          window.location.assign(data.url);
          return;
        }

        try {
          const { code } = await waitForOAuthPopupCode(popup);
          try {
            popup.close();
          } catch {
            // ignore
          }
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
            throw exchangeError;
          }
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            setError(sessionError.message);
            throw sessionError;
          }
          await applySession(sessionData.session?.access_token ?? null);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Could not complete sign-in.';
          if (message !== 'Sign-in was cancelled') {
            setError(message);
          }
          throw err instanceof Error ? err : new Error(message);
        }
      },
      signInWithEmail: async (email) => {
        setError(null);
        const trimmed = email.trim().toLowerCase();
        if (!trimmed.includes('@')) {
          const err = new Error('Enter a valid email address.');
          setError(err.message);
          throw err;
        }
        const supabase = createBrowserSupabase();
        const next =
          typeof window !== 'undefined' ? window.sessionStorage.getItem('cypher.authNext') : null;
        const redirectTo = new URL(`${window.location.origin}/auth/callback`);
        if (next?.startsWith('/')) {
          redirectTo.searchParams.set('next', next);
        }
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: trimmed,
          options: {
            emailRedirectTo: redirectTo.toString(),
            shouldCreateUser: true,
          },
        });
        if (otpError) {
          setError(otpError.message);
          throw otpError;
        }
      },
      completeOnboarding: async (input) => {
        setError(null);
        const user = await client.completeOnboarding(input);
        setMe(user);
        setStatus('authenticated');
      },
      signOut: async () => {
        try {
          const supabase = createBrowserSupabase();
          await supabase.auth.signOut();
        } catch {
          // Still clear local session.
        }
        await applySession(null);
      },
      refresh,
    }),
    [applySession, client, error, me, refresh, status, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
