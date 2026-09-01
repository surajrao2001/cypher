import { ShieldCheck, Ticket, BellRing, Film } from 'lucide-react';

const badges = [
  {
    icon: ShieldCheck,
    title: 'Secure payments',
    body: 'Razorpay checkout. Your card never hits our servers.',
  },
  {
    icon: Ticket,
    title: 'Easy registration',
    body: 'Hold a spot, pay, get a digital ticket in under a minute.',
  },
  {
    icon: BellRing,
    title: 'Event updates',
    body: 'Judges, brackets, and floor times land on your phone.',
  },
  {
    icon: Film,
    title: 'HD battle videos',
    body: 'Unlisted YouTube recaps from every scored round.',
  },
] as const;

export function TrustBadgesFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        {badges.map((badge) => (
          <div key={badge.title} className="flex gap-3 bg-surface px-5 py-6">
            <badge.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-text-primary">
                {badge.title}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{badge.body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-4 text-[11px] uppercase tracking-[0.16em] text-text-muted">
        <span>Night Cypher · Underground dance, India</span>
        <span>No light mode. The floor stays dark.</span>
      </div>
    </footer>
  );
}
