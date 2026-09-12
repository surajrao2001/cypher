'use client';

import { routes } from '@cypher/contracts';
import type { EventType, OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { eventEffectiveEndIso, formatEventDate, formatMinorUnits } from '@cypher/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { ensurePersonalOrganizer } from '@/features/organize/ensure-personal-organizer';
import { EmptyState } from '@/features/shell/EmptyState';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type EventTab = 'all' | 'live' | 'draft' | 'past';

type EventRow = {
  event: OrganizerEventDetailDto;
  org: OrganizerDto;
};

export function OrganizeHome() {
  return (
    <OrganizeGate>
      <OrganizeHomeInner />
    </OrganizeGate>
  );
}

function OrganizeHomeInner() {
  const auth = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrganizerDto[] | null>(null);
  const [rows, setRows] = useState<EventRow[] | null>(null);
  const [hostFilter, setHostFilter] = useState<string | 'all'>('all');
  const [tab, setTab] = useState<EventTab>('all');
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setError(null);
      try {
        const items = await auth.api.listMyOrganizers();
        if (cancelled) return;
        setOrgs(items);
        const nested = await Promise.all(
          items.map(async (org) => {
            try {
              const list = await auth.api.listOrganizerEvents(org.id);
              return list.items.map((event) => ({ event, org }));
            } catch {
              return [] as EventRow[];
            }
          }),
        );
        if (!cancelled) {
          setRows(nested.flat());
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.api, reloadKey]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const now = Date.now();
    let list = [...rows];
    if (hostFilter !== 'all') {
      list = list.filter((row) => row.org.slug === hostFilter);
    }
    list.sort(
      (a, b) =>
        new Date(b.event.startTime).getTime() - new Date(a.event.startTime).getTime(),
    );
    switch (tab) {
      case 'draft':
        return list.filter((r) => r.event.status === 'draft');
      case 'live':
        return list.filter(
          (r) => r.event.status === 'published' || r.event.status === 'registration_closed',
        );
      case 'past':
        return list.filter(
          (r) =>
            r.event.status === 'completed' ||
            r.event.status === 'cancelled' ||
            (r.event.status === 'published' &&
              new Date(eventEffectiveEndIso(r.event.startTime, r.event.endTime)).getTime() <
                now),
        );
      default:
        return list;
    }
  }, [rows, tab, hostFilter]);

  async function onCreate() {
    setCreating(true);
    try {
      if (!orgs || orgs.length === 0) {
        await ensurePersonalOrganizer(auth.api, auth.me?.profile);
      }
      const slugHint =
        hostFilter !== 'all'
          ? hostFilter
          : orgs && orgs.length === 1
            ? orgs[0]!.slug
            : undefined;
      const q = slugHint ? `?host=${encodeURIComponent(slugHint)}` : '';
      router.push(`${routes.organize}/create${q}`);
    } catch (err) {
      setError(err);
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="display-title text-5xl md:text-6xl">Your Events</h1>
          <p className="max-w-md text-sm text-text-secondary">
            Create an event, put it up, and manage people from here.
          </p>
        </div>
        <Button type="button" size="lg" disabled={creating} onClick={() => void onCreate()}>
          {creating ? 'Starting…' : '+ Create'}
        </Button>
      </div>

      {orgs && orgs.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            Hosting as
          </span>
          <select
            value={hostFilter}
            onChange={(e) => setHostFilter(e.target.value === 'all' ? 'all' : e.target.value)}
            className="h-9 rounded-md border border-border bg-elevated px-3 text-sm text-text-primary"
          >
            <option value="all">All hosts</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.slug}>
                {org.orgName}
              </option>
            ))}
          </select>
          <Link
            href={`${routes.organize}/new`}
            className="text-xs text-text-muted underline underline-offset-2 hover:text-accent"
          >
            Create a host profile
          </Link>
        </div>
      ) : orgs && orgs.length === 1 ? (
        <p className="text-xs text-text-muted">
          Hosting as {orgs[0]!.orgName}
          {' · '}
          <Link
            href={`${routes.organize}/new`}
            className="underline underline-offset-2 hover:text-accent"
          >
            Add another host profile
          </Link>
        </p>
      ) : null}

      {error && rows === null ? (
        <SoftError
          title="Couldn’t load events"
          error={error}
          onRetry={() => setReloadKey((n) => n + 1)}
        />
      ) : rows === null || orgs === null ? (
        <PageLoading variant="cards" label="Loading your events" />
      ) : (
        <div className="space-y-4">
          <div className="flex gap-5 border-b border-border">
            {(
              [
                ['all', 'All'],
                ['live', 'Live'],
                ['draft', 'Drafts'],
                ['past', 'Past'],
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
              kicker={rows.length === 0 ? 'First night' : 'This tab'}
              title={rows.length === 0 ? 'Nothing here yet' : 'Nothing in this tab'}
              body={
                rows.length === 0
                  ? 'Got something happening?'
                  : 'Switch tabs, or create another event.'
              }
            >
              <Button type="button" disabled={creating} onClick={() => void onCreate()}>
                {rows.length === 0 ? '+ Create' : '+ Create'}
              </Button>
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {filtered.map(({ event, org }) => {
                const confirmed = (event.categories ?? []).reduce(
                  (n, c) => n + c.confirmedCount,
                  0,
                );
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
                          {orgs.length > 1 ? (
                            <span className="text-text-muted"> · {org.orgName}</span>
                          ) : null}
                        </p>
                        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">
                          {confirmed} registered
                          {collected > 0 ? ` · ${formatMinorUnits(collected)} collected` : ''}
                        </p>
                      </div>
                      <span className="hidden text-[13px] font-semibold text-accent sm:inline">
                        Open →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
