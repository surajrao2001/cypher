import { routes } from '@cypher/contracts';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Check-in' };

export default function CheckInStubPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-16 md:px-8">
      <p className="kicker text-accent">Check-in</p>
      <h1 className="display-title text-5xl">Check-in</h1>
      <p className="text-sm leading-relaxed text-text-secondary">
        Check-in belongs to a specific event. Open an event from Your Events to scan passes or enter
        registration codes.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={routes.organize}>Your Events</Link>
        </Button>
      </div>
    </div>
  );
}
