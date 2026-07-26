import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';
import { Text } from './Text';

/**
 * Entry type tag: amethyst-tint background, amethyst text, radius 9. The tag
 * is a text label (never color-only), so meaning survives for color-blind
 * users and in grayscale (handoff §5.5).
 */
export function EntryTag({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tag, { backgroundColor: colors.amethystTint }]}>
      <Text variant="tag" color="amethystText">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    borderRadius: radii.tag,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
});
