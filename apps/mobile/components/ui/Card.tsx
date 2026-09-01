import { Pressable, View, type PressableProps, type ViewProps } from 'react-native';

import { cn } from '@/lib/format';

type CardProps = ViewProps & {
  className?: string;
};

export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={cn('rounded-lg border border-border bg-surface overflow-hidden', className)}
      {...props}
    />
  );
}

type PressableCardProps = PressableProps & {
  className?: string;
};

export function PressableCard({ className, ...props }: PressableCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        'rounded-lg border border-border bg-surface overflow-hidden active:border-accent',
        className,
      )}
      {...props}
    />
  );
}
