import { Bynd8EmptyArtwork } from '@/components/illustrations/Bynd8EmptyArtwork';
import { cn } from '@/lib/utils';

/** Eight BYND8 empty scenes + legacy aliases used across the app. */
export type EmptyIllustrationKind =
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
  | 'cancelled';

type Props = {
  kind: EmptyIllustrationKind;
  className?: string;
};

/**
 * Empty artwork — production public SVGs (transparent, no card chrome).
 * Kept as a thin wrapper so existing call sites keep working.
 */
export function EmptyIllustration({ kind, className }: Props) {
  return (
    <Bynd8EmptyArtwork
      kind={kind}
      className={cn(className)}
    />
  );
}
