import { routes } from '@cypher/contracts';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center px-6">
      <p className="kicker text-accent">404</p>
      <h1 className="display-title mt-2 text-6xl">Cypher not found</h1>
      <p className="mt-3 max-w-md text-text-secondary">
        That battle isn’t on the board. Head back to Discover and pick a floor that’s still open.
      </p>
      <Link
        href={routes.discover}
        className="mt-6 inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 font-body text-sm font-semibold uppercase tracking-[0.14em] text-white hover:bg-accent-hover"
      >
        Back to Discover
      </Link>
    </div>
  );
}
