import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/EventCard';
import { EmptyState } from '@/components/EmptyState';
import { FeaturedEventHero } from '@/components/FeaturedEventHero';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { mobileApi, toMobileEvent } from '@/lib/api';
import { DANCE_STYLES, filterEvents, type MobileEvent, type StyleFilter } from '@/lib/events';
import { colors } from '@/lib/theme';

export default function DiscoverScreen() {
  const [style, setStyle] = useState<StyleFilter>('All');
  const [catalog, setCatalog] = useState<MobileEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void mobileApi()
      .listEvents({ pageSize: 50 })
      .then((result) => {
        if (cancelled) return;
        setCatalog(result.items.map((item) => toMobileEvent(item)));
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCatalog([]);
        setError(err instanceof Error ? err.message : 'Could not load events');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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

        {loading ? (
          <ActivityIndicator className="mt-12" color={colors.lime} />
        ) : error ? (
          <View className="px-4">
            <EmptyState kicker="Offline" title="Could not load" body={error} />
          </View>
        ) : (
          <>
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
                <EmptyState
                  kicker={catalog.length === 0 ? 'Empty board' : 'Filters'}
                  title={catalog.length === 0 ? 'No nights yet' : 'Floor’s empty'}
                  body={
                    catalog.length === 0
                      ? 'Published events from organizers will show up here.'
                      : 'Nothing in that style on the board. Clear the chip and pick another room.'
                  }
                >
                  {catalog.length > 0 ? (
                    <Chip selected onPress={() => setStyle('All')}>
                      All
                    </Chip>
                  ) : null}
                </EmptyState>
              ) : (
                events.map((event) => <EventCard key={event.id} event={event} />)
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
