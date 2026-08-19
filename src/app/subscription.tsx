import { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { StackScreen } from '@/components/StackScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useSessionStore } from '@/features/auth/sessionStore';
import { HttpError } from '@/lib/http';
import { services, type SubscriptionStatus } from '@/services';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const LABELS: Record<string, string> = {
  trial_active: 'Free trial',
  active_monthly: 'Active — monthly',
  active_annual: 'Active — annual',
  license_active: 'Sponsored license',
  lapsed: 'Lapsed',
};

/** Subscription. Plain trial-end statement (date + price), no countdown, no
 * discount pressure, no guilt. Crisis resources work in every state. */
export default function SubscriptionScreen() {
  const { colors } = useTheme();
  const sessionEntitlement = useSessionStore((s) => s.session?.entitlement ?? 'trial_active');
  const setEntitlement = useSessionStore((s) => s.setEntitlement);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  // Load the authoritative status from the backend; keep the session entitlement
  // in sync so the rest of the app reflects it.
  useEffect(() => {
    let live = true;
    services.subscription
      .getStatus()
      .then((s) => {
        if (!live) return;
        setStatus(s);
        setEntitlement(s.entitlement);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [setEntitlement]);

  const entitlement = status?.entitlement ?? sessionEntitlement;

  const [code, setCode] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const onRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed || redeeming) return;
    setRedeeming(true);
    setRedeemError(null);
    try {
      const { entitlement: granted, sponsorOrganization } =
        await services.subscription.redeemLicense(trimmed);
      setEntitlement(granted, sponsorOrganization);
      setCode('');
    } catch (err) {
      // 400 = invalid code (inline, gentle); anything else = a transient problem.
      setRedeemError(
        err instanceof HttpError && err.status === 400
          ? "That code doesn't look right. Check it and try again."
          : "We couldn't reach the license service. Try again in a moment.",
      );
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <StackScreen title="Subscription">
      <Card>
        <Text variant="meta" color="textMuted">
          Current plan
        </Text>
        <Text variant="cardTitle" style={{ marginTop: 4 }}>
          {LABELS[entitlement] ?? entitlement}
        </Text>
        {status?.trialEndsOn ? (
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            Your trial ends on {status.trialEndsOn}. When it does, it is{' '}
            {status.price}. Nothing is charged without your say.
          </Text>
        ) : status ? (
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            {status.price}. You can change or step away anytime.
          </Text>
        ) : null}
        {entitlement === 'lapsed' ? (
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            Your access has paused. Restore your subscription below to bring back
            the paid features — everything you have written is still here.
          </Text>
        ) : null}
      </Card>

      <Button
        label="Restore purchases"
        variant="secondary"
        onPress={async () => setEntitlement(await services.subscription.restore())}
      />

      <Card>
        <Text variant="meta" color="textMuted">
          Have a sponsor license?
        </Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="Enter your code"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="License code"
          style={[styles.input, { borderColor: colors.line, color: colors.textPrimary }]}
        />
        {redeemError ? (
          <Text variant="bodySmall" color="crisis" style={{ marginTop: spacing.xs }}>
            {redeemError}
          </Text>
        ) : null}
        <Button
          label={redeeming ? 'Redeeming…' : 'Redeem license'}
          variant="secondary"
          onPress={onRedeem}
        />
      </Card>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    fontSize: 15,
  },
});
