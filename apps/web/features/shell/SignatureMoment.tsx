'use client';

import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SignatureKind = 'live' | 'youreIn' | 'checkedIn' | 'soldOut' | 'tonight' | 'today';

const COPY: Record<
  SignatureKind,
  { kicker: string; title: string; accentClass: string; washClass: string }
> = {
  live: {
    kicker: 'Published',
    title: "IT'S LIVE.",
    accentClass: 'text-accent',
    washClass:
      'bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(255,104,0,0.28),transparent_65%)]',
  },
  youreIn: {
    kicker: 'Confirmed',
    title: "YOU'RE IN.",
    accentClass: 'text-accent',
    washClass:
      'bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(255,104,0,0.22),transparent_65%)]',
  },
  checkedIn: {
    kicker: 'Door',
    title: 'CHECKED IN.',
    accentClass: 'text-accent-2',
    washClass:
      'bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(184,242,74,0.22),transparent_65%)]',
  },
  soldOut: {
    kicker: 'Full',
    title: 'SOLD OUT.',
    accentClass: 'text-error',
    washClass:
      'bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(255,80,80,0.16),transparent_65%)]',
  },
  tonight: {
    kicker: 'Event day',
    title: 'TONIGHT.',
    accentClass: 'text-accent',
    washClass:
      'bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(255,104,0,0.26),transparent_65%)]',
  },
  today: {
    kicker: 'Event day',
    title: 'TODAY.',
    accentClass: 'text-accent',
    washClass:
      'bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(255,104,0,0.2),transparent_65%)]',
  },
};

/** Compact status chip for heroes / cards. */
export function SignatureStatusPill({
  kind,
  className,
}: {
  kind: Extract<SignatureKind, 'soldOut' | 'tonight' | 'today' | 'live' | 'checkedIn'>;
  className?: string;
}) {
  const label =
    kind === 'soldOut'
      ? 'Sold out'
      : kind === 'tonight'
        ? 'Tonight'
        : kind === 'today'
          ? 'Today'
          : kind === 'live'
            ? 'Live'
            : 'Checked in';
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]',
        kind === 'soldOut' && 'bg-error/20 text-error',
        kind === 'tonight' && 'bg-accent text-bg',
        kind === 'today' && 'bg-accent/90 text-bg',
        kind === 'live' && 'bg-accent-2 text-bg',
        kind === 'checkedIn' && 'bg-accent-2 text-bg',
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Full-bleed emotional beat — publish / registration / door / sold out. */
export function SignatureMomentOverlay({
  open,
  kind,
  eventTitle,
  meta,
  body,
  actions,
  onClose,
}: {
  open: boolean;
  kind: SignatureKind;
  eventTitle?: string;
  meta?: string;
  body?: string;
  actions?: ReactNode;
  onClose?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const copy = COPY[kind];

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-bg/92 px-5 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={cn('pointer-events-none absolute inset-0', copy.washClass)} aria-hidden />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={
          reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 28 }
        }
        className="relative z-10 w-full max-w-md space-y-5 text-center"
      >
        <p className={cn('text-[11px] font-bold uppercase tracking-[0.2em]', copy.accentClass)}>
          {copy.kicker}
        </p>
        <h2
          id={titleId}
          className="display-title text-[2.75rem] leading-[0.9] tracking-[0.04em] text-text-primary sm:text-6xl"
        >
          {copy.title}
        </h2>
        {eventTitle ? (
          <p className="font-display text-xl uppercase tracking-[0.06em] text-text-primary sm:text-2xl">
            {eventTitle}
          </p>
        ) : null}
        {meta ? <p className="text-sm text-text-secondary">{meta}</p> : null}
        {body ? <p className="text-sm text-text-secondary">{body}</p> : null}
        {actions ? (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">{actions}</div>
        ) : null}
        {onClose ? (
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="min-h-11 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            Close
          </button>
        ) : null}
      </motion.div>
    </div>
  );
}

/** Inline signature panel (check-in strip, readiness live state, sticky sold out). */
export function SignatureMomentPanel({
  kind,
  eventTitle,
  meta,
  body,
  actions,
  className,
  compact = false,
}: {
  kind: SignatureKind;
  eventTitle?: string;
  meta?: string;
  body?: string;
  actions?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const copy = COPY[kind];

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0.85, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className={cn(
        'relative overflow-hidden rounded-xl border border-white/[0.08]',
        compact ? 'px-4 py-4 sm:px-5 sm:py-5' : 'px-5 py-6 sm:px-6 sm:py-7',
        copy.washClass,
        className,
      )}
    >
      <p className={cn('text-[11px] font-bold uppercase tracking-[0.18em]', copy.accentClass)}>
        {copy.kicker}
      </p>
      <h2
        className={cn(
          'mt-2 display-title leading-[0.92] tracking-[0.04em] text-text-primary',
          compact ? 'text-[1.65rem] sm:text-3xl' : 'text-[2rem] sm:text-4xl',
        )}
      >
        {copy.title}
      </h2>
      {eventTitle ? (
        <p className="mt-3 font-display text-lg uppercase tracking-[0.05em] text-text-primary">
          {eventTitle}
        </p>
      ) : null}
      {meta ? <p className="mt-1 text-sm text-text-secondary">{meta}</p> : null}
      {body ? <p className="mt-2 text-sm text-text-secondary">{body}</p> : null}
      {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
    </motion.section>
  );
}

export function SignaturePrimaryButton({
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button size="lg" className="min-h-11 min-w-[8.5rem] rounded-lg px-5" {...props}>
      {children}
    </Button>
  );
}
