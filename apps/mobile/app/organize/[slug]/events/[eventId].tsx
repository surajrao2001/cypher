import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { OrganizerDto, OrganizerEventDetailDto } from '@cypher/contracts';

import { PosterPicker } from '@/components/PosterPicker';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

type CategoryEdit = {
  id: string;
  name: string;
  capacity: string;
  priceRupees: string;
  teamSize: string;
  occupied: number;
};

export default function EventManageScreen() {
  const { slug, eventId } = useLocalSearchParams<{ slug: string; eventId: string }>();
  const auth = useAuth();
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [event, setEvent] = useState<OrganizerEventDetailDto | null>(null);
  const [posterUrl, setPosterUrl] = useState('');
  const [categoryEdits, setCategoryEdits] = useState<CategoryEdit[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCapacity, setNewCatCapacity] = useState('32');
  const [newCatPrice, setNewCatPrice] = useState('0');
  const [newCatTeam, setNewCatTeam] = useState('1');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function sync(detail: OrganizerEventDetailDto) {
    setEvent(detail);
    setPosterUrl(detail.posterUrl ?? '');
    setCategoryEdits(
      detail.categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        capacity: String(cat.capacity),
        priceRupees: String(Math.round(cat.priceMinor / 100)),
        teamSize: String(cat.teamSize),
        occupied: cat.reservedCount + cat.confirmedCount,
      })),
    );
  }

  const load = useCallback(async () => {
    if (!slug || !eventId || !auth.token) return;
    try {
      const organizer = await auth.api.getMyOrganizerBySlug(slug);
      const detail = await auth.api.getOrganizerEvent(organizer.id, eventId);
      setOrg(organizer);
      sync(detail);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    }
  }, [auth.api, auth.token, eventId, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function savePosterAndEvent() {
    if (!org || !event) return;
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await auth.api.updateOrganizerEvent(org.id, event.id, {
        posterUrl: posterUrl.trim() || null,
      });
      sync(updated);
      setMessage('Event saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setPending(false);
    }
  }

  async function saveCategory(row: CategoryEdit) {
    if (!org || !event) return;
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await auth.api.updateOrganizerEventCategory(org.id, event.id, row.id, {
        name: row.name.trim(),
        capacity: Number(row.capacity),
        priceMinor: Math.round(Number(row.priceRupees || 0) * 100),
        teamSize: Number(row.teamSize || 1),
      });
      sync(updated);
      setMessage(`Updated ${row.name.trim()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update category');
    } finally {
      setPending(false);
    }
  }

  function confirmDelete(row: CategoryEdit) {
    Alert.alert('Delete category', `Delete “${row.name}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void removeCategory(row),
      },
    ]);
  }

  async function removeCategory(row: CategoryEdit) {
    if (!org || !event) return;
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await auth.api.deleteOrganizerEventCategory(org.id, event.id, row.id);
      sync(updated);
      setMessage(`Deleted ${row.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete category');
    } finally {
      setPending(false);
    }
  }

  async function addCategory() {
    if (!org || !event) return;
    const name = newCatName.trim();
    if (!name) {
      setError('Category name required');
      return;
    }
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await auth.api.addOrganizerEventCategory(org.id, event.id, {
        name,
        capacity: Number(newCatCapacity),
        priceMinor: Math.round(Number(newCatPrice || 0) * 100),
        teamSize: Number(newCatTeam || 1),
      });
      sync(updated);
      setNewCatName('');
      setMessage('Category added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add category');
    } finally {
      setPending(false);
    }
  }

  async function togglePublish() {
    if (!org || !event) return;
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const updated =
        event.status === 'published'
          ? await auth.api.unpublishOrganizerEvent(org.id, event.id)
          : await auth.api.publishOrganizerEvent(org.id, event.id);
      sync(updated);
      setMessage(updated.status === 'published' ? 'Published to Discover.' : 'Unpublished.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setPending(false);
    }
  }

  if (error && !event) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4">
        <Text variant="caption" className="mt-8 text-danger">
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4">
        <Text variant="caption" className="mt-8">
          Loading…
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-3 px-4 pb-10 pt-2">
        <Text variant="kicker">{event.status}</Text>
        <Text variant="display" className="text-[44px] leading-[44px]">
          {event.title}
        </Text>
        <Text variant="caption">
          {event.city} · {new Date(event.startTime).toLocaleString()}
        </Text>

        <PosterPicker value={posterUrl} onChange={setPosterUrl} disabled={pending} />
        <Button loading={pending} variant="secondary" onPress={() => void savePosterAndEvent()}>
          Save poster
        </Button>

        <Text variant="label" className="mt-2">
          Registration categories
        </Text>
        {categoryEdits.map((row) => {
          const canDelete = categoryEdits.length > 1 && row.occupied === 0;
          return (
            <View key={row.id} className="gap-2 border border-border p-3">
              <Text variant="caption">Category name</Text>
              <TextInput
                value={row.name}
                onChangeText={(name) =>
                  setCategoryEdits((rows) =>
                    rows.map((item) => (item.id === row.id ? { ...item, name } : item)),
                  )
                }
                placeholder="e.g. Open"
                placeholderTextColor={colors.muted}
                className="h-11 rounded-md border border-border bg-elevated px-3"
                style={{ color: colors.ink }}
              />
              <Text variant="caption">Max spots · Fee (₹) · Dancers per entry</Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={row.capacity}
                  onChangeText={(capacity) =>
                    setCategoryEdits((rows) =>
                      rows.map((item) => (item.id === row.id ? { ...item, capacity } : item)),
                    )
                  }
                  keyboardType="number-pad"
                  className="h-11 flex-1 rounded-md border border-border bg-elevated px-3"
                  style={{ color: colors.ink }}
                />
                <TextInput
                  value={row.priceRupees}
                  onChangeText={(priceRupees) =>
                    setCategoryEdits((rows) =>
                      rows.map((item) => (item.id === row.id ? { ...item, priceRupees } : item)),
                    )
                  }
                  keyboardType="number-pad"
                  className="h-11 flex-1 rounded-md border border-border bg-elevated px-3"
                  style={{ color: colors.ink }}
                />
                <TextInput
                  value={row.teamSize}
                  onChangeText={(teamSize) =>
                    setCategoryEdits((rows) =>
                      rows.map((item) => (item.id === row.id ? { ...item, teamSize } : item)),
                    )
                  }
                  keyboardType="number-pad"
                  className="h-11 flex-1 rounded-md border border-border bg-elevated px-3"
                  style={{ color: colors.ink }}
                />
              </View>
              <Button loading={pending} variant="secondary" onPress={() => void saveCategory(row)}>
                Save category
              </Button>
              <Button
                disabled={!canDelete || pending}
                variant="ghost"
                onPress={() => confirmDelete(row)}
              >
                Delete category
              </Button>
            </View>
          );
        })}

        <Text variant="label">Add category</Text>
        <TextInput
          value={newCatName}
          onChangeText={setNewCatName}
          placeholder="Category name"
          placeholderTextColor={colors.muted}
          className="h-11 rounded-md border border-border bg-elevated px-3"
          style={{ color: colors.ink }}
        />
        <View className="flex-row gap-2">
          <TextInput
            value={newCatCapacity}
            onChangeText={setNewCatCapacity}
            keyboardType="number-pad"
            placeholder="Spots"
            placeholderTextColor={colors.muted}
            className="h-11 flex-1 rounded-md border border-border bg-elevated px-3"
            style={{ color: colors.ink }}
          />
          <TextInput
            value={newCatPrice}
            onChangeText={setNewCatPrice}
            keyboardType="number-pad"
            placeholder="₹"
            placeholderTextColor={colors.muted}
            className="h-11 flex-1 rounded-md border border-border bg-elevated px-3"
            style={{ color: colors.ink }}
          />
          <TextInput
            value={newCatTeam}
            onChangeText={setNewCatTeam}
            keyboardType="number-pad"
            placeholder="Team"
            placeholderTextColor={colors.muted}
            className="h-11 flex-1 rounded-md border border-border bg-elevated px-3"
            style={{ color: colors.ink }}
          />
        </View>
        <Button loading={pending} variant="secondary" onPress={() => void addCategory()}>
          Add category
        </Button>

        {message ? <Text variant="caption">{message}</Text> : null}
        {error ? (
          <Text variant="caption" className="text-danger">
            {error}
          </Text>
        ) : null}
        <Button loading={pending} variant="lime" onPress={() => void togglePublish()}>
          {event.status === 'published' ? 'Unpublish' : 'Publish'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
