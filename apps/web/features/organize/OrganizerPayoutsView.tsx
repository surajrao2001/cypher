'use client';

import type { OrganizerDto } from '@cypher/contracts';
import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { PageLoading } from '@/features/shell/AsyncState';
import { PayoutSetupPanel } from './PayoutSetupPanel';

export function OrganizerPayoutsView({ slug }: { slug: string }) {
  const auth = useAuth();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  useEffect(() => {
    void auth.api.getMyOrganizerBySlug(slug).then(setOrg);
  }, [auth.api, slug]);
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-8">
      <div><p className="kicker text-accent">Money in</p><h1 className="display-title text-5xl">Payouts</h1></div>
      <p className="text-sm text-text-secondary">
        Link bank or UPI so paid ticket money can reach this organizer.
      </p>
      {org ? (
        <PayoutSetupPanel organizerId={org.id} orgName={org.orgName} />
      ) : (
        <PageLoading variant="panel" label="Loading payouts" />
      )}
    </div>
  );
}
