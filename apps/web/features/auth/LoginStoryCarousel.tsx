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
    id: 'scattered',
    kicker: 'The problem',
    title: 'The battle lives in five group chats.',
    body: 'Posters in WhatsApp. Entry lists in DMs. By the time you find the floor, spots are gone.',
    imageSrc:
      'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Dancers in a cypher circle under stage lights',
  },
  {
    id: 'register',
    kicker: 'For dancers',
    title: 'Find the night. Hold your spot.',
    body: 'Discover what’s on, register for a category, walk in with a ticket — not a screenshot of a chat.',
    imageSrc:
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Crowd and dancers at a live hip-hop event',
  },
  {
    id: 'organize',
    kicker: 'For organizers',
    title: 'You run the floor. We’ll run what’s around it.',
    body: 'Categories, registrations, payments, tickets — so you can stay on the music, not the spreadsheet.',
    imageSrc:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Concert lights and crowd energy in a dark venue',
  },
  {
    id: 'brand',
    kicker: 'BYND8',
    title: 'Dance is counted in eights. The scene isn’t.',
    body: 'The culture is the centre. BYND8 builds around it — everything beyond the count.',
    imageSrc:
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Festival crowd under dramatic lights',
  },
];

const INTERVAL_MS = 5500;

export function LoginStoryCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      return;
    }
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const slide = SLIDES[index] ?? SLIDES[0];

  return (
    <section
      className="relative hidden h-full min-h-dvh overflow-hidden lg:block"
      aria-roledescription="carousel"
      aria-label="Why BYND8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
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
            src={item.imageSrc}
            alt={item.imageAlt}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </div>
      ))}

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/75 to-[#0B0B0B]/35"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,104,0,0.22),transparent_45%)]"
      />

      <div className="relative z-10 flex h-full min-h-dvh flex-col justify-between p-10 xl:p-14">
        <BrandLogo variant="lockup" size="md" href={null} priority />

        <div className="max-w-xl space-y-5 pb-4">
          <p className="kicker text-accent">{slide.kicker}</p>
          <h2 className="display-title text-5xl leading-[0.95] text-[#F4F2ED] xl:text-6xl">
            {slide.title}
          </h2>
          <p className="max-w-md text-base leading-relaxed text-[#F4F2ED]/80">{slide.body}</p>

          <div className="flex items-center gap-2 pt-4" role="tablist" aria-label="Story slides">
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
