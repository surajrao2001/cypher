import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { EventPoster } from '@/components/EventPoster';
import { RegisterNowBar } from '@/components/RegisterNowBar';
import { TicketQuantityStepper } from '@/components/TicketQuantityStepper';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { mobileApi, toMobileDetail } from '@/lib/api';
import { clampQuantity, formatEventDate, formatMinorUnits, spotsLeft } from '@/lib/format';
import { getEventById, type MockEvent } from '@/lib/mock-events';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<MockEvent | undefined>(
    typeof id === 'string' ? getEventById(id) : undefined,
  );
  const remaining = event ? spotsLeft(event.spotsCapacity, event.spotsConfirmed) : 0;
  const soldOut = remaining === 0;
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof id !== 'string') {
      return;
    }
    void mobileApi()
      .getEvent(id)
      .then((row) => {
        if (row) {
          setEvent(toMobileDetail(row));
        }
      })
      .catch(() => {
        setEvent(getEventById(id));
      });
  }, [id]);

  const maxTickets = Math.max(remaining, 0);
  const safeQuantity = useMemo(
    () => clampQuantity(quantity, 1, Math.max(maxTickets, 1)),
    [quantity, maxTickets],
  );

  if (!event) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-6">
        <Text variant="title">Event missing</Text>
        <Text variant="caption" className="mt-2 text-center">
          That night is not on the board.
        </Text>
        <Button className="mt-6" onPress={() => router.replace('/discover')}>
          Back to discover
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-4"
        showsVerticalScrollIndicator={false}
      >
        <EventPoster event={event} height={320} overlayHeader />
        <View className="px-4 pt-5">
          <View className="flex-row flex-wrap gap-2">
            {event.styles.map((style) => (
              <Chip key={style} selected>
                {style}
              </Chip>
            ))}
          </View>
          <Text variant="display" className="mt-4 text-[48px] leading-[48px]">
            {event.title}
          </Text>
          <Text variant="caption" className="mt-3">
            {event.organizerName}
          </Text>
          <Text variant="body" className="mt-1 text-secondary">
            {event.venue} · {event.city}
          </Text>
          <Text variant="caption" className="mt-1 text-muted">
            {formatEventDate(event.startTime)}
          </Text>

          <View className="mt-5 flex-row items-center justify-between">
            <Badge tone={soldOut ? 'danger' : remaining <= 10 ? 'lime' : 'muted'}>
              {soldOut
                ? 'Sold out'
                : `${remaining} / ${event.spotsCapacity} spots left`}
            </Badge>
            <Text variant="subtitle" className="text-[22px]">
              {event.priceMinor === 0 ? 'Free' : formatMinorUnits(event.priceMinor)}
            </Text>
          </View>

          <Text variant="body" className="mt-5 leading-6 text-secondary">
            {event.description}
          </Text>

          <View className="mt-8">
            <TicketQuantityStepper
              value={soldOut ? 0 : safeQuantity}
              min={soldOut ? 0 : 1}
              max={maxTickets}
              disabled={soldOut}
              onChange={setQuantity}
            />
          </View>

          {notice ? (
            <Text variant="caption" className="mt-4 text-lime">
              {notice}
            </Text>
          ) : null}
        </View>
      </ScrollView>
      <RegisterNowBar
        quantity={soldOut ? 0 : safeQuantity}
        unitPriceMinor={event.priceMinor}
        soldOut={soldOut}
        onRegister={() =>
          setNotice('Checkout is not wired yet. Quantity and total are live on this screen.')
        }
      />
    </View>
  );
}
