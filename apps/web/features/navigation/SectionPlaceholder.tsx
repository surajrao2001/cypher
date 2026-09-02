import { Compass } from 'lucide-react';

interface SectionPlaceholderProps {
  kicker: string;
  title: string;
  body: string;
}

export function SectionPlaceholder({ kicker, title, body }: SectionPlaceholderProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-4 py-16 md:px-8">
      <p className="kicker text-accent">{kicker}</p>
      <h1 className="display-title text-6xl md:text-7xl">{title}</h1>
      <p className="max-w-md text-base text-text-secondary">{body}</p>
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-text-muted">
        <Compass className="h-4 w-4 text-accent" />
        Live in Discover while this floor gets wired.
      </p>
    </div>
  );
}
