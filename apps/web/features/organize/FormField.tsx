'use client';

import type { ReactNode } from 'react';

/**
 * Label + control. Only marks optional fields — required is the default,
 * so we never stamp “needed” next to every name (that reads as “Call it needed”).
 * `hintReserve` keeps sibling inputs in a grid lined up when some hints are longer.
 */
export function FormField({
  label,
  hint,
  optional = false,
  hintReserve = false,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  /** Keep a hint-height slot so grid columns align even when siblings have no hint */
  hintReserve?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex h-full flex-col gap-2 text-sm text-text-secondary">
      <span className="block">
        <span className="flex flex-wrap items-baseline gap-2">
          <span className="font-semibold text-text-primary">{label}</span>
          {optional ? (
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">
              optional
            </span>
          ) : null}
        </span>
        {hint || hintReserve ? (
          <span
            className={`mt-0.5 block text-xs leading-snug text-text-muted ${
              hintReserve ? 'min-h-[2.5rem]' : ''
            }`}
          >
            {hint ?? '\u00a0'}
          </span>
        ) : null}
      </span>
      <span className="mt-auto block">{children}</span>
    </label>
  );
}
