import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/EventCard';
import { EmptyState } from '@/components/EmptyState';
import { Text } from '@/components/ui/Text';
import { mobileApi, toMobileEvent } from '@/lib/api';
import { upcomingEvents, type MobileEvent } from '@/lib/events';
import { colors } from '@/lib/theme';

export default function EventsScreen() {
  const [events, setEvents] = useState<MobileEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void mobileApi()
      .listEvents({ pageSize: 50 })
      .then((result) => {
        if (cancelled) return;
        setEvents(upcomingEvents(result.items.map((item) => toMobileEvent(item))));
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setEvents([]);
        setError(err instanceof Error ? err.message : 'Could not load events');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
              ? 'Loading upcoming nights…'
              : `${events.length} upcoming nights. Tap through for tickets, capacity, and register.`}
          </Text>
        </View>
        <View className="mt-6 gap-3">
          {loading ? (
            <ActivityIndicator className="mt-8" color={colors.lime} />
          ) : error ? (
            <EmptyState kicker="Offline" title="Could not load" body={error} />
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
