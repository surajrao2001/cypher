'use client';

import { cn } from '@/lib/utils';

/** Details + media only — Entry (competition / audience) is a separate surface. */
export const EVENT_EDIT_STEPS = [
  { id: 'basics', label: 'Details' },
  { id: 'media', label: 'Media' },
] as const;

export type EventEditStepId = (typeof EVENT_EDIT_STEPS)[number]['id'];

export function isEventEditStepId(value: string): value is EventEditStepId {
  return EVENT_EDIT_STEPS.some((step) => step.id === value);
}

type Props = {
  active: EventEditStepId;
  onChange: (step: EventEditStepId) => void;
};

export function EventEditStepper({ active, onChange }: Props) {
  return (
    <nav id="edit-steps" aria-label="Edit steps" className="scroll-mt-4 overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2 pb-1">
        {EVENT_EDIT_STEPS.map((step, index) => {
          const isActive = step.id === active;
          return (
            <li key={step.id} className="flex items-center gap-2">
              {index > 0 ? (
                <span className="hidden h-px w-4 bg-border sm:block" aria-hidden />
              ) : null}
              <button
                type="button"
                onClick={() => onChange(step.id)}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors',
                  isActive
                    ? 'border-accent bg-accent/15 text-text-primary'
                    : 'border-border bg-surface text-text-secondary hover:border-accent/40 hover:text-text-primary',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-display text-sm',
                    isActive ? 'bg-accent text-black' : 'bg-elevated text-text-muted',
                  )}
                >
                  {index + 1}
                </span>
                <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.08em] sm:text-[13px]">
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
