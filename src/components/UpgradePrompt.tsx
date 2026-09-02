import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import type { PlanLimit } from '@/features/billing/planLimit';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/**
 * The upgrade-to-Premium prompt for a plan limit (R-1b). Renders the server's
 * `message` verbatim; never a toast, always a gentle inline card. Navigation is
 * injected (`onSeePlans`, typically router.push('/subscription') unchanged — no
 * plan preselected) so the component stays free of routing. `onDismiss`, when
 * given, shows a quiet "Not now" so a surfaced limit can be cleared.
 */
export function UpgradePrompt({
  limit,
  onSeePlans,
  onDismiss,
}: {
  limit: PlanLimit;
  onSeePlans: () => void;
  onDismiss?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Card style={{ borderTopWidth: 3, borderTopColor: colors.saffron }}>
      <Text variant="sectionLabel" color="textMuted">
        A note about your plan
      </Text>
      <Text variant="body" style={styles.message}>
        {limit.message}
      </Text>
      <View style={styles.actions}>
        <Button label="See plans" onPress={onSeePlans} />
        {onDismiss ? <Button label="Not now" variant="secondary" onPress={onDismiss} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  message: { marginTop: spacing.xs, lineHeight: 23 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
});
