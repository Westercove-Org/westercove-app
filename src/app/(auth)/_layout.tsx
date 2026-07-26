import { Stack } from 'expo-router';
import { View } from 'react-native';

import { CrisisBanner } from '@/components/CrisisBanner';
import { useTheme } from '@/theme';

/**
 * Pre-auth arrival flow (launch, disclaimer, entry path, sign-in). The crisis
 * banner is present here too, before any account exists (handoff §6.0).
 */
export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack screenOptions={{ headerShown: false }} />
      <CrisisBanner />
    </View>
  );
}
