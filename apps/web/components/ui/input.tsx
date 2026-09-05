import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-border bg-elevated px-3 py-2 font-body text-sm text-text-primary shadow-none transition-colors placeholder:text-text-muted hover:border-[#3a3a3a] focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
