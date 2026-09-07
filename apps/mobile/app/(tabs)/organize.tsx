import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { OrganizerDto } from '@cypher/contracts';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/lib/auth';
import type { SocialProvider } from '@/lib/supabase';
import { colors } from '@/lib/theme';

type Pending = SocialProvider | 'email' | null;

export default function OrganizeTab() {
  const auth = useAuth();
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrganizerDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');

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

  async function continueWith(provider: SocialProvider) {
    setPending(provider);
    setError(null);
    setInfo(null);
    try {
      await auth.signInWithProvider(provider);
      await loadOrgs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setPending(null);
    }
  }

  async function continueWithEmail() {
    setPending('email');
    setError(null);
    setInfo(null);
    try {
      await auth.signInWithEmail(email);
      setInfo(`Check ${email.trim()} for a sign-in link, then return here.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send email link');
    } finally {
      setPending(null);
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

        {!auth.ready ? (
          <Text variant="caption" className="mt-8">
            Loading session…
          </Text>
        ) : !auth.token ? (
          <View className="mt-8 gap-3">
            <Text variant="caption">Continue with Google or email to organize.</Text>
            <Button
              loading={pending === 'google'}
              disabled={pending !== null}
              onPress={() => void continueWith('google')}
            >
              Continue with Google
            </Button>
            <Button
              variant="ghost"
              disabled={pending !== null}
              onPress={() => {
                setShowEmail(true);
                setError(null);
                setInfo(null);
              }}
            >
              Continue with Email
            </Button>
            {showEmail ? (
              <View className="gap-3 border-t border-border pt-3">
                <Text variant="label">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.muted}
                  className="h-12 rounded-md border border-border bg-elevated px-3 text-ink"
                  style={{ color: colors.ink }}
                />
                <Button
                  loading={pending === 'email'}
                  disabled={pending !== null || !email.trim()}
                  onPress={() => void continueWithEmail()}
                >
                  Email me a sign-in link
                </Button>
              </View>
            ) : null}
            {info ? <Text variant="caption">{info}</Text> : null}
          </View>
        ) : (
          <View className="mt-8 gap-4">
            <Text variant="caption">
              Signed in as {auth.me?.profile.dancerName ?? auth.me?.profile.name ?? 'dancer'}
            </Text>
            <Button onPress={() => router.push('/organize/new')}>New organizer</Button>
            <Button variant="ghost" onPress={() => void auth.signOut()}>
              Sign out
            </Button>

            {orgs === null ? (
              <Text variant="caption">Loading crews…</Text>
            ) : orgs.length === 0 ? (
              <EmptyState
                kicker="No crews"
                title="Start an organizer"
                body="Create a crew, draft events, then publish to Discover."
              >
                <Button className="mt-2" onPress={() => router.push('/organize/new')}>
                  Create organizer
                </Button>
              </EmptyState>
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
