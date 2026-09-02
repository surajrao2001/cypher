import type { Metadata } from 'next';

import { EventCard } from '@/features/discovery/EventCard';
import { EmptyState } from '@/features/shell/EmptyState';
import { loadEventList } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Events',
};

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const catalog = await loadEventList({ pageSize: 50 });

  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <p className="kicker text-accent">All floors</p>
      <h1 className="display-title mt-2 text-5xl">Events</h1>
      <p className="mt-3 max-w-xl text-sm text-text-secondary">
        Every published battle, jam, workshop, and showcase currently on the board.
      </p>
      {catalog.items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            kicker="Board"
            title="Nothing published"
            body="The API has no published events yet. Seed the database or check that Nest is running."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {catalog.items.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
