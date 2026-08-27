import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/** Branded fallback for unmatched routes (replaces Expo's raw "Unmatched
 * Route"). Minimal on purpose: app shell + a way back to the start. */
export default function NotFoundScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text variant="screenTitle" style={styles.title}>
          Page not found
        </Text>
        <Text variant="body" color="textMuted" style={styles.body}>
          We couldn’t find that page.
        </Text>
        <Button
          label="Go to the start"
          variant="amethyst"
          onPress={() => router.replace('/launch')}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
    gap: spacing.md,
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center' },
});
