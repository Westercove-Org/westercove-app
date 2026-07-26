import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { Text } from './Text';

/** Forest uppercase section label (RECENT, BOOKS, READING, SETTINGS). */
export function SectionLabel({ children }: { children: string }) {
  return (
    <View style={styles.wrap}>
      <Text variant="sectionLabel">{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
  },
});
