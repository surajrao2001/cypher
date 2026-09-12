'use client';

import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatEventDateRange } from '@cypher/utils';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EventMediaLinksEditor } from '@/features/organize/EventMediaLinksEditor';
import { EventUpdatesPanel, PostUpdateDialog } from '@/features/organize/EventUpdatesPanel';

export function EventPagePanel({
  org,
  event,
  onEventChange,
}: {
  org: OrganizerDto;
  event: OrganizerEventDetailDto;
  onEventChange: (next: OrganizerEventDetailDto) => void;
}) {
  const [postOpen, setPostOpen] = useState(false);
  const [updatesKey, setUpdatesKey] = useState(0);
  const editHref = `${routes.organize}/${org.slug}/events/${event.id}/edit`;
  const isLive = event.status === 'published';
  const mediaCount = event.mediaLinks?.length ?? 0;

  return (
    <section className="space-y-8">
      <div>
        <p className="kicker text-accent">Event Page</p>
        <h2 className="font-display text-3xl uppercase tracking-[0.04em]">Event Page</h2>
        <p className="mt-1 text-sm text-text-secondary">
          What people see — poster, details, media, and updates.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Poster
            </p>
            {event.posterUrl ? (
              <img
                src={event.posterUrl}
                alt=""
                className="mt-2 max-h-40 rounded-md border border-border object-cover"
              />
            ) : (
              <p className="mt-2 text-sm text-text-secondary">No poster yet</p>
            )}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`${editHref}#basics`}>Change</Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Details
            </p>
            <p className="mt-2 text-sm text-text-primary">
              {formatEventDateRange(event.startTime, event.endTime)}
            </p>
            <p className="text-sm text-text-secondary">
              {[event.venue, event.city].filter(Boolean).join(', ') || 'City TBD'}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`${editHref}#basics`}>Edit</Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Description
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
              {event.description?.trim() || 'No description yet'}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`${editHref}#basics`}>Edit</Link>
          </Button>
        </div>

        <div className="space-y-3 border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Media · {mediaCount} items
            </p>
            <Button asChild variant="ghost" size="sm">
              <Link href={`${editHref}#media`}>Open editor</Link>
            </Button>
          </div>
          <EventMediaLinksEditor
            organizerId={org.id}
            eventId={event.id}
            links={event.mediaLinks ?? []}
            categories={event.categories
              .filter((c) => c.entryType !== 'viewer')
              .map((c) => ({ id: c.id, name: c.name }))}
            onUpdated={onEventChange}
          />
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Updates
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => setPostOpen(true)}>
              Post update
            </Button>
          </div>
          <EventUpdatesPanel
            organizerId={org.id}
            eventId={event.id}
            refreshKey={updatesKey}
          />
        </div>
      </div>

      {isLive ? (
        <Button asChild>
          <Link href={`${routes.events}/${event.slug}`}>View live event</Link>
        </Button>
      ) : (
        <p className="text-sm text-text-muted">
          Public link unlocks after you put the event up.
        </p>
      )}

      <PostUpdateDialog
        organizerId={org.id}
        eventId={event.id}
        open={postOpen}
        onOpenChange={setPostOpen}
        onPosted={() => setUpdatesKey((n) => n + 1)}
      />
    </section>
  );
}
