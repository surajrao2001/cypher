import { ShieldCheck, Ticket, BellRing, Link2 } from 'lucide-react';

const badges = [
  {
    icon: Ticket,
    title: 'Hold a spot',
    body: 'Reserve a category entry, confirm free events, and get a registration code.',
  },
  {
    icon: ShieldCheck,
    title: 'Digital tickets',
    body: 'Confirmed entries show a QR on My Tickets — bring it to the door.',
  },
  {
    icon: BellRing,
    title: 'Event updates',
    body: 'Registration windows, capacity, and organizer notices stay on the event page.',
  },
  {
    icon: Link2,
    title: 'Event media',
    body: 'Organizers can share YouTube, Instagram, or Drive links — Cypher does not host video.',
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
        <span>Night Cypher · Built for battle weekends, India</span>
        <span>No light mode. The floor stays dark.</span>
      </div>
    </footer>
  );
}
