'use client';

import type { OrganizerDto, OrganizerEventDetailDto, OrganizerMemberRole } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useState } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { canPublish, statusLabel } from '@/features/organize/event-control';
import { eventTypeDisplayLabel } from '@/features/organize/event-type-copy';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { cn } from '@/lib/utils';

/** Mock-aligned: `Sat, 12 Sept 2026 - 6:00 PM` */
export function formatEventHomeWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const weekday = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(d);
  const day = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(d);
  const month = new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(d);
  const year = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(d);
  return `${weekday}, ${day} ${month} ${year} - ${time}`;
}

export function EventControlHeader({
  org,
  event,
  pending,
  onPublishToggle,
  onPostUpdate,
  onEditEvent,
  className,
}: {
  org: OrganizerDto;
  event: OrganizerEventDetailDto;
  pending?: boolean;
  onPublishToggle?: () => void;
  onPostUpdate?: () => void;
  onEditEvent?: () => void;
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
  const place = [event.venue, event.city].filter(Boolean).join(', ');
  const when = formatEventHomeWhen(event.startTime);

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
    <header className={cn('relative space-y-5', className)}>
      <PageBreadcrumb
        className="mb-0"
        items={[
          { label: 'Your Events', href: routes.organize },
          { label: event.title },
        ]}
      />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div
          className="relative mx-auto size-[9.5rem] shrink-0 overflow-hidden rounded-2xl bg-[linear-gradient(160deg,#1c1207_0%,#141414_55%,#0f0f0f_100%)] sm:mx-0 sm:size-[11rem] md:size-[12.5rem]"
          aria-hidden={event.posterUrl ? undefined : true}
        >
          {event.posterUrl ? (
            <img src={event.posterUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1">
              <ByndIcon name="poster" className="size-7 text-text-muted/40" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted/50">
                Poster
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary">
              {eventTypeDisplayLabel(event.eventType)}
            </span>
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]',
                isLive
                  ? 'bg-accent-2 text-bg'
                  : isDraft
                    ? 'bg-[#1e1e1e] text-text-secondary'
                    : 'border border-white/20 text-text-secondary',
              )}
            >
              {isLive ? 'Live' : statusLabel(event.status)}
            </span>
          </div>

          <h1 className="display-title text-[2.5rem] leading-[0.9] tracking-[0.04em] sm:text-5xl md:text-6xl">
            {event.title}
          </h1>

          <div className="space-y-1.5 text-[14px] text-text-secondary sm:text-[15px]">
            {when ? (
              <p className="flex items-center gap-2">
                <ByndIcon name="calendar" className="size-3.5 shrink-0 text-text-muted" />
                <span>{when}</span>
              </p>
            ) : null}
            {place ? (
              <p className="flex items-center gap-2">
                <ByndIcon name="pin" className="size-3.5 shrink-0 text-text-muted" />
                <span>{place}</span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!isDraft ? (
              <Button asChild size="lg" className="h-11 rounded-xl px-5 text-xs tracking-[0.14em]">
                <Link href={checkInHref}>
                  <ByndIcon name="checkIn" />
                  Check in
                </Link>
              </Button>
            ) : null}
            {isLive ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => void share()}
                className="h-11 rounded-xl border-[#2a2a2a] px-4 text-xs tracking-[0.14em]"
              >
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
                aria-label="More actions"
                onClick={() => setMenuOpen((o) => !o)}
                className="h-11 rounded-xl border-[#2a2a2a] px-4 text-xs tracking-[0.14em]"
              >
                ··· More
              </Button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute left-0 z-20 mt-2 min-w-[12rem] rounded-xl border border-border bg-surface py-1 shadow-lg sm:left-auto sm:right-0"
                >
                  {onEditEvent ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full px-3 py-2.5 text-left text-sm hover:bg-elevated"
                      onClick={() => {
                        setMenuOpen(false);
                        onEditEvent();
                      }}
                    >
                      Edit event
                    </button>
                  ) : null}
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
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full px-3 py-2.5 text-left text-sm hover:bg-elevated"
                      onClick={() => setMenuOpen(false)}
                    >
                      View event
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
                </div>
              ) : null}
            </div>
          </div>
          {shareHint ? <p className="text-xs text-accent-2">{shareHint}</p> : null}
        </div>
      </div>
    </header>
  );
}
