import { routes } from '@cypher/contracts';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/features/shell/EmptyState';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center px-4 md:px-8">
      <EmptyState
        kicker="404"
        title="Cypher not found"
        body="That battle isn’t on the board. Head back to Discover and pick a floor that’s still open."
        className="w-full max-w-2xl"
      >
        <Button asChild>
          <Link href={routes.discover}>Back to Discover</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
