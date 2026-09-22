'use client';

import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { isLiveCompanionRelevant } from '@/features/live/live-view-model';

/**
 * Contextual Live CTA for Event Details.
 * Uses listMyRegistrations once — no Live API poll on the public page.
 */
export function EventLiveEntryCta({
  eventId,
  eventSlug,
  startTime,
}: {
  eventId: string;
  eventSlug: string;
  startTime: string;
}) {
  const { api, status, token } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      setShow(false);
      return;
    }
    if (!isLiveCompanionRelevant(startTime)) {
      setShow(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.listMyRegistrations();
        const hit = res.items.some(
          (r) =>
            r.eventId === eventId &&
            r.registrationStatus === 'confirmed',
        );
        if (!cancelled) setShow(hit);
      } catch {
        if (!cancelled) setShow(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, eventId, startTime, status, token]);

  if (!show) return null;

  return (
    <Button
      asChild
      className="h-9 rounded-md px-3 text-[12px] font-semibold normal-case tracking-normal"
    >
      <Link href={routes.eventLive(eventSlug)}>Event Live</Link>
    </Button>
  );
}
