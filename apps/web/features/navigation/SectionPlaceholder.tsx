import { routes } from '@cypher/contracts';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState, FloorHint } from '@/features/shell/EmptyState';

interface SectionPlaceholderProps {
  kicker: string;
  title: string;
  body: string;
}

export function SectionPlaceholder({ kicker, title, body }: SectionPlaceholderProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <EmptyState kicker={kicker} title={title} body={body}>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href={routes.discover}>Find a cypher</Link>
          </Button>
          <FloorHint />
        </div>
      </EmptyState>
    </div>
  );
}
