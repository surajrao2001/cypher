'use client';

import type { ReactNode } from 'react';

import { ByndIcon, type ByndIconName } from '@/components/icons/bynd8';
import { cn } from '@/lib/utils';

type TabEmptyStateProps = {
  icon: ByndIconName;
  kicker: string;
  title: string;
  body: string;
  className?: string;
  children?: ReactNode;
};

/** Compact dashed empty state for organize event tabs. */
export function TabEmptyState({
  icon,
  kicker,
  title,
  body,
  className,
  children,
}: TabEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex w-full justify-center rounded-lg border border-dashed border-border bg-elevated/40 px-5 py-10 md:px-8',
        className,
      )}
    >
      <div className="flex w-full max-w-md flex-col items-start gap-4 text-left">
        <div className="flex size-12 items-center justify-center rounded-sm border border-border bg-elevated text-accent">
          <ByndIcon name={icon} className="size-6" />
        </div>
        <div className="space-y-1.5">
          <p className="kicker text-accent">{kicker}</p>
          <p className="font-display text-2xl uppercase tracking-[0.04em] text-text-primary">{title}</p>
          <p className="text-sm text-text-secondary">{body}</p>
        </div>
        {children ? <div className="flex flex-wrap items-center gap-2 pt-1">{children}</div> : null}
      </div>
    </div>
  );
}
