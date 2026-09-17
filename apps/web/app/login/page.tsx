import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';

import { LoginForm } from '@/features/auth/LoginForm';
import { LoginHeroPanel } from '@/features/auth/LoginHeroPanel';
import { RequireGuest } from '@/features/auth/AuthGates';
import { PageLoading } from '@/features/shell/AsyncState';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-[#080808] lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
      <LoginHeroPanel />

      <div className="relative flex min-h-dvh flex-col overflow-hidden">
        {/* Mobile: static hero strip (same artwork, no carousel) */}
        <div
          aria-hidden
          className="relative h-[min(34vh,16rem)] min-h-[10rem] w-full shrink-0 lg:hidden"
        >
          <Image
            src="/bynd8/login-hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_30%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#080808]" />
        </div>

        <div className="relative flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,104,0,0.08),transparent_55%)]"
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
