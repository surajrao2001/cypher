import type { Metadata } from 'next';

import { TicketsBoard } from '@/features/tickets/TicketsBoard';

export const metadata: Metadata = { title: 'Tickets' };

export default function TicketsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <p className="kicker text-accent">My events</p>
      <h1 className="display-title mt-2 text-5xl md:text-7xl">Tickets</h1>
      <p className="mt-3 max-w-xl text-sm text-text-secondary">
        Confirmed registrations with a registration code and QR. Scanning/check-in comes later.
      </p>
      <TicketsBoard />
    </div>
  );
}
