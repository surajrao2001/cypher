import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

import type { RegistrationDto } from '@cypher/contracts';
import { partitionRegistrationsForTickets } from '@cypher/utils';

import { friendlyError, InlineNotice, ListLoading, SoftError } from '@/components/AsyncState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth';
import { formatEventDate, formatMinorUnits } from '@/lib/format';
import { colors } from '@/lib/theme';
import { webBaseUrl } from '@/lib/web';

function categoryLabel(ticket: RegistrationDto): string {
  return ticket.category.entryType === 'viewer' ? 'Audience' : ticket.category.name;
}

export default function TicketsScreen() {
  const router = useRouter();
  const { token, me, api } = useAuth();
  const [items, setItems] = useState<RegistrationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const [selected, setSelected] = useState<RegistrationDto | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !me) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.listMyRegistrations();
      setItems(res.items);
      setLoadError(null);
    } catch (err: unknown) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [api, me, token]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const { needsAction, upcoming, past } = partitionRegistrationsForTickets(items);
  const empty = needsAction.length === 0 && upcoming.length === 0 && past.length === 0;

  async function confirmFree(ticket: RegistrationDto) {
    setBusyId(ticket.id);
    try {
      await api.confirmFreeRegistration(ticket.id);
      await load();
    } catch (err: unknown) {
      setActionError(err);
    } finally {
      setBusyId(null);
    }
  }

  async function reconcilePaid(ticket: RegistrationDto) {
    setBusyId(ticket.id);
    try {
      await api.reconcileRegistrationCheckout(ticket.id);
      await load();
    } catch (err: unknown) {
      setActionError(err);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-2">
        <Text variant="kicker">Wallet</Text>
        <Text variant="display" className="mt-1 text-[52px] leading-[52px]">
          Tickets
        </Text>
        <Text variant="caption" className="mt-2">
          Needs action, upcoming passes, and past history — QR at the door.
        </Text>

        {!token || !me ? (
          <Card className="mt-8 items-center px-6 py-10">
            <Text variant="title" className="text-center text-[28px]">
              Sign in
            </Text>
            <Text variant="caption" className="mt-2 text-center">
              Your tickets show up after you register and confirm.
            </Text>
            <Button className="mt-6 w-full" onPress={() => router.push('/profile')}>
              Go to profile
            </Button>
          </Card>
        ) : loading ? (
          <ListLoading />
        ) : loadError ? (
          <SoftError title="Couldn’t load tickets" error={loadError} onRetry={() => void load()} />
        ) : empty ? (
          <Card className="mt-8 items-center px-6 py-10">
            <View className="h-16 w-16 items-center justify-center rounded-full border border-border bg-elevated">
              <Ionicons name="ticket-outline" size={28} color={colors.lime} />
            </View>
            <Text variant="title" className="mt-5 text-center text-[28px]">
              No tickets yet
            </Text>
            <Text variant="caption" className="mt-2 text-center">
              Register for a night — confirmed passes land here.
            </Text>
            <Button className="mt-6 w-full" onPress={() => router.push('/discover')}>
              Find a cypher
            </Button>
          </Card>
        ) : (
          <View className="mt-8 gap-8">
            {actionError ? (
              <InlineNotice tone="warn">
                {friendlyError(actionError, 'Something went wrong')}
              </InlineNotice>
            ) : null}
            {needsAction.length > 0 ? (
              <View className="gap-3">
                <Text variant="kicker">Needs action</Text>
                {needsAction.map((ticket) => (
                  <Card key={ticket.id} className="border-dashed px-4 py-4">
                    <Text variant="kicker">{categoryLabel(ticket)}</Text>
                    <Text variant="title" className="mt-1 text-[26px]">
                      {ticket.event.title}
                    </Text>
                    <Text variant="caption" className="mt-2">
                      {ticket.event.city} · {formatEventDate(ticket.event.startTime)}
                    </Text>
                    <Text variant="caption" className="mt-1">
                      {ticket.totalAmountMinor === 0
                        ? 'Free — confirm entry'
                        : formatMinorUnits(ticket.totalAmountMinor)}
                      {ticket.reservationExpiresAt
                        ? ` · until ${new Date(ticket.reservationExpiresAt).toLocaleString()}`
                        : ''}
                    </Text>
                    <View className="mt-4 gap-2">
                      <Button
                        variant="secondary"
                        onPress={() => router.push(`/event/${ticket.event.id}`)}
                      >
                        Open event
                      </Button>
                      {ticket.totalAmountMinor === 0 ? (
                        <Button
                          disabled={busyId === ticket.id}
                          onPress={() => void confirmFree(ticket)}
                        >
                          {busyId === ticket.id ? 'Confirming…' : 'Confirm free'}
                        </Button>
                      ) : (
                        <>
                          <Button
                            disabled={busyId === ticket.id}
                            onPress={() => void reconcilePaid(ticket)}
                          >
                            {busyId === ticket.id ? 'Checking…' : 'I already paid'}
                          </Button>
                          <Button
                            variant="secondary"
                            onPress={() =>
                              void Linking.openURL(
                                `${webBaseUrl().replace(/\/$/, '')}/events/${ticket.event.slug}`,
                              )
                            }
                          >
                            Pay on web
                          </Button>
                        </>
                      )}
                    </View>
                  </Card>
                ))}
              </View>
            ) : null}

            {upcoming.length > 0 ? (
              <View className="gap-3">
                <Text variant="kicker">Upcoming</Text>
                {upcoming.map((ticket) => {
                  const open = selected?.id === ticket.id;
                  return (
                    <Pressable key={ticket.id} onPress={() => setSelected(open ? null : ticket)}>
                      <Card className="px-4 py-4">
                        {ticket.category.entryType === 'viewer' ? (
                          <Text variant="kicker" className="text-lime">
                            Audience
                          </Text>
                        ) : (
                          <Text variant="kicker">{categoryLabel(ticket)}</Text>
                        )}
                        <Text variant="title" className="mt-1 text-[26px]">
                          {ticket.event.title}
                        </Text>
                        <Text variant="caption" className="mt-2">
                          {ticket.event.city} · {formatEventDate(ticket.event.startTime)}
                        </Text>
                        <Text variant="caption" className="mt-1">
                          {ticket.registrationCode} ·{' '}
                          {ticket.totalAmountMinor === 0
                            ? 'Free'
                            : formatMinorUnits(ticket.totalAmountMinor)}
                        </Text>
                        {open && ticket.ticketQrPayload ? (
                          <View className="mt-4 items-center rounded-md bg-white p-4">
                            <QRCode value={ticket.ticketQrPayload} size={180} />
                            <Text variant="caption" className="mt-3 text-center text-muted">
                              Show this code at the door
                            </Text>
                          </View>
                        ) : (
                          <Text variant="caption" className="mt-3 text-muted">
                            Tap for QR
                          </Text>
                        )}
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {past.length > 0 ? (
              <View className="gap-3">
                <Text variant="kicker">Past</Text>
                {past.map((ticket) => {
                  const open = selected?.id === ticket.id;
                  return (
                    <Pressable key={ticket.id} onPress={() => setSelected(open ? null : ticket)}>
                      <Card className="px-4 py-4 opacity-90">
                        <Text variant="kicker">{categoryLabel(ticket)}</Text>
                        <Text variant="title" className="mt-1 text-[24px]">
                          {ticket.event.title}
                        </Text>
                        <Text variant="caption" className="mt-2">
                          {ticket.event.city} · {formatEventDate(ticket.event.startTime)}
                        </Text>
                        <Text variant="caption" className="mt-1">
                          {ticket.registrationCode}
                        </Text>
                        {open && ticket.ticketQrPayload ? (
                          <View className="mt-4 items-center rounded-md bg-white p-3 opacity-80">
                            <QRCode value={ticket.ticketQrPayload} size={120} />
                          </View>
                        ) : null}
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
