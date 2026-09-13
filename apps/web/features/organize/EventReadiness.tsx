'use client';

import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { friendlyError, InlineNotice } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type HardItem = { id: string; label: string; ok: boolean; blocker?: string };
type SoftItem = { id: string; label: string; done: boolean; href?: string };

function hasBasics(event: OrganizerEventDetailDto): boolean {
  return Boolean(event.title?.trim() && event.city?.trim() && event.startTime);
}

function entryCount(event: OrganizerEventDetailDto): number {
  return (event.categories ?? []).length;
}

function hasPaidEntry(event: OrganizerEventDetailDto): boolean {
  return (event.categories ?? []).some((c) => (c.currentPriceMinor ?? c.priceMinor) > 0);
}

/**
 * Readiness from REAL publish gates only for hard blockers.
 * Soft items are recommended — never block Put it up unless API requires them.
 */
export function EventReadiness({
  org,
  event,
  onPublished,
  className,
}: {
  org: OrganizerDto;
  event: OrganizerEventDetailDto;
  onPublished?: (next: OrganizerEventDetailDto) => void;
  className?: string;
}) {
  const auth = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payoutReady, setPayoutReady] = useState<boolean | null>(null);
  const paid = hasPaidEntry(event);

  useEffect(() => {
    if (!paid) {
      setPayoutReady(null);
      return;
    }
    let cancelled = false;
    void auth.api
      .getOrganizerPaymentAccount(org.id)
      .then((row) => {
        if (!cancelled) setPayoutReady(Boolean(row.payoutReady));
      })
      .catch(() => {
        if (!cancelled) setPayoutReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth.api, org.id, paid, event.id]);

  const hard = useMemo((): HardItem[] => {
    const items: HardItem[] = [
      {
        id: 'basics',
        label: 'Event details',
        ok: hasBasics(event),
        blocker: hasBasics(event) ? undefined : 'Add name, city, and start time',
      },
    ];
    if (paid) {
      const ok = payoutReady === true;
      items.push({
        id: 'payout',
        label: 'Payouts',
        ok,
        blocker: ok
          ? undefined
          : payoutReady === null
            ? 'Checking payout setup…'
            : 'Set up payouts before putting up a paid event',
      });
    }
    return items;
  }, [event, paid, payoutReady]);

  const soft = useMemo((): SoftItem[] => {
    const editHref = `${routes.organize}/${org.slug}/events/${event.id}/edit`;
    const entryHref = routes.organizeEventEntry(org.slug, event.id);
    return [
      {
        id: 'venue',
        label: 'Venue',
        done: Boolean(event.venue?.trim()),
        href: `${editHref}#basics`,
      },
      {
        id: 'poster',
        label: 'Poster',
        done: Boolean(event.posterUrl),
        href: `${editHref}#basics`,
      },
      {
        id: 'entry',
        label: 'Entry',
        done: entryCount(event) > 0,
        href: entryHref,
      },
    ];
  }, [event, org.slug]);

  const hardOk = hard.every((h) => h.ok);
  const isDraft = event.status === 'draft';
  const isLive = event.status === 'published';

  async function putItUp() {
    setPending(true);
    setError(null);
    const tid = toastPending(toastCopy.publishing);
    try {
      const updated = await auth.api.publishOrganizerEvent(org.id, event.id);
      toastResolve(tid, toastCopy.published);
      onPublished?.(updated);
    } catch (err) {
      const detail = err instanceof Error ? err.message : undefined;
      toastReject(tid, toastCopy.publishFailed, detail);
      setError(friendlyError(err, 'Could not put it up'));
    } finally {
      setPending(false);
    }
  }

  if (isLive) {
    return (
      <section
        className={cn(
          'space-y-3 rounded-lg border border-accent-2/40 bg-accent-2/10 px-4 py-4 md:px-5',
          className,
        )}
      >
        <p className="kicker text-accent-2">Live</p>
        <h2 className="display-title text-3xl">It&apos;s up.</h2>
        <p className="text-sm text-text-secondary">Your event is on Discover.</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`${routes.events}/${event.slug}`}>View event</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={routes.organize}>Your Events</Link>
          </Button>
        </div>
      </section>
    );
  }

  if (!isDraft) {
    return null;
  }

  return (
    <section
      className={cn(
        'space-y-4 rounded-lg border border-accent/40 bg-[radial-gradient(ellipse_at_top_left,rgba(255,104,0,0.08),transparent_55%)] p-4 md:p-5',
        className,
      )}
    >
      <div className="space-y-1">
        <p className="kicker text-accent">Draft</p>
        <h2 className="text-lg font-bold text-text-primary md:text-xl">
          {hardOk ? 'Ready to go.' : 'Almost ready'}
        </h2>
        <p className="max-w-xl text-sm text-text-secondary">
          {hardOk
            ? 'You can put it up now. Add entry later if you want people to register.'
            : 'Finish the required details, then put it up.'}
        </p>
      </div>

      <ul className="space-y-2">
        {hard.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm">
            <span className={item.ok ? 'text-accent-2' : 'text-accent'}>{item.ok ? '✓' : '!'}</span>
            <span>
              <span className="font-semibold text-text-primary">{item.label}</span>
              {item.blocker ? (
                <span className="mt-0.5 block text-xs text-text-muted">{item.blocker}</span>
              ) : null}
              {item.id === 'payout' && !item.ok && payoutReady === false ? (
                <Link
                  href={`${routes.organize}/${org.slug}/payouts`}
                  className="mt-1 block text-xs text-accent underline underline-offset-2"
                >
                  Set up payouts
                </Link>
              ) : null}
            </span>
          </li>
        ))}
        {soft.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm text-text-secondary">
            <span className={item.done ? 'text-accent-2' : 'text-text-muted'}>
              {item.done ? '✓' : '○'}
            </span>
            <span>
              <span className="font-medium">{item.label}</span>
              <span className="ml-2 text-[11px] uppercase tracking-[0.12em] text-text-muted">
                recommended
              </span>
              {!item.done && item.href ? (
                <Link href={item.href} className="ml-2 text-xs text-accent underline underline-offset-2">
                  Add
                </Link>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      {error ? <InlineNotice tone="warn">{error}</InlineNotice> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="lg" disabled={pending || !hardOk} onClick={() => void putItUp()}>
          {pending ? 'Putting it up…' : 'Put it up'}
        </Button>
      </div>
    </section>
  );
}
