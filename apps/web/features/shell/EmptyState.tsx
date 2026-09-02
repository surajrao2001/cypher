import { Compass } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  kicker: string;
  title: string;
  body: string;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({ kicker, title, body, className, children }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-4 rounded-lg border border-dashed border-border bg-surface px-6 py-12 md:px-10 md:py-16',
        className,
      )}
    >
      <p className="kicker text-accent">{kicker}</p>
      <h2 className="display-title text-4xl md:text-5xl">{title}</h2>
      <p className="max-w-md text-sm text-text-secondary md:text-base">{body}</p>
      {children}
    </div>
  );
}

export function FloorHint() {
  return (
    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-text-muted">
      <Compass className="h-4 w-4 text-accent" />
      Live in Discover while this floor gets wired.
    </p>
  );
}
