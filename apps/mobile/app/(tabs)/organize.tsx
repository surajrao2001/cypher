import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { OrganizerDto } from '@cypher/contracts';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

export default function OrganizeTab() {
  const auth = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('+91');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [orgs, setOrgs] = useState<OrganizerDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const loadOrgs = useCallback(async () => {
    if (!auth.token) {
      setOrgs(null);
      return;
    }
    try {
      setOrgs(await auth.api.listMyOrganizers());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizers');
    }
  }, [auth.api, auth.token]);

  useEffect(() => {
    void loadOrgs();
  }, [loadOrgs]);

  async function sendOtp() {
    setPending(true);
    setError(null);
    try {
      await auth.requestOtp(phone.trim());
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP request failed');
    } finally {
      setPending(false);
    }
  }

  async function verify() {
    setPending(true);
    setError(null);
    try {
      await auth.verifyOtp(phone.trim(), code.trim());
      setOtpSent(false);
      setCode('');
      await loadOrgs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verify failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10">
        <View className="pt-2">
          <Text variant="kicker">Floor control</Text>
          <Text variant="display" className="mt-1 text-[52px] leading-[52px]">
            Organize
          </Text>
          <Text variant="caption" className="mt-2">
            Create a crew, draft events, publish to Discover.
          </Text>
        </View>

        {!auth.token ? (
          <View className="mt-8 gap-3">
            <Text variant="label">Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+9198…"
              placeholderTextColor={colors.muted}
              className="h-12 rounded-md border border-border bg-elevated px-3 text-ink"
              style={{ color: colors.ink }}
            />
            {otpSent ? (
              <>
                <Text variant="label">OTP</Text>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  placeholder="6-digit code"
                  placeholderTextColor={colors.muted}
                  className="h-12 rounded-md border border-border bg-elevated px-3 text-ink"
                  style={{ color: colors.ink }}
                />
                <Button loading={pending} onPress={() => void verify()}>
                  Verify
                </Button>
              </>
            ) : (
              <Button loading={pending} onPress={() => void sendOtp()}>
                Send OTP
              </Button>
            )}
          </View>
        ) : (
          <View className="mt-8 gap-4">
            <Text variant="caption">
              Signed in as {auth.me?.profile.dancerName ?? auth.me?.profile.name ?? 'dancer'}
            </Text>
            <Button onPress={() => router.push('/organize/new')}>New organizer</Button>
            <Button variant="ghost" onPress={() => auth.signOut()}>
              Sign out
            </Button>

            {orgs === null ? (
              <Text variant="caption">Loading crews…</Text>
            ) : orgs.length === 0 ? (
              <Text variant="caption">No organizers yet. Create one to draft events.</Text>
            ) : (
              <View className="gap-2 border-t border-border pt-4">
                {orgs.map((org) => (
                  <Pressable
                    key={org.id}
                    onPress={() => router.push(`/organize/${org.slug}`)}
                    className="border-b border-border py-4 active:bg-elevated"
                  >
                    <Text variant="subtitle">{org.orgName}</Text>
                    <Text variant="caption">
                      @{org.slug} · {org.verificationStatus}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {error ? (
          <Text variant="caption" className="mt-4 text-danger">
            {error}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
