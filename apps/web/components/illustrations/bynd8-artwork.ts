/**
 * Production BYND8 illustration paths (public SVGs).
 * Phase G battle-day art intentionally omitted.
 */
export const bynd8EmptyArtwork = {
  discoverGuest: '/bynd8/illustrations/empty/discover-guest.svg',
  eventsGuest: '/bynd8/illustrations/empty/events-guest.svg',
  organizeGuest: '/bynd8/illustrations/empty/organize-guest.svg',
  profileGuest: '/bynd8/illustrations/empty/profile-guest.svg',
  discoverEmpty: '/bynd8/illustrations/empty/discover-empty.svg',
  eventsEmpty: '/bynd8/illustrations/empty/events-empty.svg',
  organizeEmpty: '/bynd8/illustrations/empty/organize-empty.svg',
  profileEmpty: '/bynd8/illustrations/empty/profile-empty.svg',
  passesEmpty: '/bynd8/illustrations/empty/passes-empty.svg',
} as const;

export const bynd8EventDayArtwork = {
  checkIn: '/bynd8/illustrations/event-day/check-in.svg',
} as const;

export type Bynd8EmptyArtworkKey = keyof typeof bynd8EmptyArtwork;

/** Map legacy EmptyIllustrationKind / DancerEmptyVariant keys → public SVG. */
export function resolveEmptyArtworkSrc(
  kind:
    | Bynd8EmptyArtworkKey
    | 'discoverGuest'
    | 'eventsGuest'
    | 'organizeGuest'
    | 'profileGuest'
    | 'discoverLocation'
    | 'eventsSaved'
    | 'organizeCreate'
    | 'profileSetup'
    | 'discover'
    | 'filters'
    | 'location'
    | 'events'
    | 'saved'
    | 'passes'
    | 'profile'
    | 'organize'
    | 'signIn'
    | 'cancelled',
): string {
  switch (kind) {
    case 'discoverGuest':
    case 'discover':
      return bynd8EmptyArtwork.discoverGuest;
    case 'eventsGuest':
    case 'signIn':
      return bynd8EmptyArtwork.eventsGuest;
    case 'organizeGuest':
    case 'organize':
      return bynd8EmptyArtwork.organizeGuest;
    case 'profileGuest':
    case 'profile':
      return bynd8EmptyArtwork.profileGuest;
    case 'discoverLocation':
    case 'discoverEmpty':
    case 'location':
    case 'filters':
      return bynd8EmptyArtwork.discoverEmpty;
    case 'eventsSaved':
    case 'eventsEmpty':
    case 'events':
    case 'saved':
      return bynd8EmptyArtwork.eventsEmpty;
    case 'organizeCreate':
    case 'organizeEmpty':
      return bynd8EmptyArtwork.organizeEmpty;
    case 'profileSetup':
    case 'profileEmpty':
      return bynd8EmptyArtwork.profileEmpty;
    case 'passes':
    case 'passesEmpty':
    case 'cancelled':
      return bynd8EmptyArtwork.passesEmpty;
    default:
      return bynd8EmptyArtwork.discoverGuest;
  }
}
