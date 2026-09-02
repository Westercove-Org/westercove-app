import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { services } from '@/services';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/**
 * Landing for the `update_card_url` email deep link (R-10/R-61). The email is an
 * app deep link, not a portal URL — the portal is minted per session. A member
 * (carried here through sign-in by R-62) should never see the subscription
 * screen on the way: mint a portal session opened straight on the card form and
 * send them there in one tap, no support email ever. If billing is unavailable,
 * fall back to the subscription screen, which owns the graceful error.
 */
export default function UpdateCardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // one shot: never re-mint on a re-render
    ran.current = true;
    let alive = true;
    void services.subscription
      .createPortalSession('payment_method_update')
      .then(({ url }) => {
        if (!alive) return;
        if (Platform.OS === 'web') {
          window.location.assign(url);
        } else {
          void Linking.openURL(url);
          // Leave the portal behind on a real screen, not this blank redirector.
          router.replace('/subscription');
        }
      })
      .catch(() => {
        if (alive) router.replace('/subscription');
      });
    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.textMuted} />
      <Text variant="body" color="textMuted" style={styles.label}>
        Opening your billing…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  label: { marginTop: spacing.sm },
});
