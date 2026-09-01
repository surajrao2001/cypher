'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { routes } from '@cypher/contracts';

export function useDiscoverQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === 'all') next.delete(key);
      else next.set(key, value);
    }
    const target = pathname === routes.discover ? pathname : routes.discover;
    const qs = next.toString();
    router.push(qs ? `${target}?${qs}` : target, { scroll: false });
  }

  return { searchParams, setParams };
}
