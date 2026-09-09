import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
  OrganizerDto,
  OrganizerEventDetailDto,
  OrganizerEventRegistrationsResponse,
} from '@cypher/contracts';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/format';
import { colors } from '@/lib/theme';
import { webBaseUrl } from '@/lib/web';

type TabId = 'overview' | 'registrations' | 'updates' | 'lineup' | 'media' | 'payouts';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'registrations', label: 'Registrations' },
  { id: 'updates', label: 'Updates' },
  { id: 'lineup', label: 'Lineup' },
  { id: 'media', label: 'Media' },
  { id: 'payouts', label: 'Payouts' },
];

function formatPrice(priceMinor: number): string {
  return priceMinor === 0 ? 'Free' : `₹${Math.round(priceMinor / 100)}`;
}

export default function EventManageScreen() {
  const { slug, eventId } = useLocalSearchParams<{ slug: string; eventId: string }>();
  const auth = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('overview');
  const [org, setOrg] = useState<OrganizerDto | null>(null);
  const [event, setEvent] = useState<OrganizerEventDetailDto | null>(null);
  const [regs, setRegs] = useState<OrganizerEventRegistrationsResponse | null>(null);
  const [payoutReady, setPayoutReady] = useState(false);
  const [payoutStatus, setPayoutStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug || !eventId || !auth.token) return;
    try {
      const organizer = await auth.api.getMyOrganizerBySlug(slug);
      const [detail, registrations, payout] = await Promise.all([
        auth.api.getOrganizerEvent(organizer.id, eventId),
        auth.api.listOrganizerEventRegistrations(organizer.id, eventId),
        auth.api.getOrganizerPaymentAccount(organizer.id).catch(() => null),
      ]);
      setOrg(organizer);
      setEvent(detail);
      setRegs(registrations);
      setPayoutReady(Boolean(payout?.payoutReady));
      setPayoutStatus(payout?.status ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    }
  }, [auth.api, auth.token, eventId, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const competeCats = useMemo(
    () => (event?.categories ?? []).filter((c) => c.entryType !== 'viewer'),
    [event],
  );
  const audienceCat = useMemo(
    () => (event?.categories ?? []).find((c) => c.entryType === 'viewer') ?? null,
    [event],
  );

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
      setEvent(updated);
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

  if (!event || !org) {
    return (
      <SafeAreaView className="flex-1 bg-bg px-4">
        <Text variant="caption" className="mt-8">
          Loading…
        </Text>
      </SafeAreaView>
    );
  }

  const editHref = `/organize/${String(slug)}/events/${String(eventId)}/edit` as Href;
  const checkInHref = `/organize/${String(slug)}/events/${String(eventId)}/check-in` as Href;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['bottom']}>
      <ScrollView contentContainerClassName="gap-3 px-4 pb-10 pt-2">
        <Text variant="kicker">{event.status}</Text>
        <Text variant="display" className="text-[44px] leading-[44px]">
          {event.title}
        </Text>
        <Text variant="caption">
          {event.city}
          {event.venue ? ` · ${event.venue}` : ''} · {new Date(event.startTime).toLocaleString()}
        </Text>

        <View className="mt-2 flex-row flex-wrap gap-2">
          <Button variant="secondary" onPress={() => router.push(editHref)}>
            Edit
          </Button>
          <Button loading={pending} variant="lime" onPress={() => void togglePublish()}>
            {event.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="secondary" onPress={() => router.push(checkInHref)}>
            Check-in
          </Button>
        </View>

        {message ? <Text variant="caption">{message}</Text> : null}
        {error ? (
          <Text variant="caption" className="text-danger">
            {error}
          </Text>
        ) : null}

        <View className="mt-2 flex-row flex-wrap gap-2 border-b border-border pb-2">
          {TABS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              className={cn(
                'rounded-sm px-3 py-2',
                tab === item.id ? 'bg-accent' : 'active:bg-elevated',
              )}
            >
              <Text
                variant="label"
                className={cn(
                  'text-[10px] tracking-[1.4px]',
                  tab === item.id ? 'text-ink' : 'text-muted',
                )}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'overview' ? (
          <View className="gap-4">
            {event.description ? (
              <View className="gap-1">
                <Text variant="label">About</Text>
                <Text variant="caption">{event.description}</Text>
              </View>
            ) : null}

            <View className="gap-2">
              <Text variant="label">Compete</Text>
              {competeCats.length === 0 ? (
                <Text variant="caption">No competition categories yet.</Text>
              ) : (
                competeCats.map((cat) => (
                  <View key={cat.id} className="border border-border px-3 py-2">
                    <Text variant="body" className="font-semibold">
                      {cat.name}
                    </Text>
                    <Text variant="caption">
                      {cat.entryType} · {cat.confirmedCount}/{cat.capacity} confirmed
                      {cat.reservedCount ? ` · ${cat.reservedCount} held` : ''} ·{' '}
                      {formatPrice(cat.priceMinor)}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View className="gap-2">
              <Text variant="label">Audience</Text>
              {audienceCat ? (
                <View className="border border-border bg-elevated/40 px-3 py-2">
                  <Text variant="body" className="font-semibold">
                    Watch / audience
                  </Text>
                  <Text variant="caption">
                    {formatPrice(audienceCat.priceMinor)} · {audienceCat.confirmedCount}/
                    {audienceCat.capacity} confirmed
                    {audienceCat.reservedCount ? ` · ${audienceCat.reservedCount} held` : ''}
                  </Text>
                </View>
              ) : (
                <Text variant="caption">
                  No audience pass — enable one when you edit this event.
                </Text>
              )}
            </View>
          </View>
        ) : null}

        {tab === 'registrations' ? (
          <View className="gap-2">
            {regs ? (
              <>
                <Text variant="caption">
                  Pending {regs.totals.pending} · Confirmed {regs.totals.confirmed}
                  {regs.totals.other > 0 ? ` · Other ${regs.totals.other}` : ''}
                </Text>
                {regs.categories.map((cat) => (
                  <View key={cat.id} className="border border-border px-3 py-2">
                    <Text variant="body" className="font-semibold">
                      {cat.name}
                    </Text>
                    <Text variant="caption">
                      {cat.confirmedCount} confirmed · {cat.reservedCount} held · {cat.capacity}{' '}
                      cap
                    </Text>
                  </View>
                ))}
                {regs.items.length === 0 ? (
                  <Text variant="caption">
                    No registrations yet. Share the public event link so dancers can hold a spot.
                  </Text>
                ) : (
                  regs.items.map((row) => (
                    <View key={row.id} className="gap-1 border border-border px-3 py-2">
                      <Text variant="body" className="font-semibold">
                        {row.categoryName} · {row.registrationStatus.replaceAll('_', ' ')}
                      </Text>
                      {row.entryName ? (
                        <Text variant="caption">Entry {row.entryName}</Text>
                      ) : null}
                      <Text variant="caption">
                        {row.participants
                          .map((p) => `${p.displayName}${p.isTeamCaptain ? ' (captain)' : ''}`)
                          .join(', ')}
                      </Text>
                      <Text variant="caption">{row.registrationCode}</Text>
                    </View>
                  ))
                )}
              </>
            ) : (
              <Text variant="caption">Loading registrations…</Text>
            )}
          </View>
        ) : null}

        {tab === 'updates' ? (
          <MobileUpdatesTab organizerId={org.id} eventId={event.id} />
        ) : null}

        {tab === 'lineup' ? (
          <MobileLineupTab organizerId={org.id} eventId={event.id} slug={org.slug} />
        ) : null}

        {tab === 'media' ? (
          <View className="gap-2">
            <Text variant="caption">YouTube / IG / Drive links — not hosted video.</Text>
            {(event.mediaLinks ?? []).length === 0 ? (
              <Text variant="caption">No media links yet. Add them in Edit.</Text>
            ) : (
              (event.mediaLinks ?? []).map((link) => (
                <View key={link.id} className="gap-1 border border-border px-3 py-2">
                  <Text variant="body" className="font-semibold">
                    {link.title}
                  </Text>
                  <Text variant="caption">
                    {link.kind} · {link.url}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : null}

        {tab === 'payouts' ? (
          <View className="gap-3 rounded-sm border border-border bg-elevated/40 p-4">
            <Text variant="kicker">Settlement</Text>
            <Text variant="subtitle" className="text-[22px]">
              {payoutReady ? 'Connected' : 'Pending'}
            </Text>
            {payoutStatus ? (
              <Text variant="caption">Account status: {payoutStatus}</Text>
            ) : null}
            <Text variant="caption">
              {payoutReady
                ? 'Paid entry and audience fees settle to the connected bank or UPI. Settlement setup is managed on web.'
                : 'Settlement is set up on web. Connect bank or UPI there before charging fees above ₹0. Free (₹0) events still work without it.'}
            </Text>
            <Button
              variant="secondary"
              onPress={() =>
                void Linking.openURL(
                  `${webBaseUrl().replace(/\/$/, '')}/organize/${org.slug}/payouts`,
                )
              }
            >
              Continue on browser
            </Button>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function MobileUpdatesTab({ organizerId, eventId }: { organizerId: string; eventId: string }) {
  const auth = useAuth();
  const [items, setItems] = useState<Array<{ id: string; kind: string; title: string | null; body: string; publishedAt: string }>>([]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void auth.api
      .listEventUpdates(organizerId, eventId)
      .then((res) => setItems(res.items))
      .catch(() => setItems([]));
  }, [auth.api, eventId, organizerId]);

  async function post() {
    if (!body.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      await auth.api.createEventUpdate(organizerId, eventId, { body: body.trim(), kind: 'GENERAL' });
      setBody('');
      const res = await auth.api.listEventUpdates(organizerId, eventId);
      setItems(res.items);
      setMsg('Posted.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="gap-3">
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Post an update for dancers"
        placeholderTextColor={colors.muted}
        multiline
        className="min-h-[88px] border border-border bg-elevated px-3 py-2 text-ink"
      />
      <Button loading={busy} onPress={() => void post()} disabled={!body.trim()}>
        Post update
      </Button>
      {msg ? <Text variant="caption">{msg}</Text> : null}
      {items.map((item) => (
        <View key={item.id} className="gap-1 border border-border px-3 py-2">
          <Text variant="caption">{item.kind}</Text>
          {item.title ? <Text variant="body" className="font-semibold">{item.title}</Text> : null}
          <Text variant="caption">{item.body}</Text>
        </View>
      ))}
    </View>
  );
}

function MobileLineupTab({
  organizerId,
  eventId,
  slug,
}: {
  organizerId: string;
  eventId: string;
  slug: string;
}) {
  const auth = useAuth();
  const [drops, setDrops] = useState<
    Array<{ id: string; title: string | null; publishedAt: string }>
  >([]);

  useEffect(() => {
    void auth.api
      .listEventUpdates(organizerId, eventId)
      .then((res) =>
        setDrops(
          res.items
            .filter((item) => item.kind === 'LINEUP')
            .map((item) => ({
              id: item.id,
              title: item.title,
              publishedAt: item.publishedAt,
            })),
        ),
      )
      .catch(() => setDrops([]));
  }, [auth.api, eventId, organizerId]);

  return (
    <View className="gap-3">
      <Text variant="body" className="text-ink-secondary">
        Lineup is poster-first. Drop the graphic on the browser — one flyer can carry the whole
        cast.
      </Text>
      <Button
        variant="secondary"
        onPress={() =>
          void Linking.openURL(
            `${webBaseUrl().replace(/\/$/, '')}/organize/${slug}/events/${eventId}`,
          )
        }
      >
        Drop poster on browser
      </Button>
      {drops.length === 0 ? (
        <Text variant="caption">No lineup posters yet.</Text>
      ) : (
        drops.map((drop) => (
          <View key={drop.id} className="gap-1 border border-border px-3 py-2">
            <Text variant="body" className="font-semibold">
              {drop.title || 'Lineup drop'}
            </Text>
            <Text variant="caption">{new Date(drop.publishedAt).toLocaleString()}</Text>
          </View>
        ))
      )}
    </View>
  );
}
