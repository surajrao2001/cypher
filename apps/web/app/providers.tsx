'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LayoutGroup } from 'framer-motion';
import { useState, type ReactNode } from 'react';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LayoutGroup id="organize-shared">{children}</LayoutGroup>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
