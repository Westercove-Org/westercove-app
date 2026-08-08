import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CrisisBanner } from '@/components/CrisisBanner';
import { useTheme } from '@/theme';

/**
 * Pre-auth arrival flow (launch, disclaimer, entry path, sign-in). The crisis
 * banner floats over the bottom of the screen content (so the launch photo
 * reaches behind it), and stays present before any account exists.
 */
export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={{ flex: 1 }} pointerEvents="none" />
        <CrisisBanner />
      </View>
    </View>
  );
}
