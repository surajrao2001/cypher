'use client';

import { routes } from '@cypher/contracts';
import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { EmptyState } from '@/features/shell/EmptyState';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';

export function OrganizerDashboard({ slug }: { slug: string }) {
  return (
    <OrganizeGate>
      <OrganizerDashboardInner slug={slug} />
    </OrganizeGate>
  );
}

function OrganizerDashboardInner({ slug }: { slug: string }) {
  const auth = useAuth();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [events, setEvents] = useState<OrganizerEventDetailDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const organizer = await auth.api.getMyOrganizerBySlug(slug);
        if (cancelled) return;
        setOrg(organizer);
        const list = await auth.api.listOrganizerEvents(organizer.id);
        if (cancelled) return;
        setEvents(list.items);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load organizer');
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.api, slug]);

  if (error) {
    return <p className="px-6 py-16 text-sm text-error">{error}</p>;
  }

  if (!org || events === null) {
    return <p className="px-6 py-16 text-sm text-text-muted">Loading organizer…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-8">
      <PageBreadcrumb
        items={[
          { label: 'Organize', href: routes.organize },
          { label: org.orgName },
        ]}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="kicker text-accent">@{org.slug}</p>
          <h1 className="display-title text-5xl md:text-6xl">{org.orgName}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="muted">{org.role}</Badge>
            <Badge variant={org.verificationStatus === 'verified' ? 'lime' : 'outline'}>
              {org.verificationStatus}
            </Badge>
            {org.city ? <Badge variant="outline">{org.city}</Badge> : null}
          </div>
        </div>
        <Button asChild size="lg">
          <Link href={`${routes.organize}/${org.slug}/events/new`}>New event</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          kicker="No nights yet"
          title="Draft your first event"
          body="Add categories, set a poster, then publish to Discover when you are ready."
          className="py-10 md:py-12"
        >
          <Button asChild>
            <Link href={`${routes.organize}/${org.slug}/events/new`}>New event</Link>
          </Button>
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`${routes.organize}/${org.slug}/events/${event.id}`}
                className="flex flex-col gap-2 py-4 transition-colors hover:bg-elevated/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-display text-2xl tracking-[0.06em] text-text-primary">{event.title}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                    {event.city} · {new Date(event.startTime).toLocaleString()}
                  </p>
                </div>
                <Badge variant={event.status === 'published' ? 'lime' : 'muted'}>{event.status}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Button asChild variant="ghost">
        <Link href={routes.organize}>All organizers</Link>
      </Button>
    </div>
  );
}
