import { Pressable, StyleSheet, View } from 'react-native';

import { MicIcon, PencilIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

export interface ComposeCardProps {
  chips: readonly string[];
  onPressPrompt?: () => void;
  onPressMic?: () => void;
  onPressChip?: (label: string) => void;
}

/**
 * The compose surface: the "What are you feeling?" prompt with a pencil
 * (type) control and a forest mic (voice) control, above a wrap of command
 * chips. Voice capture and command behavior are wired in Phase 3.
 */
export function ComposeCard({
  chips,
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
            accessibilityLabel={copy.home.prompt}
            onPress={onPressPrompt}
            style={styles.promptText}
          >
            <Text variant="body" color="textMuted">
              {copy.home.prompt}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Write an entry"
            onPress={onPressPrompt}
            style={[styles.pencil, { backgroundColor: colors.chipGreen }]}
          >
            <PencilIcon size={20} color={colors.forest} />
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

        <View style={styles.chips}>
          {chips.map((label) => (
            <Chip key={label} label={label} onPress={() => onPressChip?.(label)} />
          ))}
        </View>
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
