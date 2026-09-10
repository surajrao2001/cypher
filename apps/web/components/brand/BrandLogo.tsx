import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { routes } from '@cypher/contracts';

type BrandLogoProps = {
  className?: string;
  /** mark = monogram only; lockup = horizontal mark + word; wordmark = text logo */
  variant?: 'mark' | 'lockup' | 'wordmark';
  href?: string | null;
  priority?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'hero';
};

const sizeClass = {
  sm: { mark: 'h-7 w-7', lockup: 'h-7 w-auto', wordmark: 'h-5 w-auto' },
  md: { mark: 'h-9 w-9', lockup: 'h-9 w-auto', wordmark: 'h-6 w-auto' },
  lg: { mark: 'h-12 w-12', lockup: 'h-11 w-auto', wordmark: 'h-8 w-auto' },
  hero: { mark: 'h-16 w-16', lockup: 'h-14 w-auto', wordmark: 'h-10 w-auto' },
} as const;

const src = {
  mark: '/brand/bynd8-mark.png',
  lockup: '/brand/bynd8-lockup-horizontal-dark.png',
  wordmark: '/brand/bynd8-wordmark-dark.png',
} as const;

export function BrandLogo({
  className,
  variant = 'lockup',
  href = routes.discover,
  priority = false,
  size = 'md',
}: BrandLogoProps) {
  const image = (
    <Image
      src={src[variant]}
      alt="BYND8"
      width={variant === 'mark' ? 64 : 280}
      height={variant === 'mark' ? 64 : 64}
      priority={priority}
      className={cn(sizeClass[size][variant], 'object-contain object-left', className)}
    />
  );

  if (href === null) {
    return image;
  }

  return (
    <Link href={href} className="inline-flex items-center" aria-label="BYND8 home">
      {image}
    </Link>
  );
}
