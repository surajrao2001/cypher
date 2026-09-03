'use client';

import { routes } from '@cypher/contracts';
import type { OrganizerDto } from '@cypher/contracts';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/features/shell/EmptyState';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void auth.api
      .listMyOrganizers()
      .then((items) => {
        if (!cancelled) {
          setOrgs(items);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load organizers');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth.api]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="kicker text-accent">Floor control</p>
          <h1 className="display-title text-5xl md:text-6xl">Organize</h1>
          <p className="max-w-md text-sm text-text-secondary">
            Create a crew, draft events, publish when the card is ready. You become owner on create.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href={`${routes.organize}/new`}>New organizer</Link>
        </Button>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      {orgs === null ? (
        <p className="text-sm text-text-muted">Loading your crews…</p>
      ) : orgs.length === 0 ? (
        <EmptyState
          kicker="No crews yet"
          title="Start an organizer"
          body="Any signed-in dancer can create an org. Milestone A is owner-only — invites come later."
        >
          <Button asChild>
            <Link href={`${routes.organize}/new`}>Create organizer</Link>
          </Button>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {orgs.map((org) => (
            <li key={org.id}>
              <Link
                href={`${routes.organize}/${org.slug}`}
                className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-elevated/60"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-display text-2xl tracking-[0.06em] text-text-primary">{org.orgName}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                    @{org.slug}
                    {org.city ? ` · ${org.city}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="muted">{org.role}</Badge>
                  <Badge variant={org.verificationStatus === 'verified' ? 'lime' : 'outline'}>
                    {org.verificationStatus}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
