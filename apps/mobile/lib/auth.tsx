import { createApiClient, type CypherApiClient } from '@cypher/api-client';
import type { CurrentUserDto } from '@cypher/contracts';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiBaseUrl } from '@/lib/api';
import { createMobileSupabase, oauthRedirectUri, type SocialProvider } from '@/lib/supabase';

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  me: CurrentUserDto | null;
  api: CypherApiClient;
  signInWithProvider: (provider: SocialProvider) => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

let memoryToken: string | null = null;

async function createSessionFromUrl(url: string): Promise<string | null> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    throw new Error(errorCode);
  }

  const supabase = createMobileSupabase();
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  const code = params.code;

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      throw error;
    }
    return data.session?.access_token ?? accessToken;
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
    return data.session?.access_token ?? null;
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(memoryToken);
  const [me, setMe] = useState<CurrentUserDto | null>(null);

  const api = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl(),
        getAccessToken: () => memoryToken,
      }),
    [],
  );

  const loadMe = useCallback(
    async (accessToken: string | null) => {
      memoryToken = accessToken;
      if (!accessToken) {
        setToken(null);
        setMe(null);
        return;
      }
      setToken(accessToken);
      try {
        setMe(await api.me());
      } catch {
        memoryToken = null;
        setToken(null);
        setMe(null);
      }
    },
    [api],
  );

  const refresh = useCallback(async () => {
    try {
      const supabase = createMobileSupabase();
      const { data } = await supabase.auth.getSession();
      await loadMe(data.session?.access_token ?? null);
    } catch {
      await loadMe(memoryToken);
    }
  }, [loadMe]);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const supabase = createMobileSupabase();
        const { data } = await supabase.auth.getSession();
        if (!cancelled) {
          await loadMe(data.session?.access_token ?? null);
        }

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          void loadMe(session?.access_token ?? null);
        });
        unsubscribe = () => listener.subscription.unsubscribe();
      } catch {
        if (!cancelled) {
          await loadMe(null);
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();

    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      void createSessionFromUrl(url)
        .then((accessToken) => {
          if (accessToken) {
            return loadMe(accessToken);
          }
        })
        .catch(() => {
          // Ignore malformed deep links.
        });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
      linkingSub.remove();
    };
  }, [loadMe]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      token,
      me,
      api,
      signInWithProvider: async (provider) => {
        const supabase = createMobileSupabase();
        const redirectTo = oauthRedirectUri();
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });
        if (error) {
          throw error;
        }
        if (!data.url) {
          throw new Error('No OAuth URL returned');
        }

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type !== 'success' || !('url' in result) || !result.url) {
          throw new Error('Sign-in was cancelled');
        }

        const accessToken = await createSessionFromUrl(result.url);
        if (!accessToken) {
          throw new Error('No session returned from OAuth');
        }
        await loadMe(accessToken);
      },
      signInWithEmail: async (email) => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed.includes('@')) {
          throw new Error('Enter a valid email address.');
        }
        const supabase = createMobileSupabase();
        const redirectTo = oauthRedirectUri();
        const { error } = await supabase.auth.signInWithOtp({
          email: trimmed,
          options: {
            emailRedirectTo: redirectTo,
            shouldCreateUser: true,
          },
        });
        if (error) {
          throw error;
        }
      },
      signOut: async () => {
        try {
          const supabase = createMobileSupabase();
          await supabase.auth.signOut();
        } catch {
          // Still clear local session.
        }
        await loadMe(null);
      },
      refresh,
    }),
    [api, loadMe, me, ready, refresh, token],
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
