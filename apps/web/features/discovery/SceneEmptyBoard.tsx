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
  const title = surface === 'events' ? 'Nothing live yet.' : 'Quiet night on the board.';
  const body =
    surface === 'events'
      ? 'When battles and jams go up, you’ll find them here. Meanwhile — set up your dancer card, or host the first night yourself.'
      : 'This is where upcoming battles, jams, and labs will show. Nothing’s published yet — so start with who you are on the floor, or put your own night live.';

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-2xl flex-col items-start gap-8 border-b border-border pb-12 pt-6 text-left md:gap-10 md:pb-16 md:pt-10',
        className,
      )}
    >
      <div className="w-full max-w-xl space-y-4">
        <p className="kicker text-accent">{kicker}</p>
        <h1 className="display-title text-5xl md:text-7xl">{title}</h1>
        <p className="text-sm leading-relaxed text-text-secondary md:text-base">{body}</p>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li>Coming soon: nights near you, with real spots — not a WhatsApp rumour.</li>
          <li>Sign in so your name’s ready when you register.</li>
          <li>Running a cypher? Host it here and open the door when people show up.</li>
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
    </div>
  );
}
