import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/BrandLogo';
import { GoogleGlyph } from '@/components/GoogleGlyph';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth';
import { useCypherFonts } from '@/lib/fonts';
import { cn } from '@/lib/format';
import { DANCE_STYLES } from '@/lib/events';
import { colors } from '@/lib/theme';
import type { SocialProvider } from '@/lib/supabase';

const STYLES = DANCE_STYLES.filter((style) => style !== 'All');

type Pending = SocialProvider | 'email' | null;

export default function ProfileScreen() {
  const auth = useAuth();
  const router = useRouter();
  const fonts = useCypherFonts();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [crew, setCrew] = useState('');
  const [styles, setStyles] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [authPending, setAuthPending] = useState<Pending>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canContinue = name.trim().length > 1 && city.trim().length > 1;

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '??';
    }
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return `${first}${last}`.toUpperCase();
  }, [name]);

  function toggleStyle(style: string) {
    setStyles((current) =>
      current.includes(style) ? current.filter((item) => item !== style) : [...current, style],
    );
  }

  async function continueWith(provider: SocialProvider) {
    setAuthPending(provider);
    setError(null);
    setInfo(null);
    try {
      await auth.signInWithProvider(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setAuthPending(null);
    }
  }

  async function continueWithEmail() {
    setAuthPending('email');
    setError(null);
    setInfo(null);
    try {
      await auth.signInWithEmail(email);
      setInfo(`Check ${email.trim()} for a sign-in link.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send email link');
    } finally {
      setAuthPending(null);
    }
  }

  async function onSave() {
    setPending(true);
    setError(null);
    try {
      await auth.completeOnboarding({
        dancerName: name.trim(),
        city: city.trim(),
        crew: crew.trim() || undefined,
        styles,
      });
      router.replace('/(tabs)/discover');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setPending(false);
    }
  }

  if (!auth.ready) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center" edges={['top']}>
        <Text variant="caption">Loading session…</Text>
      </SafeAreaView>
    );
  }

  if (!auth.token) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10">
          <View className="mt-6 gap-5">
            <BrandLogo variant="lockup" height={40} />
            <Text variant="kicker">Sign in</Text>
            <Text variant="display" className="text-[48px] leading-[48px]">
              Enter the scene
            </Text>
            <Text variant="caption">
              Sign in to register, hold tickets, and run the floor. Your dancer card stays yours.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              disabled={authPending !== null}
              onPress={() => void continueWith('google')}
              className={cn(
                'h-14 flex-row items-center justify-center gap-3 rounded-sm border border-[#dadce0] bg-white px-4',
                authPending !== null && 'opacity-40',
              )}
            >
              <GoogleGlyph size={22} />
              <Text
                className="text-[16px] text-[#1f1f1f]"
                style={{ fontFamily: fonts.bodyBoldFamily }}
              >
                {authPending === 'google' ? 'Waiting for Google…' : 'Continue with Google'}
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
                className="h-12 rounded-sm border border-border bg-elevated px-3"
                style={{ color: colors.ink, fontFamily: fonts.bodyFamily }}
              />
              <Button
                variant="secondary"
                loading={authPending === 'email'}
                disabled={authPending !== null || !email.trim()}
                onPress={() => void continueWithEmail()}
              >
                Email me a sign-in link
              </Button>
            </View>
            {info ? <Text variant="caption">{info}</Text> : null}
            {error ? <Text variant="caption" className="text-danger">{error}</Text> : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!auth.me?.needsOnboarding) {
    const profile = auth.me?.profile;
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10">
          <View className="pt-2 gap-3">
            <BrandLogo variant="mark" height={48} />
            <Text variant="kicker">Profile</Text>
            <Text variant="display" className="text-[48px] leading-[48px]">
              {profile?.dancerName ?? profile?.name ?? 'Dancer'}
            </Text>
            <Text variant="caption">{profile?.city ?? 'City not set'}</Text>
            {profile?.bio ? <Text variant="caption">{profile.bio}</Text> : null}
          </View>
          <View className="mt-8 gap-3 rounded-sm border border-border bg-surface px-4 py-5">
            <Text variant="caption">Crew · {profile?.crew ?? '—'}</Text>
            <Text variant="caption">
              Styles · {profile?.styles?.length ? profile.styles.join(', ') : '—'}
            </Text>
            <Text variant="caption">
              Instagram · {profile?.instagram ? `@${profile.instagram}` : '—'}
            </Text>
            <Text variant="caption">
              Orgs you run · {auth.me?.organizerMemberships.length ?? 0}
            </Text>
          </View>
          <Field label="Update dancer name">
            <TextInput
              value={name || profile?.dancerName || ''}
              onChangeText={setName}
              placeholder="Name on the floor"
              placeholderTextColor={colors.muted}
              className={inputClass}
              style={{ fontFamily: fonts.bodyFamily, color: colors.ink }}
            />
          </Field>
          <Field label="City">
            <TextInput
              value={city || profile?.city || ''}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor={colors.muted}
              className={inputClass}
              style={{ fontFamily: fonts.bodyFamily, color: colors.ink }}
            />
          </Field>
          <Field label="Crew">
            <TextInput
              value={crew || profile?.crew || ''}
              onChangeText={setCrew}
              placeholder="Crew"
              placeholderTextColor={colors.muted}
              className={inputClass}
              style={{ fontFamily: fonts.bodyFamily, color: colors.ink }}
            />
          </Field>
          <Button
            className="mt-6"
            loading={pending}
            onPress={() =>
              void (async () => {
                setPending(true);
                setError(null);
                try {
                  await auth.api.updateProfile({
                    dancerName: (name || profile?.dancerName || '').trim() || undefined,
                    city: (city || profile?.city || '').trim() || null,
                    crew: (crew || profile?.crew || '').trim() || null,
                    styles: styles.length ? styles : profile?.styles,
                  });
                  await auth.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not update');
                } finally {
                  setPending(false);
                }
              })()
            }
          >
            Save profile
          </Button>
          {error ? (
            <Text variant="caption" className="mt-3 text-danger">
              {error}
            </Text>
          ) : null}
          <Button className="mt-8" variant="ghost" onPress={() => void auth.signOut()}>
            Sign out
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="pt-2 gap-3">
            <BrandLogo variant="mark" height={48} />
            <Text variant="kicker">Step 1 · Account setup</Text>
            <Text variant="display" className="text-[48px] leading-[48px]">
              Set up your dancer card
            </Text>
            <Text variant="caption">
              Dancer name and city are enough to get on the list.
            </Text>
          </View>

          <View className="mt-8 items-center">
            <View className="h-24 w-24 items-center justify-center rounded-full border border-accent bg-elevated">
              <Text variant="title" className="text-[32px] text-accent">
                {initials}
              </Text>
            </View>
          </View>

          <Field label="Dancer name">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Nova"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              className={inputClass}
              style={{ fontFamily: fonts.bodyFamily, color: colors.ink }}
            />
          </Field>

          <Field label="City">
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Mumbai"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              className={inputClass}
              style={{ fontFamily: fonts.bodyFamily, color: colors.ink }}
            />
          </Field>

          <Field label="Crew (optional)">
            <TextInput
              value={crew}
              onChangeText={setCrew}
              placeholder="Independent"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              className={inputClass}
              style={{ fontFamily: fonts.bodyFamily, color: colors.ink }}
            />
          </Field>

          <Text variant="label" className="mt-6 mb-3">
            Primary styles
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {STYLES.map((style) => (
              <Chip key={style} selected={styles.includes(style)} onPress={() => toggleStyle(style)}>
                {style}
              </Chip>
            ))}
          </View>

          {error ? (
            <Text variant="caption" className="mt-6 text-danger">
              {error}
            </Text>
          ) : null}

          <Button className="mt-8" size="lg" loading={pending} disabled={!canContinue} onPress={() => void onSave()}>
            Save and continue
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inputClass = cn('h-12 rounded-sm border border-border bg-elevated px-3 text-base text-ink');

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="mt-5">
      <Text variant="label" className="mb-2">
        {label}
      </Text>
      {children}
    </View>
  );
}
