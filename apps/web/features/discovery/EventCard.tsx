'use client';

import type { EventCardDto } from '@cypher/contracts';
import { formatEventDate } from '@cypher/utils';
import Link from 'next/link';

import { ByndIcon } from '@/components/icons/bynd8';
import { EventPoster } from '@/features/discovery/EventPoster';
import { eventDayMoment } from '@/features/shell/event-day';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: EventCardDto;
  /** Poster tile (discover grid) vs compact feed row */
  variant?: 'poster' | 'row';
}

function typeLabel(eventType: string): string {
  const t = eventType.toLowerCase();
  if (t.includes('jam') || t.includes('cypher')) return 'JAM / CYPHER';
  if (t.includes('workshop')) return 'WORKSHOP';
  if (t.includes('session')) return 'SESSION';
  if (t.includes('battle')) return 'BATTLE';
  return eventType.toUpperCase();
}

export function EventCard({ event, variant = 'poster' }: EventCardProps) {
  const day = eventDayMoment(event.startTime);
  const liveBadge = day === 'tonight' || day === 'today';
  const place = [event.venue, event.city].filter(Boolean).join(', ') || event.city;
  const tagLine = (event.tags.length ? event.tags : event.styles).slice(0, 3);

  if (variant === 'row') {
    return (
      <article className="group">
        <Link
          href={`/events/${event.slug}`}
          className="flex gap-2.5 overflow-hidden rounded-md border border-white/[0.08] bg-[#121212] p-1.5 transition-colors hover:border-white/14"
        >
          <div className="relative h-[4.25rem] w-[3.15rem] shrink-0 overflow-hidden rounded bg-[#0D0E0D]">
            <EventPoster title={event.title} src={event.posterUrl} sizes="56px" />
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
                {typeLabel(event.eventType)}
              </p>
              {liveBadge ? (
                <span className="rounded-sm bg-accent-2 px-1 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-bg">
                  Live
                </span>
              ) : null}
            </div>
            <h3 className="mt-0.5 truncate font-display text-base uppercase tracking-[0.04em] text-text-primary">
              {event.title}
            </h3>
            <p className="mt-0.5 text-[10px] text-white/50">
              {formatEventDate(event.startTime)} · {event.city}
            </p>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group">
      <Link
        href={`/events/${event.slug}`}
        className="block overflow-hidden rounded-lg border border-white/[0.08] bg-[#121212] transition-colors hover:border-white/14"
      >
        {/* Poster plane — title + chrome live on the image (matches reference cards) */}
        <div className="relative aspect-[5/4] overflow-hidden bg-[#0D0E0D]">
          <EventPoster
            title={event.title}
            src={event.posterUrl}
            sizes="(max-width: 640px) 45vw, (max-width: 1280px) 18vw, 160px"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/35"
          />

          <span className="absolute left-2 top-2 font-display text-[10px] tracking-[0.08em] text-white/90">
            BYND8
          </span>

          {tagLine.length > 0 ? (
            <div className="absolute right-2 top-2 flex max-w-[40%] flex-col items-end gap-0.5 text-right">
              {tagLine.map((tag) => (
                <span
                  key={tag}
                  className="text-[7px] font-semibold uppercase leading-tight tracking-[0.12em] text-white/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="absolute inset-x-2 bottom-7 top-7 flex items-center justify-center px-1">
            <p className="display-title line-clamp-3 text-center text-[1.05rem] leading-[0.92] tracking-[0.03em] text-accent sm:text-[1.15rem]">
              {event.title}
            </p>
          </div>

          {liveBadge ? (
            <span className="absolute bottom-2 left-2 rounded-sm bg-accent-2 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-bg">
              Live
            </span>
          ) : null}
        </div>

        {/* Meta footer — below poster */}
        <div className="space-y-1 px-2.5 py-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
              {typeLabel(event.eventType)}
            </p>
            {liveBadge ? (
              <span className="rounded-sm bg-accent-2 px-1 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-bg">
                Live
              </span>
            ) : null}
          </div>
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">
            {event.title}
          </h3>
          <p className="flex items-start gap-1 text-[10px] leading-snug text-white/50">
            <ByndIcon name="calendar" className="mt-0.5 size-3 shrink-0 opacity-70" />
            <span>{formatEventDate(event.startTime)}</span>
          </p>
          <p className={cn('flex items-start gap-1 text-[10px] leading-snug text-accent')}>
            <ByndIcon name="pin" className="mt-0.5 size-3 shrink-0" />
            <span className="line-clamp-1">{place}</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
