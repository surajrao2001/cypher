import type { ReactNode } from 'react';

import {
  EmptyIllustration,
  type EmptyIllustrationKind,
} from '@/components/illustrations/EmptyIllustration';
import { ByndIcon } from '@/components/icons/bynd8';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  kicker: string;
  title: string;
  body: string;
  className?: string;
  children?: ReactNode;
  /** BYND8 stage illustration — bare SVG, no card chrome */
  illustration?: EmptyIllustrationKind;
  /** Centered artwork layout (default when illustration is set) */
  align?: 'start' | 'center';
}

/** Flat empty — illustration + copy only. No banner, no bordered container. */
export function EmptyState({
  kicker,
  title,
  body,
  className,
  children,
  illustration,
  align,
}: EmptyStateProps) {
  const centered = align === 'center' || (align == null && Boolean(illustration));

  return (
    <div
      className={cn(
        'relative flex w-full flex-col',
        centered
          ? 'items-center py-8 text-center sm:py-10'
          : 'items-start gap-3 py-8 md:py-10',
        className,
      )}
    >
      <div
        className={cn(
          'relative z-[1] flex w-full flex-col',
          centered ? 'items-center gap-3' : 'items-start gap-3',
        )}
      >
        {illustration ? (
          <div className="mb-1 w-full max-w-[12.5rem] sm:max-w-[14rem]">
            <EmptyIllustration kind={illustration} />
          </div>
        ) : null}

        <p
          className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.18em] text-accent',
            centered && 'text-center',
          )}
        >
          {kicker}
        </p>
        <h2
          className={cn(
            'font-display text-[1.85rem] uppercase leading-[0.92] tracking-[0.02em] text-white sm:text-[2.35rem]',
            centered ? 'max-w-[16ch] text-center' : 'text-left',
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            'max-w-md text-sm leading-relaxed text-white/55 sm:text-[15px]',
            centered && 'mx-auto text-center',
          )}
        >
          {body}
        </p>
        {children ? (
          <div className={cn('mt-1 flex flex-wrap gap-3', centered && 'justify-center')}>
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function FloorHint() {
  return (
    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-text-muted">
      <ByndIcon name="discover" className="size-4 text-accent" />
      Live in Discover while this floor gets wired.
    </p>
  );
}
