import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/format';
import { colors } from '@/lib/theme';

type Props = {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  label?: string;
};

export function TicketQuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  disabled = false,
  label = 'Tickets',
}: Props) {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  function step(delta: number) {
    if (disabled) {
      return;
    }
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) {
      onChange(next);
      void Haptics.selectionAsync().catch(() => undefined);
    }
  }

  return (
    <View className="flex-row items-center justify-between rounded-md border border-border bg-elevated px-4 py-3">
      <View>
        <Text variant="kicker">{label}</Text>
        <Text variant="caption" className="mt-1 text-muted">
          {max <= 0 ? 'Sold out' : `${max} available`}
        </Text>
      </View>
      <View className="flex-row items-center gap-3">
        <StepButton
          icon="remove"
          label="Decrease quantity"
          disabled={!canDecrease}
          onPress={() => step(-1)}
        />
        <Text
          variant="title"
          className="min-w-[36px] text-center text-[28px]"
          accessibilityRole="text"
          accessibilityLabel={`${value} tickets`}
        >
          {String(value)}
        </Text>
        <StepButton
          icon="add"
          label="Increase quantity"
          disabled={!canIncrease}
          onPress={() => step(1)}
        />
      </View>
    </View>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'add' | 'remove';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'h-11 w-11 items-center justify-center rounded-md border border-border bg-surface active:bg-accent',
        disabled && 'opacity-30',
      )}
    >
      <Ionicons name={icon} size={20} color={colors.ink} />
    </Pressable>
  );
}
