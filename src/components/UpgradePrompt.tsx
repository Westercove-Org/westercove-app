import { Linking, Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import type { PlanLimit } from '@/features/billing/planLimit';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

// ponytail: inline tel/sms open (also in CrisisBanner); extract a shared util if a third caller appears.
function open(url: string) {
  Linking.openURL(url).catch(() => {
    /* If the platform can't handle tel:/sms:, fail quietly. */
  });
}

function smsUrl(number: string, body: string): string {
  const sep = Platform.OS === 'ios' ? '&' : '?';
  return `sms:${number}${sep}body=${encodeURIComponent(body)}`;
}

/**
 * The upgrade-to-Premium prompt for a plan limit (R-1b). Renders the server's
 * `message` verbatim; never a toast, always a gentle inline card. Navigation is
 * injected (`onSeePlans`, typically router.push('/subscription') unchanged — no
 * plan preselected) so the component stays free of routing. `onDismiss`, when
 * given, shows a quiet "Not now" so a surfaced limit can be cleared.
 *
 * Crisis resources sit inside the card, visible — never behind a tap. A member
 * who has just been told they cannot start a conversation (a lapsed/paused
 * account hitting the chat gate) is exactly who should not have to go looking
 * for 988/741741/911. Crisis is never gated, so it renders unconditionally.
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

      <View style={[styles.crisis, { borderTopColor: colors.amethystTint }]}>
        <Text variant="bodySmall" color="textMuted">
          If you are in crisis, help is available any time:
        </Text>
        <Text variant="bodySmall" style={styles.crisisRow}>
          <Text
            variant="bodySmall"
            color="amethystText"
            accessibilityRole="link"
            accessibilityLabel="Call 988, Suicide and Crisis Lifeline"
            onPress={() => open('tel:988')}
            style={styles.crisisLink}
          >
            Call 988
          </Text>
          {'  ·  '}
          <Text
            variant="bodySmall"
            color="amethystText"
            accessibilityRole="link"
            accessibilityLabel="Text HOME to 741741, Crisis Text Line"
            onPress={() => open(smsUrl('741741', 'HOME'))}
            style={styles.crisisLink}
          >
            Text HOME to 741741
          </Text>
          {'  ·  '}
          <Text
            variant="bodySmall"
            color="amethystText"
            accessibilityRole="link"
            accessibilityLabel="Call 911 for an emergency"
            onPress={() => open('tel:911')}
            style={styles.crisisLink}
          >
            Call 911
          </Text>
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  message: { marginTop: spacing.xs, lineHeight: 23 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  crisis: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  crisisRow: { marginTop: spacing.xs, lineHeight: 22 },
  crisisLink: { fontWeight: '700' },
});
