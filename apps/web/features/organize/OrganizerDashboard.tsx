'use client';

import { routes } from '@cypher/contracts';
import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { eventEffectiveEndIso, formatEventDate, formatMinorUnits } from '@cypher/utils';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { OrganizerNextSteps } from '@/features/organize/OrganizerNextSteps';
import { EmptyState } from '@/features/shell/EmptyState';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type EventTab = 'all' | 'draft' | 'published' | 'completed';

export function OrganizerDashboard({ slug }: { slug: string }) {
  return (
    <OrganizeGate>
      <Suspense fallback={<PageLoading variant="page" className="px-6 py-16" label="Loading organizer" />}>
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
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
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
          setError(err);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.api, slug, reloadKey]);

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
    return (
      <div className="px-6 py-16">
        <SoftError
          title="Couldn’t load organizer"
          error={error}
          onRetry={() => setReloadKey((n) => n + 1)}
        />
      </div>
    );
  }

  if (!org || events === null) {
    return <PageLoading variant="page" className="px-6 py-16" label="Loading organizer" />;
  }

  const createHref = `${routes.organize}/${org.slug}/events/new`;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <PageBreadcrumb
        items={[
          { label: 'Organize', href: routes.organize },
          { label: org.orgName },
        ]}
      />

      <header className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker text-accent">Your events</p>
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
            {payoutReady ? <Badge variant="lime">Payouts connected</Badge> : null}
          </div>
        </div>
        <Button asChild size="lg">
          <Link href={createHref}>+ New event</Link>
        </Button>
      </header>

      {!payoutReady ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 rounded-lg border border-accent/50 bg-[linear-gradient(90deg,rgba(255,104,0,0.1),transparent)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">Payouts not connected</p>
              <p className="text-[12.5px] text-text-secondary">
                Add bank or UPI to receive money from paid entries and audience passes.
              </p>
            </div>
            <Button type="button" variant="lime" size="sm" onClick={() => setShowPayout((v) => !v)}>
              {showPayout ? 'Hide setup' : 'Connect bank or UPI'}
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

      <div className="space-y-4">
        <div className="flex gap-5 border-b border-border">
          {(
            [
              ['all', 'All'],
              ['draft', 'Draft'],
              ['published', 'Live'],
              ['completed', 'Past'],
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
          <EmptyState
            kicker={events.length === 0 ? 'First night' : 'This tab'}
            title={events.length === 0 ? 'No events yet' : 'Nothing in this tab'}
            body={
              events.length === 0
                ? 'Create a night — poster, categories, then publish. Manage registrations and door from the event.'
                : 'Switch tabs, or create another event for this crew.'
            }
          >
            <Button asChild>
              <Link href={createHref}>
                {events.length === 0 ? 'Create your first event' : 'New event'}
              </Link>
            </Button>
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {filtered.map((event) => {
              const confirmed = (event.categories ?? []).reduce((n, c) => n + c.confirmedCount, 0);
              const collected = (event.categories ?? []).reduce(
                (n, c) => n + c.confirmedCount * (c.currentPriceMinor ?? c.priceMinor ?? 0),
                0,
              );
              return (
                <li key={event.id}>
                  <Link
                    href={`${routes.organize}/${org.slug}/events/${event.id}`}
                    className="grid grid-cols-[4.5rem_1fr] items-center gap-4 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent/40 hover:bg-elevated/40 sm:grid-cols-[5.5rem_1fr_auto]"
                  >
                    <div
                      className="aspect-[3/4] w-full overflow-hidden rounded-md bg-[linear-gradient(135deg,#1c1207,#141414)]"
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
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-xl tracking-[0.04em] text-text-primary sm:text-2xl">
                          {event.title}
                        </p>
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
                      </div>
                      <p className="text-sm text-text-secondary">
                        {formatEventDate(event.startTime)}
                        {event.city ? ` · ${event.city}` : ''}
                      </p>
                      <p className="text-xs uppercase tracking-[0.12em] text-text-muted">
                        {confirmed} registered
                        {collected > 0 ? ` · ${formatMinorUnits(collected)} collected` : ''}
                        {payoutReady ? ' · payout ready' : ''}
                      </p>
                    </div>
                    <span className="hidden text-[13px] font-semibold text-accent sm:inline">
                      Open event →
                    </span>
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
