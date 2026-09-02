'use client';

import { routes } from '@cypher/contracts';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type DiscoverQueryValue = {
  searchParams: URLSearchParams;
  setParams: (patch: Record<string, string | null>) => void;
};

const DiscoverQueryContext = createContext<DiscoverQueryValue | null>(null);

function applyPatch(current: URLSearchParams, patch: Record<string, string | null>): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  return next;
}

function discoverHref(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${routes.discover}?${qs}` : routes.discover;
}

export function DiscoverQueryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const urlParams = useSearchParams();
  const [params, setParamsState] = useState(() => new URLSearchParams(urlParams.toString()));

  useEffect(() => {
    setParamsState(new URLSearchParams(urlParams.toString()));
  }, [urlParams]);

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      setParamsState((current) => {
        const next = applyPatch(current, patch);
        const href = discoverHref(next);
        if (pathname === routes.discover) {
          window.history.replaceState(window.history.state, '', href);
        } else {
          router.push(href);
        }
        return next;
      });
    },
    [pathname, router],
  );

  const value = useMemo(() => ({ searchParams: params, setParams }), [params, setParams]);

  return <DiscoverQueryContext.Provider value={value}>{children}</DiscoverQueryContext.Provider>;
}

export function useDiscoverQuery(): DiscoverQueryValue {
  const ctx = useContext(DiscoverQueryContext);
  if (!ctx) {
    throw new Error('useDiscoverQuery must be used within DiscoverQueryProvider');
  }
  return ctx;
}
