import { createApiClient, type CypherApiClient } from '@cypher/api-client';
import type { CurrentUserDto } from '@cypher/contracts';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiBaseUrl } from '@/lib/api';

type AuthContextValue = {
  token: string | null;
  me: CurrentUserDto | null;
  api: CypherApiClient;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

let memoryToken: string | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
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

  const refresh = useCallback(async () => {
    if (!memoryToken) {
      setToken(null);
      setMe(null);
      return;
    }
    setToken(memoryToken);
    try {
      setMe(await api.me());
    } catch {
      memoryToken = null;
      setToken(null);
      setMe(null);
    }
  }, [api]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      me,
      api,
      requestOtp: async (phone) => {
        await api.requestOtp(phone);
      },
      verifyOtp: async (phone, code) => {
        const session = await api.verifyOtp(phone, code);
        memoryToken = session.accessToken;
        setToken(session.accessToken);
        setMe(await api.me());
      },
      signOut: () => {
        memoryToken = null;
        setToken(null);
        setMe(null);
      },
      refresh,
    }),
    [api, me, refresh, token],
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
