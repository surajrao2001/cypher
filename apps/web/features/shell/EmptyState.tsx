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
  /** BYND8 stage illustration — artwork-first empties */
  illustration?: EmptyIllustrationKind;
  /** Centered artwork layout (default when illustration is set) */
  align?: 'start' | 'center';
}

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
        'relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#0C0C0C]',
        centered
          ? 'flex flex-col items-center px-5 py-10 text-center sm:px-8 sm:py-12'
          : 'flex flex-col items-start gap-4 px-6 py-10 md:px-10 md:py-14',
        className,
      )}
    >
      {/* Soft stage wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,101,0,0.14),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#080808] to-transparent"
      />

      <div className={cn('relative z-[1] flex w-full flex-col', centered ? 'items-center gap-4' : 'items-start gap-4')}>
        {illustration ? (
          <div className="mb-1 w-full max-w-[17.5rem] animate-in fade-in zoom-in-95 duration-500">
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
          <div className={cn('mt-1 flex flex-wrap gap-3', centered && 'justify-center')}>{children}</div>
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
