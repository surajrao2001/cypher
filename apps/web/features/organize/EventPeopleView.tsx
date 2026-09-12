'use client';

import type {
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
  OrganizerRegistrationItemDto,
} from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { OrganizeEmpty, OrganizerWorkspace } from '@/features/organize/organizer-ui';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { cn } from '@/lib/utils';

type PeopleFilter = 'all' | 'competitors' | 'audience' | 'checked_in';

export function EventPeopleView({ slug, eventId }: { slug: string; eventId: string }) {
  return (
    <OrganizeGate>
      <EventPeoplePanel slug={slug} eventId={eventId} />
    </OrganizeGate>
  );
}

function EventPeoplePanel({ slug, eventId }: { slug: string; eventId: string }) {
  const auth = useAuth();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [event, setEvent] = useState<OrganizerEventDetailDto | null>(null);
  const [data, setData] = useState<OrganizerEventRegistrationsResponse | null>(null);
  const [checkedAt, setCheckedAt] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<PeopleFilter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const organizer = await auth.api.getMyOrganizerBySlug(slug);
        const [detail, regs, checkIns] = await Promise.all([
          auth.api.getOrganizerEvent(organizer.id, eventId),
          auth.api.listOrganizerEventRegistrations(organizer.id, eventId),
          auth.api.listCheckIns(organizer.id, eventId).catch(() => null),
        ]);
        if (cancelled) return;
        setOrg(organizer);
        setEvent(detail);
        setData(regs);
        const map = new Map<string, string>();
        for (const c of checkIns?.items ?? []) {
          map.set(c.registrationId, c.checkedInAt);
        }
        setCheckedAt(map);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.api, eventId, reloadKey, slug]);

  const viewerIds = useMemo(() => {
    const viewers =
      event?.viewerCategories ?? (event?.categories ?? []).filter((c) => c.entryType === 'viewer');
    return new Set((viewers ?? []).map((c) => c.id));
  }, [event]);

  const filtered = useMemo(() => {
    if (!data) return [] as OrganizerRegistrationItemDto[];
    const q = query.trim().toLowerCase();
    return data.items.filter((row) => {
      const isAudience = viewerIds.has(row.categoryId);
      if (filter === 'competitors' && isAudience) return false;
      if (filter === 'audience' && !isAudience) return false;
      if (filter === 'checked_in' && !checkedAt.has(row.id)) return false;
      if (!q) return true;
      const hay = [
        row.entryName ?? '',
        row.registrationCode,
        row.categoryName,
        ...row.participants.map((p) => p.displayName),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [checkedAt, data, filter, query, viewerIds]);

  const counts = useMemo(() => {
    if (!data) return { all: 0, competitors: 0, audience: 0, checked_in: 0 };
    let competitors = 0;
    let audience = 0;
    for (const row of data.items) {
      if (viewerIds.has(row.categoryId)) audience += 1;
      else competitors += 1;
    }
    return {
      all: data.items.length,
      competitors,
      audience,
      checked_in: checkedAt.size,
    };
  }, [checkedAt, data, viewerIds]);

  if (loading && !data) {
    return <PageLoading variant="list" className="px-6 py-16" label="Loading people" />;
  }
  if (error && !event) {
    return (
      <div className="px-6 py-16">
        <SoftError
          title="Couldn’t load people"
          error={error}
          onRetry={() => setReloadKey((n) => n + 1)}
        />
      </div>
    );
  }
  if (!org || !event || !data) return null;

  const entryHref = routes.organizeEventEntry(org.slug, event.id);
  const manageHref = `/organize/${org.slug}/events/${event.id}`;

  const filters: Array<{ id: PeopleFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'competitors', label: 'Competitors', count: counts.competitors },
    { id: 'audience', label: 'Audience', count: counts.audience },
    { id: 'checked_in', label: 'Checked in', count: counts.checked_in },
  ];

  const body =
    data.categories.length === 0 ? (
      <OrganizeEmpty
        title="No Entry yet"
        body="Add a competition or audience pass to start taking registrations."
      >
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={entryHref}>Add Entry</Link>
        </Button>
      </OrganizeEmpty>
    ) : (
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="display-title text-[2.75rem] leading-[0.9] tracking-[0.04em] sm:text-6xl md:text-7xl">
            People
          </h1>
          <p className="text-[15px] text-text-secondary sm:text-base">
            {counts.all} registration{counts.all === 1 ? '' : 's'}
          </p>
        </header>

        <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="People filters">
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors',
                  active
                    ? 'border-accent text-text-primary'
                    : 'border-[#2a2a2a] text-text-secondary hover:border-accent/40 hover:text-text-primary',
                )}
              >
                {active ? (
                  <span className="size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                ) : null}
                {f.label} ({f.count})
              </button>
            );
          })}
        </div>

        <label className="relative block">
          <span className="sr-only">Search registrations</span>
          <ByndIcon
            name="search"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search registrations..."
            className="flex h-12 w-full rounded-xl border border-[#2a2a2a] bg-[#141414] py-2 pl-10 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent/50"
          />
        </label>

        {filtered.length === 0 ? (
          <OrganizeEmpty
            title="Nobody matches"
            body="Try another filter or clear search."
            className="py-8"
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFilter('all');
                setQuery('');
              }}
            >
              Clear
            </Button>
          </OrganizeEmpty>
        ) : (
          <div className="max-w-3xl">
            <div
              className="hidden grid-cols-[minmax(0,11rem)_minmax(0,10rem)_auto_auto] gap-x-8 border-b border-[#2a2a2a] pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted md:grid"
              aria-hidden
            >
              <span>Name</span>
              <span>Entry</span>
              <span>Status</span>
              <span>Checked in</span>
            </div>
            <ul className="divide-y divide-[#2a2a2a]">
              {filtered.map((row) => {
                const name =
                  row.participants[0]?.displayName ?? row.entryName ?? row.registrationCode;
                const checked = checkedAt.get(row.id);
                const checkLabel = checked ? `✓ ${formatCheckInTime(checked)}` : '—';
                return (
                  <li key={row.id} className="py-4">
                    {/* Phone: left-aligned compact row — no justify-between stretch */}
                    <div className="space-y-1 md:hidden">
                      <p className="truncate font-semibold text-text-primary">{name}</p>
                      <p className="truncate text-sm text-text-secondary">{row.categoryName}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                        <StatusCell status={row.registrationStatus} />
                        <span className="text-text-muted" aria-hidden>
                          ·
                        </span>
                        <p
                          className={cn(
                            'text-sm',
                            checked ? 'text-[#9BE15D]' : 'text-text-muted',
                          )}
                        >
                          {checkLabel}
                        </p>
                      </div>
                    </div>

                    {/* Desktop: tight columns (not full-bleed fr stretch) */}
                    <div className="hidden grid-cols-[minmax(0,11rem)_minmax(0,10rem)_auto_auto] items-center gap-x-8 md:grid">
                      <p className="truncate font-semibold text-text-primary">{name}</p>
                      <p className="truncate text-sm text-text-secondary">{row.categoryName}</p>
                      <StatusCell status={row.registrationStatus} />
                      <p className={cn('text-sm', checked ? 'text-[#9BE15D]' : 'text-text-muted')}>
                        {checkLabel}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );

  return (
    <div className="relative overflow-hidden before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[28rem] before:bg-[radial-gradient(ellipse_at_top_right,rgba(255,104,0,0.28)_0%,rgba(255,104,0,0.08)_35%,transparent_70%)] before:content-['']">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[url('/organize/people-crowd.png')] bg-cover bg-[position:85%_20%] opacity-[0.35] [mask-image:linear-gradient(to_bottom,black_0%,black_45%,transparent_100%)]"
      />
      <OrganizerWorkspace width="full" className="relative z-10 space-y-6">
        <PageBreadcrumb
          items={[
            { label: event.title, href: manageHref },
            { label: 'People' },
          ]}
        />
        {body}
      </OrganizerWorkspace>
    </div>
  );
}

function StatusCell({ status, className }: { status: string; className?: string }) {
  const label = status.replaceAll('_', ' ');
  const tone =
    status === 'confirmed'
      ? 'bg-[#9BE15D]'
      : status === 'pending_payment' || status === 'pending'
        ? 'bg-accent'
        : 'bg-text-muted';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-sm capitalize text-text-secondary',
        className,
      )}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', tone)} aria-hidden />
      {label}
    </span>
  );
}

function formatCheckInTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Yes';
  const date = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date}, ${time}`;
}
