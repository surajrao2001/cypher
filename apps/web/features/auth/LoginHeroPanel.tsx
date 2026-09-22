import Image from 'next/image';

import { BrandLogo } from '@/components/brand/BrandLogo';

/**
 * Desktop left panel — full viewport height cover art + HTML copy overlays (no baked logos).
 */
export function LoginHeroPanel() {
  return (
    <aside className="relative hidden min-h-dvh overflow-hidden bg-[#080808] lg:flex lg:w-full lg:max-w-[40rem] lg:shrink-0 lg:flex-col xl:max-w-[44rem]">
      <Image
        src="/bynd8/login-hero-desktop-v4.jpg"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 44rem, 100vw"
        className="object-cover object-[center_30%]"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[4] h-32 bg-gradient-to-b from-[#080808]/80 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-40 bg-gradient-to-t from-[#080808]/70 via-[#080808]/25 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-[45%] bg-gradient-to-r from-transparent via-[#080808]/50 to-[#080808]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-20 bg-gradient-to-r from-transparent to-[#080808]"
      />

      <div className="absolute left-5 top-5 z-10 xl:left-6 xl:top-6">
        <BrandLogo variant="lockup" size="md" href={null} priority />
        <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55">
          Everything beyond the count
        </p>
      </div>

      <div className="absolute bottom-10 left-5 z-10 max-w-[16rem] xl:bottom-12 xl:left-6">
        <p className="font-display text-[2.1rem] uppercase leading-[0.88] tracking-[0.02em] text-white xl:text-[2.35rem]">
          More than events
        </p>
        <p className="mt-1 font-display text-[1.85rem] uppercase leading-[0.88] tracking-[0.02em] text-accent xl:text-[2.1rem]">
          A movement
        </p>
        <div aria-hidden className="mt-2 h-1 w-24 -skew-x-12 bg-accent" />
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
          Dance / Music / People / Culture
        </p>
        <p className="mt-5 text-[13px] italic text-white/75">People. Events. Beyond.</p>
      </div>
    </aside>
  );
}
