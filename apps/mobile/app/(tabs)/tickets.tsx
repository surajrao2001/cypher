import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

import type { RegistrationDto } from '@cypher/contracts';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth';
import { formatEventDate, formatMinorUnits } from '@/lib/format';
import { colors } from '@/lib/theme';

export default function TicketsScreen() {
  const router = useRouter();
  const { token, me, api } = useAuth();
  const [items, setItems] = useState<RegistrationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RegistrationDto | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token || !me) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      void api
        .listMyRegistrations()
        .then((res) => {
          setItems(res.items.filter((row) => row.registrationStatus === 'confirmed'));
          setError(null);
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Could not load tickets');
        })
        .finally(() => setLoading(false));
    }, [api, me, token]),
  );

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10 pt-2">
        <Text variant="kicker">Wallet</Text>
        <Text variant="display" className="mt-1 text-[52px] leading-[52px]">
          Tickets
        </Text>
        <Text variant="caption" className="mt-2">
          Confirmed entries with code + QR. Check-in scanning comes later.
        </Text>

        {!token || !me ? (
          <Card className="mt-8 items-center px-6 py-10">
            <Text variant="title" className="text-center text-[28px]">
              Sign in
            </Text>
            <Text variant="caption" className="mt-2 text-center">
              Your tickets show up after you confirm a free registration.
            </Text>
            <Button className="mt-6 w-full" onPress={() => router.push('/profile')}>
              Go to profile
            </Button>
          </Card>
        ) : loading ? (
          <ActivityIndicator className="mt-12" color={colors.lime} />
        ) : error ? (
          <Text variant="caption" className="mt-8 text-danger">
            {error}
          </Text>
        ) : items.length === 0 ? (
          <Card className="mt-8 items-center px-6 py-10">
            <View className="h-16 w-16 items-center justify-center rounded-full border border-border bg-elevated">
              <Ionicons name="ticket-outline" size={28} color={colors.lime} />
            </View>
            <Text variant="title" className="mt-5 text-center text-[28px]">
              No tickets yet
            </Text>
            <Text variant="caption" className="mt-2 text-center">
              Register free and confirm — your pass lands here.
            </Text>
            <Button className="mt-6 w-full" onPress={() => router.push('/discover')}>
              Find a cypher
            </Button>
          </Card>
        ) : (
          <View className="mt-8 gap-4">
            {items.map((ticket) => {
              const open = selected?.id === ticket.id;
              return (
                <Pressable key={ticket.id} onPress={() => setSelected(open ? null : ticket)}>
                  <Card className="px-4 py-4">
                    <Text variant="kicker">{ticket.category.name}</Text>
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
                          Show at door when check-in ships
                        </Text>
                      </View>
                    ) : null}
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
