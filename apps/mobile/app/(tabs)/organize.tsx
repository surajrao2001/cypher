import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { OrganizerDto } from '@cypher/contracts';

import { BrandLogo } from '@/components/BrandLogo';
import { GoogleGlyph } from '@/components/GoogleGlyph';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/lib/auth';
import type { SocialProvider } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { useCypherFonts } from '@/lib/fonts';
import { cn } from '@/lib/format';

type Pending = SocialProvider | 'email' | null;

export default function OrganizeTab() {
  const auth = useAuth();
  const router = useRouter();
  const fonts = useCypherFonts();
  const [orgs, setOrgs] = useState<OrganizerDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
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
          <View className="mt-10 gap-5">
            <BrandLogo variant="lockup" height={40} />
            <Text variant="title" className="text-[28px]">
              Sign in to organize
            </Text>
            <Text variant="caption">
              Same account as web — membership comes from the org you create.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              disabled={pending !== null}
              onPress={() => void continueWith('google')}
              className={cn(
                'h-14 flex-row items-center justify-center gap-3 rounded-sm border border-[#dadce0] bg-white px-4',
                pending !== null && 'opacity-40',
              )}
            >
              <GoogleGlyph size={22} />
              <Text
                className="text-[16px] text-[#1f1f1f]"
                style={{ fontFamily: fonts.bodyBoldFamily }}
              >
                {pending === 'google' ? 'Waiting for Google…' : 'Continue with Google'}
              </Text>
            </Pressable>

            <View className="flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border" />
              <Text variant="caption" className="uppercase tracking-[1.5px]">
                or
              </Text>
              <View className="h-px flex-1 bg-border" />
            </View>

            <View className="gap-3">
              <Text variant="label">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                className="h-12 rounded-sm border border-border bg-elevated px-3 text-ink"
                style={{ color: colors.ink }}
              />
              <Button
                variant="secondary"
                loading={pending === 'email'}
                disabled={pending !== null || !email.trim()}
                onPress={() => void continueWithEmail()}
              >
                Email me a sign-in link
              </Button>
            </View>
            {info ? <Text variant="caption">{info}</Text> : null}
            <Text variant="caption" className="uppercase tracking-[1.5px]">
              The culture is the centre
            </Text>
          </View>
        ) : (
          <View className="mt-8 gap-4">
            <Text variant="caption">
              Signed in as {auth.me?.profile.dancerName ?? auth.me?.profile.name ?? 'dancer'}
            </Text>
            {auth.me?.needsOnboarding ? (
              <Button onPress={() => router.push('/(tabs)/profile')}>Finish dancer card</Button>
            ) : (
              <Button onPress={() => router.push('/organize/new')}>New organizer</Button>
            )}
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
              <View className="gap-3 pt-2">
                {orgs.map((org) => (
                  <Pressable
                    key={org.id}
                    onPress={() => router.push(`/organize/${org.slug}`)}
                    className="rounded-sm border border-border bg-surface px-4 py-4 active:bg-elevated"
                  >
                    <Text variant="subtitle" className="text-[26px]">
                      {org.orgName}
                    </Text>
                    <Text variant="caption" className="mt-1">
                      @{org.slug}
                      {org.city ? ` · ${org.city}` : ''} · {org.verificationStatus} · {org.role}
                    </Text>
                    {org.bio ? (
                      <Text variant="caption" className="mt-2" numberOfLines={2}>
                        {org.bio}
                      </Text>
                    ) : null}
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
