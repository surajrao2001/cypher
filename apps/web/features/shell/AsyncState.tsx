'use client';

import type { ReactNode } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Map API / thrown errors to short copy users can actually use. Never dump raw messages. */
export function friendlyError(
  err: unknown,
  fallback = 'Something went sideways. Try again in a moment.',
): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : '';
  const msg = raw.trim();
  if (!msg) return fallback;

  if (/failed to fetch|networkerror|network request failed|load failed|econnrefused|timeout/i.test(msg)) {
    return 'Check your connection and try again.';
  }
  if (/401|unauthorized|jwt|session expired|invalid token/i.test(msg)) {
    return 'Your session expired. Sign in again.';
  }
  if (/403|forbidden|not an organizer|not allowed/i.test(msg)) {
    return "You don’t have access to that.";
  }
  if (/404|not found/i.test(msg)) {
    return 'We couldn’t find that.';
  }
  if (/429|too many|rate limit/i.test(msg)) {
    return 'Slow down a second — too many requests.';
  }
  if (/5\d\d|internal server|bad gateway|service unavailable/i.test(msg)) {
    return 'Our side hiccuped. Try again shortly.';
  }
  if (/cashfree|payouts before creating paid|paid categor/i.test(msg)) {
    return 'Set up payouts before you can charge for registrations.';
  }
  if (/capacity cannot be below|below .* occupied/i.test(msg)) {
    return "Capacity can't be lower than the number of spots already taken.";
  }
  if (/cannot delete a category.*(reserved|confirmed|registration)/i.test(msg)) {
    return "This entry already has registrations and can't be removed.";
  }

  // Keep short, intentional product validation copy; drop stack-y / Nest noise.
  if (
    msg.length <= 120 &&
    !/exception|prisma|sql|stack|ecode|nestjs|axios|undefined|null is not/i.test(msg)
  ) {
    return msg;
  }

  return fallback;
}

type SoftErrorProps = {
  title?: string;
  body?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
  children?: ReactNode;
};

/** Friendly load/action failure — no raw red API dumps. */
export function SoftError({
  title = 'Couldn’t load that',
  body,
  error,
  onRetry,
  className,
  compact = false,
  children,
}: SoftErrorProps) {
  const copy = body ?? (error !== undefined ? friendlyError(error) : 'Try again in a moment.');
  return (
    <div
      role="alert"
      className={cn(
        'flex w-full justify-center rounded-lg border border-dashed border-border bg-elevated/40',
        compact ? 'px-4 py-6' : 'px-5 py-10 md:px-8',
        className,
      )}
    >
      <div className="flex w-full max-w-md flex-col items-start gap-3 text-left">
        <p className="kicker text-accent">Hang on</p>
        <p
          className={cn(
            'font-display uppercase tracking-[0.04em] text-text-primary',
            compact ? 'text-xl' : 'text-2xl',
          )}
        >
          {title}
        </p>
        <p className="text-sm text-text-secondary">{copy}</p>
        {(onRetry || children) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {onRetry ? (
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                <ByndIcon name="retry" />
                Try again
              </Button>
            ) : null}
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact field / form notice (validation, payment) — calm, not alarm-red. */
export function InlineNotice({
  children,
  tone = 'muted',
  className,
}: {
  children: ReactNode;
  tone?: 'muted' | 'warn';
  className?: string;
}) {
  return (
    <p
      role="status"
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        tone === 'warn'
          ? 'border-border bg-elevated/60 text-text-primary'
          : 'border-border bg-elevated/40 text-text-secondary',
        className,
      )}
    >
      {children}
    </p>
  );
}

export type LoadingVariant = 'page' | 'detail' | 'list' | 'panel' | 'form' | 'profile' | 'cards';

type PageLoadingProps = {
  variant?: LoadingVariant;
  className?: string;
  label?: string;
};

/** Skeleton shells for route / panel fetches. */
export function PageLoading({
  variant = 'page',
  className,
  label = 'Loading',
}: PageLoadingProps) {
  return (
    <div
      className={cn('w-full', className)}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      {variant === 'page' ? <PageSkeleton /> : null}
      {variant === 'detail' ? <DetailSkeleton /> : null}
      {variant === 'list' ? <ListSkeleton /> : null}
      {variant === 'panel' ? <PanelSkeleton /> : null}
      {variant === 'form' ? <FormSkeleton /> : null}
      {variant === 'profile' ? <ProfileSkeleton /> : null}
      {variant === 'cards' ? <CardsSkeleton /> : null}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-12 w-2/3 max-w-md" />
      <Skeleton className="h-4 w-full max-w-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="aspect-[4/5] w-full" />
        <Skeleton className="aspect-[4/5] w-full" />
        <Skeleton className="aspect-[4/5] w-full" />
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[18rem] w-full md:h-[26rem]" />
      <div className="mx-auto max-w-4xl space-y-4 px-4 md:px-6">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-3/4 max-w-xl" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-4 w-2/3 max-w-md" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md border border-border p-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-4 w-14 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <ListSkeleton rows={3} />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8 md:px-8">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-10 w-28" />
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

/** Sidebar / sheet auth chip while session resolves. */
export function AuthSlotLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center gap-3 rounded-md px-3 py-2', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading session"
    >
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-2.5 w-14" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
