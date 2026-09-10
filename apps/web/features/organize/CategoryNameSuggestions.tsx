'use client';

import { CATEGORY_NAME_SUGGESTIONS } from '@cypher/utils';

import { cn } from '@/lib/utils';

/** Tap chips to fill a category name — scene formats (1v1, Crew, Prelims…). */
export function CategoryNameSuggestions({
  value,
  onPick,
  disabled,
}: {
  value: string;
  onPick: (name: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORY_NAME_SUGGESTIONS.map((name) => {
        const active = value.trim().toLowerCase() === name.toLowerCase();
        return (
          <button
            key={name}
            type="button"
            disabled={disabled}
            onClick={() => onPick(name)}
            className={cn(
              'rounded-sm border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] transition-colors',
              active
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-border bg-elevated text-text-secondary hover:border-accent/40 hover:text-text-primary',
            )}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
