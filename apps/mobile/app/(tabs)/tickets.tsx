import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { colors } from '@/lib/theme';

export default function TicketsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-1 px-4 pt-2">
        <Text variant="kicker">Wallet</Text>
        <Text variant="display" className="mt-1 text-[52px] leading-[52px]">
          Tickets
        </Text>
        <Text variant="caption" className="mt-2">
          Confirmed registrations land here as digital tickets. Nothing on this phone yet.
        </Text>

        <Card className="mt-8 items-center px-6 py-10">
          <View className="h-16 w-16 items-center justify-center rounded-full border border-border bg-elevated">
            <Ionicons name="ticket-outline" size={28} color={colors.lime} />
          </View>
          <Text variant="title" className="mt-5 text-center text-[28px]">
            No tickets yet
          </Text>
          <Text variant="caption" className="mt-2 text-center">
            Register for a night and your pass will show up here with a QR once payment clears.
          </Text>
          <Button className="mt-6 w-full" onPress={() => router.push('/discover')}>
            Find a cypher
          </Button>
        </Card>
      </View>
    </SafeAreaView>
  );
}
