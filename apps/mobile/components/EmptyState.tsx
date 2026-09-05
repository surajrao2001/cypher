import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

export function EmptyState({
  kicker,
  title,
  body,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <View className="mt-6 gap-3 rounded-md border border-dashed border-border bg-surface px-4 py-8">
      <Text variant="kicker">{kicker}</Text>
      <Text variant="title" className="text-[28px]">
        {title}
      </Text>
      <Text variant="caption">{body}</Text>
      {children}
    </View>
  );
}
