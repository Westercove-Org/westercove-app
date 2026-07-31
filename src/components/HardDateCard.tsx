import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/theme/tokens';

/**
 * A reflective hard-date card, shown on Home when a tracked date is near. Framed
 * as care, not homework — preparation is user-initiated, at their own pace.
 */
export function HardDateCard({
  label,
  detail,
  onPrepare,
}: {
  label: string;
  detail?: string;
  onPrepare: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Card reflective>
        <Text variant="cardTitle" color="amethystText">
          {label}
        </Text>
        {detail ? (
          <Text variant="bodySmall" color="amethystText" style={styles.body}>
            {detail}
          </Text>
        ) : null}
        <Text variant="bodySmall" color="amethystText" style={styles.body}>
          We can move toward it together, at whatever pace is yours.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Prepare together"
          onPress={onPrepare}
          style={styles.action}
        >
          <Text variant="bodySmall" color="forest">
            Prepare together
          </Text>
        </Pressable>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.screen, paddingTop: spacing.cardGap },
  body: { marginTop: spacing.xs },
  action: { minHeight: 44, justifyContent: 'center', marginTop: spacing.xs },
});
