'use client';

import { ByndIcon, type ByndIconName } from '@/components/icons/bynd8';
import type { ControlDest } from '@/features/organize/event-control';
import { cn } from '@/lib/utils';

const ALL_ITEMS: Array<{ id: ControlDest; label: string; icon: ByndIconName }> = [
  { id: 'home', label: 'Home', icon: 'floor' },
  { id: 'people', label: 'People', icon: 'crew' },
  { id: 'entry', label: 'Entry', icon: 'tickets' },
  { id: 'money', label: 'Money', icon: 'wallet' },
  { id: 'page', label: 'Event Page', icon: 'media' },
];

export function EventControlNav({
  active,
  onChange,
  showMoney,
}: {
  active: ControlDest;
  onChange: (dest: ControlDest) => void;
  showMoney: boolean;
}) {
  const items = showMoney ? ALL_ITEMS : ALL_ITEMS.filter((i) => i.id !== 'money');

  return (
    <nav aria-label="Event" className="border-b border-border pb-1">
      {/* Mobile: native select avoids overflow */}
      <label className="block sm:hidden">
        <span className="sr-only">Section</span>
        <select
          className="flex min-h-11 w-full rounded-md border border-border bg-elevated px-3 text-sm font-semibold text-text-primary"
          value={active}
          onChange={(e) => onChange(e.target.value as ControlDest)}
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {/* Desktop / tablet: wrapping pills */}
      <ul className="hidden flex-wrap gap-2 sm:flex">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-semibold transition-colors',
                  isActive
                    ? 'border-accent bg-accent/15 text-text-primary'
                    : 'border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text-secondary',
                )}
              >
                <ByndIcon name={item.icon} className="size-3.5" />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
