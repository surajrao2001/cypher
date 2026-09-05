import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';

import { EventPoster } from '@/components/EventPoster';
import { RegisterNowBar } from '@/components/RegisterNowBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth';
import { toMobileDetail, mobileApi } from '@/lib/api';
import { formatEventDate, formatMinorUnits, spotsLeft } from '@/lib/format';
import { getEventById, type MockEvent } from '@/lib/mock-events';

export default function EventDetailScreen() {
  const router = useRouter();
  const { token, me, api } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<MockEvent | undefined>(
    typeof id === 'string' ? getEventById(id) : undefined,
  );
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof id !== 'string') {
      return;
    }
    void mobileApi()
      .getEvent(id)
      .then((row) => {
        if (row) {
          const detail = toMobileDetail(row);
          setEvent(detail);
          setCategoryId(detail.categories?.[0]?.id ?? null);
        }
      })
      .catch(() => {
        setEvent(getEventById(id));
      });
  }, [id]);

  const category = useMemo(
    () => event?.categories?.find((row) => row.id === categoryId) ?? event?.categories?.[0],
    [categoryId, event?.categories],
  );

  const remaining = category
    ? spotsLeft(category.capacity, category.confirmedCount + category.reservedCount)
    : event
      ? spotsLeft(event.spotsCapacity, event.spotsConfirmed)
      : 0;
  const soldOut = remaining === 0;
  const unitPrice = category?.priceMinor ?? event?.priceMinor ?? 0;

  async function holdSpot() {
    if (!event) {
      return;
    }
    if (!token || !me) {
      setNotice('Sign in from Profile to hold a spot.');
      return;
    }
    if (!category) {
      setNotice('No category available.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      let registration = await api.createRegistration({
        categoryId: category.id,
        participants: [
          {
            displayName: me.profile.dancerName ?? me.profile.name,
            dancerName: me.profile.dancerName ?? undefined,
            userId: me.profile.id,
            isTeamCaptain: true,
          },
        ],
      });
      if (registration.totalAmountMinor === 0) {
        registration = await api.confirmFreeRegistration(registration.id);
      }
      setNotice(
        registration.registrationStatus === 'confirmed'
          ? `Confirmed ${registration.category.name} · ${registration.registrationCode}`
          : `Held ${registration.category.name} · ${registration.registrationCode}`,
      );
      const refreshed = await mobileApi().getEvent(event.slug);
      if (refreshed) {
        setEvent(toMobileDetail(refreshed));
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not register');
    } finally {
      setBusy(false);
    }
  }

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
              {soldOut ? 'Sold out' : `${remaining} spots left`}
            </Badge>
            <Text variant="subtitle" className="text-[22px]">
              {unitPrice === 0 ? 'Free' : formatMinorUnits(unitPrice)}
            </Text>
          </View>

          <Text variant="body" className="mt-5 leading-6 text-secondary">
            {event.description}
          </Text>

          {event.categories && event.categories.length > 0 ? (
            <View className="mt-8 gap-2">
              <Text variant="caption">Choose category</Text>
              {event.categories.map((row) => {
                const left = spotsLeft(row.capacity, row.confirmedCount + row.reservedCount);
                const selected = row.id === (category?.id ?? null);
                return (
                  <Pressable
                    key={row.id}
                    disabled={left === 0}
                    onPress={() => setCategoryId(row.id)}
                    className={`rounded-md border px-3 py-3 ${
                      selected ? 'border-lime bg-elevated' : 'border-border bg-surface'
                    } ${left === 0 ? 'opacity-40' : ''}`}
                  >
                    <Text variant="subtitle">{row.name}</Text>
                    <Text variant="caption" className="mt-1 text-muted">
                      {row.priceMinor === 0 ? 'Free' : formatMinorUnits(row.priceMinor)} · {left} left
                      · {row.minTeamSize === row.maxTeamSize
                        ? `${row.minTeamSize}p`
                        : `${row.minTeamSize}-${row.maxTeamSize}p`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {event.mediaLinks && event.mediaLinks.length > 0 ? (
            <View className="mt-8 gap-2">
              <Text variant="label">Event media</Text>
              {event.mediaLinks.map((link) => (
                <Pressable
                  key={link.id}
                  onPress={() => void Linking.openURL(link.url)}
                  className="rounded-md border border-border bg-surface px-3 py-3"
                >
                  <Text variant="subtitle">{link.title}</Text>
                  <Text variant="caption" className="mt-1 text-muted">
                    {link.kind}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {notice ? (
            <Text variant="caption" className="mt-4 text-lime">
              {notice}
            </Text>
          ) : null}
        </View>
      </ScrollView>
      <RegisterNowBar
        quantity={1}
        unitPriceMinor={unitPrice}
        soldOut={soldOut}
        onRegister={() => {
          if (busy) {
            return;
          }
          void holdSpot();
        }}
      />
    </View>
  );
}
