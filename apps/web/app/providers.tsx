'use client';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
