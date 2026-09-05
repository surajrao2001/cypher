import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { formatMinorUnits } from '@/lib/format';

type Props = {
  quantity: number;
  unitPriceMinor: number;
  currency?: string;
  soldOut?: boolean;
  submitting?: boolean;
  onRegister: () => void;
};

export function RegisterNowBar({
  quantity,
  unitPriceMinor,
  currency = 'INR',
  soldOut = false,
  submitting = false,
  onRegister,
}: Props) {
  const insets = useSafeAreaInsets();
  const totalMinor = unitPriceMinor * quantity;
  const isFree = unitPriceMinor === 0;

  return (
    <View
      className="border-t border-border bg-surface px-4 pt-3"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <View className="mb-3 flex-row items-end justify-between">
        <View>
          <Text variant="kicker" className="text-muted">
            {soldOut ? 'Registration closed' : isFree ? 'Entry' : 'Live total'}
          </Text>
          <Text variant="title" className="mt-0.5 text-[32px]">
            {soldOut ? 'Sold out' : isFree ? 'Free' : formatMinorUnits(totalMinor, currency)}
          </Text>
        </View>
        <Text variant="caption" className="mb-1 text-secondary">
          {soldOut ? 'Waitlist opens on web' : isFree ? 'Show up early' : `${quantity} × ${formatMinorUnits(unitPriceMinor, currency)}`}
        </Text>
      </View>
      <Button
        size="lg"
        loading={submitting}
        disabled={soldOut}
        onPress={onRegister}
        accessibilityLabel="Register now"
      >
        {soldOut ? 'Sold out' : 'Register now'}
      </Button>
    </View>
  );
}
