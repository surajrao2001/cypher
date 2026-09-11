'use client';

import { routes } from '@cypher/contracts';
import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/features/shell/EmptyState';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';

type OrgStats = {
  events: number;
  registrations: number;
  live: number;
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
  const [orgs, setOrgs] = useState<OrganizerDto[] | null>(null);
  const [statsById, setStatsById] = useState<Record<string, OrgStats>>({});
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setError(null);
      try {
        const items = await auth.api.listMyOrganizers();
        if (cancelled) return;
        setOrgs(items);
        const entries = await Promise.all(
          items.map(async (org) => {
            try {
              const list = await auth.api.listOrganizerEvents(org.id);
              return [org.id, summarizeOrgEvents(list.items)] as const;
            } catch {
              return [org.id, { events: 0, registrations: 0, live: 0 }] as const;
            }
          }),
        );
        if (!cancelled) {
          setStatsById(Object.fromEntries(entries));
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

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="display-title text-5xl md:text-6xl">Organize</h1>
          <p className="max-w-md text-sm text-text-secondary">
            Pick a crew, then manage nights — not a dashboard of KPIs.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href={`${routes.organize}/new`}>+ New organizer</Link>
        </Button>
      </div>

      {error && orgs === null ? (
        <SoftError
          title="Couldn’t load organizers"
          error={error}
          onRetry={() => setReloadKey((n) => n + 1)}
        />
      ) : orgs === null ? (
        <PageLoading variant="cards" label="Loading your crews" />
      ) : orgs.length === 0 ? (
        <EmptyState
          kicker="No crews yet"
          title="Start an organizer"
          body="Any signed-in dancer can create an organizer. You are the owner; teammate invites come later."
        >
          <Button asChild>
            <Link href={`${routes.organize}/new`}>Create organizer</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => {
            const stats = statsById[org.id];
            const initials = org.orgName
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() ?? '')
              .join('');
            return (
              <Link
                key={org.id}
                href={`${routes.organize}/${org.slug}`}
                className="rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent/40 hover:bg-elevated/40"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-elevated font-display text-lg text-text-secondary">
                    {initials || '·'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-text-primary">{org.orgName}</p>
                    <p className="text-[12.5px] text-text-secondary">
                      {org.type}
                      {org.city ? ` · ${org.city}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-5 border-t border-border pt-3.5">
                  <Stat label="Events" value={stats?.events} />
                  <Stat label="Registrations" value={stats?.registrations} />
                  <Stat label="Live now" value={stats?.live} />
                </div>
              </Link>
            );
          })}

          <Link
            href={`${routes.organize}/new`}
            className="flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-border px-8 py-9 text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border font-display text-3xl">
              +
            </span>
            <span className="text-sm">Create another organizer profile</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div>
      <p className="font-display text-xl text-text-primary">{value === undefined ? '—' : value}</p>
      <p className="text-[11px] text-text-muted">{label}</p>
    </div>
  );
}

function summarizeOrgEvents(events: OrganizerEventDetailDto[]): OrgStats {
  const now = Date.now();
  let registrations = 0;
  let live = 0;
  for (const event of events) {
    for (const cat of event.categories ?? []) {
      registrations += cat.confirmedCount;
    }
    if (event.status === 'published' && new Date(event.startTime).getTime() >= now) {
      live += 1;
    }
  }
  return { events: events.length, registrations, live };
}
