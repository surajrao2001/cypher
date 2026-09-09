import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginForm } from '@/features/auth/LoginForm';
import { LoginStoryCarousel } from '@/features/auth/LoginStoryCarousel';
import { RequireGuest } from '@/features/auth/AuthGates';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
      <LoginStoryCarousel />

      <div className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-6 py-12 sm:px-10 lg:px-12 xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,104,0,0.1),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(199,255,0,0.05),transparent_45%)] lg:bg-[radial-gradient(ellipse_at_top,rgba(255,104,0,0.08),transparent_55%)]"
        />
        <div className="relative z-10 w-full">
          <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
            <RequireGuest>
              <LoginForm />
            </RequireGuest>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
