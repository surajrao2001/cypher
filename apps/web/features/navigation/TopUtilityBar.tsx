'use client';

import { routes } from '@cypher/contracts';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { SearchBar } from '@/features/discovery/SearchBar';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthSlotLoading } from '@/features/shell/AsyncState';
import { loginUrl } from '@/lib/auth-routes';

/**
 * Compact top utility row — search + city + auth CTAs (matches BYND8 Discover reference).
 */
export function TopUtilityBar() {
  const auth = useAuth();
  const pathname = usePathname();
  const next = loginUrl(pathname || routes.discover);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
      <SearchBar />

      <div className="flex shrink-0 items-center gap-2">
        {auth.status === 'loading' ? (
          <AuthSlotLoading />
        ) : auth.status === 'authenticated' ? (
          <Button
            asChild
            className="h-10 rounded-md bg-accent px-4 text-[13px] font-semibold normal-case tracking-normal text-white hover:bg-accent/90"
          >
            <Link href={routes.organize}>Continue</Link>
          </Button>
        ) : (
          <>
            <Button
              asChild
              variant="outline"
              className="hidden h-10 rounded-md border-white/25 bg-transparent px-4 text-[13px] font-medium normal-case tracking-normal text-white hover:bg-white/5 sm:inline-flex"
            >
              <Link href={next}>Log in</Link>
            </Button>
            <Button
              asChild
              className="h-10 rounded-md bg-accent px-4 text-[13px] font-semibold normal-case tracking-normal text-white hover:bg-accent/90"
            >
              <Link href={next}>Continue</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
