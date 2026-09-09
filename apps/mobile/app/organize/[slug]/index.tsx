import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/lib/auth';
import { webBaseUrl } from '@/lib/web';

export default function OrganizerScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const auth = useAuth();
  const router = useRouter();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [events, setEvents] = useState<OrganizerEventDetailDto[]>([]);
  const [payoutReady, setPayoutReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug || !auth.token) return;
    try {
      const organizer = await auth.api.getMyOrganizerBySlug(slug);
      const [list, payout] = await Promise.all([
        auth.api.listOrganizerEvents(organizer.id),
        auth.api.getOrganizerPaymentAccount(organizer.id).catch(() => null),
      ]);
      setOrg(organizer);
      setEvents(list.items);
      setPayoutReady(Boolean(payout?.payoutReady));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    }
  }, [auth.api, auth.token, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const partitioned = useMemo(() => {
    const now = Date.now();
    const upcoming = events
      .filter((e) => e.status !== 'completed' && e.status !== 'cancelled' && new Date(e.startTime).getTime() >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const past = events
      .filter((e) => !upcoming.includes(e))
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return { upcoming, past };
  }, [events]);

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
          {org.city ? ` · ${org.city}` : ''}
          {payoutReady ? ' · Settlement connected' : ' · Settlement pending'}
        </Text>
        {org.bio ? (
          <Text variant="caption" className="mt-2">
            {org.bio}
          </Text>
        ) : null}

        {!payoutReady ? (
          <View className="mt-6 gap-3 rounded-sm border border-border bg-elevated/40 p-4">
            <Text variant="kicker">Settlement</Text>
            <Text variant="subtitle" className="text-[22px]">
              Connect bank or UPI for paid fees
            </Text>
            <Text variant="caption">
              Set up settlement on web for entry fees above ₹0. Free (₹0) events still work without
              it.
            </Text>
            <Button
              variant="secondary"
              onPress={() =>
                void Linking.openURL(
                  `${webBaseUrl().replace(/\/$/, '')}/organize/${org.slug}?payout=1`,
                )
              }
            >
              Open settlement on web
            </Button>
          </View>
        ) : null}

        <View className="mt-6">
          <Button onPress={() => router.push(`/organize/${org.slug}/events/new`)}>
            New event
          </Button>
        </View>

        <View className="mt-8 gap-6">
          {events.length === 0 ? (
            <EmptyState
              kicker="No nights"
              title="Draft an event"
              body="Add categories and a poster, then publish to Discover."
            />
          ) : (
            <>
              {partitioned.upcoming.length > 0 ? (
                <EventList
                  title="Upcoming"
                  events={partitioned.upcoming}
                  orgSlug={org.slug}
                  onOpen={(id) => router.push(`/organize/${org.slug}/events/${id}`)}
                />
              ) : null}
              {partitioned.past.length > 0 ? (
                <EventList
                  title="Past & drafts"
                  events={partitioned.past}
                  orgSlug={org.slug}
                  onOpen={(id) => router.push(`/organize/${org.slug}/events/${id}`)}
                />
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EventList({
  title,
  events,
  onOpen,
}: {
  title: string;
  events: OrganizerEventDetailDto[];
  orgSlug: string;
  onOpen: (id: string) => void;
}) {
  return (
    <View className="gap-1 border-t border-border pt-4">
      <Text variant="kicker">{title}</Text>
      {events.map((event) => (
        <Pressable
          key={event.id}
          onPress={() => onOpen(event.id)}
          className="border-b border-border py-4 active:bg-elevated"
        >
          <Text variant="subtitle">{event.title}</Text>
          <Text variant="caption">
            {event.status} · {event.city} · {new Date(event.startTime).toLocaleDateString()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
