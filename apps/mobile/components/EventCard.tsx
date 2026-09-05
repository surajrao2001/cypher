import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { EventPoster } from '@/components/EventPoster';
import { Badge } from '@/components/ui/Badge';
import { PressableCard } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { formatEventDate, spotsLeft } from '@/lib/format';
import type { MobileEvent } from '@/lib/events';

type Props = {
  event: MobileEvent;
};

export function EventCard({ event }: Props) {
  const router = useRouter();
  const remaining = spotsLeft(event.spotsCapacity, event.spotsConfirmed);
  const soldOut = remaining === 0;

  return (
    <PressableCard
      accessibilityLabel={`${event.title} in ${event.city}`}
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
    >
      <View className="flex-row">
        <View className="w-[118px]">
          <EventPoster event={event} height={132} />
        </View>
        <View className="flex-1 justify-between p-3">
          <View>
            <Text variant="kicker">{event.styles[0]}</Text>
            <Text variant="subtitle" className="mt-1 text-[22px] leading-6" numberOfLines={2}>
              {event.title}
            </Text>
            <Text variant="caption" className="mt-1.5" numberOfLines={1}>
              {event.venue} · {event.city}
            </Text>
            <Text variant="caption" className="mt-0.5 text-muted">
              {formatEventDate(event.startTime)}
            </Text>
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Badge tone={soldOut ? 'danger' : remaining <= 10 ? 'lime' : 'muted'}>
              {soldOut
                ? 'Sold out'
                : `${remaining} / ${event.spotsCapacity} spots left`}
            </Badge>
          </View>
        </View>
      </View>
    </PressableCard>
  );
}
