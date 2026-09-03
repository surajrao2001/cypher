'use client';

import type { EventCardDto } from '@cypher/contracts';
import { formatEventDate } from '@cypher/utils';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { spotsTone } from '@/features/discovery/mock-events';

interface NextUpListProps {
  events: EventCardDto[];
}

export function NextUpList({ events }: NextUpListProps) {
  const reduceMotion = useReducedMotion();

  return (
    <aside className="rounded-lg border border-border bg-surface p-4">
      <p className="kicker">Tonight & this week</p>
      <h2 className="display-title mt-1 text-3xl">Next up</h2>
      <ul className="mt-4 space-y-3">
        {events.length === 0 ? (
          <li className="text-sm text-text-muted">Nothing queued for this filter.</li>
        ) : (
          events.map((event) => {
            const tone = spotsTone(event.spotsConfirmed, event.spotsCapacity);
            return (
              <li key={event.id}>
                <motion.div whileHover={reduceMotion ? undefined : { x: 3 }} transition={{ duration: 0.15 }}>
                  <Link
                    href={`/events/${event.slug}`}
                    className="flex gap-3 rounded-md border border-transparent p-1.5 hover:border-border hover:bg-elevated"
                  >
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-sm bg-elevated">
                      {event.posterUrl ? (
                        <Image
                          src={event.posterUrl}
                          alt=""
                          fill
                          unoptimized
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg uppercase tracking-[0.04em] leading-none">
                        {event.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-text-secondary">
                        {event.city} · {formatEventDate(event.startTime)}
                      </p>
                      <p className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tone.className}`}>
                        {tone.label}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
