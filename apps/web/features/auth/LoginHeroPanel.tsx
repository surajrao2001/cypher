import Image from 'next/image';

import { BrandLogo } from '@/components/brand/BrandLogo';

/**
 * Static cinematic left panel for login — supplied BYND8 hero artwork (no carousel).
 */
export function LoginHeroPanel() {
  return (
    <aside className="relative hidden min-h-dvh overflow-hidden bg-[#080808] lg:block">
      <Image
        src="/bynd8/login-hero.jpg"
        alt=""
        fill
        priority
        sizes="55vw"
        className="object-cover object-center"
      />
      {/* Soft edges so the panel meets the form column cleanly */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30"
      />

      <div className="absolute left-6 top-6 z-10 xl:left-8 xl:top-8">
        <BrandLogo variant="lockup" size="md" href={null} priority />
        <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">
          Everything beyond the count
        </p>
      </div>
    </aside>
  );
}
