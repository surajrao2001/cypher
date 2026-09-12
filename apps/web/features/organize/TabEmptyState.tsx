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

/** Typographic empty for organize tabs — no dashed box. */
export function TabEmptyState({
  icon,
  kicker,
  title,
  body,
  className,
  children,
}: TabEmptyStateProps) {
  return (
    <div className={cn('flex w-full flex-col items-start gap-4 py-10', className)}>
      <div className="flex size-10 items-center justify-center text-accent">
        <ByndIcon name={icon} className="size-6" />
      </div>
      <div className="space-y-1.5">
        <p className="kicker text-accent">{kicker}</p>
        <p className="font-display text-2xl uppercase tracking-[0.04em] text-text-primary">{title}</p>
        <p className="max-w-md text-sm text-text-secondary">{body}</p>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2 pt-1">{children}</div> : null}
    </div>
  );
}
