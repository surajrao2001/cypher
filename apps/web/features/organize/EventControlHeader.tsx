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
    <header className={cn('relative space-y-4 sm:space-y-6', className)}>
      <PageBreadcrumb
        className="mb-0"
        items={[
          { label: 'Your Events', href: routes.organize },
          { label: event.title },
        ]}
      />

      <div className="relative flex flex-row items-start gap-3.5 sm:gap-8 lg:gap-10 xl:gap-12">
        <PosterThumb
          src={event.posterUrl}
          size="hero"
          className="shrink-0 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.75)] sm:shadow-[0_28px_56px_-18px_rgba(0,0,0,0.8)]"
        />

        <div className="min-w-0 flex-1 space-y-2.5 pt-0 sm:space-y-6 sm:pt-3 lg:pt-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary sm:text-[13px] sm:tracking-[0.18em]">
              {eventTypeDisplayLabel(event.eventType)}
            </span>
            <span className="text-text-muted" aria-hidden>
              ·
            </span>
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] sm:px-3 sm:py-1 sm:text-[11px] sm:tracking-[0.14em]',
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

          <h1 className="display-title max-w-[16ch] text-[1.65rem] leading-[0.92] tracking-[0.03em] text-text-primary sm:text-6xl sm:leading-[0.88] md:text-7xl lg:text-[4.75rem] xl:text-[5.25rem]">
            {event.title}
          </h1>

          <div className="space-y-1 text-[12px] text-text-secondary sm:space-y-2.5 sm:text-base lg:text-[17px]">
            {when ? (
              <p className="flex items-center gap-1.5 sm:gap-2.5">
                <ByndIcon name="calendar" className="size-3 shrink-0 text-text-muted sm:size-4" />
                <span className="truncate">{when}</span>
              </p>
            ) : null}
            {place ? (
              <p className="flex items-center gap-1.5 sm:gap-2.5">
                <ByndIcon name="pin" className="size-3 shrink-0 text-text-muted sm:size-4" />
                <span className="truncate">{place}</span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5 sm:gap-3 sm:pt-2">
            {!isDraft ? (
              <Button
                asChild
                size="lg"
                className="size-10 rounded-xl p-0 sm:h-[3.25rem] sm:w-auto sm:min-w-[11rem] sm:px-8 sm:text-[15px]"
              >
                <Link href={checkInHref} aria-label="Check in">
                  <ByndIcon name="checkIn" className="size-5" />
                  <span className="hidden sm:inline">Check in</span>
                </Link>
              </Button>
            ) : null}
            {isLive ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => void share()}
                aria-label="Share"
                className="size-10 rounded-xl border-[#2a2a2a] bg-[#141414]/70 p-0 hover:border-accent/35 sm:h-[3.25rem] sm:w-auto sm:min-w-[8.5rem] sm:px-7 sm:text-[15px]"
              >
                <ByndIcon name="external" className="size-5" />
                <span className="hidden sm:inline">Share</span>
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
                className="size-10 rounded-xl border-[#2a2a2a] bg-[#141414]/70 p-0 hover:border-accent/35 sm:h-[3.25rem] sm:w-auto sm:min-w-[7rem] sm:px-7 sm:text-[15px]"
              >
                <span className="text-base leading-none tracking-widest sm:hidden" aria-hidden>
                  ···
                </span>
                <span className="hidden sm:inline">··· More</span>
              </Button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 min-w-[12rem] rounded-xl border border-border bg-surface py-1 shadow-lg"
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
