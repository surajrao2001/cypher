import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold, Barlow_700Bold } from '@expo-google-fonts/barlow';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { fallbackFonts, FontsProvider, loadedFonts } from '@/lib/fonts';
import { AuthProvider } from '@/lib/auth';
import { colors } from '@/lib/theme';

import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
void SystemUI.setBackgroundColorAsync('#0A0A0A');

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
  });

  const fontsReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return <View className="flex-1 bg-bg" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
          <FontsProvider value={fontsLoaded ? loadedFonts : fallbackFonts}>
        <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="event/[id]"
            options={{
              headerShown: true,
              headerTitle: '',
              headerTransparent: true,
              headerTintColor: colors.ink,
              headerBackTitle: 'Discover',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="organize/new"
            options={{
              headerShown: true,
              headerTitle: 'New organizer',
              headerTintColor: colors.ink,
              headerStyle: { backgroundColor: colors.bg },
              headerBackTitle: 'Organize',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="organize/[slug]/index"
            options={{
              headerShown: true,
              headerTitle: 'Organizer',
              headerTintColor: colors.ink,
              headerStyle: { backgroundColor: colors.bg },
              headerBackTitle: 'Organize',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="organize/[slug]/events/new"
            options={{
              headerShown: true,
              headerTitle: 'Draft event',
              headerTintColor: colors.ink,
              headerStyle: { backgroundColor: colors.bg },
              headerBackTitle: 'Organizer',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="organize/[slug]/events/[eventId]"
            options={{
              headerShown: true,
              headerTitle: 'Event',
              headerTintColor: colors.ink,
              headerStyle: { backgroundColor: colors.bg },
              headerBackTitle: 'Organizer',
              animation: 'slide_from_right',
            }}
          />
        </Stack>
        </AuthProvider>
      </FontsProvider>
    </GestureHandlerRootView>
  );
}
