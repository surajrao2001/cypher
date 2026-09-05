'use client';

import type { OrganizerEventRegistrationsResponse } from '@cypher/contracts';
import { formatMinorUnits } from '@cypher/utils';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/AuthProvider';

export function EventRegistrationsPanel({
  organizerId,
  eventId,
}: {
  organizerId: string;
  eventId: string;
}) {
  const { api } = useAuth();
  const [data, setData] = useState<OrganizerEventRegistrationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api
      .listOrganizerEventRegistrations(organizerId, eventId)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load registrations');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, eventId, organizerId]);

  if (loading) {
    return <p className="text-sm text-text-secondary">Loading registrations…</p>;
  }
  if (error) {
    return <p className="text-sm text-error">{error}</p>;
  }
  if (!data) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker text-accent">Entries</p>
          <h2 className="font-display text-3xl uppercase tracking-[0.04em]">Registrations</h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em] text-text-muted">
          <span>Pending {data.totals.pending}</span>
          <span>·</span>
          <span>Confirmed {data.totals.confirmed}</span>
          {data.totals.other > 0 ? (
            <>
              <span>·</span>
              <span>Other {data.totals.other}</span>
            </>
          ) : null}
        </div>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {data.categories.map((cat) => (
          <li key={cat.id} className="rounded-md border border-border bg-elevated px-3 py-2 text-sm">
            <p className="font-semibold text-text-primary">{cat.name}</p>
            <p className="text-text-secondary">
              {cat.confirmedCount} confirmed · {cat.reservedCount} held · {cat.capacity} cap ·{' '}
              {cat.priceMinor === 0 ? 'Free' : formatMinorUnits(cat.priceMinor)}
            </p>
          </li>
        ))}
      </ul>

      {data.items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-elevated px-4 py-8">
          <p className="kicker text-accent">Empty floor</p>
          <p className="mt-2 font-display text-2xl uppercase tracking-[0.04em] text-text-primary">
            No registrations yet
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            Share the public event link so dancers can hold a category spot.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {data.items.map((row) => (
            <li key={row.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-text-primary">{row.categoryName}</p>
                  <Badge variant="outline">{row.registrationStatus.replaceAll('_', ' ')}</Badge>
                </div>
                {row.entryName ? (
                  <p className="mt-1 text-sm text-text-secondary">Entry {row.entryName}</p>
                ) : null}
                <p className="mt-1 text-sm text-text-secondary">
                  {row.participants
                    .map((p) => `${p.displayName}${p.isTeamCaptain ? ' (captain)' : ''}`)
                    .join(', ')}
                </p>
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
