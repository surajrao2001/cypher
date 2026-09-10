import { cn } from '@/lib/utils';

/** Pulse bar for skeleton layouts. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-elevated', className)}
      aria-hidden
    />
  );
}
