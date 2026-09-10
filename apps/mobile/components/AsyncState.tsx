import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

/** Map thrown / API errors to short dancer-facing copy. */
export function friendlyError(
  err: unknown,
  fallback = 'Something went sideways. Try again in a moment.',
): string {
  const raw =
    err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  const msg = raw.trim();
  if (!msg) return fallback;
  if (/failed to fetch|network|timeout|econnrefused/i.test(msg)) {
    return 'Check your connection and try again.';
  }
  if (/401|unauthorized|jwt|session/i.test(msg)) {
    return 'Your session expired. Sign in again.';
  }
  if (/403|forbidden|not allowed/i.test(msg)) {
    return "You don’t have access to that.";
  }
  if (/404|not found/i.test(msg)) {
    return 'We couldn’t find that.';
  }
  if (
    msg.length <= 120 &&
    !/exception|prisma|sql|stack|nestjs|undefined/i.test(msg)
  ) {
    return msg;
  }
  return fallback;
}

export function SoftError({
  title = 'Couldn’t load that',
  error,
  body,
  onRetry,
}: {
  title?: string;
  error?: unknown;
  body?: string;
  onRetry?: () => void;
}) {
  const copy = body ?? (error !== undefined ? friendlyError(error) : 'Try again in a moment.');
  return (
    <View className="mt-6 gap-3 rounded-md border border-dashed border-border bg-surface px-4 py-8">
      <Text variant="kicker">Hang on</Text>
      <Text variant="title" className="text-[28px]">
        {title}
      </Text>
      <Text variant="caption">{copy}</Text>
      {onRetry ? (
        <Button variant="secondary" onPress={onRetry}>
          Try again
        </Button>
      ) : null}
    </View>
  );
}

export function InlineNotice({
  children,
  tone = 'muted',
}: {
  children: string;
  tone?: 'muted' | 'warn';
}) {
  return (
    <View
      className={`rounded-md border border-border px-3 py-2 ${
        tone === 'warn' ? 'bg-elevated' : 'bg-elevated/60'
      }`}
    >
      <Text variant="caption" className={tone === 'warn' ? 'text-ink' : undefined}>
        {children}
      </Text>
    </View>
  );
}

/** Simple pulse bars — RN has no CSS pulse; use muted placeholders. */
export function PageLoading({ label = 'Loading' }: { label?: string }) {
  return (
    <View className="mt-6 gap-3" accessibilityLabel={label} accessibilityState={{ busy: true }}>
      <View className="h-3 w-24 rounded-sm bg-elevated" />
      <View className="h-8 w-2/3 rounded-sm bg-elevated" />
      <View className="h-4 w-full rounded-sm bg-elevated" />
      <View className="mt-2 h-24 w-full rounded-md bg-elevated" />
      <View className="h-24 w-full rounded-md bg-elevated" />
    </View>
  );
}

export function ListLoading({ rows = 4 }: { rows?: number }) {
  return (
    <View className="mt-4 gap-3" accessibilityState={{ busy: true }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} className="h-16 rounded-md border border-border bg-elevated/80" />
      ))}
    </View>
  );
}

export function AuthChipLoading() {
  return (
    <View className="flex-row items-center gap-3 px-1 py-2" accessibilityState={{ busy: true }}>
      <View className="h-8 w-8 rounded-full bg-elevated" />
      <View className="gap-1.5">
        <View className="h-2.5 w-14 rounded-sm bg-elevated" />
        <View className="h-3 w-24 rounded-sm bg-elevated" />
      </View>
    </View>
  );
}
