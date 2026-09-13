export const orgKeys = {
  all: ['organize'] as const,
  organizersMine: () => [...orgKeys.all, 'organizers', 'mine'] as const,
  organizerSlug: (slug: string) => [...orgKeys.all, 'organizer', 'slug', slug] as const,
  organizerEvents: (orgId: string) => [...orgKeys.all, 'organizer', orgId, 'events'] as const,
  payoutAccount: (orgId: string) =>
    [...orgKeys.all, 'organizer', orgId, 'payout-account'] as const,
  event: (eventId: string) => [...orgKeys.all, 'event', eventId] as const,
  eventRegistrations: (eventId: string) =>
    [...orgKeys.all, 'event', eventId, 'registrations'] as const,
  eventCheckIns: (eventId: string) => [...orgKeys.all, 'event', eventId, 'check-ins'] as const,
  eventUpdates: (eventId: string) => [...orgKeys.all, 'event', eventId, 'updates'] as const,
};
