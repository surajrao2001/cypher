'use client';

import { routes } from '@cypher/contracts';
import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { eventEffectiveEndIso } from '@cypher/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { ensurePersonalOrganizer } from '@/features/organize/ensure-personal-organizer';
import { eventTypeDisplayLabel, yourEventsCardMetric } from '@/features/organize/event-type-copy';
import { OrganizeEmpty, OrganizerWorkspace } from '@/features/organize/organizer-ui';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type EventTab = 'all' | 'live' | 'draft' | 'past';

type EventRow = {
  event: OrganizerEventDetailDto;
  org: OrganizerDto;
};

/** Match reference: `Sat, 18 Oct - 6:00 PM` */
function formatCardWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const weekday = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(d);
  const day = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(d);
  const month = new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(d);
  return `${weekday}, ${day} ${month} - ${time}`;
}

function cardStatus(
  event: OrganizerEventDetailDto,
  now: number,
): { label: 'LIVE' | 'DRAFT' | 'PAST'; tone: 'live' | 'muted' } {
  if (event.status === 'draft') return { label: 'DRAFT', tone: 'muted' };
  if (
    event.status === 'completed' ||
    event.status === 'cancelled' ||
    (event.status === 'published' &&
      new Date(eventEffectiveEndIso(event.startTime, event.endTime)).getTime() < now)
  ) {
    return { label: 'PAST', tone: 'muted' };
  }
  if (event.status === 'published' || event.status === 'registration_closed') {
    return { label: 'LIVE', tone: 'live' };
  }
  return { label: 'PAST', tone: 'muted' };
}

function cardTags(event: OrganizerEventDetailDto): string[] {
  const tags: string[] = [eventTypeDisplayLabel(event.eventType)];
  for (const style of event.styles ?? []) {
    if (style && !tags.includes(style)) tags.push(style);
    if (tags.length >= 2) break;
  }
  return tags;
}

function cardPlace(event: OrganizerEventDetailDto): string {
  return [event.venue, event.city].filter(Boolean).join(', ');
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
          (r) =>
            (r.event.status === 'published' || r.event.status === 'registration_closed') &&
            new Date(eventEffectiveEndIso(r.event.startTime, r.event.endTime)).getTime() >= now,
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

  const now = Date.now();

  return (
    <OrganizerWorkspace width="full" className="space-y-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="display-title text-[2.75rem] leading-[0.9] tracking-[0.04em] sm:text-6xl md:text-7xl">
            Your Events
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-text-secondary">
            Create an event, put it up, and manage people from here.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          disabled={creating}
          onClick={() => void onCreate()}
          className="h-14 shrink-0 rounded-xl px-9 text-base tracking-[0.12em]"
        >
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
            className="h-9 rounded-xl border border-border/80 bg-elevated px-3 text-sm text-text-primary"
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
          {/* Desktop tabs — underline; mobile — rounded pills */}
          <div className="hidden gap-6 border-b border-border/60 sm:flex">
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
                  'border-b-2 px-0.5 pb-3 text-lg font-semibold transition-colors',
                  tab === id
                    ? 'border-accent text-text-primary'
                    : 'border-transparent text-text-muted hover:text-text-secondary',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 sm:hidden">
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
                  'min-h-11 rounded-full border px-5 text-base font-semibold transition-colors',
                  tab === id
                    ? 'border-accent bg-transparent text-text-primary'
                    : 'border-border/80 text-text-muted',
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
              <Button
                type="button"
                disabled={creating}
                onClick={() => void onCreate()}
                className="rounded-xl"
              >
                + Create
              </Button>
            </OrganizeEmpty>
          ) : (
            <ul className="space-y-3.5">
              {filtered.map(({ event, org }) => {
                const metric = yourEventsCardMetric(event);
                const status = cardStatus(event, now);
                const tags = cardTags(event);
                const place = cardPlace(event);
                const when = formatCardWhen(event.startTime);

                return (
                  <li key={event.id}>
                    <Link
                      href={`${routes.organize}/${org.slug}/events/${event.id}`}
                      className={cn(
                        'group flex gap-3.5 rounded-2xl border border-[#2a2a2a] bg-[#121212] p-3.5 transition-[border-color,background-color] duration-200',
                        'hover:border-accent/40 hover:bg-[#161616] sm:gap-5 sm:p-4',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                      )}
                    >
                      {/* Poster */}
                      <div
                        className="relative h-[5.75rem] w-[5.75rem] shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(160deg,#1c1207_0%,#141414_55%,#0f0f0f_100%)] sm:h-[6.75rem] sm:w-[9.5rem]"
                        aria-hidden={event.posterUrl ? undefined : true}
                      >
                        {event.posterUrl ? (
                          <img
                            src={event.posterUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
                            <span className="font-display text-lg tracking-[0.08em] text-text-muted/40">
                              +
                            </span>
                            <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-text-muted/50">
                              Poster
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                        <span
                          className={cn(
                            'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]',
                            status.tone === 'live'
                              ? 'bg-accent-2 text-bg'
                              : 'bg-[#1e1e1e] text-text-secondary',
                          )}
                        >
                          {status.label}
                        </span>

                        <p className="truncate font-display text-[1.65rem] leading-none tracking-[0.04em] text-text-primary sm:text-[2rem] md:text-[2.15rem]">
                          {event.title}
                        </p>

                        <div className="space-y-0.5 text-[13px] leading-snug text-text-secondary sm:text-sm">
                          <p>{when}</p>
                          {place ? <p>{place}</p> : null}
                          {orgs.length > 1 ? (
                            <p className="text-text-muted">{org.orgName}</p>
                          ) : null}
                        </div>

                        {tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-[#333] px-2.5 py-0.5 text-[11px] font-medium text-text-secondary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {/* Mobile metric */}
                        <p className="pt-1 text-[13px] text-text-secondary sm:hidden">
                          <span className="font-display text-xl tracking-[0.04em] text-text-primary">
                            {metric.primary}
                          </span>{' '}
                          {metric.secondary}
                        </p>
                      </div>

                      {/* Desktop count + chevron */}
                      <div className="hidden shrink-0 items-center gap-4 self-center sm:flex">
                        <div className="max-w-[9rem] text-right">
                          <p className="font-display text-[2.35rem] leading-none tracking-[0.02em] text-text-primary">
                            {metric.primary}
                          </p>
                          <p className="mt-1 text-[13px] leading-snug text-text-secondary">
                            {metric.secondary}
                          </p>
                        </div>
                        <ByndIcon
                          name="chevronRight"
                          className="size-5 text-accent"
                          aria-hidden
                        />
                      </div>
                    </Link>
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
