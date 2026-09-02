'use client';

import { formatEventDate } from '@cypher/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { EventPoster } from '@/features/discovery/EventPoster';
import { spotsTone, type MockEvent } from '@/features/discovery/mock-events';

interface EventCardProps {
  event: MockEvent;
}

export function EventCard({ event }: EventCardProps) {
  const reduceMotion = useReducedMotion();
  const tone = spotsTone(event.spotsConfirmed, event.spotsCapacity);
  const start = new Date(event.startTime);
  const day = start.toLocaleDateString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' });
  const month = start.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' });

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group h-full"
    >
      <Link
        href={`/events/${event.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-poster"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-elevated">
          <EventPoster
            title={event.title}
            src={event.posterUrl}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 280px"
          />
          <div className="absolute left-3 top-3 flex h-14 w-12 flex-col items-center justify-center rounded-sm bg-bg/90 text-center ring-1 ring-border">
            <span className="font-body text-[9px] font-semibold uppercase tracking-[0.18em] text-accent">
              {month}
            </span>
            <span className="font-display text-2xl leading-none text-text-primary">{day}</span>
          </div>
          <Badge variant="lime" className="absolute right-3 top-3">
            {event.styles[0]}
          </Badge>
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="kicker text-accent-2">{event.kicker}</p>
            <h3 className="display-title mt-1 text-[1.65rem]">{event.title}</h3>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <p className="flex items-start gap-1.5 font-body text-sm text-text-secondary">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
            <span>
              {event.venue}
              <span className="text-text-muted"> · {event.city}</span>
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <Calendar className="h-3.5 w-3.5" />
            {formatEventDate(event.startTime)}
          </p>
          <div className="mt-auto flex items-center justify-between pt-1">
            <p className={`font-body text-xs font-semibold uppercase tracking-[0.12em] ${tone.className}`}>
              {tone.label}
            </p>
            <span className="text-[11px] uppercase tracking-[0.14em] text-text-muted">{event.crew}</span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
