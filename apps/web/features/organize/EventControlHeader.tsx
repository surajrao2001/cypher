'use client';

import type { OrganizerDto, OrganizerEventDetailDto, OrganizerMemberRole } from '@cypher/contracts';
import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useState } from 'react';

import { ByndIcon } from '@/components/icons/bynd8';
import { Button } from '@/components/ui/button';
import { canPublish, statusLabel } from '@/features/organize/event-control';
import { PageBreadcrumb } from '@/features/shell/PageBreadcrumb';
import { cn } from '@/lib/utils';

function formatHomeWhen(iso: string): string {
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
  return `${weekday}, ${day} ${month} • ${time}`;
}

function eventTypeLabel(type: string): string {
  if (type === 'cypher') return 'Jam';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

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
  const place = [event.venue, event.city].filter(Boolean).join(', ');
  const when = formatHomeWhen(event.startTime);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageBreadcrumb
          className="mb-0"
          items={[
            { label: 'Your Events', href: routes.organize },
            { label: event.title },
          ]}
        />

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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
          {!isDraft ? (
            <Button asChild size="lg" className="h-11 rounded-xl px-5 text-xs tracking-[0.14em]">
              <Link href={checkInHref}>
                <ByndIcon name="checkIn" />
                Check in
              </Link>
            </Button>
          ) : null}
          <div className="relative">
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="More actions"
              onClick={() => setMenuOpen((o) => !o)}
              className="size-11 rounded-xl border-[#2a2a2a]"
            >
              <span className="text-lg leading-none tracking-widest" aria-hidden>
                ···
              </span>
            </Button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 min-w-[11rem] rounded-xl border border-border bg-surface py-1 shadow-lg"
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

      {shareHint ? <p className="text-xs text-accent-2">{shareHint}</p> : null}

      <div className="space-y-4 pt-1">
        <div className="flex flex-wrap items-center gap-2">
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
            {statusLabel(event.status).toUpperCase()}
          </span>
          <span className="inline-flex rounded-full border border-[#2a2a2a] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary">
            {eventTypeLabel(event.eventType)}
          </span>
        </div>
        <h1 className="display-title text-[2.75rem] leading-[0.9] tracking-[0.04em] sm:text-6xl md:text-7xl">
          {event.title}
        </h1>
        <p className="text-[15px] text-text-secondary sm:text-base">
          {[when, place].filter(Boolean).join(' • ')}
        </p>
      </div>
    </header>
  );
}
