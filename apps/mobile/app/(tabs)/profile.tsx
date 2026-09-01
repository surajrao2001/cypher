import { useMemo, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useCypherFonts } from '@/lib/fonts';
import { cn } from '@/lib/format';
import { DANCE_STYLES } from '@/lib/mock-events';
import { colors } from '@/lib/theme';

const STYLES = DANCE_STYLES.filter((style) => style !== 'All');

export default function ProfileScreen() {
  const fonts = useCypherFonts();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [crew, setCrew] = useState('');
  const [styles, setStyles] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

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

  function onContinue() {
    setNotice('Profile is a preview — name and city are not saved yet.');
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
          <View className="pt-2">
            <Text variant="kicker">Dancer card</Text>
            <Text variant="display" className="mt-1 text-[52px] leading-[52px]">
              Profile
            </Text>
            <Text variant="caption" className="mt-2">
              Tell the floor who you are. Auth and save come later — this is layout only.
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
              accessibilityLabel="Dancer name"
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
              accessibilityLabel="City"
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
              accessibilityLabel="Crew"
              className={inputClass}
              style={{ fontFamily: fonts.bodyFamily, color: colors.ink }}
            />
          </Field>

          <Text variant="label" className="mt-6 mb-3">
            Primary styles
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {STYLES.map((style) => (
              <Chip
                key={style}
                selected={styles.includes(style)}
                onPress={() => toggleStyle(style)}
              >
                {style}
              </Chip>
            ))}
          </View>

          {notice ? (
            <Text variant="caption" className="mt-6 text-lime">
              {notice}
            </Text>
          ) : null}

          <Button className="mt-8" size="lg" disabled={!canContinue} onPress={onContinue}>
            Continue
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inputClass = cn(
  'h-12 rounded-md border border-border bg-elevated px-3 text-base text-ink',
);

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
