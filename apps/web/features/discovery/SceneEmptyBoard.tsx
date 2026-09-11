'use client';

import { routes } from '@cypher/contracts';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/utils';

type SceneEmptyBoardProps = {
  /** Discover vs Events — same story, slightly different kickers */
  surface?: 'discover' | 'events';
  className?: string;
};

/**
 * Full-board empty when no published events exist.
 * No filters, featured carousel, or empty card chrome — just purpose + CTAs.
 */
export function SceneEmptyBoard({ surface = 'discover', className }: SceneEmptyBoardProps) {
  const { status } = useAuth();
  const signedIn = status === 'authenticated';

  const kicker = surface === 'events' ? 'All floors' : 'Discover';
  const title = surface === 'events' ? 'No nights on the board.' : 'The floor’s quiet — for now.';
  const body =
    surface === 'events'
      ? 'Published battles, jams, and labs will list here. Until then: claim your dancer card, or put your own night live.'
      : 'BYND8 is infrastructure around the floor — discover the night, lock a category, walk in with a pass. Organizers run registrations and the door without five group chats.';

  return (
    <div
      className={cn(
        'flex flex-col gap-8 border-b border-border pb-12 pt-2 md:gap-10 md:pb-16',
        className,
      )}
    >
      <div className="max-w-2xl space-y-4">
        <p className="kicker text-accent">{kicker}</p>
        <h1 className="display-title text-5xl md:text-7xl">{title}</h1>
        <p className="max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">{body}</p>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            Find what’s on — battles, jams, labs with real confirmed spots.
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            Register, pay or confirm free, carry a BYND8 Pass to the door.
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-2" aria-hidden />
            Host a night — categories, registrations, check-in, payouts.
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button asChild size="lg">
          <Link href={signedIn ? routes.organize : `${routes.login}?next=${routes.organize}`}>
            Host a night
          </Link>
        </Button>
        {signedIn ? (
          <>
            <Button asChild size="lg" variant="lime">
              <Link href={routes.profile}>Open dancer card</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={routes.tickets}>My passes</Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild size="lg" variant="lime">
              <Link href={`${routes.login}?next=${routes.discover}`}>Enter the scene</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`${routes.login}?next=${routes.profile}`}>Build your dancer card</Link>
            </Button>
          </>
        )}
      </div>

      <p className="max-w-lg text-xs uppercase tracking-[0.14em] text-text-muted">
        When organizers publish, nights land here first — no empty carousels, no fake filters.
      </p>
    </div>
  );
}
