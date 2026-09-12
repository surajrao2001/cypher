'use client';

import type { OrganizerDto, OrganizerEventDetailDto, OrganizerMemberRole } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import { formatEventDateRange } from '@cypher/utils';
import Link from 'next/link';
import { useState } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { canPublish, statusLabel } from '@/features/organize/event-control';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { cn } from '@/lib/utils';

export function EventControlHeader({
  org,
  event,
  pending,
  onPublishToggle,
  onPostUpdate,
  className,
}: {
  org: OrganizerDto;
  event: OrganizerEventDetailDto;
  pending?: boolean;
  onPublishToggle?: () => void;
  onPostUpdate?: () => void;
  className?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const isLive = event.status === 'published';
  const isDraft = event.status === 'draft';
  const role = org.role as OrganizerMemberRole;
  const publishOk = canPublish(role);
  const checkInHref = routes.organizeEventCheckIn(org.slug, event.id);
  const publicHref = `${routes.events}/${event.slug}`;

  async function share() {
    if (!isLive) return;
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}${publicHref}` : publicHref;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: event.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint('Link copied');
      window.setTimeout(() => setShareHint(null), 2000);
    } catch {
      setShareHint('Couldn’t share');
      window.setTimeout(() => setShareHint(null), 2000);
    }
  }

  return (
    <header className={cn('space-y-4', className)}>
      <PageBreadcrumb
        items={[
          { label: 'Your Events', href: routes.organize },
          { label: event.title },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="kicker text-accent">{org.orgName}</p>
          <h1 className="display-title text-4xl md:text-6xl">{event.title}</h1>
          <p className="text-sm uppercase tracking-[0.12em] text-text-secondary">
            {formatEventDateRange(event.startTime, event.endTime)}
            {event.city ? ` · ${event.city}` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isLive ? 'lime' : isDraft ? 'muted' : 'outline'}>
              {statusLabel(event.status)}
            </Badge>
            <Badge variant="outline">{event.eventType}</Badge>
            {shareHint ? <span className="text-xs text-accent-2">{shareHint}</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isDraft ? (
            <Button asChild size="lg">
              <Link href={checkInHref}>
                <ByndIcon name="checkIn" />
                Check in
              </Link>
            </Button>
          ) : null}
          {isLive ? (
            <Button type="button" size="lg" variant="secondary" onClick={() => void share()}>
              <ByndIcon name="external" />
              Share
            </Button>
          ) : null}
          <div className="relative">
            <Button
              type="button"
              size="lg"
              variant="outline"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              More
            </Button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 min-w-[11rem] rounded-md border border-border bg-surface py-1 shadow-lg"
              >
                {onPostUpdate ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2.5 text-left text-sm hover:bg-elevated"
                    onClick={() => {
                      setMenuOpen(false);
                      onPostUpdate();
                    }}
                  >
                    Post update
                  </button>
                ) : null}
                {isLive ? (
                  <Link
                    role="menuitem"
                    href={publicHref}
                    className="block w-full px-3 py-2.5 text-left text-sm hover:bg-elevated"
                    onClick={() => setMenuOpen(false)}
                  >
                    View live event
                  </Link>
                ) : null}
                {publishOk && onPublishToggle ? (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={pending}
                    className="block w-full px-3 py-2.5 text-left text-sm hover:bg-elevated disabled:opacity-50"
                    onClick={() => {
                      setMenuOpen(false);
                      onPublishToggle();
                    }}
                  >
                    {isLive ? 'Unpublish' : isDraft ? 'Put it up' : 'Publish'}
                  </button>
                ) : null}
                <Link
                  role="menuitem"
                  href={routes.organize}
                  className="block w-full px-3 py-2.5 text-left text-sm hover:bg-elevated"
                  onClick={() => setMenuOpen(false)}
                >
                  Your Events
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
