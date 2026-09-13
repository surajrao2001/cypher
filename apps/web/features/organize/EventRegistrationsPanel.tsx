'use client';

import type {
  OrganizerEventRegistrationsResponse,
  OrganizerRegistrationItemDto,
} from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/features/auth/AuthProvider';
import { TabEmptyState } from '@/features/organize/TabEmptyState';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { ByndIcon } from '@/components/icons/bynd8';

type StatusFilter = 'all' | 'confirmed' | 'pending' | 'other';

function statusBucket(status: string): Exclude<StatusFilter, 'all'> {
  if (status === 'confirmed') return 'confirmed';
  if (status === 'pending_payment') return 'pending';
  return 'other';
}

const selectClass =
  'flex h-10 w-full rounded-md border border-border bg-elevated px-3 font-body text-sm text-text-primary focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40';

export function EventRegistrationsPanel({
  organizerId,
  eventId,
  eventSlug,
  eventStatus,
  editHref,
}: {
  organizerId: string;
  eventId: string;
  eventSlug?: string;
  eventStatus?: string;
  editHref?: string;
}) {
  const { api } = useAuth();
  const [data, setData] = useState<OrganizerEventRegistrationsResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>('confirmed');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api
      .listOrganizerEventRegistrations(organizerId, eventId)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setError(null);
        setCategoryId((prev) => {
          if (prev && res.categories.some((cat) => cat.id === prev)) return prev;
          return res.categories[0]?.id ?? null;
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, eventId, organizerId, reloadKey]);

  const activeCategory = useMemo(
    () => data?.categories.find((cat) => cat.id === categoryId) ?? null,
    [categoryId, data],
  );

  const filtered = useMemo(() => {
    if (!data || !categoryId) return [] as OrganizerRegistrationItemDto[];
    const q = query.trim().toLowerCase();
    return data.items.filter((row) => {
      if (row.categoryId !== categoryId) return false;
      if (status !== 'all' && statusBucket(row.registrationStatus) !== status) return false;
      if (!q) return true;
      const hay = [
        row.entryName ?? '',
        row.registrationCode,
        ...row.participants.map((p) => p.displayName),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [categoryId, data, query, status]);

  if (loading) {
    return <PageLoading variant="list" label="Loading registrations" />;
  }
  if (error) {
    return (
      <SoftError
        title="Couldn’t load registrations"
        error={error}
        onRetry={() => setReloadKey((n) => n + 1)}
        compact
      />
    );
  }
  if (!data) {
    return null;
  }

  if (data.categories.length === 0) {
    return (
      <TabEmptyState
        icon="tickets"
        kicker="Entry first"
        title="No registrations yet"
        body="Add competition or an audience pass under Entry, then this list fills as people register."
      >
        {editHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={editHref}>Open Entry</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={`${routes.organize}`}>Back to organize</Link>
          </Button>
        )}
      </TabEmptyState>
    );
  }

  return (
    <section className="space-y-5 rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker text-accent">Entries</p>
          <h2 className="font-display text-3xl uppercase tracking-[0.04em]">Registrations</h2>
          {activeCategory ? (
            <p className="mt-1 text-sm text-text-secondary">
              {activeCategory.name} · {activeCategory.confirmedCount}/{activeCategory.capacity}{' '}
              confirmed
              {activeCategory.reservedCount > 0
                ? ` · ${activeCategory.reservedCount} held`
                : ''}
            </p>
          ) : null}
        </div>
        <p className="text-xs uppercase tracking-[0.12em] text-text-muted">
          {filtered.length} shown
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1fr)]">
        <label className="block space-y-2 text-sm text-text-secondary">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            Category
          </span>
          <select
            className={selectClass}
            value={categoryId ?? ''}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {data.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2 text-sm text-text-secondary">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            Status
          </span>
          <select
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="other">Other</option>
            <option value="all">Any status</option>
          </select>
        </label>

        <label className="block space-y-2 text-sm text-text-secondary">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
            Search
          </span>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, entry, or code"
          />
        </label>
      </div>

      {data.items.length === 0 ? (
        <TabEmptyState
          icon="tickets"
          kicker="Empty floor"
          title="Nobody’s locked a spot"
          body="Share the public event page. Waiting for telepathy is not a growth strategy."
        >
          {eventSlug && eventStatus === 'published' ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`${routes.events}/${eventSlug}`}>
                <ByndIcon name="external" />
                Open public page
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setStatus('all')}>
              Show any status
            </Button>
          )}
        </TabEmptyState>
      ) : filtered.length === 0 ? (
        <TabEmptyState
          icon="filter"
          kicker="Filters"
          title="Nobody matches that combo"
          body="Try another category or status — or clear search."
          className="py-8"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setStatus('all');
              setQuery('');
            }}
          >
            Clear filters
          </Button>
        </TabEmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {filtered.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-text-primary">
                    {row.participants[0]?.displayName ?? row.entryName ?? row.registrationCode}
                  </p>
                  <Badge variant="outline">
                    {row.registrationStatus.replaceAll('_', ' ')}
                  </Badge>
                </div>
                {row.entryName ? (
                  <p className="mt-1 text-sm text-text-secondary">Entry {row.entryName}</p>
                ) : null}
                {row.participants.length > 1 ? (
                  <p className="mt-1 text-sm text-text-secondary">
                    {row.participants
                      .map((p) => `${p.displayName}${p.isTeamCaptain ? ' (captain)' : ''}`)
                      .join(', ')}
                  </p>
                ) : null}
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-text-muted">
                  {row.registrationCode}
                  {row.reservationExpiresAt && row.registrationStatus === 'pending_payment'
                    ? ` · hold until ${new Date(row.reservationExpiresAt).toLocaleString()}`
                    : null}
                </p>
              </div>
              <p className="shrink-0 text-sm text-text-primary">
                {row.totalAmountMinor === 0 ? 'Free' : formatMinorUnits(row.totalAmountMinor)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
