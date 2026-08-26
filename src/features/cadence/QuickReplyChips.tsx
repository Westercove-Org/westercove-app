import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

/**
 * Inline answer controls for a companion-asked question (design doc §5): the
 * tap options render as quick-reply chips, plus "Not now" (defer) and "Skip this
 * one" (skip). Presentational only — the parent wires it to the answers / defer
 * / skip endpoints. Used by the in-chat question rendering (BE-5 phase); shipped
 * now so that phase is a small diff.
 *
 * `options` empty → a free-text question, so only the defer/skip row shows.
 */
export function QuickReplyChips({
  options,
  onSelect,
  onDefer,
  onSkip,
}: {
  options: string[];
  onSelect: (value: string) => void;
  onDefer: () => void;
  onSkip: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {options.length > 0 ? (
        <View style={styles.chips}>
          {options.map((opt) => (
            <Pressable
              key={opt}
              accessibilityRole="button"
              accessibilityLabel={opt}
              onPress={() => onSelect(opt)}
              style={({ pressed }) => [
                styles.chip,
                { borderColor: colors.line },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text variant="bodySmall" color="textPrimary">
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={styles.softRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Not now" onPress={onDefer} hitSlop={8}>
          <Text variant="bodySmall" color="textMuted">
            Not now
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Skip this one" onPress={onSkip} hitSlop={8}>
          <Text variant="bodySmall" color="textMuted">
            Skip this one
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderRadius: radii.inputPill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: 'center',
  },
  softRow: { flexDirection: 'row', gap: spacing.lg, paddingTop: spacing.xs },
});
