'use client';

import type {
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
  OrganizerRegistrationItemDto,
} from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';
import { TabEmptyState } from '@/features/organize/TabEmptyState';
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
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
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
        setCheckedIds(new Set((checkIns?.items ?? []).map((c) => c.registrationId)));
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
      if (filter === 'checked_in' && !checkedIds.has(row.id)) return false;
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
  }, [checkedIds, data, filter, query, viewerIds]);

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
  const filters: Array<{ id: PeopleFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'competitors', label: 'Competitors' },
    { id: 'audience', label: 'Audience' },
    { id: 'checked_in', label: 'Checked in' },
  ];

  if (data.categories.length === 0) {
    return (
      <TabEmptyState
        icon="tickets"
        kicker="Entry"
        title="No Entry yet"
        body="Add a competition or audience pass to start taking registrations."
      >
        <Button type="button" variant="outline" size="sm" onClick={onOpenEntry}>
          Add Entry
        </Button>
      </TabEmptyState>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="kicker text-accent">People</p>
        <h2 className="font-display text-3xl uppercase tracking-[0.04em]">People</h2>
        <p className="mt-1 text-sm text-text-secondary">{confirmed} registrations</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="People filters">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'min-h-11 rounded-md border px-3 py-2 text-sm font-semibold',
              filter === f.id
                ? 'border-accent bg-accent/15 text-text-primary'
                : 'border-border text-text-muted',
            )}
          >
            {f.label}
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
        <TabEmptyState
          icon="crew"
          kicker="People"
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
        </TabEmptyState>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {filtered.map((row) => (
            <li key={row.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-text-primary">
                    {row.participants[0]?.displayName ?? row.entryName ?? row.registrationCode}
                  </p>
                  <Badge variant="outline">
                    {row.registrationStatus.replaceAll('_', ' ')}
                  </Badge>
                  {checkedIds.has(row.id) ? <Badge variant="lime">Checked in</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-text-secondary">{row.categoryName}</p>
              </div>
              <p className="shrink-0 text-sm text-text-secondary">
                {row.totalAmountMinor === 0 ? 'Free' : formatMinorUnits(row.totalAmountMinor)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-text-muted">
        <a href={entryHref} className="underline underline-offset-2">
          Manage Entry
        </a>
      </p>
    </section>
  );
}
