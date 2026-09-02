import type { Metadata } from 'next';
import { Ticket } from 'lucide-react';

import { routes } from '@cypher/contracts';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/features/shell/EmptyState';

export const metadata: Metadata = { title: 'Tickets' };

export default function TicketsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <p className="kicker text-accent">My events</p>
      <h1 className="display-title mt-2 text-5xl md:text-7xl">Tickets</h1>
      <p className="mt-3 max-w-xl text-sm text-text-secondary">
        Confirmed registrations and QR tokens land here after Razorpay marks a hold paid.
      </p>
      <EmptyState
        className="mt-10"
        kicker="Wallet"
        title="No tickets yet"
        body="Register for a night. Your pass shows up here with a signed QR once payment clears — scanning is Phase 3."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href={routes.discover}>
              <Ticket className="h-4 w-4" />
              Find a cypher
            </Link>
          </Button>
        </div>
      </EmptyState>
    </div>
  );
}
