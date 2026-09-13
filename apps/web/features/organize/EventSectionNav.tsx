'use client';

import { routes } from '@cypher/contracts';
import { useRouter } from 'next/navigation';

import { EventControlNav } from '@/features/organize/EventControlNav';
import { hasPaidEntry } from '@/features/organize/event-control';
import type { ControlDest } from '@/features/organize/event-control';
import type { OrganizerEventDetailDto } from '@cypher/contracts';

/** Shared HOME / PEOPLE / ENTRY / MONEY nav for dedicated event sub-routes. */
export function EventSectionNav({
  slug,
  eventId,
  event,
  active,
}: {
  slug: string;
  eventId: string;
  event: OrganizerEventDetailDto;
  active: ControlDest;
}) {
  const router = useRouter();
  const showMoney = hasPaidEntry(event);
  const manageHref = `${routes.organize}/${slug}/events/${eventId}`;

  function onChange(next: ControlDest) {
    if (next === 'home') {
      router.push(manageHref);
      return;
    }
    if (next === 'people') {
      router.push(routes.organizeEventPeople(slug, eventId));
      return;
    }
    if (next === 'entry') {
      router.push(routes.organizeEventEntry(slug, eventId));
      return;
    }
    if (next === 'money') {
      router.push(`${manageHref}?tab=money`);
    }
  }

  return <EventControlNav active={active} onChange={onChange} showMoney={showMoney} />;
}
