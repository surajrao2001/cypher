import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { formatEventDate, spotsLeft } from '@/lib/format';
import type { MockEvent } from '@/lib/mock-events';
import { colors } from '@/lib/theme';

type Props = {
  event: MockEvent;
};

export function FeaturedEventHero({ event }: Props) {
  const router = useRouter();
  const remaining = spotsLeft(event.spotsCapacity, event.spotsConfirmed);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Featured event ${event.title}`}
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      className="overflow-hidden rounded-lg border border-border bg-elevated"
    >
      <LinearGradient
        colors={['#2A140C', '#0A0A0A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ minHeight: 240, padding: 20, justifyContent: 'flex-end' }}
      >
        <View className="absolute left-0 top-0 h-1 w-full" style={{ backgroundColor: colors.accent }} />
        <Badge tone="accent">Featured</Badge>
        <Text variant="kicker" className="mt-4 text-accent">
          Next on the floor
        </Text>
        <Text variant="display" className="mt-1 text-[44px] leading-[44px]" numberOfLines={3}>
          {event.title}
        </Text>
        <Text variant="caption" className="mt-3 text-ink">
          {event.venue}
        </Text>
        <Text variant="caption" className="text-secondary">
          {formatEventDate(event.startTime)} · {event.city}
        </Text>
        <View className="mt-5 flex-row items-center justify-between">
          <Badge tone="lime">
            {remaining} / {event.spotsCapacity} spots left
          </Badge>
          <View className="h-10 items-center justify-center rounded-md bg-accent px-3">
            <Text variant="label" className="text-[13px] tracking-[1.8px] text-ink">
              View event
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
