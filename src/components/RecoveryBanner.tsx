import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useSessionStore } from '@/features/auth/sessionStore';
import { shouldShowRecoveryBanner, useRecoveryBannerStore } from '@/features/billing/recoveryBanner';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/**
 * R-11: a calm, non-modal recovery strip shown while a failed payment can still
 * be fixed (entitlement `grace` during the recovery window, and `lapsed` after
 * it), mirroring the recovery emails. Tapping it
 * goes to Membership to fix payment; the ✕ dismisses it for the session only
 * (not persisted — a relaunch shows it again while payment is still lapsed).
 *
 * It is a quiet strip at the top of a screen — never a modal or overlay. In
 * grace only session-create is gated, not message turns, so a member can be
 * mid-conversation; the banner must never land between them and a reply. It is
 * therefore placed on Home, not on the compose/chat surfaces.
 */
export function RecoveryBanner() {
  const router = useRouter();
  const { colors } = useTheme();
  const entitlement = useSessionStore((s) => s.session?.entitlement);
  const dismissed = useRecoveryBannerStore((s) => s.dismissed);
  const dismiss = useRecoveryBannerStore((s) => s.dismiss);

  if (!shouldShowRecoveryBanner(entitlement, dismissed)) return null;

  return (
    <View style={[styles.bar, { backgroundColor: colors.amethystTint, borderColor: colors.line }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Your last payment didn’t go through. Update your payment to keep your access."
        onPress={() => router.push('/subscription')}
        style={styles.main}
      >
        <Text variant="bodySmall" color="textPrimary" style={styles.text}>
          Your last payment didn’t go through. Update your payment to keep your access — everything
          you’ve written is safe.
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        onPress={dismiss}
        hitSlop={8}
        style={styles.close}
      >
        <Text variant="body" color="textMuted">
          {'✕'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  main: { flex: 1 },
  text: { lineHeight: 20 },
  close: { minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
});
