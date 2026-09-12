'use client';

import { routes } from '@cypher/contracts';
import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { eventEffectiveEndIso, formatEventDate } from '@cypher/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { ensurePersonalOrganizer } from '@/features/organize/ensure-personal-organizer';
import {
  ObjectSurface,
  OrganizeEmpty,
  OrganizerWorkspace,
  PosterThumb,
} from '@/features/organize/organizer-ui';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type EventTab = 'all' | 'live' | 'draft' | 'past';

type EventRow = {
  event: OrganizerEventDetailDto;
  org: OrganizerDto;
};

function eventTypeLabel(type: string): string {
  if (type === 'cypher') return 'Jam';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

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
    <OrganizerWorkspace width="wide">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="display-title text-5xl md:text-6xl">Your Events</h1>
          <p className="max-w-lg text-sm text-text-secondary">
            Create, publish and manage what you&apos;re putting up.
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
            className="h-9 rounded-sm border border-border/80 bg-elevated px-3 text-sm text-text-primary"
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
        <div className="space-y-5">
          <div className="flex gap-5 border-b border-border/70">
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
            <OrganizeEmpty
              title={rows.length === 0 ? 'No events yet' : 'Nothing in this tab'}
              body={
                rows.length === 0
                  ? 'Got something happening?'
                  : 'Switch tabs, or create another event.'
              }
            >
              <Button type="button" disabled={creating} onClick={() => void onCreate()}>
                + Create
              </Button>
            </OrganizeEmpty>
          ) : (
            <ul className="space-y-3">
              {filtered.map(({ event, org }) => {
                const confirmed = (event.categories ?? []).reduce(
                  (n, c) => n + c.confirmedCount,
                  0,
                );
                const isDraft = event.status === 'draft';
                const isLive = event.status === 'published';
                return (
                  <li key={event.id}>
                    <ObjectSurface interactive className="overflow-hidden">
                      <Link
                        href={`${routes.organize}/${org.slug}/events/${event.id}`}
                        className="group grid grid-cols-[auto_1fr] gap-4 p-3 sm:gap-5 sm:p-4 md:grid-cols-[auto_1fr_auto] md:items-center"
                      >
                        <PosterThumb src={event.posterUrl} size="md" />
                        <div className="min-w-0 space-y-1.5 self-center">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={isLive ? 'lime' : isDraft ? 'muted' : 'outline'}>
                              {isLive ? 'Live' : event.status === 'draft' ? 'Draft' : event.status}
                            </Badge>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                              {eventTypeLabel(event.eventType)}
                            </span>
                          </div>
                          <p className="font-display text-2xl tracking-[0.04em] text-text-primary sm:text-3xl md:text-4xl">
                            {event.title}
                          </p>
                          <p className="text-sm text-text-secondary">
                            {formatEventDate(event.startTime)}
                            {event.city ? ` · ${event.city}` : ''}
                            {orgs.length > 1 ? (
                              <span className="text-text-muted"> · {org.orgName}</span>
                            ) : null}
                          </p>
                          <p className="text-xs uppercase tracking-[0.12em] text-text-muted md:hidden">
                            {isDraft
                              ? confirmed > 0
                                ? `${String(confirmed)} registered`
                                : 'Draft · not up yet'
                              : `${String(confirmed)} registered`}
                          </p>
                        </div>
                        <div className="hidden items-center gap-3 md:flex">
                          <p className="text-right text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                            {isDraft && confirmed === 0 ? (
                              <span>Draft</span>
                            ) : (
                              <>
                                <span className="block font-display text-2xl tracking-[0.04em] text-text-primary">
                                  {confirmed}
                                </span>
                                registered
                              </>
                            )}
                          </p>
                          <span
                            className="text-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:opacity-70"
                            aria-hidden
                          >
                            →
                          </span>
                        </div>
                      </Link>
                    </ObjectSurface>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </OrganizerWorkspace>
  );
}
