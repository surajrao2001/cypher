import type { Metadata } from 'next';

import { TicketsBoard } from '@/features/tickets/TicketsBoard';

export const metadata: Metadata = { title: 'Passes' };

export default function TicketsPage() {
  return <TicketsBoard />;
}
