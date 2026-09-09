'use client';

import { routes } from '@cypher/contracts';
import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { eventEffectiveEndIso } from '@cypher/utils';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { OrganizerNextSteps } from '@/features/organize/OrganizerNextSteps';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { cn } from '@/lib/utils';

type EventTab = 'all' | 'draft' | 'published' | 'completed';

export function OrganizerDashboard({ slug }: { slug: string }) {
  return (
    <OrganizeGate>
      <Suspense fallback={<p className="px-6 py-16 text-sm text-text-muted">Loading organizer…</p>}>
        <OrganizerDashboardInner slug={slug} />
      </Suspense>
    </OrganizeGate>
  );
}

function OrganizerDashboardInner({ slug }: { slug: string }) {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [events, setEvents] = useState<OrganizerEventDetailDto[] | null>(null);
  const [payoutReady, setPayoutReady] = useState(false);
  const [showPayout, setShowPayout] = useState(searchParams.get('payout') === '1');
  const [tab, setTab] = useState<EventTab>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const organizer = await auth.api.getMyOrganizerBySlug(slug);
        if (cancelled) return;
        setOrg(organizer);
        const [list, payout] = await Promise.all([
          auth.api.listOrganizerEvents(organizer.id),
          auth.api.getOrganizerPaymentAccount(organizer.id).catch(() => null),
        ]);
        if (cancelled) return;
        setEvents(list.items);
        setPayoutReady(Boolean(payout?.payoutReady));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load organizer');
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.api, slug]);

  const stats = useMemo(() => {
    if (!events) return { total: 0, confirmed: 0, live: 0 };
    const now = Date.now();
    let confirmed = 0;
    let live = 0;
    for (const event of events) {
      for (const cat of event.categories ?? []) {
        confirmed += cat.confirmedCount;
      }
      const endMs = new Date(eventEffectiveEndIso(event.startTime, event.endTime)).getTime();
      if (event.status === 'published' && endMs >= now) {
        live += 1;
      }
    }
    return { total: events.length, confirmed, live };
  }, [events]);

  const filtered = useMemo(() => {
    if (!events) return [];
    const now = Date.now();
    const list = [...events].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
    switch (tab) {
      case 'draft':
        return list.filter((e) => e.status === 'draft');
      case 'published':
        return list.filter((e) => e.status === 'published' || e.status === 'registration_closed');
      case 'completed':
        return list.filter(
          (e) =>
            e.status === 'completed' ||
            e.status === 'cancelled' ||
            (e.status === 'published' &&
              new Date(eventEffectiveEndIso(e.startTime, e.endTime)).getTime() < now),
        );
      default:
        return list;
    }
  }, [events, tab]);

  if (error) {
    return <p className="px-6 py-16 text-sm text-error">{error}</p>;
  }

  if (!org || events === null) {
    return <p className="px-6 py-16 text-sm text-text-muted">Loading organizer…</p>;
  }

  const initials = org.orgName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <PageBreadcrumb
        items={[
          { label: 'Organize', href: routes.organize },
          { label: org.orgName },
        ]}
      />

      <header className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-elevated font-display text-2xl text-text-secondary">
            {initials || '·'}
          </div>
          <div>
            <h1 className="display-title text-3xl md:text-4xl">{org.orgName}</h1>
            <p className="mt-1 text-[13px] text-text-secondary">
              {org.type}
              {org.city ? ` · ${org.city}` : ''}
              {' · '}
              <Link href={routes.organize} className="underline underline-offset-2">
                All organizers
              </Link>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {payoutReady ? <Badge variant="lime">Settlement connected</Badge> : null}
            </div>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href={`${routes.organize}/${org.slug}/events/new`}>+ New event</Link>
        </Button>
      </header>

      {!payoutReady ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 rounded-lg border border-accent/50 bg-[linear-gradient(90deg,rgba(255,104,0,0.1),transparent)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">Settlement not connected</p>
              <p className="text-[12.5px] text-text-secondary">
                Connect Cashfree to receive payouts for paid entries and audience passes.
              </p>
            </div>
            <Button type="button" variant="lime" size="sm" onClick={() => setShowPayout((v) => !v)}>
              {showPayout ? 'Hide setup' : 'Connect settlement'}
            </Button>
          </div>
          {showPayout ? (
            <OrganizerNextSteps
              organizerId={org.id}
              orgSlug={org.slug}
              orgName={org.orgName}
              isFirstEvent={events.length === 0}
              payoutReady={payoutReady}
              onPayoutReadyChange={setPayoutReady}
            />
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
        <StatCard value={stats.total} label="Total events" />
        <StatCard value={stats.confirmed} label="Confirmed registrations" />
        <StatCard value={stats.live} label="Live & upcoming" />
      </div>

      <div className="space-y-4 pt-2">
        <h2 className="font-display text-2xl tracking-[0.04em]">Events</h2>
        <div className="flex gap-5 border-b border-border">
          {(
            [
              ['all', 'All'],
              ['draft', 'Draft'],
              ['published', 'Published'],
              ['completed', 'Completed'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'border-b-2 px-0.5 py-2.5 text-[13.5px] font-semibold transition-colors',
                tab === id
                  ? 'border-accent text-text-primary'
                  : 'border-transparent text-text-muted hover:text-text-secondary',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-sm text-text-muted">
            {events.length === 0
              ? 'No events yet — create one when you’re ready to publish a night.'
              : 'No events in this tab.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((event) => {
              const confirmed = (event.categories ?? []).reduce((n, c) => n + c.confirmedCount, 0);
              return (
                <li key={event.id}>
                  <Link
                    href={`${routes.organize}/${org.slug}/events/${event.id}`}
                    className="grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3.5 transition-colors hover:border-accent/30 hover:bg-elevated/40 sm:grid-cols-[64px_1fr_auto_auto]"
                  >
                    <div
                      className="h-12 w-16 overflow-hidden rounded-md bg-[linear-gradient(135deg,#1c1207,#141414)]"
                      style={
                        event.posterUrl
                          ? {
                              backgroundImage: `url(${event.posterUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }
                          : undefined
                      }
                    />
                    <div className="min-w-0">
                      <p className="font-display text-lg tracking-[0.04em] text-text-primary">
                        {event.title}
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(event.startTime).toLocaleString()} · {event.status}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="font-display text-lg text-text-primary">{confirmed}</p>
                      <p className="text-xs text-text-muted">registered</p>
                    </div>
                    <Badge
                      variant={
                        event.status === 'published'
                          ? 'lime'
                          : event.status === 'draft'
                            ? 'muted'
                            : 'outline'
                      }
                    >
                      {event.status === 'published' ? 'Live' : event.status}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-[18px]">
      <p className="font-display text-3xl text-text-primary">{value}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}
