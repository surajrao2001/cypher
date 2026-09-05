import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/lib/auth';

export default function OrganizerScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const auth = useAuth();
  const router = useRouter();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [events, setEvents] = useState<OrganizerEventDetailDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug || !auth.token) return;
    try {
      const organizer = await auth.api.getMyOrganizerBySlug(slug);
      const list = await auth.api.listOrganizerEvents(organizer.id);
      setOrg(organizer);
      setEvents(list.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    }
  }, [auth.api, auth.token, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4">
        <Text variant="caption" className="mt-8 text-danger">
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  if (!org) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4">
        <Text variant="caption" className="mt-8">
          Loading…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['bottom']}>
      <ScrollView contentContainerClassName="px-4 pb-10 pt-2">
        <Text variant="kicker">@{org.slug}</Text>
        <Text variant="display" className="mt-1 text-[44px] leading-[44px]">
          {org.orgName}
        </Text>
        <Text variant="caption" className="mt-2">
          {org.verificationStatus} · {org.role}
        </Text>

        <View className="mt-6">
          <Button onPress={() => router.push(`/organize/${org.slug}/events/new`)}>
            New event
          </Button>
        </View>

        <View className="mt-6 gap-1 border-t border-border pt-4">
          {events.length === 0 ? (
            <EmptyState
              kicker="No nights"
              title="Draft an event"
              body="Add categories and a poster, then publish to Discover."
            />
          ) : (
            events.map((event) => (
              <Pressable
                key={event.id}
                onPress={() => router.push(`/organize/${org.slug}/events/${event.id}`)}
                className="border-b border-border py-4 active:bg-elevated"
              >
                <Text variant="subtitle">{event.title}</Text>
                <Text variant="caption">
                  {event.status} · {event.city}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
