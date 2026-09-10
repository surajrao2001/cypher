import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import type { CheckInListResponse, OrganizerDto } from '@cypher/contracts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

export default function CheckInScreen() {
  const { slug, eventId } = useLocalSearchParams<{ slug: string; eventId: string }>();
  const auth = useAuth();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [data, setData] = useState<CheckInListResponse | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const load = useCallback(async () => {
    const organizer = await auth.api.getMyOrganizerBySlug(String(slug));
    setOrg(organizer);
    setData(await auth.api.listCheckIns(organizer.id, String(eventId)));
  }, [auth.api, eventId, slug]);
  useEffect(() => { void load(); }, [load]);

  async function checkIn() {
    if (!org || !code.trim()) return;
    try {
      const value = code.trim();
      await auth.api.checkIn(org.id, String(eventId), value.startsWith('cy1.')
        ? { qrToken: value, channel: 'SCAN' }
        : { registrationCode: value, channel: 'MANUAL' });
      setCode('');
      setMessage('Checked in.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Check-in failed');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView contentContainerClassName="gap-4 px-4 pb-10">
        <Text variant="kicker">Door ops</Text>
        <Text variant="display" className="text-[44px]">Check-in</Text>
        <TextInput value={code} onChangeText={setCode} autoCapitalize="none" placeholder="QR payload or registration code" placeholderTextColor={colors.muted} className="h-12 border border-border bg-elevated px-3 text-ink" />
        <Button onPress={() => void checkIn()} disabled={!code.trim()}>Check in</Button>
        {message ? <Text variant="caption">{message}</Text> : null}
        <Text variant="subtitle">{data?.totals.checkedIn ?? 0} / {data?.totals.confirmed ?? 0} checked in</Text>
        {(data?.items ?? []).map((item) => (
          <View key={item.id} className="border-b border-border py-3">
            <Text variant="body">{item.dancerName ?? item.entryName ?? item.registrationCode}</Text>
            <Text variant="caption">{new Date(item.checkedInAt).toLocaleTimeString()}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
