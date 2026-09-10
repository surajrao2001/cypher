import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListLoading, SoftError } from '@/components/AsyncState';
import { EventCard } from '@/components/EventCard';
import { EmptyState } from '@/components/EmptyState';
import { Text } from '@/components/ui/Text';
import { mobileApi, toMobileEvent } from '@/lib/api';
import { upcomingEvents, type MobileEvent } from '@/lib/events';

export default function EventsScreen() {
  const [events, setEvents] = useState<MobileEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await mobileApi().listEvents({ pageSize: 50 });
      setEvents(upcomingEvents(result.items.map((item) => toMobileEvent(item))));
      setLoadError(null);
    } catch (err) {
      setEvents([]);
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
            {loading
              ? 'Upcoming nights on the board.'
              : `${events.length} upcoming nights. Tap through for tickets, capacity, and register.`}
          </Text>
        </View>
        <View className="mt-6 gap-3">
          {loading ? (
            <ListLoading />
          ) : loadError ? (
            <SoftError title="Couldn’t load events" error={loadError} onRetry={() => void load()} />
          ) : events.length === 0 ? (
            <EmptyState
              kicker="Empty calendar"
              title="No events yet"
              body="When organizers publish battles, they will show up here."
            />
          ) : (
            events.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
