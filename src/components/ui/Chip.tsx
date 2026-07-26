import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leading?: React.ReactNode;
}

/**
 * Command / filter chip. Unselected: white/surface with a thin line border and
 * forest label. Selected: forest fill with a white label (handoff §5.3).
 * Min 44pt touch target.
 */
export function Chip({ label, selected = false, onPress, leading }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.forest : colors.card,
          borderColor: colors.line,
        },
        pressed && onPress ? { opacity: 0.7 } : null,
      ]}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <Text
        variant="body"
        color={selected ? colors.onAccent : colors.forest}
        style={styles.label}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.chip,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  leading: { marginRight: 2 },
  label: { fontWeight: '500' },
});
