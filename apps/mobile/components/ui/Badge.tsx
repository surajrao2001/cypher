import { type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/format';

type BadgeTone = 'lime' | 'accent' | 'muted' | 'danger' | 'surface';

export type BadgeProps = ViewProps & {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

const toneClass: Record<BadgeTone, string> = {
  lime: 'bg-lime',
  accent: 'bg-accent',
  muted: 'bg-elevated border border-border',
  danger: 'bg-danger',
  surface: 'bg-surface border border-border',
};

const labelClass: Record<BadgeTone, string> = {
  lime: 'text-bg',
  accent: 'text-ink',
  muted: 'text-secondary',
  danger: 'text-ink',
  surface: 'text-ink',
};

export function Badge({ children, tone = 'lime', className, ...props }: BadgeProps) {
  return (
    <View
      className={cn('self-start rounded-sm px-2 py-1', toneClass[tone], className)}
      {...props}
    >
      <Text variant="label" className={cn('text-[10px] tracking-[1.4px]', labelClass[tone])}>
        {children}
      </Text>
    </View>
  );
}
