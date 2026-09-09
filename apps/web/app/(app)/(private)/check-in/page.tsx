import { routes } from '@cypher/contracts';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Check-in' };

export default function CheckInStubPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-16 md:px-8">
      <p className="kicker text-accent">Door ops</p>
      <h1 className="display-title text-5xl">Check-in</h1>
      <p className="text-sm leading-relaxed text-text-secondary">
        Door QR check-in is coming in v1. You’ll scan dancer tickets here on the night — this page is a
        placeholder so organizers can see where that flow will live.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={routes.organize}>Back to Organize</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={routes.tickets}>My tickets</Link>
        </Button>
      </div>
    </div>
  );
}
