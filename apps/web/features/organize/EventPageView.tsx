'use client';

import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatEventDateRange } from '@cypher/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { EventMediaLinksEditor } from '@/features/organize/EventMediaLinksEditor';
import { EventUpdatesPanel, PostUpdateDialog } from '@/features/organize/EventUpdatesPanel';
import { OrganizeGate } from '@/features/organize/OrganizeGate';
import { OrganizerWorkspace } from '@/features/organize/organizer-ui';
import { PageLoading, SoftError } from '@/features/shell/AsyncState';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { cn } from '@/lib/utils';

type SectionId = 'poster' | 'details' | 'description' | 'media' | 'updates';

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: 'poster', label: 'Poster' },
  { id: 'details', label: 'Details' },
  { id: 'description', label: 'Description' },
  { id: 'media', label: 'Media' },
  { id: 'updates', label: 'Updates' },
];

export function EventPageView({ slug, eventId }: { slug: string; eventId: string }) {
  return (
    <OrganizeGate>
      <EventPagePanel slug={slug} eventId={eventId} />
    </OrganizeGate>
  );
}

function EventPagePanel({ slug, eventId }: { slug: string; eventId: string }) {
  const auth = useAuth();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [event, setEvent] = useState<OrganizerEventDetailDto | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [active, setActive] = useState<SectionId>('poster');
  const [postOpen, setPostOpen] = useState(false);
  const [updatesKey, setUpdatesKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const organizer = await auth.api.getMyOrganizerBySlug(slug);
        const detail = await auth.api.getOrganizerEvent(organizer.id, eventId);
        if (cancelled) return;
        setOrg(organizer);
        setEvent(detail);
      } catch (err) {
        if (!cancelled) setError(err);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [auth.api, eventId, reloadKey, slug]);

  if (error && !event) {
    return (
      <div className="px-6 py-16">
        <SoftError
          title="Couldn’t load event page"
          error={error}
          onRetry={() => setReloadKey((n) => n + 1)}
        />
      </div>
    );
  }

  if (!org || !event) {
    return <PageLoading variant="detail" className="px-6 py-16" label="Loading event page" />;
  }

  const manageHref = `/organize/${org.slug}/events/${event.id}`;
  const editHref = `${routes.organize}/${org.slug}/events/${event.id}/edit`;
  const isLive = event.status === 'published';
  const place = [event.venue, event.city].filter(Boolean).join(', ') || 'City TBD';

  return (
    <div className="relative overflow-hidden before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-[28rem] before:bg-[radial-gradient(ellipse_at_top_right,rgba(255,104,0,0.28)_0%,rgba(255,104,0,0.08)_35%,transparent_70%)] before:content-['']">
      <OrganizerWorkspace width="full" className="relative z-10 space-y-8">
        <PageBreadcrumb
          items={[
            { label: event.title, href: manageHref },
            { label: 'Event Page' },
          ]}
        />

        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="display-title text-[2.75rem] leading-[0.9] tracking-[0.04em] sm:text-6xl md:text-7xl">
              Event Page
            </h1>
            <p className="max-w-xl text-[15px] text-text-secondary sm:text-base">
              What people see — poster, details, media, and updates.
            </p>
          </div>
          {isLive ? (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 shrink-0 rounded-xl border-accent/70 px-5 text-xs tracking-[0.14em]"
            >
              <Link href={`${routes.events}/${event.slug}`}>
                View live event
                <ByndIcon name="external" className="size-3.5" />
              </Link>
            </Button>
          ) : (
            <p className="text-sm text-text-muted">Public link unlocks after you put the event up.</p>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-[9.5rem_minmax(0,40rem)] lg:items-start lg:gap-10">
          <nav aria-label="Event page sections" className="lg:pt-1">
            <ul
              className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0"
              role="tablist"
            >
              {SECTIONS.map((section) => {
                const isActive = active === section.id;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActive(section.id)}
                      className={cn(
                        'whitespace-nowrap border-l-2 px-3 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full',
                        isActive
                          ? 'border-accent text-accent'
                          : 'border-transparent text-text-muted hover:text-text-secondary',
                      )}
                    >
                      {section.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0" role="tabpanel">
            {active === 'poster' ? (
              <section className="space-y-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                  Poster
                </p>
                <div className="relative aspect-[3/4] w-full max-w-[16rem] overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#141414]">
                  {event.posterUrl ? (
                    <img src={event.posterUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[linear-gradient(160deg,#1c1207,#141414)]">
                      <span className="font-display text-2xl text-text-muted/40">+</span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted/50">
                        Poster
                      </span>
                    </div>
                  )}
                  <Link
                    href={`${editHref}#basics`}
                    className="absolute inset-x-3 bottom-3 rounded-lg bg-black/70 px-3 py-2 text-center text-xs font-semibold tracking-[0.08em] text-white backdrop-blur-sm transition-colors hover:bg-black/85"
                  >
                    {event.posterUrl ? 'Change Poster' : 'Add Poster'}
                  </Link>
                </div>
              </section>
            ) : null}

            {active === 'details' ? (
              <section className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                    Event details
                  </p>
                  <Button asChild variant="outline" size="sm" className="rounded-xl border-[#2a2a2a]">
                    <Link href={`${editHref}#basics`}>Edit</Link>
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-base text-text-primary">
                    {formatEventDateRange(event.startTime, event.endTime)}
                  </p>
                  <p className="text-sm text-text-secondary">{place}</p>
                </div>
              </section>
            ) : null}

            {active === 'description' ? (
              <section className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                    Description
                  </p>
                  <Button asChild variant="outline" size="sm" className="rounded-xl border-[#2a2a2a]">
                    <Link href={`${editHref}#basics`}>Edit</Link>
                  </Button>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                  {event.description?.trim() || 'No description yet'}
                </p>
              </section>
            ) : null}

            {active === 'media' ? (
              <section className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                    Media
                  </p>
                  <Button asChild variant="outline" size="sm" className="rounded-xl border-[#2a2a2a]">
                    <Link href={`${editHref}#media`}>Edit</Link>
                  </Button>
                </div>
                <EventMediaLinksEditor
                  organizerId={org.id}
                  eventId={event.id}
                  links={event.mediaLinks ?? []}
                  categories={event.categories
                    .filter((c) => c.entryType !== 'viewer')
                    .map((c) => ({ id: c.id, name: c.name }))}
                  onUpdated={setEvent}
                />
              </section>
            ) : null}

            {active === 'updates' ? (
              <section className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                    Updates
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-[#2a2a2a]"
                    onClick={() => setPostOpen(true)}
                  >
                    Post update
                  </Button>
                </div>
                <EventUpdatesPanel
                  organizerId={org.id}
                  eventId={event.id}
                  refreshKey={updatesKey}
                />
              </section>
            ) : null}
          </div>
        </div>

        <PostUpdateDialog
          organizerId={org.id}
          eventId={event.id}
          open={postOpen}
          onOpenChange={setPostOpen}
          onPosted={() => setUpdatesKey((n) => n + 1)}
        />
      </OrganizerWorkspace>
    </div>
  );
}
