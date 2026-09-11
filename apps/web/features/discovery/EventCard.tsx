'use client';

import type { EventCardDto } from '@cypher/contracts';
import { formatEventDate } from '@cypher/utils';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';

import { EventPoster } from '@/features/discovery/EventPoster';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: EventCardDto;
  /** Poster tile (discover grid) vs compact feed row */
  variant?: 'poster' | 'row';
}

export function EventCard({ event, variant = 'poster' }: EventCardProps) {
  const reduceMotion = useReducedMotion();

  if (variant === 'row') {
    return (
      <motion.article
        whileHover={reduceMotion ? undefined : { x: 2 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="group"
      >
        <Link
          href={`/events/${event.slug}`}
          className="flex gap-3 overflow-hidden rounded-xl border border-border bg-surface p-2.5 transition-colors hover:border-accent/40"
        >
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-elevated sm:h-24 sm:w-20">
            <EventPoster title={event.title} src={event.posterUrl} sizes="80px" />
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
              {event.eventType}
            </p>
            <h3 className="mt-0.5 truncate font-display text-xl uppercase tracking-[0.04em] text-text-primary">
              {event.title}
            </h3>
            <p className="mt-1 text-xs text-text-secondary">
              {formatEventDate(event.startTime)} · {event.city}
            </p>
          </div>
          <p className="shrink-0 self-center pr-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Open
          </p>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group h-full"
    >
      <Link
        href={`/events/${event.slug}`}
        className={cn(
          'relative block aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-elevated',
        )}
      >
        <EventPoster
          title={event.title}
          src={event.posterUrl}
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 280px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-bg sm:left-3 sm:top-3">
          {event.eventType}
        </span>
        <div className="absolute inset-x-0 bottom-0 space-y-1 p-3 sm:p-4">
          <h3 className="display-title text-xl leading-[0.95] text-text-primary sm:text-2xl md:text-3xl">
            {event.title}
          </h3>
          <p className="text-[11px] text-text-secondary sm:text-xs">
            {formatEventDate(event.startTime)} · {event.city}
          </p>
          {event.styles[0] || event.crew ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent sm:text-xs">
              {event.styles[0] ?? event.crew}
            </p>
          ) : null}
        </div>
      </Link>
    </motion.article>
  );
}
