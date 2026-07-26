import { Pressable, StyleSheet, View } from 'react-native';

import { EntryTag } from '@/components/ui/EntryTag';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme/tokens';

export interface EntryCardProps {
  type: string;
  headline: string;
  timestamp: string;
  onPress?: () => void;
}

/**
 * Entry feed card: a type tag (left) and timestamp (right, muted), then the
 * headline generated from the entry's own content (handoff §5.5).
 */
export function EntryCard({ type, headline, timestamp, onPress }: EntryCardProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${type}. ${headline}. ${timestamp}`}
        onPress={onPress}
        style={({ pressed }) => (pressed && onPress ? { opacity: 0.85 } : null)}
      >
        <Card>
          <View style={styles.topRow}>
            <EntryTag label={type} />
            <Text variant="meta">{timestamp}</Text>
          </View>
          <Text style={styles.headline}>{headline}</Text>
        </Card>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.screen, paddingTop: spacing.cardGap },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headline: { fontSize: 17, lineHeight: 23, fontWeight: '500', marginTop: spacing.sm },
});
