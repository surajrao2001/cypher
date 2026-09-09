import type { Metadata } from 'next';

import { TicketsBoard } from '@/features/tickets/TicketsBoard';

export const metadata: Metadata = { title: 'Tickets' };

export default function TicketsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <h1 className="display-title text-5xl md:text-7xl">Tickets</h1>
      <p className="mt-3 max-w-xl text-sm text-text-secondary">
        Your wallet — holds, upcoming passes, and past nights.
      </p>
      <TicketsBoard />
    </div>
  );
}
