'use client';

import { routes } from '@cypher/contracts';
import type {
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
} from '@cypher/contracts';
import { formatEventDateRange, formatMinorUnits } from '@cypher/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { ByndIcon, type ByndIconName } from '@/components/icons/bynd8';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toastCopy, toastPending, toastReject, toastResolve } from '@/components/ui/toaster';
import { useAuth } from '@/features/auth/AuthProvider';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { EventRegistrationsPanel } from '@/features/organize/EventRegistrationsPanel';
import {
  EventUpdatesPanel,
  PostUpdateDialog,
} from '@/features/organize/EventUpdatesPanel';
import { PayoutSetupPanel } from '@/features/organize/PayoutSetupPanel';
import { TabEmptyState } from '@/features/organize/TabEmptyState';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { cn } from '@/lib/utils';

type TabId = 'overview' | 'registrations' | 'updates' | 'media' | 'payouts';

const TABS: Array<{ id: TabId; label: string; icon: ByndIconName }> = [
  { id: 'overview', label: 'Overview', icon: 'floor' },
  { id: 'registrations', label: 'Registrations', icon: 'crew' },
  { id: 'updates', label: 'Updates', icon: 'megaphone' },
  { id: 'media', label: 'Media', icon: 'media' },
  { id: 'payouts', label: 'Payouts', icon: 'wallet' },
];

export function EventManageView({ slug, eventId }: { slug: string; eventId: string }) {
  return (
    <OrganizeGate>
      <Suspense fallback={<PageLoading variant="detail" className="px-6 py-16" label="Loading event" />}>
        <EventManageViewInner slug={slug} eventId={eventId} />
      </Suspense>
    </OrganizeGate>
  );
}

function EventManageViewInner({ slug, eventId }: { slug: string; eventId: string }) {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId | null) ?? 'overview';
  const [tab, setTab] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'overview',
  );
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [event, setEvent] = useState<OrganizerEventDetailDto | null>(null);
  const [regs, setRegs] = useState<OrganizerEventRegistrationsResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [postUpdateOpen, setPostUpdateOpen] = useState(false);
  const [updatesRefreshKey, setUpdatesRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadError(null);
      try {
        const organizer = await auth.api.getMyOrganizerBySlug(slug);
        const [detail, regList] = await Promise.all([
          auth.api.getOrganizerEvent(organizer.id, eventId),
          auth.api.listOrganizerEventRegistrations(organizer.id, eventId).catch(() => null),
        ]);
        if (cancelled) return;
        setOrg(organizer);
        setEvent(detail);
        setRegs(regList);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.api, eventId, slug, reloadKey]);

  const competeCats = useMemo(
    () => event?.competeCategories ?? (event?.categories ?? []).filter((c) => c.entryType !== 'viewer'),
    [event],
  );
  const audience = event?.audience;

  const confirmedTotal = useMemo(() => {
    if (regs) return regs.totals.confirmed;
    if (!event) return 0;
    return (event.categories ?? []).reduce((n, c) => n + c.confirmedCount, 0);
  }, [event, regs]);

  const pendingTotal = regs?.totals.pending ?? 0;
  const recentRegs = (regs?.items ?? []).slice(0, 5);

  async function togglePublish() {
    if (!org || !event) return;
    setPending(true);
    const tid = toastPending(toastCopy.publishing);
    try {
      const updated =
        event.status === 'published'
          ? await auth.api.unpublishOrganizerEvent(org.id, event.id)
          : await auth.api.publishOrganizerEvent(org.id, event.id);
      setEvent(updated);
      toastResolve(
        tid,
        updated.status === 'published' ? toastCopy.published : toastCopy.unpublished,
      );
    } catch (err) {
      toastReject(tid, toastCopy.publishFailed, err instanceof Error ? err.message : undefined);
    } finally {
      setPending(false);
    }
  }

  if (loadError && !event) {
    return (
      <div className="px-6 py-16">
        <SoftError
          title="Couldn’t load event"
          error={loadError}
          onRetry={() => setReloadKey((n) => n + 1)}
        />
      </div>
    );
  }

  if (!org || !event) {
    return <PageLoading variant="detail" className="px-6 py-16" label="Loading event" />;
  }

  const editHref = `${routes.organize}/${org.slug}/events/${event.id}/edit`;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
      <PageBreadcrumb
        items={[
          { label: 'Organize', href: routes.organize },
          { label: org.orgName, href: `${routes.organize}/${org.slug}` },
          { label: event.title },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="kicker text-accent">{org.orgName}</p>
          <h1 className="display-title text-5xl md:text-6xl">{event.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant={event.status === 'published' ? 'lime' : 'muted'}>{event.status}</Badge>
            <Badge variant="outline">{event.eventType}</Badge>
          </div>
          <p className="text-sm text-text-secondary">
            {event.city}
            {event.venue ? ` · ${event.venue}` : ''} ·{' '}
            {formatEventDateRange(event.startTime, event.endTime)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="lg">
            <Link href={routes.organizeEventCheckIn(org.slug, event.id)}>
              <ByndIcon name="checkIn" />
              Check in
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href={editHref}>
              <ByndIcon name="edit" />
              Edit
            </Link>
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => setPostUpdateOpen(true)}
          >
            <ByndIcon name="megaphone" />
            Post update
          </Button>
          <Button
            type="button"
            size="lg"
            variant={event.status === 'published' ? 'outline' : 'lime'}
            disabled={pending}
            onClick={() => void togglePublish()}
          >
            <ByndIcon name={event.status === 'published' ? 'unpublish' : 'publish'} />
            {event.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
          {event.status === 'published' ? (
            <Button asChild size="lg" variant="ghost">
              <Link href={`${routes.events}/${event.slug}`}>
                <ByndIcon name="external" />
                Public page
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <PostUpdateDialog
        organizerId={org.id}
        eventId={event.id}
        open={postUpdateOpen}
        onOpenChange={setPostUpdateOpen}
        onPosted={() => {
          setUpdatesRefreshKey((n) => n + 1);
          setTab('updates');
        }}
      />

      <div className="flex gap-5 border-b border-border">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'inline-flex items-center gap-1.5 border-b-2 px-0.5 py-2.5 text-[13.5px] font-semibold transition-colors',
              tab === item.id
                ? 'border-accent text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary',
            )}
          >
            <ByndIcon
              name={item.icon}
              className={cn('size-3.5', tab === item.id ? 'text-accent' : 'text-current')}
            />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {confirmedTotal} confirmed
                {pendingTotal > 0 ? ` · ${pendingTotal} held` : ''}
              </p>
              <p className="text-[12.5px] text-text-secondary">
                Door ops and registrations for this night — not a BI dashboard.
              </p>
            </div>
            <Button asChild variant="lime" size="sm">
              <Link href={routes.organizeEventCheckIn(org.slug, event.id)}>Open check-in</Link>
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-lg border border-border bg-surface p-5">
              <h2 className="mb-4 font-display text-xl tracking-[0.04em]">Category fill</h2>
              <ul className="space-y-4">
                {competeCats.map((cat) => (
                  <FillBar
                    key={cat.id}
                    name={cat.name}
                    confirmed={cat.confirmedCount}
                    capacity={cat.capacity}
                    meta={`${cat.entryType} · ${cat.priceMinor === 0 ? 'Free' : formatMinorUnits(cat.priceMinor)}`}
                  />
                ))}
                {audience?.enabled ? (
                  <FillBar
                    name={audience.name || 'Audience'}
                    confirmed={audience.confirmedCount}
                    capacity={audience.capacity}
                    meta={`Watch · ${audience.priceMinor === 0 ? 'Free' : formatMinorUnits(audience.priceMinor)}`}
                  />
                ) : null}
                {competeCats.length === 0 && !audience?.enabled ? (
                  <li>
                    <TabEmptyState
                      icon="layers"
                      kicker="Categories"
                      title="Nothing to fill yet"
                      body="Add a 1v1, 2v2, or open category in Edit — empty brackets are just vibes."
                      className="border-0 bg-transparent px-0 py-2"
                    >
                      <Button asChild variant="outline" size="sm">
                        <Link href={editHref}>Open edit</Link>
                      </Button>
                    </TabEmptyState>
                  </li>
                ) : null}
              </ul>
            </section>

            <section className="flex flex-col justify-between rounded-lg border border-border bg-surface p-5">
              <div>
                <h2 className="font-display text-xl tracking-[0.04em]">Door check-in</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Scan ticket QR payloads or enter a registration code, with a live door list.
                </p>
              </div>
              <Button asChild className="mt-5 w-full sm:w-auto" size="lg">
                <Link href={routes.organizeEventCheckIn(org.slug, event.id)}>
                  <ByndIcon name="checkIn" />
                  Open check-in
                </Link>
              </Button>
            </section>
          </div>

          <section className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-xl tracking-[0.04em]">Recent registrations</h2>
              <button
                type="button"
                className="text-[13px] font-semibold text-text-muted hover:text-text-primary"
                onClick={() => setTab('registrations')}
              >
                See all
              </button>
            </div>
            {recentRegs.length === 0 ? (
              <TabEmptyState
                icon="crew"
                kicker="Quiet night"
                title="Nobody’s locked a spot"
                body="Share the public page. Dancers won’t find you through telepathy (we checked)."
                className="border-0 bg-transparent px-0 py-4"
              >
                {event.status === 'published' ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`${routes.events}/${event.slug}`}>
                      <ByndIcon name="external" />
                      Public page
                    </Link>
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => setTab('registrations')}>
                    <ByndIcon name="tickets" />
                    Registrations
                  </Button>
                )}
              </TabEmptyState>
            ) : (
              <ul className="divide-y divide-border">
                {recentRegs.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {row.participants[0]?.displayName ?? row.entryName ?? row.registrationCode}
                      </p>
                      <p className="text-xs text-text-muted">
                        {row.categoryName} · {row.registrationStatus.replaceAll('_', ' ')}
                      </p>
                    </div>
                    <p className="text-text-secondary">
                      {row.totalAmountMinor === 0 ? 'Free' : formatMinorUnits(row.totalAmountMinor)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {event.description ? (
            <section className="space-y-2">
              <p className="kicker">About</p>
              <p className="whitespace-pre-wrap text-sm text-text-secondary">{event.description}</p>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === 'registrations' ? (
        <EventRegistrationsPanel
          organizerId={org.id}
          eventId={eventId}
          eventSlug={event.slug}
          eventStatus={event.status}
          editHref={editHref}
        />
      ) : null}

      {tab === 'updates' ? (
        <EventUpdatesPanel
          organizerId={org.id}
          eventId={event.id}
          refreshKey={updatesRefreshKey}
        />
      ) : null}

      {tab === 'media' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker text-accent">Links</p>
              <h2 className="font-display text-3xl uppercase tracking-[0.04em]">Event media</h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`${editHref}#media`}>Manage in edit</Link>
            </Button>
          </div>
          {(event.mediaLinks ?? []).length === 0 ? (
            <TabEmptyState
              icon="media"
              kicker="Media"
              title="No links on the wall"
              body="Drop YouTube, IG, or Drive in Edit. We don’t host the aftermovie (your hard drive does)."
            >
              <Button asChild variant="outline" size="sm">
                <Link href={`${editHref}#media`}>
                  <ByndIcon name="link" />
                  Add links in edit
                </Link>
              </Button>
            </TabEmptyState>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {(event.mediaLinks ?? []).map((link) => (
                <li key={link.id} className="py-3">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-accent hover:underline"
                  >
                    {link.title}
                  </a>
                  <p className="mt-1 truncate text-xs text-text-muted">{link.url}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === 'payouts' ? (
        <PayoutSetupPanel organizerId={org.id} orgName={org.orgName} />
      ) : null}

      <Button asChild variant="ghost">
        <Link href={`${routes.organize}/${org.slug}`}>Back to organizer</Link>
      </Button>
    </div>
  );
}

function FillBar({
  name,
  confirmed,
  capacity,
  meta,
}: {
  name: string;
  confirmed: number;
  capacity: number;
  meta: string;
}) {
  const pct = capacity > 0 ? Math.min(100, Math.round((confirmed / capacity) * 100)) : 0;
  return (
    <li>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-text-primary">{name}</p>
        <p className="text-xs text-text-muted">
          {confirmed}/{capacity}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-elevated">
        <div className="h-full rounded-sm bg-accent transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-text-muted">{meta}</p>
    </li>
  );
}
