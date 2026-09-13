import type { Metadata } from 'next';

import { EventCard } from '@/features/discovery/EventCard';
import { SceneEmptyBoard } from '@/features/discovery/SceneEmptyBoard';
import { loadEventList } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Events',
};

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const catalog = await loadEventList({ pageSize: 50 });

  if (catalog.items.length === 0) {
    return (
      <div className="px-4 py-6 md:px-6 md:py-8">
        <SceneEmptyBoard surface="events" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        <span className="size-1.5 rounded-full bg-accent" aria-hidden />
        All floors
      </p>
      <h1 className="display-title mt-2 text-5xl md:text-7xl">Events</h1>
      <p className="mt-3 max-w-xl text-sm text-text-secondary">
        Every published battle, jam, workshop, and showcase currently on the board.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {catalog.items.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
