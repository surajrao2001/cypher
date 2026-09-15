import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';

import { LoginForm } from '@/features/auth/LoginForm';
import { LoginStoryCarousel } from '@/features/auth/LoginStoryCarousel';
import { RequireGuest } from '@/features/auth/AuthGates';
import { PageLoading } from '@/features/shell/AsyncState';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
      <LoginStoryCarousel />

      <div className="relative flex min-h-dvh flex-col overflow-hidden">
        {/* Mobile: photo only in a short top strip — form sits on solid bg below */}
        <div
          aria-hidden
          className="relative h-[min(36vh,18rem)] min-h-[11rem] w-full shrink-0 lg:hidden"
        >
          <Image
            src="/login/floor-01.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-bg/35 via-transparent to-bg" />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-bg/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-accent/35" />
        </div>

        <div className="relative flex flex-1 flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,104,0,0.1),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(199,255,0,0.05),transparent_45%)] lg:bg-[radial-gradient(ellipse_at_top,rgba(255,104,0,0.08),transparent_55%)]"
          />
          <div className="relative z-10 w-full">
            <Suspense fallback={<PageLoading variant="form" label="Loading sign-in" />}>
              <RequireGuest>
                <LoginForm />
              </RequireGuest>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
