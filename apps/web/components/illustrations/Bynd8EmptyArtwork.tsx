import { cn } from '@/lib/utils';

import { resolveEmptyArtworkSrc } from '@/components/illustrations/bynd8-artwork';

type Props = {
  kind: Parameters<typeof resolveEmptyArtworkSrc>[0];
  className?: string;
  sizesClassName?: string;
};

/**
 * Production empty-state artwork from /public/bynd8/illustrations.
 * Decorative only — always aria-hidden with empty alt.
 */
export function Bynd8EmptyArtwork({ kind, className, sizesClassName }: Props) {
  const src = resolveEmptyArtworkSrc(kind);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static public SVG; avoids next/image SVG quirks
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      className={cn(
        'h-auto w-full',
        sizesClassName ?? 'max-w-[18rem] sm:max-w-[20rem]',
        className,
      )}
    />
  );
}
