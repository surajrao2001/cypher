'use client';

import type {
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
  OrganizerRegistrationItemDto,
} from '@cypher/contracts';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeEmpty } from '@/features/organize/organizer-ui';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type PeopleFilter = 'all' | 'competitors' | 'audience' | 'checked_in';

export function EventPeoplePanel({
  organizerId,
  eventId,
  event,
  entryHref,
  onOpenEntry,
}: {
  organizerId: string;
  eventId: string;
  event: OrganizerEventDetailDto;
  entryHref: string;
  onOpenEntry: () => void;
}) {
  const { api } = useAuth();
  const [data, setData] = useState<OrganizerEventRegistrationsResponse | null>(null);
  const [checkedAt, setCheckedAt] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<PeopleFilter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      api.listOrganizerEventRegistrations(organizerId, eventId),
      api.listCheckIns(organizerId, eventId).catch(() => null),
    ])
      .then(([regs, checkIns]) => {
        if (cancelled) return;
        setData(regs);
        const map = new Map<string, string>();
        for (const c of checkIns?.items ?? []) {
          map.set(c.registrationId, c.checkedInAt);
        }
        setCheckedAt(map);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, eventId, organizerId, reloadKey]);

  const viewerIds = useMemo(() => {
    const viewers =
      event.viewerCategories ?? (event.categories ?? []).filter((c) => c.entryType === 'viewer');
    return new Set(viewers.map((c) => c.id));
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

  if (loading) return <PageLoading variant="list" label="Loading people" />;
  if (error) {
    return (
      <SoftError
        title="Couldn’t load people"
        error={error}
        onRetry={() => setReloadKey((n) => n + 1)}
        compact
      />
    );
  }
  if (!data) return null;

  const confirmed = data.totals.confirmed;
  const filters: Array<{ id: PeopleFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'competitors', label: 'Competitors', count: counts.competitors },
    { id: 'audience', label: 'Audience', count: counts.audience },
    { id: 'checked_in', label: 'Checked in', count: counts.checked_in },
  ];

  if (data.categories.length === 0) {
    return (
      <OrganizeEmpty
        title="No Entry yet"
        body="Add a competition or audience pass to start taking registrations."
      >
        <Button type="button" variant="outline" size="sm" onClick={onOpenEntry}>
          Add Entry
        </Button>
      </OrganizeEmpty>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="display-title text-4xl md:text-5xl">People</h2>
        <p className="mt-1 text-sm text-text-secondary">{confirmed} registrations</p>
      </div>

      <div
        className="flex flex-wrap gap-x-5 gap-y-1 border-b border-border/70"
        role="tablist"
        aria-label="People filters"
      >
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'min-h-11 border-b-2 px-0.5 py-2.5 text-sm font-semibold transition-colors',
              filter === f.id
                ? 'border-accent text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary',
            )}
          >
            {f.label} <span className="text-text-muted">{f.count}</span>
          </button>
        ))}
      </div>

      <label className="block space-y-2 text-sm text-text-secondary">
        <span className="sr-only">Search registrations</span>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search registrations…"
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
        <>
          <div
            className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_7rem_7rem] gap-3 border-b border-border/50 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted md:grid"
            aria-hidden
          >
            <span>Name</span>
            <span>Entry</span>
            <span>Status</span>
            <span>Checked in</span>
          </div>
          <ul className="divide-y divide-border/70">
            {filtered.map((row) => {
              const name =
                row.participants[0]?.displayName ?? row.entryName ?? row.registrationCode;
              const status = row.registrationStatus.replaceAll('_', ' ');
              const checked = checkedAt.get(row.id);
              return (
                <li
                  key={row.id}
                  className="grid gap-1 py-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_7rem_7rem] md:items-center md:gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text-primary">{name}</p>
                    <p className="mt-0.5 text-sm text-text-secondary md:hidden">{row.categoryName}</p>
                  </div>
                  <p className="hidden truncate text-sm text-text-secondary md:block">
                    {row.categoryName}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 md:block">
                    <Badge variant="outline" className="capitalize">
                      {status}
                    </Badge>
                    {checked ? (
                      <Badge variant="lime" className="md:hidden">
                        Checked in
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-text-secondary">
                    {checked ? formatCheckInTime(checked) : '—'}
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p className="text-xs text-text-muted">
        <a href={entryHref} className="underline underline-offset-2">
          Manage Entry
        </a>
      </p>
    </section>
  );
}

function formatCheckInTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Yes';
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
