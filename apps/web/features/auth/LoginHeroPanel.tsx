import Image from 'next/image';

import { BrandLogo } from '@/components/brand/BrandLogo';

/**
 * Desktop left panel — artwork 1024×682, width-capped, contain, right edge fades into form bg.
 */
export function LoginHeroPanel() {
  return (
    <aside className="relative hidden min-h-dvh overflow-hidden bg-[#080808] lg:flex lg:w-full lg:max-w-[40rem] lg:shrink-0 lg:flex-col xl:max-w-[44rem]">
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-8 pr-0">
        <Image
          src="/bynd8/login-hero.jpg"
          alt=""
          width={1024}
          height={682}
          priority
          sizes="(min-width: 1024px) 40rem, 100vw"
          className="h-auto w-full max-h-[min(100dvh-4rem,42rem)] object-contain"
        />
      </div>

      {/* Right dissolve into the form column */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-[42%] bg-gradient-to-r from-transparent via-[#080808]/55 to-[#080808]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-24 bg-gradient-to-r from-transparent to-[#080808]"
      />

      <div className="absolute left-5 top-5 z-10 xl:left-6 xl:top-6">
        <BrandLogo variant="lockup" size="md" href={null} priority />
        <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">
          Everything beyond the count
        </p>
      </div>
    </aside>
  );
}
