import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { Text } from './Text';

/**
 * The soft empty-state pattern. Copy is gentle and never comments on absence
 * ("There is nothing here yet, and that is fine. Begin when you are ready.").
 */
export function EmptyState({ message, subtitle }: { message: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      <Text variant="body" color="textMuted" style={styles.message}>
        {message}
      </Text>
      {subtitle ? (
        <Text variant="bodySmall" color="textMuted" style={styles.message}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.huge,
    alignItems: 'center',
    gap: spacing.sm,
  },
  message: { textAlign: 'center' },
});
