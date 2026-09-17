import Image from 'next/image';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type BrandHeroBannerProps = {
  /** Desktop / laptop wide crop */
  desktopSrc: string;
  /** Phone / narrow crop — focuses subject for short bands */
  mobileSrc: string;
  priority?: boolean;
  className?: string;
  /** Extra overlay layers (scrims, HTML titles) */
  children?: ReactNode;
  /** Height band matching Discover / Events / Passes heroes */
  size?: 'banner' | 'promo';
};

/**
 * Full-bleed brand hero with separate sharp assets for mobile vs laptop.
 * Mobile image shows below `md`; desktop from `md` up.
 */
export function BrandHeroBanner({
  desktopSrc,
  mobileSrc,
  priority = false,
  className,
  children,
  size = 'banner',
}: BrandHeroBannerProps) {
  const height =
    size === 'promo'
      ? 'h-28'
      : 'h-[9.5rem] w-full sm:h-[11rem] lg:h-[12.5rem]';

  return (
    <section className={cn('relative w-full overflow-hidden', className)}>
      <div className={cn('relative w-full', height)}>
        <Image
          src={mobileSrc}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover object-center md:hidden"
        />
        <Image
          src={desktopSrc}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 1280px) 100vw, 1200px"
          className="hidden object-cover object-center md:block"
        />
        {children}
      </div>
    </section>
  );
}
