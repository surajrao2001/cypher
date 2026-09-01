import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/EventCard';
import { Text } from '@/components/ui/Text';
import { upcomingEvents } from '@/lib/mock-events';

export default function EventsScreen() {
  const events = upcomingEvents();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-2">
          <Text variant="kicker">Calendar</Text>
          <Text variant="display" className="mt-1 text-[52px] leading-[52px]">
            Events
          </Text>
          <Text variant="caption" className="mt-2">
            {events.length} upcoming nights. Tap through for tickets, capacity, and the sticky register bar.
          </Text>
        </View>
        <View className="mt-6 gap-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
