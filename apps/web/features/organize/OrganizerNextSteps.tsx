'use client';

import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { PayoutSetupPanel } from '@/features/organize/PayoutSetupPanel';
import { cn } from '@/lib/utils';

type Props = {
  organizerId: string;
  orgSlug: string;
  orgName: string;
  isFirstEvent: boolean;
  payoutReady: boolean;
  onPayoutReadyChange?: (ready: boolean) => void;
};

/**
 * Shown only until payouts are connected (or ?payout=1 to reopen setup).
 * Once payoutReady, the org dashboard is events-first — no onboarding wall.
 */
export function OrganizerNextSteps({
  organizerId,
  orgSlug,
  orgName,
  isFirstEvent,
  payoutReady,
  onPayoutReadyChange,
}: Props) {
  const searchParams = useSearchParams();
  const wantPayout = searchParams.get('payout') === '1';
  const [showBank, setShowBank] = useState(!payoutReady || wantPayout);

  useEffect(() => {
    if (wantPayout) {
      setShowBank(true);
    }
  }, [wantPayout]);

  if (payoutReady && !wantPayout) {
    return null;
  }

  return (
    <section
      className={cn(
        'space-y-4 rounded-md border border-accent/40 bg-[radial-gradient(ellipse_at_top_left,rgba(255,104,0,0.08),transparent_55%)] p-4 md:p-5',
      )}
    >
      <div className="space-y-2">
        <p className="kicker text-accent">Payouts</p>
        <h2 className="display-title text-3xl md:text-4xl">
          {payoutReady ? 'Update payout details' : 'Add bank or UPI for paid entries'}
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-text-secondary">
          {payoutReady
            ? 'Your payout account is connected. You can update bank or UPI details here.'
            : 'Needed only when you charge entry or audience fees. Free (₹0) nights work without this.'}
        </p>
      </div>

      {showBank ? (
        <PayoutSetupPanel
          organizerId={organizerId}
          orgName={orgName}
          embedded
          onReadyChange={onPayoutReadyChange}
        />
      ) : (
        <Button type="button" size="lg" onClick={() => setShowBank(true)}>
          Connect bank or UPI
        </Button>
      )}

      {isFirstEvent ? (
        <Button asChild size="lg" variant="secondary">
          <Link href={`${routes.organize}/${orgSlug}/events/new`}>Create first event</Link>
        </Button>
      ) : null}
    </section>
  );
}
