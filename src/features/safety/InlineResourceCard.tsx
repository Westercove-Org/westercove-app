import { Pressable, StyleSheet, View } from 'react-native';

import { MessageIcon, PhoneIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { callLine, textLine } from '@/lib/crisisLinks';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/**
 * Level 2 (Elevated Distress): a gentle inline resource card appended below a
 * companion response. Non-blocking — the conversation continues; this simply
 * offers support without interrupting (handoff §4.3).
 */
export function InlineResourceCard() {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Card reflective>
        <Text variant="cardTitle" color="amethystText">
          {copy.safety.inlineTitle}
        </Text>
        <Text variant="bodySmall" color="amethystText" style={styles.body}>
          {copy.safety.inlineBody}
        </Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Call or text 988, Suicide and Crisis Lifeline"
            onPress={() => callLine('988')}
            style={styles.action}
          >
            <PhoneIcon size={18} color={colors.emerald} />
            <Text variant="bodySmall" color={colors.emerald} style={styles.actionText}>
              Call or text 988
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Text HOME to 741741, Crisis Text Line"
            onPress={() => textLine('741741', 'HOME')}
            style={styles.action}
          >
            <MessageIcon size={18} color={colors.emerald} />
            <Text variant="bodySmall" color={colors.emerald} style={styles.actionText}>
              Text HOME to 741741
            </Text>
          </Pressable>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.screen, paddingTop: spacing.cardGap },
  body: { marginTop: spacing.xs },
  actions: { marginTop: spacing.md, gap: spacing.sm },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  actionText: { fontWeight: '600' },
});
