import type { Metadata } from 'next';

import { SectionPlaceholder } from '@/features/navigation/SectionPlaceholder';

export const metadata: Metadata = { title: 'Tickets' };

export default function TicketsPage() {
  return (
    <SectionPlaceholder
      kicker="My events"
      title="Tickets"
      body="Confirmed registrations and QR tokens will live here after Razorpay webhooks flip a hold to paid."
    />
  );
}
