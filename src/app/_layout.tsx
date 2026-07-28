import '@/global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthGuard } from '@/features/auth/useAuthGuard';
import { useSessionStore } from '@/features/auth/sessionStore';
import { QuestionsOverlay } from '@/features/questions/QuestionsOverlay';
import { useTheme, WestercoveThemeProvider } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // The app uses only the native system font, so there is nothing to load —
  // release the splash as soon as we mount.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <WestercoveThemeProvider>
        <RootNav />
      </WestercoveThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNav() {
  const { colors } = useTheme();
  const hydrated = useSessionStore((s) => s.hydrated);
  useAuthGuard();

  // Hold on a plain surface until the persisted session has rehydrated, so we
  // don't flash the tab shell before the guard can redirect.
  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <>
      {/* Hero is dark at the top of every screen, so light status-bar content. */}
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="gate" options={{ gestureEnabled: false }} />
        <Stack.Screen name="support-mode" options={{ presentation: 'card' }} />
        {/* Level 4 interrupts flow and cannot be swiped away; the only exit is
            the in-screen soft exit. */}
        <Stack.Screen
          name="crisis"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
      </Stack>
      {/* Timer-driven profile questions overlay the whole app; it self-hides
          until the talk-time timer marks a Day due. */}
      <QuestionsOverlay />
    </>
  );
}
