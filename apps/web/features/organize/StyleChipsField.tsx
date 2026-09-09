'use client';

import { useState, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const SUGGESTED_DANCE_STYLES = [
  'Breaking',
  'Hip Hop',
  'House',
  'Popping',
  'Locking',
  'Waacking',
  'Krump',
  'Open',
] as const;

type StyleChipsFieldProps = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  max?: number;
  suggestions?: readonly string[];
};

export function StyleChipsField({
  value,
  onChange,
  disabled = false,
  max = 12,
  suggestions = SUGGESTED_DANCE_STYLES,
}: StyleChipsFieldProps) {
  const [draft, setDraft] = useState('');

  function addStyle(raw: string) {
    const name = raw.trim().replace(/\s+/g, ' ');
    if (!name) return;
    const exists = value.some((s) => s.toLowerCase() === name.toLowerCase());
    if (exists || value.length >= max) return;
    onChange([...value, name]);
    setDraft('');
  }

  function removeStyle(name: string) {
    onChange(value.filter((s) => s !== name));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addStyle(draft);
    } else if (event.key === 'Backspace' && !draft && value.length > 0) {
      removeStyle(value[value.length - 1]!);
    }
  }

  const available = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="flex min-h-10 flex-wrap gap-2 rounded-md border border-border bg-elevated px-3 py-2">
        {value.map((style) => (
          <button
            key={style}
            type="button"
            disabled={disabled}
            onClick={() => removeStyle(style)}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-primary hover:border-accent/50 disabled:opacity-40"
          >
            {style}
            <span className="text-text-muted" aria-hidden>
              ×
            </span>
          </button>
        ))}
        {value.length < max ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => {
              if (draft.trim()) addStyle(draft);
            }}
            disabled={disabled}
            placeholder={value.length === 0 ? 'Add a style' : 'Add another'}
            className="h-7 min-w-[8rem] flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        ) : null}
      </div>
      {available.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {available.map((style) => (
            <Button
              key={style}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || value.length >= max}
              className={cn('h-7 text-[11px] normal-case tracking-normal')}
              onClick={() => addStyle(style)}
            >
              + {style}
            </Button>
          ))}
        </div>
      ) : null}
      <p className="text-[11px] text-text-muted">
        Up to {max} styles. Press Enter to add a custom style.
      </p>
    </div>
  );
}
