import '@/global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  SourceSerif4_400Regular,
  SourceSerif4_600SemiBold,
} from '@expo-google-fonts/source-serif-4';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthGuard } from '@/features/auth/useAuthGuard';
import { useSessionStore } from '@/features/auth/sessionStore';
import { useQuestionsStore } from '@/features/questions/questionsStore';
import { useTheme, WestercoveThemeProvider } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Source Serif 4 (display) + Inter (body/labels) drive all typography, so
  // hold the splash until the faces are ready to avoid a flash of fallback text.
  const [fontsLoaded, fontError] = useFonts({
    SourceSerif4_400Regular,
    SourceSerif4_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

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

  // Count one app-open session so the Home check-in un-snoozes each open.
  useEffect(() => {
    useQuestionsStore.getState().startSession();
  }, []);

  // Hold on a plain surface until the persisted session has rehydrated, so we
  // don't flash the tab shell before the guard can redirect.
  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <>
      {/* Hero is a bright parchment photo, so dark status-bar content. */}
      <StatusBar style="dark" />
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
    </>
  );
}
