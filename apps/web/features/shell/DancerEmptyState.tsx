import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  EmptyIllustration,
  type EmptyIllustrationKind,
} from '@/components/illustrations/EmptyIllustration';
import { Button } from '@/components/ui/button';
import { routes } from '@cypher/contracts';
import { loginUrl } from '@/lib/auth-routes';
import { cn } from '@/lib/utils';

export type DancerEmptyVariant =
  | 'discoverGuest'
  | 'eventsGuest'
  | 'organizeGuest'
  | 'profileGuest'
  | 'discoverLocation'
  | 'eventsSaved'
  | 'organizeCreate'
  | 'profileSetup';

const COPY: Record<
  DancerEmptyVariant,
  {
    illustration: EmptyIllustrationKind;
    title: string;
    body: string;
  }
> = {
  discoverGuest: {
    illustration: 'discoverGuest',
    title: "Discover what's next",
    body: 'Sign in to explore amazing events, battles, workshops and more from around you.',
  },
  eventsGuest: {
    illustration: 'eventsGuest',
    title: 'Events are waiting',
    body: 'Sign in to view event details, lineups, locations and to save your favourites.',
  },
  organizeGuest: {
    illustration: 'organizeGuest',
    title: 'Got an event in mind?',
    body: 'Sign in to create and manage your events, reach the right audience and bring your ideas to life.',
  },
  profileGuest: {
    illustration: 'profileGuest',
    title: 'Your BYND8 profile',
    body: 'Sign in to save events, manage your passes, set your interests and be part of the community.',
  },
  discoverLocation: {
    illustration: 'discoverLocation',
    title: 'No events here yet',
    body: "We couldn't find any events near you right now. Try changing your location or check back soon.",
  },
  eventsSaved: {
    illustration: 'eventsSaved',
    title: "You haven't saved any events yet",
    body: 'Explore events and tap the heart icon to save them here.',
  },
  organizeCreate: {
    illustration: 'organizeCreate',
    title: "You haven't created any events yet",
    body: 'Start organizing your first event and bring your community together.',
  },
  profileSetup: {
    illustration: 'profileSetup',
    title: "Let's set up your profile",
    body: 'Add a few details to personalize your profile, and get better event recommendations.',
  },
};

const btnPrimary =
  'h-11 rounded-md bg-accent px-6 text-[13px] font-semibold normal-case tracking-normal text-white hover:bg-accent-hover';
const btnSecondary =
  'h-11 rounded-md border-0 bg-[#1C1C1C] px-6 text-[13px] font-semibold normal-case tracking-normal text-white hover:bg-[#262626]';

type DancerEmptyStateProps = {
  variant: DancerEmptyVariant;
  className?: string;
  /** Optional override actions (defaults match the reference). Pass null to hide. */
  actions?: ReactNode | null;
  /** For location empty — clear city filter */
  onChangeLocation?: () => void;
};

/**
 * Centered dancer empty — exact reference layout/copy; bare SVG (no banner/card).
 * Sign up + Log in both route to magic-link / Google login.
 */
export function DancerEmptyState({
  variant,
  className,
  actions,
  onChangeLocation,
}: DancerEmptyStateProps) {
  const copy = COPY[variant];

  return (
    <div
      className={cn(
        'flex min-h-[min(70vh,36rem)] w-full flex-col items-center justify-center px-4 py-12 text-center',
        className,
      )}
    >
      <div className="mb-6 w-full max-w-[20rem]">
        <EmptyIllustration kind={copy.illustration} />
      </div>
      <h2 className="max-w-[18ch] text-[1.65rem] font-bold leading-tight tracking-tight text-white sm:text-[1.85rem]">
        {copy.title}
      </h2>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/55 sm:text-[15px]">
        {copy.body}
      </p>
      {actions === null ? null : (
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {actions ?? <DefaultActions variant={variant} onChangeLocation={onChangeLocation} />}
        </div>
      )}
    </div>
  );
}

function DefaultActions({
  variant,
  onChangeLocation,
}: {
  variant: DancerEmptyVariant;
  onChangeLocation?: () => void;
}) {
  switch (variant) {
    case 'discoverGuest':
      return (
        <>
          <Button asChild className={btnPrimary}>
            <Link href={loginUrl(routes.discover)}>Sign up</Link>
          </Button>
          <Button asChild className={btnSecondary}>
            <Link href={loginUrl(routes.discover)}>Log in</Link>
          </Button>
        </>
      );
    case 'eventsGuest':
      return (
        <>
          <Button asChild className={btnPrimary}>
            <Link href={loginUrl(routes.events)}>Sign up</Link>
          </Button>
          <Button asChild className={btnSecondary}>
            <Link href={loginUrl(routes.events)}>Log in</Link>
          </Button>
        </>
      );
    case 'organizeGuest':
      return (
        <>
          <Button asChild className={btnPrimary}>
            <Link href={loginUrl(routes.organize)}>Sign up</Link>
          </Button>
          <Button asChild className={btnSecondary}>
            <Link href={loginUrl(routes.organize)}>Log in</Link>
          </Button>
        </>
      );
    case 'profileGuest':
      return (
        <>
          <Button asChild className={btnPrimary}>
            <Link href={loginUrl(routes.profile)}>Sign up</Link>
          </Button>
          <Button asChild className={btnSecondary}>
            <Link href={loginUrl(routes.profile)}>Log in</Link>
          </Button>
        </>
      );
    case 'discoverLocation':
      return (
        <>
          <Button
            type="button"
            className={btnSecondary}
            onClick={() => onChangeLocation?.()}
          >
            Change location
          </Button>
          <Button asChild className={btnSecondary}>
            <Link href={routes.events}>Browse all events</Link>
          </Button>
        </>
      );
    case 'eventsSaved':
      return (
        <Button asChild className={btnPrimary}>
          <Link href={routes.discover}>Explore Events</Link>
        </Button>
      );
    case 'organizeCreate':
      return (
        <Button asChild className={btnPrimary}>
          <Link href={`${routes.organize}/create`}>Create an Event</Link>
        </Button>
      );
    case 'profileSetup':
      return (
        <Button asChild className={btnPrimary}>
          <Link href={routes.profile}>Complete Profile</Link>
        </Button>
      );
    default:
      return null;
  }
}
