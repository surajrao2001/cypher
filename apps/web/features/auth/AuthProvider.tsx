'use client';

import { createApiClient } from '@cypher/api-client';
import type { CurrentUserDto } from '@cypher/contracts';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const TOKEN_KEY = 'cypher.accessToken';

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

function readToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
}

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  me: CurrentUserDto | null;
  error: string | null;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  completeOnboarding: (input: {
    dancerName: string;
    city: string;
    crew?: string;
    styles?: string[];
    instagram?: string;
  }) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<CurrentUserDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl(),
        getAccessToken: readToken,
      }),
    [],
  );

  const refresh = useCallback(async () => {
    const current = readToken();
    if (!current) {
      setToken(null);
      setMe(null);
      return;
    }
    setToken(current);
    try {
      setMe(await client.me());
      setError(null);
    } catch {
      window.localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setMe(null);
    }
  }, [client]);

  useEffect(() => {
    void refresh().finally(() => setReady(true));
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      token,
      me,
      error,
      requestOtp: async (phone) => {
        setError(null);
        await client.requestOtp(phone);
      },
      verifyOtp: async (phone, code) => {
        setError(null);
        const session = await client.verifyOtp(phone, code);
        window.localStorage.setItem(TOKEN_KEY, session.accessToken);
        setToken(session.accessToken);
        setMe(await client.me());
      },
      completeOnboarding: async (input) => {
        setError(null);
        setMe(await client.completeOnboarding(input));
      },
      signOut: () => {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setMe(null);
      },
      refresh,
    }),
    [client, error, me, ready, refresh, token],
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
