import { Pressable, StyleSheet, View } from 'react-native';

import { SearchIcon } from '@/components/icons';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';
import { Text } from './Text';

export interface SearchPillProps {
  placeholder: string;
  onPress?: () => void;
}

/**
 * Search pill: radius 25, surface-alt fill, leading search glyph, muted
 * placeholder (handoff §5.4). A tappable entry point into the search surface.
 */
export function SearchPill({ placeholder, onPress }: SearchPillProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel={placeholder}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: colors.surfaceAlt },
        pressed && onPress ? { opacity: 0.7 } : null,
      ]}
    >
      <SearchIcon size={20} color={colors.textMuted} />
      <View style={styles.textWrap}>
        <Text variant="body" color="textMuted">
          {placeholder}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.inputPill,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  textWrap: { flex: 1 },
});
