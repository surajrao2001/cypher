import type { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { LoginForm } from '@/features/auth/LoginForm';
import { LoginHeroPanel } from '@/features/auth/LoginHeroPanel';
import { RequireGuest } from '@/features/auth/AuthGates';
import { PageLoading } from '@/features/shell/AsyncState';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-[#080808] lg:flex">
      <LoginHeroPanel />

      <div className="relative flex min-h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        {/*
          Mobile: no cropped top strip. Use a soft atmospheric wash of the hero
          behind the form so brand is present without fighting the layout.
        */}
        <div aria-hidden className="pointer-events-none absolute inset-0 lg:hidden">
          <Image
            src="/bynd8/login-hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_25%] opacity-[0.22]"
          />
          <div className="absolute inset-0 bg-[#080808]/82" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,104,0,0.16),transparent_55%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#080808] to-transparent" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
          <div className="mb-6 flex flex-col items-center gap-1.5 lg:hidden">
            <BrandLogo variant="lockup" size="md" href={null} priority />
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Everything beyond the count
            </p>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,104,0,0.08),transparent_55%)] lg:block"
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
