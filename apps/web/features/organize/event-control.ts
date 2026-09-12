import type {
  EventStatus,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
  OrganizerMemberRole,
} from '@cypher/contracts';

export type ControlDest = 'home' | 'people' | 'entry' | 'money';

export function statusLabel(status: EventStatus): string {
  switch (status) {
    case 'published':
      return 'Live';
    case 'draft':
      return 'Draft';
    case 'registration_closed':
      return 'Registration closed';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function canPublish(role: OrganizerMemberRole): boolean {
  return role === 'owner' || role === 'manager';
}

export function hasPaidEntry(event: OrganizerEventDetailDto): boolean {
  return (event.categories ?? []).some((c) => (c.currentPriceMinor ?? c.priceMinor) > 0);
}

export function isFreeOnlyEvent(event: OrganizerEventDetailDto): boolean {
  const cats = event.categories ?? [];
  if (cats.length === 0) return true;
  return cats.every((c) => (c.currentPriceMinor ?? c.priceMinor) === 0);
}

/** Local calendar day of start matches today — safe for check-in prominence. */
export function isEventDay(startIso: string, now = new Date()): boolean {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return false;
  return (
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate()
  );
}

export function isPastEvent(event: OrganizerEventDetailDto, now = new Date()): boolean {
  if (event.status === 'completed' || event.status === 'cancelled') return true;
  const end = event.endTime ? new Date(event.endTime) : new Date(event.startTime);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() < now.getTime() - 12 * 60 * 60 * 1000;
}

export function moneyFromRegistrations(regs: OrganizerEventRegistrationsResponse | null): {
  collectedMinor: number;
  pendingMinor: number;
  refundedMinor: number;
} {
  if (!regs) return { collectedMinor: 0, pendingMinor: 0, refundedMinor: 0 };
  let collectedMinor = 0;
  let pendingMinor = 0;
  let refundedMinor = 0;
  for (const row of regs.items) {
    if (row.paymentStatus === 'paid') collectedMinor += row.totalAmountMinor;
    if (row.registrationStatus === 'pending_payment' || row.paymentStatus === 'pending') {
      pendingMinor += row.totalAmountMinor;
    }
    if (
      row.paymentStatus === 'refunded' ||
      row.paymentStatus === 'partially_refunded' ||
      row.registrationStatus === 'refunded'
    ) {
      refundedMinor += row.totalAmountMinor;
    }
  }
  return { collectedMinor, pendingMinor, refundedMinor };
}

export type AttentionItem = {
  id: string;
  title: string;
  body: string;
  dest?: ControlDest;
  href?: string;
};

export function buildAttention(args: {
  event: OrganizerEventDetailDto;
  payoutReady: boolean | null;
  orgSlug: string;
}): AttentionItem[] {
  const { event, payoutReady, orgSlug } = args;
  const items: AttentionItem[] = [];
  const paid = hasPaidEntry(event);

  if (paid && payoutReady === false) {
    items.push({
      id: 'payout',
      title: 'Payout setup',
      body: 'Required before paid registrations can settle.',
      dest: 'money',
      href: `/organize/${orgSlug}/payouts`,
    });
  }

  if (event.status === 'draft') {
    if (!event.title?.trim() || !event.city?.trim() || !event.startTime) {
      items.push({
        id: 'basics',
        title: 'Event details',
        body: 'Add name, city, and start time before putting it up.',
        href: 'edit',
      });
    }
  }

  const compete =
    event.competeCategories ?? (event.categories ?? []).filter((c) => c.entryType !== 'viewer');
  for (const cat of compete) {
    const left = Math.max(0, cat.capacity - cat.confirmedCount - cat.reservedCount);
    if (cat.capacity > 0 && left === 0) {
      items.push({
        id: `full-${cat.id}`,
        title: cat.name,
        body: 'Sold out',
        dest: 'entry',
      });
    } else if (cat.capacity > 0 && left <= Math.max(3, Math.floor(cat.capacity * 0.1))) {
      items.push({
        id: `low-${cat.id}`,
        title: cat.name,
        body: `${String(left)} spots left`,
        dest: 'entry',
      });
    }
  }

  return items;
}

export function legacyTabToDest(tab: string | null): ControlDest {
  switch (tab) {
    case 'registrations':
      return 'people';
    case 'entry':
      return 'entry';
    case 'payouts':
      return 'money';
    case 'updates':
    case 'media':
    case 'page':
    case 'overview':
    case 'home':
    default:
      return 'home';
  }
}
