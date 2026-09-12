import type { Metadata } from 'next';

import { TicketsBoard } from '@/features/tickets/TicketsBoard';

export const metadata: Metadata = { title: 'Passes' };

export default function TicketsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <TicketsBoard />
    </div>
  );
}
