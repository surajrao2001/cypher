import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { OrganizerDto } from '@cypher/contracts';

import { PosterPicker } from '@/components/PosterPicker';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

type CategoryDraft = {
  key: string;
  name: string;
  capacity: string;
  priceRupees: string;
  teamSize: string;
};

function newCat(partial?: Partial<CategoryDraft>): CategoryDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    capacity: '32',
    priceRupees: '0',
    teamSize: '1',
    ...partial,
  };
}

export default function NewEventScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const auth = useAuth();
  const router = useRouter();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [categories, setCategories] = useState<CategoryDraft[]>([
    newCat({ name: '1v1', teamSize: '1' }),
    newCat({ name: '2v2', capacity: '16', teamSize: '2' }),
  ]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !auth.token) return;
    void auth.api
      .getMyOrganizerBySlug(slug)
      .then((item) => {
        setOrg(item);
        if (item.city) setCity(item.city);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Organizer not found');
      });
  }, [auth.api, auth.token, slug]);

  async function create() {
    if (!org) return;
    setPending(true);
    setError(null);
    try {
      const start = new Date();
      start.setDate(start.getDate() + 14);
      start.setHours(18, 0, 0, 0);
      const cleaned = categories
        .map((row) => ({
          name: row.name.trim(),
          capacity: Number(row.capacity),
          priceMinor: Math.round(Number(row.priceRupees || 0) * 100),
          teamSize: Number(row.teamSize || 1),
        }))
        .filter((row) => row.name.length > 0 && row.capacity > 0);
      if (cleaned.length === 0) {
        throw new Error('Add at least one registration category');
      }
      const created = await auth.api.createOrganizerEvent(org.id, {
        title: title.trim(),
        city: city.trim(),
        eventType: 'battle',
        startTime: start.toISOString(),
        styles: ['Breaking'],
        posterUrl: posterUrl.trim() || undefined,
        categories: cleaned,
      });
      router.replace(`/organize/${org.slug}/events/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setPending(false);
    }
  }

  if (!org) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4">
        <Text variant="caption" className="mt-8">
          {error ?? 'Loading…'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-3 px-4 pb-10 pt-2">
        <Text variant="caption">{org.orgName}</Text>
        <Text variant="label">Event title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Andheri Cypher Night"
          placeholderTextColor={colors.muted}
          className="h-12 rounded-md border border-border bg-elevated px-3"
          style={{ color: colors.ink }}
        />
        <Text variant="label">City</Text>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Mumbai"
          placeholderTextColor={colors.muted}
          className="h-12 rounded-md border border-border bg-elevated px-3"
          style={{ color: colors.ink }}
        />

        <PosterPicker value={posterUrl} onChange={setPosterUrl} disabled={pending} />

        <Text variant="caption">Starts in ~2 weeks at 18:00 local.</Text>

        <Text variant="label" className="mt-2">
          Registration categories
        </Text>
        <Text variant="caption">
          Each category is a registration lane (name, max spots, fee, dancers per entry).
        </Text>
        {categories.map((row) => (
          <View key={row.key} className="gap-2 border border-border p-3">
            <Text variant="caption">Category name</Text>
            <TextInput
              value={row.name}
              onChangeText={(name) =>
                setCategories((rows) => rows.map((item) => (item.key === row.key ? { ...item, name } : item)))
              }
              placeholder="e.g. 1v1 / 2v2 / Open"
              placeholderTextColor={colors.muted}
              className="h-11 rounded-md border border-border bg-elevated px-3"
              style={{ color: colors.ink }}
            />
            <Text variant="caption">Max spots · Entry fee (₹) · Dancers per entry</Text>
            <View className="flex-row gap-2">
              <TextInput
                value={row.capacity}
                onChangeText={(capacity) =>
                  setCategories((rows) =>
                    rows.map((item) => (item.key === row.key ? { ...item, capacity } : item)),
                  )
                }
                keyboardType="number-pad"
                placeholder="Spots"
                placeholderTextColor={colors.muted}
                className="h-11 flex-1 rounded-md border border-border bg-elevated px-3"
                style={{ color: colors.ink }}
              />
              <TextInput
                value={row.priceRupees}
                onChangeText={(priceRupees) =>
                  setCategories((rows) =>
                    rows.map((item) => (item.key === row.key ? { ...item, priceRupees } : item)),
                  )
                }
                keyboardType="number-pad"
                placeholder="₹ fee"
                placeholderTextColor={colors.muted}
                className="h-11 flex-1 rounded-md border border-border bg-elevated px-3"
                style={{ color: colors.ink }}
              />
              <TextInput
                value={row.teamSize}
                onChangeText={(teamSize) =>
                  setCategories((rows) =>
                    rows.map((item) => (item.key === row.key ? { ...item, teamSize } : item)),
                  )
                }
                keyboardType="number-pad"
                placeholder="Team"
                placeholderTextColor={colors.muted}
                className="h-11 flex-1 rounded-md border border-border bg-elevated px-3"
                style={{ color: colors.ink }}
              />
            </View>
            {categories.length > 1 ? (
              <Pressable
                onPress={() => setCategories((rows) => rows.filter((item) => item.key !== row.key))}
              >
                <Text variant="caption" className="text-danger">
                  Remove category
                </Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        <Button variant="secondary" onPress={() => setCategories((rows) => [...rows, newCat()])}>
          Add another category
        </Button>

        {error ? <Text variant="caption" className="text-danger">{error}</Text> : null}
        <Button
          loading={pending}
          disabled={title.trim().length < 2 || city.trim().length < 2}
          onPress={() => void create()}
        >
          Save draft
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
