'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { BrandLogo } from '@/components/brand/BrandLogo';
import { cn } from '@/lib/utils';

type StorySlide = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  /** Full-bleed photo — atmosphere for the floor, not a product screenshot. */
  imageSrc: string;
  imageAlt: string;
};

const SLIDES: StorySlide[] = [
  {
    id: 'floor',
    kicker: 'The floor',
    title: 'Who will rule the dance floor?',
    body: 'One cipher. One night. Everyone watching. This is the energy BYND8 is built around.',
    imageSrc: '/login/floor-01.jpg',
    imageAlt: 'Crowd around the floor at a packed battle',
  },
  {
    id: 'scattered',
    kicker: 'The problem',
    title: 'The battle lives in five group chats.',
    body: 'Posters in WhatsApp. Entry lists in DMs. By the time you find the floor, spots are gone.',
    imageSrc: '/login/floor-02.jpg',
    imageAlt: 'Crowd forming a battle circle under stage lights',
  },
  {
    id: 'register',
    kicker: 'For dancers',
    title: 'Find the night. Hold your spot.',
    body: 'Discover what’s on, register for a category, walk in with a pass — not a screenshot of a chat.',
    imageSrc: '/login/floor-03.jpg',
    imageAlt: 'Two dancers battling in a packed hall',
  },
  {
    id: 'organize',
    kicker: 'For organizers',
    title: 'You run the floor. We’ll run what’s around it.',
    body: 'Categories, registrations, tickets, door check-in — so you can stay on the music, not the spreadsheet.',
    imageSrc: '/login/floor-04.jpg',
    imageAlt: 'B-boy freeze in front of a watching crowd',
  },
  {
    id: 'brand',
    kicker: 'BYND8',
    title: 'Dance is counted in eights. The scene isn’t.',
    body: 'The culture is the centre. BYND8 builds around it — everything beyond the count.',
    imageSrc: '/login/floor-05.jpg',
    imageAlt: 'Wide cypher circle from above at a community battle',
  },
];

const INTERVAL_MS = 5500;

export function LoginStoryCarousel() {
  const [index, setIndex] = useState(0);
  /** Pause only while pointer is over the dots / controls — not the whole panel */
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      return;
    }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      return;
    }
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const slide = SLIDES[index] ?? SLIDES[0];
  if (!slide) {
    return null;
  }

  return (
    <section
      className="relative hidden h-full min-h-dvh overflow-hidden lg:block"
      aria-roledescription="carousel"
      aria-label="Why BYND8"
    >
      {SLIDES.map((item, i) => (
        <div
          key={item.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-700 ease-out',
            i === index ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden={i !== index}
        >
          <Image
            src={`${item.imageSrc}?v=2`}
            alt={item.imageAlt}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover opacity-[0.42]"
          />
        </div>
      ))}

      {/* Heavy veil so photos stay atmospheric but copy/logo stay readable */}
      <div aria-hidden className="absolute inset-0 bg-[#0B0B0B]/78" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/70 to-[#0B0B0B]/45"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,104,0,0.18),transparent_45%)]"
      />

      <div className="relative z-10 flex h-full min-h-dvh flex-col justify-between p-10 xl:p-14">
        <BrandLogo variant="lockup" size="md" href={null} priority />

        <div className="max-w-xl space-y-5 pb-4">
          <p className="kicker text-accent">{slide.kicker}</p>
          <h2 className="display-title text-5xl leading-[0.95] text-[#F4F2ED] xl:text-6xl">
            {slide.title}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-[#F4F2ED]/80">{slide.body}</p>

          <div
            className="flex items-center gap-2 pt-4"
            role="tablist"
            aria-label="Story slides"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setPaused(false);
              }
            }}
          >
            {SLIDES.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show slide ${i + 1}: ${item.kicker}`}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === index ? 'w-10 bg-accent' : 'w-3 bg-[#F4F2ED]/35 hover:bg-[#F4F2ED]/55',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
