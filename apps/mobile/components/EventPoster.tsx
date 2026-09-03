import { LinearGradient } from 'expo-linear-gradient';
import { Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { formatEventDay } from '@/lib/format';
import type { MockEvent } from '@/lib/mock-events';
import { colors } from '@/lib/theme';

type Props = {
  event: MockEvent;
  height?: number;
  overlayHeader?: boolean;
};

export function EventPoster({ event, height = 168, overlayHeader = false }: Props) {
  const insets = useSafeAreaInsets();
  const isLime = event.posterTone === 'lime';
  const accent = isLime ? colors.lime : colors.accent;
  const topPad = overlayHeader ? insets.top + 44 : 16;
  const posterUrl = event.posterUrl?.trim();

  return (
    <View className="overflow-hidden bg-elevated" style={{ height }}>
      {posterUrl ? (
        <Image source={{ uri: posterUrl }} className="absolute inset-0 h-full w-full" resizeMode="cover" />
      ) : null}
      <LinearGradient
        colors={posterUrl ? ['transparent', 'rgba(10,10,10,0.85)'] : ['#1A1A1A', '#0A0A0A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <View
          className="absolute bottom-0 left-0 top-0 w-1.5"
          style={{ backgroundColor: accent }}
        />
        <View className="flex-1 justify-between px-4 pb-4" style={{ paddingTop: topPad }}>
          <Badge tone={isLime ? 'lime' : 'accent'}>{formatEventDay(event.startTime)}</Badge>
          <View>
            <Text variant="kicker" className={isLime ? 'text-lime' : 'text-accent'}>
              {event.city}
            </Text>
            <Text variant="title" className="mt-1 text-[28px] leading-8" numberOfLines={2}>
              {event.title}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
