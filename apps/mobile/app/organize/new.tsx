import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

export default function NewOrganizerScreen() {
  const auth = useAuth();
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [city, setCity] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setPending(true);
    setError(null);
    try {
      const org = await auth.api.createOrganizer({
        orgName: orgName.trim(),
        city: city.trim() || undefined,
      });
      router.replace(`/organize/${org.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setPending(false);
    }
  }

  if (!auth.token) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4">
        <Text variant="body" className="mt-8">
          Sign in from the Organize tab first.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-3 px-4 pb-10 pt-2">
        <Text variant="label">Organizer name</Text>
        <TextInput
          value={orgName}
          onChangeText={setOrgName}
          className="h-12 rounded-md border border-border bg-elevated px-3"
          style={{ color: colors.ink }}
        />
        <Text variant="label">City</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          className="h-12 rounded-md border border-border bg-elevated px-3"
          style={{ color: colors.ink }}
        />
        {error ? <Text variant="caption" className="text-danger">{error}</Text> : null}
        <Button
          loading={pending}
          disabled={orgName.trim().length < 2}
          onPress={() => void create()}
        >
          Create
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
