'use client';

import { Button } from '@/components/ui/button';
import { openEventRegister } from '@/features/discovery/register-events';
import { cn } from '@/lib/utils';

type Props = {
  mode: 'compete' | 'watch';
  categoryId?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'lime' | 'link' | 'destructive';
  disabled?: boolean;
};

/** Opens the shared registration dialog (same as sticky Compete / Watch). */
export function OpenRegisterButton({
  mode,
  categoryId,
  children,
  className,
  size = 'sm',
  variant = 'default',
  disabled,
}: Props) {
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      disabled={disabled}
      className={cn('rounded-full', className)}
      onClick={() => openEventRegister({ mode, categoryId })}
    >
      {children}
    </Button>
  );
}
