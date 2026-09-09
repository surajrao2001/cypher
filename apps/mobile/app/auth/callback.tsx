import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import * as Linking from 'expo-linking';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/lib/auth';

/**
 * Deep-link landing for OAuth redirects (cypher://auth/callback).
 * Primary flow completes inside AuthProvider via openAuthSessionAsync;
 * this route covers cold-start / secondary opens.
 */
export default function AuthCallbackScreen() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          await auth.refresh();
        }
      } finally {
        router.replace('/(tabs)/organize');
      }
    })();
  }, [auth, router]);

  return (
    <View className="flex-1 items-center justify-center bg-bg px-4">
      <Text variant="caption">Finishing sign-in…</Text>
    </View>
  );
}
