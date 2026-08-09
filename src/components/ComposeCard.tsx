import { Pressable, StyleSheet, View } from 'react-native';

import { MicIcon, PaperclipIcon, PencilIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export interface ComposeCardProps {
  /** Command chips under the prompt. Omit for a chip-less compose pill. */
  chips?: readonly string[];
  /** Prompt placeholder text (defaults to "What are you feeling?"). */
  placeholder?: string;
  /** Show a paperclip (attach) control instead of the pencil (Journal). */
  attach?: boolean;
  onPressPrompt?: () => void;
  onPressMic?: () => void;
  onPressChip?: (label: string) => void;
}

/**
 * The compose surface: a prompt with a pencil (or paperclip) control and a
 * forest mic control, optionally above a wrap of command chips.
 */
export function ComposeCard({
  chips,
  placeholder = copy.home.prompt,
  attach = false,
  onPressPrompt,
  onPressMic,
  onPressChip,
}: ComposeCardProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Card>
        <View style={styles.promptRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={placeholder}
            onPress={onPressPrompt}
            style={styles.promptText}
          >
            <Text variant="body" color="textMuted">
              {placeholder}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={attach ? 'Attach to entry' : 'Write an entry'}
            onPress={onPressPrompt}
            style={[styles.pencil, { backgroundColor: colors.chipGreen }]}
          >
            {attach ? (
              <PaperclipIcon size={20} color={colors.forest} />
            ) : (
              <PencilIcon size={20} color={colors.forest} />
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Speak an entry"
            onPress={onPressMic}
            style={[styles.mic, { backgroundColor: colors.forest }]}
          >
            <MicIcon size={22} color={colors.onAccent} />
          </Pressable>
        </View>

        {chips && chips.length > 0 ? (
          <View style={styles.chips}>
            {chips.map((label) => (
              <Chip key={label} label={label} onPress={() => onPressChip?.(label)} />
            ))}
          </View>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg },
  promptRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  promptText: { flex: 1 },
  pencil: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
