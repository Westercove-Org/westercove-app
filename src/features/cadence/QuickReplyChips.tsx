import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

/**
 * Inline answer controls for a companion-asked question (design doc §5): the
 * tap options render as quick-reply chips, plus "Not now" (defer) and "Skip this
 * one" (skip). Presentational only — the parent wires it to the answers / defer
 * / skip endpoints.
 *
 * `options` empty → a free-text question, so a small text-answer affordance
 * shows instead of chips. `onSelect` receives the chosen chip or the typed text.
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
  const [draft, setDraft] = useState('');
  const submitDraft = () => {
    const v = draft.trim();
    if (v) onSelect(v);
  };
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
      ) : (
        <View style={styles.answerRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submitDraft}
            placeholder="Type your answer"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Your answer"
            returnKeyType="send"
            style={[styles.answerInput, { borderColor: colors.line, color: colors.textPrimary }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send answer"
            disabled={draft.trim().length === 0}
            onPress={submitDraft}
            style={({ pressed }) => [
              styles.answerSend,
              { borderColor: colors.line },
              draft.trim().length === 0 && { opacity: 0.4 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text variant="bodySmall" color="textPrimary">
              Send
            </Text>
          </Pressable>
        </View>
      )}
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
  answerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  answerInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.inputPill,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    fontSize: 14,
  },
  answerSend: {
    borderWidth: 1,
    borderRadius: radii.inputPill,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
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
