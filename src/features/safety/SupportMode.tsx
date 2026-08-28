import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { callLine, textLine } from '@/lib/crisisLinks';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { ServerResources } from './ServerResources';

/**
 * Level 3 (High Risk): Support Mode — a calmer, full-width state with reduced
 * animation and larger targets, offering grounding, a way to contact a trusted
 * person, and the crisis actions, plus a strong professional-resource
 * recommendation (handoff §4.3). The Six Moves are suspended here.
 */
export function SupportMode() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.huge,
          paddingBottom: insets.bottom + spacing.xxl,
          paddingHorizontal: spacing.screen,
          gap: spacing.lg,
        }}
      >
        <Text variant="display" accessibilityRole="header">
          {copy.safety.supportModeTitle}
        </Text>
        <Text variant="body" color="textMuted">
          {copy.safety.supportModeBody}
        </Text>

        <Card reflective>
          <Text variant="body" color="amethystText">
            {copy.safety.grounding}
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            label="Call or text 988"
            variant="primary"
            onPress={() => callLine('988')}
          />
          <Button
            label="Text HOME to 741741"
            variant="secondary"
            onPress={() => textLine('741741', 'HOME')}
          />
        </View>

        {/* The backend's professional-resource card for this tier, when present. */}
        <ServerResources padded={false} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Return to a quiet screen"
          onPress={() => router.back()}
          style={styles.softExit}
        >
          <Text variant="body" color="textMuted">
            {copy.safety.softExit}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.md, marginTop: spacing.sm },
  softExit: { alignItems: 'center', minHeight: 44, justifyContent: 'center', marginTop: spacing.md },
});
