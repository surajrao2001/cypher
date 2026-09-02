import Image from 'next/image';

import { cn } from '@/lib/utils';

interface EventPosterProps {
  title: string;
  src: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

function hueFromSlug(title: string): number {
  let hash = 0;
  for (const char of title) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }
  return hash;
}

export function EventPoster({ title, src, className, priority, sizes }: EventPosterProps) {
  const hue = hueFromSlug(title);

  return (
    <div className={cn('poster-grain absolute inset-0 overflow-hidden bg-elevated', className)}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg, hsl(${String(hue)} 70% 18%), #0a0a0a 55%, hsl(${String((hue + 40) % 360)} 80% 12%))`,
        }}
      />
      <div className="absolute inset-0 opacity-40 mix-blend-overlay">
        <Image
          src={src}
          alt=""
          fill
          priority={priority}
          sizes={sizes ?? '100vw'}
          className="object-cover object-center"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/20" />
    </div>
  );
}
