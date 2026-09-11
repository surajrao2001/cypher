'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type EventEditChecklist = {
  hasCategories: boolean;
  hasViewersPass: boolean;
  hasPoster: boolean;
  hasVenuePin: boolean;
  hasMedia: boolean;
  isDraft: boolean;
};

type Step = {
  id: string;
  title: string;
  body: string;
  href: string;
  done: boolean;
};

/**
 * After draft create, suggest optional next steps — nothing blocks publish.
 */
export function EventEditNextSteps({ checklist }: { checklist: EventEditChecklist }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fresh = searchParams.get('fresh') === '1';
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!fresh) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('fresh');
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
  }, [fresh, router]);

  const steps: Step[] = [
    {
      id: 'categories',
      title: 'Add categories (optional)',
      body: '1v1, crew, prelims — only if people register to compete. Skip for a free session or open floor.',
      href: '#categories',
      done: checklist.hasCategories,
    },
    {
      id: 'viewers',
      title: 'Viewers pass (optional)',
      body: 'One-day: a single pass. Multi-day: per-day + full-run passes on that step.',
      href: '#viewers',
      done: checklist.hasViewersPass,
    },
    {
      id: 'early-bird',
      title: 'Early bird (optional)',
      body: 'Per category and viewers pass — regular is filled from your prices; you set early bird.',
      href: '#early-bird',
      done: false,
    },
    {
      id: 'poster',
      title: 'Poster / flyer (optional)',
      body: 'Looks better on Discover. Drop it under What’s cooking.',
      href: '#basics',
      done: checklist.hasPoster,
    },
    {
      id: 'media',
      title: 'Media links (optional)',
      body: 'YouTube / IG / Drive — rules, aftermovies, vibes.',
      href: '#media',
      done: checklist.hasMedia,
    },
  ];

  const show = checklist.isDraft && !dismissed && fresh;

  if (!show) return null;

  return (
    <section
      className={cn(
        'space-y-4 rounded-lg border border-accent/40 bg-[radial-gradient(ellipse_at_top_left,rgba(255,104,0,0.1),transparent_55%)] p-4 md:p-5',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="kicker text-accent">Draft saved</p>
          <h2 className="text-lg font-bold text-text-primary md:text-xl">
            Add more when you’re ready
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-text-secondary">
            You can publish now, or flesh out categories, viewers, poster, and media anytime.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setDismissed(true)}>
          Got it
        </Button>
      </div>

      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step.id}>
            <a
              href={step.href}
              className={cn(
                'flex gap-3 rounded-md border px-3 py-3 transition-colors',
                step.done
                  ? 'border-border/60 bg-surface/40 text-text-muted'
                  : 'border-border bg-surface hover:border-accent/50',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-sm',
                  step.done ? 'bg-elevated text-text-muted' : 'bg-accent/15 text-accent',
                )}
              >
                {step.done ? '✓' : String(index + 1)}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-text-primary">{step.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-text-muted">{step.body}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>

      <p className="text-xs text-text-muted">
        Hit <span className="text-text-secondary">Publish</span> up top whenever the night is ready
        to show on Discover.
      </p>
    </section>
  );
}
