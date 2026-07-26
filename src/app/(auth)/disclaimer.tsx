import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

/** Disclaimer: wellness-companion-not-therapy, plus the 18+ and T&C acknowledgment. */
export default function DisclaimerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [agreed, setAgreed] = useState(false);

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top + spacing.huge }]}
    >
      <View style={styles.content}>
        <Text variant="display" accessibilityRole="header">
          {copy.disclaimerScreen.title}
        </Text>
        <Text variant="body" color="textMuted" style={styles.body}>
          {copy.disclaimerScreen.body}
        </Text>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          accessibilityLabel={copy.disclaimerScreen.age}
          onPress={() => setAgreed((v) => !v)}
          style={styles.checkRow}
        >
          <View
            style={[
              styles.box,
              { borderColor: colors.line },
              agreed && { backgroundColor: colors.forest, borderColor: colors.forest },
            ]}
          >
            {agreed ? (
              <Text color={colors.onAccent} style={styles.tick}>
                ✓
              </Text>
            ) : null}
          </View>
          <Text variant="body" style={styles.checkLabel}>
            {copy.disclaimerScreen.age}
          </Text>
        </Pressable>
      </View>

      <Button
        label={copy.disclaimerScreen.agree}
        disabled={!agreed}
        onPress={() => router.push('/entry-path')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  content: { gap: spacing.lg },
  body: {},
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    minHeight: 44,
    marginTop: spacing.sm,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tick: { fontSize: 15, fontWeight: '700' },
  checkLabel: { flex: 1 },
});
