'use client';

import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatEventDateRange } from '@cypher/utils';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { EventMediaLinksEditor } from '@/features/organize/EventMediaLinksEditor';
import { EventUpdatesPanel, PostUpdateDialog } from '@/features/organize/EventUpdatesPanel';
import { ObjectSurface, PosterThumb } from '@/features/organize/organizer-ui';

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display-title text-4xl md:text-5xl">Event Page</h2>
          <p className="mt-1 text-sm text-text-secondary">What people see.</p>
        </div>
        {isLive ? (
          <Button asChild variant="outline">
            <Link href={`${routes.events}/${event.slug}`}>
              View live event ↗
            </Link>
          </Button>
        ) : (
          <p className="text-sm text-text-muted">Public link unlocks after you put the event up.</p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
        <div className="space-y-3">
          <ObjectSurface className="inline-block overflow-hidden p-2">
            <PosterThumb src={event.posterUrl} size="hero" />
          </ObjectSurface>
          <Button asChild variant="outline" size="sm">
            <Link href={`${editHref}#basics`}>
              {event.posterUrl ? 'Change poster' : 'Add poster'}
            </Link>
          </Button>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                  Event details
                </p>
                <p className="mt-2 text-base text-text-primary">
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
          </div>

          <div className="space-y-2 border-t border-border/70 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                  Description
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                  {event.description?.trim() || 'No description yet'}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href={`${editHref}#basics`}>Edit</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border/70 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
              Media
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {mediaCount > 0 ? `${String(mediaCount)} items` : 'No media yet'}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`${editHref}#media`}>Manage →</Link>
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

      <div className="space-y-3 border-t border-border/70 pt-6">
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
