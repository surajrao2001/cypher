import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-[0.16em]',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-accent text-white',
        lime: 'border-transparent bg-accent-2 text-bg',
        outline: 'border-border bg-transparent text-text-secondary',
        muted: 'border-transparent bg-elevated text-text-secondary',
        live: 'border-transparent bg-error text-white',
        success: 'border-transparent bg-success/15 text-success',
        warning: 'border-transparent bg-warning/15 text-warning',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
