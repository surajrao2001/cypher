'use client';

import { formatEventDate } from '@cypher/utils';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { spotsTone, type MockEvent } from '@/features/discovery/mock-events';

interface HeroCarouselProps {
  events: MockEvent[];
}

export function HeroCarousel({ events }: HeroCarouselProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = events.length;
  const current = count > 0 ? events[index % count] : undefined;

  useEffect(() => {
    if (paused || reduceMotion || count < 2) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [paused, reduceMotion, count]);

  if (!current) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-border bg-surface text-sm text-text-muted">
        No featured battles in this city yet.
      </div>
    );
  }

  const tone = spotsTone(current.spotsConfirmed, current.spotsCapacity);

  function go(delta: number) {
    if (count === 0) return;
    setIndex((prev) => (prev + delta + count) % count);
  }

  return (
    <section
      className="relative overflow-hidden rounded-lg border border-border bg-elevated shadow-poster"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured events"
    >
      <div className="relative min-h-[22rem] md:min-h-[28rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="poster-grain absolute inset-0">
              <Image
                src={current.posterUrl}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/30" />
            </div>
            <div className="relative z-10 flex min-h-[22rem] flex-col justify-end gap-4 p-5 md:min-h-[28rem] md:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="lime">{current.styles[0]}</Badge>
                <Badge variant="muted">{current.city}</Badge>
                <span className={`font-body text-xs font-semibold uppercase tracking-[0.14em] ${tone.className}`}>
                  {tone.label}
                </span>
              </div>
              <p className="kicker text-accent">{current.kicker}</p>
              <h2 className="display-title max-w-3xl text-5xl md:text-7xl">{current.title}</h2>
              <p className="flex max-w-xl items-center gap-2 font-body text-sm text-text-secondary md:text-base">
                <MapPin className="h-4 w-4 text-accent" />
                {current.venue} · {formatEventDate(current.startTime)}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href={`/events/${current.slug}`}>Register now</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={`/events/${current.slug}`}>Event details</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute right-4 top-4 z-20 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 bg-bg/70 backdrop-blur-sm"
          onClick={() => go(-1)}
          aria-label="Previous featured event"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-9 w-9 bg-bg/70 backdrop-blur-sm"
          onClick={() => go(1)}
          aria-label="Next featured event"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2" role="tablist" aria-label="Slides">
        {events.map((event, slideIndex) => {
          const active = slideIndex === index % count;
          return (
            <button
              key={event.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Show ${event.title}`}
              className={
                active
                  ? 'h-1.5 w-8 rounded-full bg-accent'
                  : 'h-1.5 w-3 rounded-full bg-text-muted/50 hover:bg-text-secondary'
              }
              onClick={() => setIndex(slideIndex)}
            />
          );
        })}
      </div>
    </section>
  );
}
