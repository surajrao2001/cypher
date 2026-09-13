import { ByndIcon, type ByndIconName } from '@/components/icons/bynd8';

const badges: Array<{ icon: ByndIconName; title: string; body: string }> = [
  {
    icon: 'tickets',
    title: 'Hold a spot',
    body: 'Reserve an entry, confirm free events, and get a registration code.',
  },
  {
    icon: 'shield',
    title: 'Digital passes',
    body: 'Confirmed entries show a QR on Passes — bring it to check-in.',
  },
  {
    icon: 'bell',
    title: 'Event updates',
    body: 'Registration windows, capacity, and organizer notices stay on the event page.',
  },
  {
    icon: 'link',
    title: 'Event media',
    body: 'Organizers can share YouTube, Instagram, or Drive links — BYND8 does not host video.',
  },
];

export function TrustBadgesFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        {badges.map((badge) => (
          <div key={badge.title} className="flex gap-3 bg-surface px-5 py-6">
            <ByndIcon name={badge.icon} className="mt-0.5 size-5 shrink-0 text-accent" />
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
        <span>BYND8 · Everything beyond the count</span>
        <span>The culture is the centre</span>
      </div>
    </footer>
  );
}
