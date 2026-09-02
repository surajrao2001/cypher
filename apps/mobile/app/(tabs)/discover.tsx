import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/EventCard';
import { FeaturedEventHero } from '@/components/FeaturedEventHero';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { mobileApi, toMobileEvent } from '@/lib/api';
import { DANCE_STYLES, filterEvents, MOCK_EVENTS, type MockEvent, type StyleFilter } from '@/lib/mock-events';

export default function DiscoverScreen() {
  const [style, setStyle] = useState<StyleFilter>('All');
  const [catalog, setCatalog] = useState<MockEvent[]>(MOCK_EVENTS);

  useEffect(() => {
    void mobileApi()
      .listEvents({ pageSize: 50 })
      .then((result) => {
        if (result.items.length > 0) {
          setCatalog(result.items.map((item) => toMobileEvent(item)));
        }
      })
      .catch(() => {
        // Keep the mock board if Nest is not running.
      });
  }, []);

  const featured = catalog.find((event) => event.featured) ?? catalog[0];
  const events = useMemo(() => {
    const list = filterEvents(style, catalog);
    return featured ? list.filter((event) => event.id !== featured.id) : list;
  }, [style, catalog, featured]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-2">
          <Text variant="kicker">Night Cypher</Text>
          <Text variant="display" className="mt-1 text-[52px] leading-[52px]">
            Discover
          </Text>
          <Text variant="caption" className="mt-2">
            Underground floors across India. Filter by style, grab a spot before the room locks.
          </Text>
        </View>

        {featured ? (
          <View className="mt-6 px-4">
            <FeaturedEventHero event={featured} />
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-6"
          contentContainerClassName="gap-2 px-4"
        >
          {DANCE_STYLES.map((item) => (
            <Chip key={item} selected={style === item} onPress={() => setStyle(item)}>
              {item}
            </Chip>
          ))}
        </ScrollView>

        <View className="mt-6 gap-3 px-4">
          <Text variant="label">For you</Text>
          {events.length === 0 ? (
            <View className="rounded-2xl border border-dashed border-border bg-surface px-5 py-10">
              <Text variant="kicker">Filters</Text>
              <Text variant="title" className="mt-2">
                Floor’s empty
              </Text>
              <Text variant="caption" className="mt-2">
                Nothing in that style on the board. Clear the chip and pick another room.
              </Text>
              <View className="mt-5 self-start">
                <Chip selected onPress={() => setStyle('All')}>
                  All
                </Chip>
              </View>
            </View>
          ) : (
            events.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
