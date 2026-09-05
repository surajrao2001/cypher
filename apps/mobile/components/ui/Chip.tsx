import { Pressable, View, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/format';

export type ChipProps = Omit<PressableProps, 'children'> & {
  children: string;
  selected?: boolean;
  className?: string;
};

export function Chip({ children, selected = false, className, onPress, ...props }: ChipProps) {
  const chipClass = cn(
    'rounded-full border px-3.5 py-2',
    selected ? 'border-lime bg-lime' : 'border-border bg-elevated',
    onPress && 'active:scale-95',
    className,
  );
  const label = (
    <Text
      variant="label"
      className={cn('text-[11px] tracking-[1.2px]', selected ? 'text-bg' : 'text-ink')}
    >
      {children}
    </Text>
  );

  if (!onPress) {
    return <View className={chipClass}>{label}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={chipClass}
      onPress={onPress}
      {...props}
    >
      {label}
    </Pressable>
  );
}
