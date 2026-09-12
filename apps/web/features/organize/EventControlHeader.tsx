'use client';

import type { OrganizerDto, OrganizerEventDetailDto, OrganizerMemberRole } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useState } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { canPublish, statusLabel } from '@/features/organize/event-control';
import { eventTypeDisplayLabel } from '@/features/organize/event-type-copy';
import { PosterThumb } from '@/features/organize/organizer-ui';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { cn } from '@/lib/utils';

/** Reference: `Sat, 12 Sept 2026 · 6:00 PM` */
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
  return `${weekday}, ${day} ${month} ${year} · ${time}`;
}

/** Shorter preview line: `Sat, 12 Sept · 6:00 PM` */
export function formatEventHomeWhenShort(iso: string): string {
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
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(d);
  return `${weekday}, ${day} ${month} · ${time}`;
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
    <header className={cn('relative space-y-6', className)}>
      <PageBreadcrumb
        className="mb-0"
        items={[
          { label: 'Your Events', href: routes.organize },
          { label: event.title },
        ]}
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8 lg:gap-10 xl:gap-12">
        <PosterThumb
          src={event.posterUrl}
          size="hero"
          className="mx-auto shadow-[0_28px_56px_-18px_rgba(0,0,0,0.8)] sm:mx-0"
        />

        <div className="min-w-0 flex-1 space-y-5 pt-1 sm:space-y-6 sm:pt-3 lg:pt-4">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-text-secondary sm:text-[13px]">
              {eventTypeDisplayLabel(event.eventType)}
            </span>
            <span className="text-text-muted" aria-hidden>
              ·
            </span>
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] sm:text-[11px]',
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

          <h1 className="display-title max-w-[16ch] text-[3rem] leading-[0.88] tracking-[0.03em] text-text-primary sm:text-6xl md:text-7xl lg:text-[4.75rem] xl:text-[5.25rem]">
            {event.title}
          </h1>

          <div className="space-y-2.5 text-[15px] text-text-secondary sm:text-base lg:text-[17px]">
            {when ? (
              <p className="flex items-center gap-2.5">
                <ByndIcon name="calendar" className="size-4 shrink-0 text-text-muted" />
                <span>{when}</span>
              </p>
            ) : null}
            {place ? (
              <p className="flex items-center gap-2.5">
                <ByndIcon name="pin" className="size-4 shrink-0 text-text-muted" />
                <span>{place}</span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!isDraft ? (
              <Button
                asChild
                size="lg"
                className="h-12 min-w-[9.5rem] rounded-xl px-7 text-sm font-semibold tracking-[0.12em] sm:h-[3.25rem] sm:min-w-[11rem] sm:px-8 sm:text-[15px]"
              >
                <Link href={checkInHref}>
                  <ByndIcon name="checkIn" className="size-5" />
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
                className="h-12 min-w-[7.5rem] rounded-xl border-[#2a2a2a] bg-[#141414]/70 px-6 text-sm tracking-[0.12em] hover:border-accent/35 sm:h-[3.25rem] sm:min-w-[8.5rem] sm:px-7 sm:text-[15px]"
              >
                <ByndIcon name="external" className="size-5" />
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
                className="h-12 min-w-[7rem] rounded-xl border-[#2a2a2a] bg-[#141414]/70 px-6 text-sm tracking-[0.12em] hover:border-accent/35 sm:h-[3.25rem] sm:px-7 sm:text-[15px]"
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
