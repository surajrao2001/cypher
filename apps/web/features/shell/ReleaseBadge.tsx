import { getReleaseBadgeLabel } from '@/lib/release';
import { cn } from '@/lib/utils';

export function ReleaseBadge({ className }: { className?: string }) {
  const label = getReleaseBadgeLabel();
  if (!label) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent',
        className,
      )}
    >
      {label}
    </span>
  );
}
