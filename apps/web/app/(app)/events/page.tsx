import type { Metadata } from 'next';

import { EventCard } from '@/features/discovery/EventCard';
import { mockEvents } from '@/features/discovery/mock-events';

export const metadata: Metadata = {
  title: 'Events',
};

export default function EventsPage() {
  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <p className="kicker text-accent">All floors</p>
      <h1 className="display-title mt-2 text-5xl">Events</h1>
      <p className="mt-3 max-w-xl text-sm text-text-secondary">
        Every published battle, jam, workshop, and showcase currently on the board.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {mockEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
