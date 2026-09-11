'use client';

import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useState } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { CITIES } from '@/features/discovery/catalog';
import { cn } from '@/lib/utils';

type SceneEmptyBoardProps = {
  surface?: 'discover' | 'events';
  className?: string;
};

const STEPS = [
  {
    n: '01',
    title: 'Discover',
    body: 'Every battle, jam and workshop on one board — filtered by city and style.',
    icon: 'discover' as const,
  },
  {
    n: '02',
    title: 'Enter',
    body: 'Hold a spot in seconds. Pay when you’re ready — free jams confirm instantly.',
    icon: 'tickets' as const,
  },
  {
    n: '03',
    title: 'Show up',
    body: 'One QR at the door. Checked in and on the record.',
    icon: 'checkIn' as const,
  },
];

/**
 * Empty Discover / Events board — mockup-aligned: hero, city chips, CTAs, how-it-works.
 */
export function SceneEmptyBoard({ surface = 'discover', className }: SceneEmptyBoardProps) {
  const { status } = useAuth();
  const signedIn = status === 'authenticated';
  const [picked, setPicked] = useState<string | null>(null);

  const organizeHref = signedIn ? routes.organize : `${routes.login}?next=${routes.organize}`;
  const secondaryHref = signedIn
    ? routes.profile
    : `${routes.login}?next=${routes.discover}`;
  const secondaryLabel = signedIn ? 'Open dancer card' : 'Enter the scene';

  return (
    <div className={cn('mx-auto w-full max-w-5xl space-y-8 pb-10 pt-2 md:space-y-10 md:pb-14', className)}>
      <header className="space-y-3">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          The operating layer for the Indian dance scene
        </p>
        <h1 className="display-title text-5xl text-text-primary md:text-7xl">Tonight starts here.</h1>
      </header>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="space-y-6 p-5 md:p-8">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              {surface === 'events' ? 'The board' : 'Day one'}
            </p>
            <h2 className="display-title text-3xl text-text-primary md:text-5xl">
              {surface === 'events' ? 'The board is empty. For now.' : 'The scene starts with you.'}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-text-secondary md:text-base">
              {surface === 'events'
                ? 'Nothing’s published yet. Follow your city to get ready when the first night drops — or be the one who drops it.'
                : 'BYND8 is where Indian battles, jams, and labs get found, entered, and checked in. No nights live yet — host the first one, or set up your dancer card.'}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              {surface === 'events' ? 'Get notified for' : 'Follow your city'}
            </p>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((city) => {
                const active = picked === city;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setPicked((prev) => (prev === city ? null : city))}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
                      active
                        ? 'border-accent bg-accent text-bg'
                        : 'border-border bg-transparent text-text-secondary hover:border-accent/50 hover:text-text-primary',
                    )}
                  >
                    <ByndIcon name="pin" className="size-3.5" />
                    {city}
                  </button>
                );
              })}
            </div>
            {picked ? (
              <p className="text-xs text-text-muted">
                Got it — {picked}. When nights drop there, they’ll show on this board.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href={organizeHref}>
                {surface === 'events' ? 'Organize a night' : 'Organize the first night'}
                <span aria-hidden>→</span>
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {STEPS.map((step) => (
          <article
            key={step.n}
            className="relative rounded-xl border border-border bg-surface p-5 md:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-3xl text-accent">{step.n}</p>
              <ByndIcon name={step.icon} className="size-5 text-accent" />
            </div>
            <h3 className="mt-4 font-display text-2xl uppercase tracking-[0.04em] text-text-primary">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{step.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
