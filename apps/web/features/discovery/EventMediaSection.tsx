import type { EventMediaLinkDto } from '@cypher/contracts';
import { ExternalLink } from 'lucide-react';

export function EventMediaSection({ links }: { links: EventMediaLinkDto[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <p className="kicker text-accent">Watch</p>
      <h2 className="font-display text-3xl uppercase tracking-[0.04em]">Event media</h2>
      <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-elevated"
            >
              <div className="min-w-0">
                <p className="font-semibold text-text-primary">{link.title}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{link.kind}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
