import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type WorkspaceWidth = 'form' | 'default' | 'wide' | 'full';

const WIDTH: Record<WorkspaceWidth, string> = {
  form: 'max-w-[40rem]',
  default: 'max-w-[72rem]',
  wide: 'max-w-[82rem]',
  full: 'max-w-none',
};

/** Left-anchored organizer canvas — replaces narrow centered columns. */
export function OrganizerWorkspace({
  children,
  width = 'default',
  className,
}: {
  children: ReactNode;
  width?: WorkspaceWidth;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-full space-y-6 px-4 py-8 pb-24 sm:px-8 lg:px-10 xl:px-14',
        WIDTH[width],
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Subtle numbered section identity — `01 / PEOPLE`. */
export function CountLabel({
  index,
  label,
  className,
}: {
  index: number;
  label: string;
  className?: string;
}) {
  const n = String(index).padStart(2, '0');
  return (
    <p
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted',
        className,
      )}
    >
      <span className="text-accent">{n}</span>
      <span className="mx-1.5 text-border">/</span>
      <span>{label}</span>
    </p>
  );
}

/** Poster-shaped thumb or intentional empty placeholder. */
export function PosterThumb({
  src,
  alt = '',
  className,
  size = 'md',
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}) {
  const sizes = {
    sm: 'aspect-[3/4] w-16',
    md: 'aspect-[3/4] w-24 sm:w-28',
    lg: 'aspect-[3/4] w-32 sm:w-40',
    hero: 'aspect-[3/4] w-40 sm:w-52 md:w-56',
  } as const;

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-sm bg-[linear-gradient(160deg,#1c1207_0%,#141414_55%,#0f0f0f_100%)]',
        sizes[size],
        className,
      )}
      aria-hidden={src ? undefined : true}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
          <span className="font-display text-lg tracking-[0.08em] text-text-muted/50">+</span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-text-muted/60">
            Poster
          </span>
        </div>
      )}
    </div>
  );
}

/** Capacity fill meter for Entry objects. */
export function CapacityMeter({
  filled,
  capacity,
  className,
}: {
  filled: number;
  capacity: number;
  className?: string;
}) {
  if (capacity <= 0) return null;
  const pct = Math.min(100, Math.round((filled / capacity) * 100));
  return (
    <div
      className={cn('h-1 w-full overflow-hidden rounded-full bg-elevated', className)}
      role="progressbar"
      aria-valuenow={filled}
      aria-valuemin={0}
      aria-valuemax={capacity}
      aria-label={`${String(filled)} of ${String(capacity)} filled`}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out motion-reduce:transition-none"
        style={{ width: `${String(pct)}%` }}
      />
    </div>
  );
}

/** Soft object surface — use when something is an actual object (event, entry, attention). */
export function ObjectSurface({
  children,
  className,
  interactive,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-sm border border-border/80 bg-surface/80',
        interactive &&
          'transition-[border-color,background-color,transform] duration-200 hover:border-accent/45 hover:bg-elevated/50 motion-reduce:transition-none',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Typographic empty — no dashed gray box. */
export function OrganizeEmpty({
  title,
  body,
  children,
  className,
}: {
  title: string;
  body?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4 py-10', className)}>
      <h2 className="display-title text-3xl md:text-4xl">{title}</h2>
      {body ? <p className="max-w-md text-sm text-text-secondary">{body}</p> : null}
      {children ? <div className="flex flex-wrap gap-2 pt-1">{children}</div> : null}
    </div>
  );
}
